import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";

const API_URL = "http://10.50.101.100:5000";

// Fallback types if equipment types cannot be loaded.
const DEFAULT_EQUIPMENT_TYPES = [
  "Tractor",
  "Harvester",
  "Tillage",
  "Irrigation",
];

export default function RecommendationsScreen({ onBack }) {
  const [crop, setCrop] = useState("");
  const [landSize, setLandSize] = useState("");
  const [equipmentType, setEquipmentType] = useState("Tractor");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");

  const [equipmentTypes, setEquipmentTypes] = useState(
    DEFAULT_EQUIPMENT_TYPES
  );
  const [typesLoading, setTypesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [searched, setSearched] = useState(false);
  const [brokenImages, setBrokenImages] = useState([]);

  // Load equipment types dynamically from existing equipment records.
  useEffect(() => {
    let isMounted = true;

    const loadEquipmentTypes = async () => {
      try {
        const response = await fetch(`${API_URL}/api/equipment`);

        if (!response.ok) {
          throw new Error("Could not load equipment types.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid equipment response.");
        }

        const typesFromDatabase = [
          ...new Set(
            data
              .map((item) =>
                typeof item.type === "string"
                  ? item.type.trim()
                  : ""
              )
              .filter(Boolean)
          ),
        ];

        if (isMounted && typesFromDatabase.length > 0) {
          const uniqueTypes = [
            ...new Set([
              ...DEFAULT_EQUIPMENT_TYPES,
              ...typesFromDatabase,
            ]),
          ];

          // Keep Tractor first.
          // Sort other types alphabetically.
          // Always move "Other" to the end.
          const otherType = uniqueTypes.find(
            (type) => type.toLowerCase() === "other"
          );

          const combinedTypes = uniqueTypes
            .filter(
              (type) => type.toLowerCase() !== "other"
            )
            .sort((a, b) => {
              if (a.toLowerCase() === "tractor") return -1;
              if (b.toLowerCase() === "tractor") return 1;

              return a.localeCompare(b);
            });

          if (otherType) {
            combinedTypes.push(otherType);
          }

          setEquipmentTypes(combinedTypes);

          setEquipmentType((currentType) =>
            combinedTypes.includes(currentType)
              ? currentType
              : combinedTypes[0]
          );
        }
      } catch (error) {
        console.log(
          "Equipment type loading:",
          error.message
        );

        // Keep the default types if loading fails.
      } finally {
        if (isMounted) {
          setTypesLoading(false);
        }
      }
    };

    loadEquipmentTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  const getRecommendations = async () => {
    if (
      !crop.trim() ||
      !landSize.trim() ||
      !equipmentType ||
      !location.trim() ||
      !budget.trim()
    ) {
      Alert.alert(
        "Missing Details",
        "Please fill in all fields."
      );
      return;
    }

    const budgetNumber = Number(budget);
    const landSizeNumber = Number(landSize);

    if (
      !Number.isFinite(budgetNumber) ||
      budgetNumber <= 0
    ) {
      Alert.alert(
        "Invalid Budget",
        "Enter a valid budget greater than zero."
      );
      return;
    }

    if (
      !Number.isFinite(landSizeNumber) ||
      landSizeNumber <= 0
    ) {
      Alert.alert(
        "Invalid Land Size",
        "Enter a valid land size greater than zero."
      );
      return;
    }

    setLoading(true);
    setSearched(false);
    setRecommendations([]);
    setBrokenImages([]);

    try {
      const response = await fetch(
        `${API_URL}/api/recommendations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            crop: crop.trim(),
            landSize: landSizeNumber,
            equipmentType,
            location: location.trim(),
            budget: budgetNumber,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to get recommendations."
        );
      }

      setRecommendations(
        Array.isArray(data.recommendations)
          ? data.recommendations
          : []
      );

      setSearched(true);
    } catch (error) {
      Alert.alert(
        "Connection Error",
        error.message ||
          "Unable to connect to the server. Check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // Compare the actual location text.
  const getLocationMatch = (item) => {
    const equipmentLocation = String(
      item.location || ""
    )
      .trim()
      .toLowerCase();

    const searchLocation = location
      .trim()
      .toLowerCase();

    if (!equipmentLocation || !searchLocation) {
      return "Location match unavailable";
    }

    if (equipmentLocation === searchLocation) {
      return "Exact location match";
    }

    if (
      equipmentLocation.includes(searchLocation) ||
      searchLocation.includes(equipmentLocation)
    ) {
      return "Partial location match";
    }

    return "Different location";
  };

  const formatPrice = (price) => {
    const amount = Number(price);

    if (!Number.isFinite(amount)) {
      return "Price unavailable";
    }

    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const markImageBroken = (id) => {
    setBrokenImages((current) =>
      current.includes(id)
        ? current
        : [...current, id]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>
            ← Back
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Smart Recommendations
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>
          Find the Right Equipment 🌾
        </Text>

        <Text style={styles.subtitle}>
          Enter your farming details to find available
          equipment matching your selected type, location,
          and daily budget.
        </Text>

        <Text style={styles.label}>
          Crop Name
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. Rice, Wheat, Sugarcane"
          value={crop}
          onChangeText={setCrop}
          autoCapitalize="words"
        />

        <Text style={styles.label}>
          Land Size (acres)
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. 5"
          value={landSize}
          onChangeText={setLandSize}
          keyboardType="decimal-pad"
        />

        <View style={styles.typeHeadingRow}>
          <Text style={styles.label}>
            Equipment Type
          </Text>

          {typesLoading && (
            <ActivityIndicator
              size="small"
              color="#218838"
            />
          )}
        </View>

        <View style={styles.typeContainer}>
          {equipmentTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                equipmentType === type &&
                  styles.typeButtonSelected,
              ]}
              onPress={() => setEquipmentType(type)}
              accessibilityRole="button"
              accessibilityState={{
                selected: equipmentType === type,
              }}
            >
              <Text
                style={[
                  styles.typeText,
                  equipmentType === type &&
                    styles.typeTextSelected,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.typeHint}>
          Equipment types are loaded from your existing
          equipment records.
        </Text>

        <Text style={styles.label}>
          Your Location
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. Vijayapura"
          value={location}
          onChangeText={setLocation}
          autoCapitalize="words"
        />

        <Text style={styles.label}>
          Maximum Budget per Day (₹)
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. 1500"
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[
            styles.searchButton,
            loading && styles.disabledButton,
          ]}
          onPress={getRecommendations}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.searchButtonText}>
              Find Recommended Equipment →
            </Text>
          )}
        </TouchableOpacity>

        {searched && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsHeading}>
              Recommended Equipment (
              {recommendations.length})
            </Text>

            {recommendations.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>
                  No matching equipment found
                </Text>

                <Text style={styles.emptyText}>
                  Try another equipment type or location,
                  or increase your daily budget.
                </Text>
              </View>
            ) : (
              recommendations.map((item, index) => {
                const itemId = String(
                  item._id || index
                );

                const hasImage =
                  Boolean(item.imageUrl) &&
                  !brokenImages.includes(itemId);

                return (
                  <View
                    key={itemId}
                    style={styles.equipmentCard}
                  >
                    {hasImage ? (
                      <Image
                        source={{
                          uri: item.imageUrl,
                        }}
                        style={styles.equipmentImage}
                        resizeMode="cover"
                        onError={() =>
                          markImageBroken(itemId)
                        }
                        accessibilityLabel={`${
                          item.name || "Equipment"
                        } photo`}
                      />
                    ) : (
                      <View
                        style={styles.imagePlaceholder}
                      >
                        <Text
                          style={styles.placeholderEmoji}
                        >
                          🚜
                        </Text>

                        <Text
                          style={styles.placeholderText}
                        >
                          No image available
                        </Text>
                      </View>
                    )}

                    <View style={styles.cardBody}>
                      <Text
                        style={styles.equipmentName}
                      >
                        {item.name ||
                          item.equipmentName ||
                          "Equipment"}
                      </Text>

                      <View style={styles.typeBadge}>
                        <Text
                          style={styles.typeBadgeText}
                        >
                          {item.type || equipmentType}
                        </Text>
                      </View>

                      <Text
                        style={styles.equipmentDetail}
                      >
                        Owner:{" "}
                        {item.owner || "Not specified"}
                      </Text>

                      <Text
                        style={styles.equipmentDetail}
                      >
                        📍{" "}
                        {item.location ||
                          "Location not specified"}
                      </Text>

                      {item.description ? (
                        <Text style={styles.description}>
                          {item.description}
                        </Text>
                      ) : null}

                      <View style={styles.priceRow}>
                        <Text style={styles.price}>
                          {formatPrice(item.pricePerDay)}
                        </Text>

                        <Text style={styles.perDay}>
                          / day
                        </Text>
                      </View>

                      <View style={styles.matchRow}>
                        <Text style={styles.matchLabel}>
                          {getLocationMatch(item)}
                        </Text>

                        <Text style={styles.score}>
                          Score:{" "}
                          {item.recommendationScore ??
                            "N/A"}
                        </Text>
                      </View>

                      {item.availability === true ? (
                        <Text style={styles.availableText}>
                          ● Available for booking
                        </Text>
                      ) : (
                        <Text
                          style={styles.unavailableText}
                        >
                          ● Availability not confirmed
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F8F1",
    paddingTop: 45,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  backButton: {
    paddingVertical: 8,
    paddingRight: 8,
  },

  backText: {
    color: "#218838",
    fontSize: 16,
    fontWeight: "bold",
  },

  headerTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: "bold",
    color: "#1B5E20",
    marginLeft: 8,
  },

  content: {
    padding: 18,
    paddingBottom: 35,
  },

  heading: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 8,
  },

  subtitle: {
    color: "#58665A",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 22,
  },

  label: {
    color: "#243B2A",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 7,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E2D3",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 17,
    color: "#243B2A",
  },

  typeHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },

  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E2D3",
    marginBottom: 2,
  },

  typeButtonSelected: {
    backgroundColor: "#218838",
    borderColor: "#218838",
  },

  typeText: {
    color: "#243B2A",
    fontWeight: "600",
  },

  typeTextSelected: {
    color: "#FFFFFF",
  },

  typeHint: {
    color: "#68756A",
    fontSize: 12,
    marginBottom: 17,
  },

  searchButton: {
    backgroundColor: "#218838",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },

  disabledButton: {
    opacity: 0.65,
  },

  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },

  resultsSection: {
    marginTop: 25,
  },

  resultsHeading: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 12,
  },

  equipmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },

  equipmentImage: {
    width: "100%",
    height: 190,
    backgroundColor: "#E8EFE5",
  },

  imagePlaceholder: {
    width: "100%",
    height: 150,
    backgroundColor: "#E8EFE5",
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderEmoji: {
    fontSize: 35,
    marginBottom: 6,
  },

  placeholderText: {
    color: "#58665A",
    fontSize: 13,
  },

  cardBody: {
    padding: 15,
  },

  equipmentName: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 8,
  },

  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E7F4E8",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 12,
  },

  typeBadgeText: {
    color: "#218838",
    fontSize: 12,
    fontWeight: "bold",
  },

  equipmentDetail: {
    color: "#333333",
    fontSize: 14,
    marginBottom: 8,
  },

  description: {
    color: "#58665A",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
    marginBottom: 8,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 5,
  },

  price: {
    color: "#16803D",
    fontWeight: "bold",
    fontSize: 21,
  },

  perDay: {
    color: "#58665A",
    fontSize: 13,
    marginLeft: 4,
  },

  matchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 10,
  },

  matchLabel: {
    color: "#58665A",
    fontSize: 12,
    flexShrink: 1,
    marginRight: 8,
  },

  score: {
    color: "#68756A",
    fontSize: 12,
  },

  availableText: {
    color: "#16803D",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },

  unavailableText: {
    color: "#A16207",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 7,
  },

  emptyText: {
    color: "#58665A",
    lineHeight: 21,
  },
});