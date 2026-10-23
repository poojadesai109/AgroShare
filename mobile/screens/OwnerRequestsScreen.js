
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";

const API_URL = "http://10.50.101.100:5000";

export default function OwnerRequestsScreen({ user, onBack }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async (refresh = false) => {
    if (!user?.name) {
      setLoading(false);
      return;
    }

    refresh ? setRefreshing(true) : setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/bookings/owner/${encodeURIComponent(user.name)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load requests");
      }

      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert("Error", error.message || "Could not load requests.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.name]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const updateStatus = (booking, status) => {
    Alert.alert(
      `${status} booking?`,
      `Do you want to ${status.toLowerCase()} this request for ${booking.equipmentName || "equipment"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: status,
          onPress: async () => {
            try {
              setUpdatingId(booking._id);

              const response = await fetch(
                `${API_URL}/api/bookings/${booking._id}/status`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status }),
                }
              );

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.message || "Could not update booking");
              }

              Alert.alert("Success", data.message || `Booking ${status.toLowerCase()}.`);
              await loadRequests(true);
            } catch (error) {
              Alert.alert("Error", error.message || "Please try again.");
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const renderRequest = ({ item }) => {
    const status = item.status || "Pending";
    const pending = status.toLowerCase() === "pending";
    const updating = updatingId === item._id;

    return (
      <View style={styles.card}>
        <Text style={styles.equipment}>
          🚜 {item.equipmentName || "Equipment"}
        </Text>

        <Text style={styles.detail}>
          Farmer: {item.farmerName || "Not specified"}
        </Text>
        <Text style={styles.detail}>
          Location: {item.location || "Not specified"}
        </Text>
        <Text style={styles.detail}>
          Requested date: {item.date || "Not specified"}
        </Text>
        <Text style={styles.detail}>
          Price: ₹{item.pricePerDay ?? "N/A"} / day
        </Text>

        <Text style={[
          styles.status,
          status.toLowerCase() === "approved" && styles.approved,
          status.toLowerCase() === "rejected" && styles.rejected,
        ]}>
          Status: {status}
        </Text>

        {pending && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.accept]}
              disabled={updating}
              onPress={() => updateStatus(item, "Approved")}
            >
              <Text style={styles.buttonText}>
                {updating ? "Updating..." : "✓ Accept"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.reject]}
              disabled={updating}
              onPress={() => updateStatus(item, "Rejected")}
            >
              <Text style={styles.buttonText}>
                ✕ Reject
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Owner Requests</Text>
      </View>

      <TouchableOpacity
        style={styles.refresh}
        onPress={() => loadRequests(true)}
        disabled={loading || refreshing}
      >
        <Text style={styles.refreshText}>
          {refreshing ? "Refreshing..." : "↻ Refresh Requests"}
        </Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#218838"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item, index) => String(item._id || index)}
          renderItem={renderRequest}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => loadRequests(true)}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No booking requests found for your equipment.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F8F1", paddingTop: 45 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  back: { color: "#218838", fontSize: 15, fontWeight: "bold" },
  title: {
    color: "#14532D",
    fontSize: 21,
    fontWeight: "bold",
    marginLeft: 18,
  },
  refresh: {
    backgroundColor: "#218838",
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  refreshText: { color: "#FFFFFF", fontWeight: "bold" },
  list: { padding: 16, paddingBottom: 30 },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    elevation: 3,
  },
  equipment: {
    fontSize: 18,
    color: "#14532D",
    fontWeight: "bold",
    marginBottom: 12,
  },
  detail: { fontSize: 14, color: "#374151", marginBottom: 8 },
  status: { fontWeight: "bold", color: "#D97706", marginTop: 5 },
  approved: { color: "#16803D" },
  rejected: { color: "#DC2626" },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 9,
    alignItems: "center",
  },
  accept: { backgroundColor: "#16803D" },
  reject: { backgroundColor: "#DC2626" },
  buttonText: { color: "#FFFFFF", fontWeight: "bold" },
  empty: {
    textAlign: "center",
    color: "#68756A",
    marginTop: 40,
    fontSize: 15,
  },
});
