
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";

const API_URL = "http://10.50.101.100:5000";

const EQUIPMENT_TYPES = [
  "Tractor",
  "Harvester",
  "Rotavator",
  "Tillage Equipment",
  "Irrigation Equipment",
  "Other",
];

const EMPTY_FORM = {
  name: "",
  type: "",
  description: "",
  location: "",
  pricePerDay: "",
  availability: true,
};

export default function MyEquipmentScreen({ user, token, onBack }) {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const loadEquipment = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const response = await fetch(`${API_URL}/api/equipment`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load equipment.");
        }

        if (!Array.isArray(data)) {
          throw new Error("Unexpected equipment data received.");
        }

        const myItems = data.filter(
          (item) =>
            item.ownerId &&
            String(item.ownerId._id || item.ownerId) ===
              String(user?.id)
        );

        setEquipment(myItems);
      } catch (error) {
        Alert.alert(
          "My Equipment",
          error.message || "Could not load equipment."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setSelectedImage(null);
  };

  const openAddForm = () => {
    setEditing(null);
    resetForm();
    setShowAddForm(true);
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    resetForm();
  };

  const chooseImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow photo library access to select an equipment image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert(
          "Image too large",
          "Please select an image smaller than 5 MB."
        );
        return;
      }

      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName || `equipment-${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      });
    } catch (error) {
      console.error("Choose image error:", error);
      Alert.alert("Image error", "Could not open your photo library.");
    }
  };

  const validateForm = () => {
    if (
      !form.name.trim() ||
      !form.type.trim() ||
      !form.location.trim() ||
      !form.pricePerDay.trim()
    ) {
      Alert.alert(
        "Missing details",
        "Please fill in equipment name, type, location and price."
      );
      return false;
    }

    const price = Number(form.pricePerDay);

    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert(
        "Invalid price",
        "Enter a valid price greater than zero."
      );
      return false;
    }

    return true;
  };

  const addEquipment = async () => {
    if (saving || !validateForm()) return;

    if (!token) {
      Alert.alert("Login required", "Please log in again to add equipment.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("name", form.name.trim());
      formData.append("type", form.type.trim());
      formData.append("description", form.description.trim());
      formData.append("owner", user?.name || "");
      formData.append("location", form.location.trim());
      formData.append("pricePerDay", String(Number(form.pricePerDay)));
      formData.append("availability", String(form.availability));

      if (selectedImage?.uri) {
        formData.append("image", new File(selectedImage.uri));
      }

      const response = await expoFetch(`${API_URL}/api/equipment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add equipment.");
      }

      setShowAddForm(false);
      resetForm();
      await loadEquipment();

      Alert.alert("Success", "Equipment added successfully!");
    } catch (error) {
      console.error("Add equipment error:", error);
      Alert.alert(
        "Could not add equipment",
        error.message || "Unable to connect to the server."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setShowAddForm(false);
    setSelectedImage(null);
    setEditing(item);

    setForm({
      name: item.name || "",
      type: item.type || "",
      description: item.description || "",
      location: item.location || "",
      pricePerDay: String(item.pricePerDay ?? ""),
      availability: Boolean(item.availability),
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    resetForm();
  };

  // Update equipment, uploading an image only when a replacement is selected.
  const saveEdit = async () => {
    if (!editing || saving || !validateForm()) return;

    if (!token) {
      Alert.alert("Login required", "Please log in again to edit equipment.");
      return;
    }

    setSaving(true);

    try {
      let response;

      if (selectedImage?.uri) {
        const formData = new FormData();

        formData.append("name", form.name.trim());
        formData.append("type", form.type.trim());
        formData.append("description", form.description.trim());
        formData.append("location", form.location.trim());
        formData.append(
          "pricePerDay",
          String(Number(form.pricePerDay))
        );
        formData.append("availability", String(form.availability));
        formData.append("image", new File(selectedImage.uri));

        response = await expoFetch(
          `${API_URL}/api/equipment/${editing._id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );
      } else {
        response = await fetch(
          `${API_URL}/api/equipment/${editing._id}`,
          {
            method: "PUT",
            headers: {
              ...authHeaders,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: form.name.trim(),
              type: form.type.trim(),
              description: form.description.trim(),
              location: form.location.trim(),
              pricePerDay: Number(form.pricePerDay),
              availability: form.availability,
            }),
          }
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Equipment update failed.");
      }

      cancelEdit();
      await loadEquipment();

      Alert.alert("Success", "Equipment updated successfully.");
    } catch (error) {
      console.error("Update equipment error:", error);
      Alert.alert("Update failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteEquipment = (item) => {
    Alert.alert(
      "Delete Equipment",
      `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/api/equipment/${item._id}`,
                {
                  method: "DELETE",
                  headers: authHeaders,
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(
                  data.message || "Could not delete equipment."
                );
              }

              setEquipment((previous) =>
                previous.filter((entry) => entry._id !== item._id)
              );

              if (editing?._id === item._id) cancelEdit();

              Alert.alert("Success", "Equipment deleted successfully.");
            } catch (error) {
              console.error("Delete equipment error:", error);
              Alert.alert("Delete failed", error.message);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>🚜 No image available</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.type}>{item.type}</Text>
        <Text style={styles.info}>📍 {item.location}</Text>
        <Text style={styles.price}>₹{item.pricePerDay} / day</Text>

        <Text
          style={[
            styles.availability,
            { color: item.availability ? "#15803D" : "#DC2626" },
          ]}
        >
          {item.availability ? "● Available" : "● Unavailable"}
        </Text>

        {!!item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => startEdit(item)}
          >
            <Text style={styles.buttonText}>✏️ Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteEquipment(item)}
          >
            <Text style={styles.buttonText}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderForm = () => (
    <KeyboardAvoidingView
      style={styles.formKeyboard}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {editing ? "Edit Equipment" : "Add New Equipment"}
          </Text>

          <Text style={styles.label}>Equipment Name *</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(value) => updateField("name", value)}
            placeholder="e.g. Mahindra Tractor"
            placeholderTextColor="#89958A"
          />

          <Text style={styles.label}>Equipment Type *</Text>
          <View style={styles.typeOptions}>
            {EQUIPMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  form.type === type && styles.typeOptionSelected,
                ]}
                onPress={() => updateField("type", type)}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    form.type === type && styles.typeOptionTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Location *</Text>
          <TextInput
            style={styles.input}
            value={form.location}
            onChangeText={(value) => updateField("location", value)}
            placeholder="Enter equipment location"
            placeholderTextColor="#89958A"
          />

          <Text style={styles.label}>Price per day (₹) *</Text>
          <TextInput
            style={styles.input}
            value={form.pricePerDay}
            onChangeText={(value) => updateField("pricePerDay", value)}
            keyboardType="decimal-pad"
            placeholder="e.g. 800"
            placeholderTextColor="#89958A"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={form.description}
            onChangeText={(value) => updateField("description", value)}
            placeholder="Describe your equipment"
            placeholderTextColor="#89958A"
            multiline
          />

          <Text style={styles.label}>Equipment Image (Optional)</Text>

          {selectedImage?.uri ? (
            <Image
              source={{ uri: selectedImage.uri }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          ) : editing?.imageUrl ? (
            <Image
              source={{ uri: editing.imageUrl }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          ) : null}

          <TouchableOpacity
            style={styles.imageButton}
            onPress={chooseImage}
          >
            <Text style={styles.imageButtonText}>
              {selectedImage
                ? "📷 Change Image"
                : editing?.imageUrl
                  ? "📷 Replace Existing Image"
                  : "📷 Choose Equipment Image"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Select a photo smaller than 5 MB.
          </Text>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Available for rent</Text>
            <Switch
              value={form.availability}
              onValueChange={(value) => updateField("availability", value)}
              trackColor={{ false: "#CBD5CB", true: "#86C99A" }}
              thumbColor={form.availability ? "#15803D" : "#F4F4F4"}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={editing ? saveEdit : addEquipment}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {editing ? "Save Changes" : "Add Equipment"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={editing ? cancelEdit : cancelAdd}
            disabled={saving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>My Equipment</Text>
          <Text style={styles.headerSubtitle}>
            Manage your agricultural listings
          </Text>
        </View>
      </View>

      {editing || showAddForm ? (
        renderForm()
      ) : (
        <>
          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddForm}
          >
            <Text style={styles.addButtonText}>＋ Add New Equipment</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#14532D"
              style={styles.loader}
            />
          ) : (
            <FlatList
              style={styles.listFlex}
              data={equipment}
              keyExtractor={(item) => String(item._id)}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => loadEquipment(true)}
                  colors={["#14532D"]}
                />
              }
              ListHeaderComponent={
                <Text style={styles.listHeading}>
                  Your Listings ({equipment.length})
                </Text>
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>🚜</Text>
                  <Text style={styles.emptyTitle}>
                    No equipment listed yet
                  </Text>
                  <Text style={styles.emptyText}>
                    Tap "Add New Equipment" to list your first item.
                    Pull down to refresh.
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAF5",
  },
  header: {
    backgroundColor: "#14532D",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 6,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "#D1FAE5",
    fontSize: 12,
    marginTop: 3,
  },
  addButton: {
    backgroundColor: "#15803D",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  listFlex: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingTop: 10,
    flexGrow: 1,
  },
  listHeading: {
    color: "#14532D",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E1EAE0",
  },
  image: {
    width: "100%",
    height: 180,
    backgroundColor: "#E7F3E8",
  },
  noImage: {
    height: 130,
    backgroundColor: "#E7F3E8",
    alignItems: "center",
    justifyContent: "center",
  },
  noImageText: {
    color: "#14532D",
    fontSize: 14,
  },
  cardContent: {
    padding: 15,
  },
  itemName: {
    color: "#173B25",
    fontSize: 19,
    fontWeight: "800",
  },
  type: {
    color: "#647568",
    marginTop: 4,
  },
  info: {
    color: "#526354",
    marginTop: 9,
  },
  price: {
    color: "#14532D",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 9,
  },
  availability: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 7,
  },
  description: {
    color: "#526354",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#14532D",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#B91C1C",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    textAlign: "center",
  },
  formKeyboard: {
    flex: 1,
    minHeight: 0,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  form: {
    margin: 14,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE8D9",
  },
  formTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#14532D",
    marginBottom: 14,
  },
  label: {
    color: "#23412D",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FBFCFA",
    borderWidth: 1,
    borderColor: "#DCE5D9",
    borderRadius: 10,
    padding: 11,
    marginBottom: 12,
    color: "#173B25",
  },
  descriptionInput: {
    minHeight: 75,
    textAlignVertical: "top",
  },
  typeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  typeOption: {
    borderWidth: 1,
    borderColor: "#DCE5D9",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 11,
    backgroundColor: "#FBFCFA",
  },
  typeOptionSelected: {
    backgroundColor: "#14532D",
    borderColor: "#14532D",
  },
  typeOptionText: {
    color: "#23412D",
    fontSize: 12,
    fontWeight: "600",
  },
  typeOptionTextSelected: {
    color: "#FFFFFF",
  },
  imagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#E7F3E8",
  },
  imageButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#15803D",
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 6,
  },
  imageButtonText: {
    color: "#15803D",
    fontWeight: "800",
  },
  helperText: {
    color: "#647568",
    fontSize: 12,
    marginBottom: 14,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: "#15803D",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButton: {
    alignItems: "center",
    padding: 12,
    marginTop: 4,
  },
  cancelText: {
    color: "#526354",
    fontWeight: "700",
  },
  loader: {
    marginTop: 50,
  },
  empty: {
    alignItems: "center",
    padding: 30,
    marginTop: 25,
  },
  emptyIcon: {
    fontSize: 45,
  },
  emptyTitle: {
    color: "#173B25",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 12,
  },
  emptyText: {
    color: "#647568",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
});
