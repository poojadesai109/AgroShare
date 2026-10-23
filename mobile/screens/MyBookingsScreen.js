import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

const API_URL = "http://10.50.101.100:5000";

const PAYMENT_METHODS = [
  { id: "UPI", label: "UPI", icon: "📱" },
  { id: "Card", label: "Card", icon: "💳" },
  { id: "Cash", label: "Cash", icon: "💵" },
];

export default function MyBookingsScreen({ user, onBack }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("UPI");

  const fetchBookings = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      setBookings([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `${API_URL}/api/bookings/${user.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load bookings");
      }

      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Unable to load bookings. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const payNow = (booking) => {
    Alert.alert(
      "Confirm Payment",
      `Method: ${selectedMethod}\nAmount: ₹${booking.pricePerDay}\n\nContinue with this demo payment?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => processPayment(booking, selectedMethod),
        },
      ]
    );
  };

  const processPayment = async (booking, paymentMethod) => {
    if (!booking._id) {
      Alert.alert("Error", "Booking ID is missing.");
      return;
    }

    try {
      setPayingId(booking._id);

      const response = await fetch(
        `${API_URL}/api/bookings/${booking._id}/payment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentMethod }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Payment failed");
      }

      Alert.alert(
        "Payment Successful",
        `Demo payment completed using ${data.paymentMethod || paymentMethod}.\n\nTransaction ID: ${
          data.transactionId || "Not returned by server"
        }`
      );

      // Reload bookings to display the saved payment details.
      await fetchBookings();
    } catch (error) {
      Alert.alert(
        "Payment Error",
        error.message || "Please try again."
      );
    } finally {
      setPayingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return "#16803D";
      case "rejected":
        return "#DC2626";
      default:
        return "#D97706";
    }
  };

  const renderBooking = ({ item }) => {
    const status = (item.status || "Pending").toLowerCase();

    // Payment status is separate from booking status.
    const isPaid =
      (item.paymentStatus || "").toLowerCase() === "paid";

    const isApproved = status === "approved";
    const isRejected = status === "rejected";
    const isPaying = payingId === item._id;

    return (
      <View style={styles.card}>
        <Text style={styles.equipmentName}>
          {item.equipmentName || "Equipment"}
        </Text>

        <Text style={styles.detail}>
          📍 Location: {item.location || "Not specified"}
        </Text>

        <Text style={styles.detail}>
          📅 Booking date: {item.date || "Not specified"}
        </Text>

        <Text style={styles.detail}>
          💰 Price: ₹{item.pricePerDay ?? "N/A"} / day
        </Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Booking status:</Text>
          <Text
            style={[
              styles.status,
              { color: getStatusColor(item.status) },
            ]}
          >
            {item.status || "Pending"}
          </Text>
        </View>

        {isApproved && !isPaid && (
          <View style={styles.paymentBox}>
            <Text style={styles.paymentTitle}>
              Choose Payment Method
            </Text>

            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodButton,
                  selectedMethod === method.id &&
                    styles.methodSelected,
                ]}
                onPress={() => setSelectedMethod(method.id)}
                disabled={payingId !== null}
              >
                <Text style={styles.methodText}>
                  {method.icon} {method.label}
                </Text>

                <Text style={styles.radio}>
                  {selectedMethod === method.id ? "🔘" : "⚪"}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.payButton,
                isPaying && styles.disabledButton,
              ]}
              disabled={payingId !== null}
              onPress={() => payNow(item)}
            >
              {isPaying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.payButtonText}>
                  Confirm Payment →
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.demoNote}>
              Demo payment only. No real money is transferred.
            </Text>
          </View>
        )}

        {isPaid && (
          <View style={styles.paidBox}>
            <Text style={styles.paidNote}>
              ✓ Payment completed
            </Text>

            <View style={styles.transactionBox}>
              <Text style={styles.transactionLabel}>
                Transaction ID
              </Text>

              <Text selectable style={styles.transactionId}>
                {item.transactionId || "Transaction ID not available"}
              </Text>
            </View>

            <Text style={styles.paymentMethodDetail}>
              Payment Method: {item.paymentMethod || "Not available"}
            </Text>

            <Text style={styles.paymentStatusDetail}>
              Payment Status: {item.paymentStatus}
            </Text>
          </View>
        )}

        {isRejected && (
          <Text style={styles.rejectedNote}>
            This booking was rejected.
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>My Bookings</Text>
      </View>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => fetchBookings(true)}
        disabled={loading || refreshing}
      >
        {refreshing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.refreshText}>
            ↻ Refresh Bookings
          </Text>
        )}
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#218838"
          style={styles.loader}
        />
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No bookings found.
          </Text>
          <Text style={styles.emptySubtext}>
            Your equipment bookings will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item, index) =>
            String(item._id || index)
          }
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => fetchBookings(true)}
        />
      )}
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
    paddingBottom: 15,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backText: {
    color: "#218838",
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1B5E20",
    marginLeft: 12,
  },
  refreshButton: {
    backgroundColor: "#218838",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  refreshText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  loader: {
    marginTop: 30,
  },
  list: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    elevation: 3,
  },
  equipmentName: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1B5E20",
    marginBottom: 12,
  },
  detail: {
    fontSize: 15,
    color: "#333333",
    marginBottom: 9,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 5,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333333",
    marginRight: 6,
  },
  status: {
    fontSize: 15,
    fontWeight: "bold",
  },
  paymentBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#F5FAF3",
    borderRadius: 12,
  },
  paymentTitle: {
    color: "#14532D",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  methodButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 13,
    borderWidth: 1,
    borderColor: "#D5E2D3",
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  methodSelected: {
    borderColor: "#218838",
    backgroundColor: "#E7F3E8",
    borderWidth: 2,
  },
  methodText: {
    fontSize: 15,
    color: "#243B2A",
    fontWeight: "600",
  },
  radio: {
    fontSize: 17,
  },
  payButton: {
    backgroundColor: "#218838",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    minHeight: 46,
  },
  disabledButton: {
    opacity: 0.65,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  demoNote: {
    color: "#68756A",
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
  },
  paidBox: {
    marginTop: 15,
    padding: 13,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  paidNote: {
    color: "#166534",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
  },
  transactionBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 11,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  transactionLabel: {
    color: "#555555",
    fontSize: 13,
    marginBottom: 5,
    fontWeight: "600",
  },
  transactionId: {
    color: "#1D4ED8",
    fontSize: 15,
    fontWeight: "bold",
  },
  paymentMethodDetail: {
    color: "#333333",
    fontSize: 14,
    marginTop: 10,
  },
  paymentStatusDetail: {
    color: "#333333",
    fontSize: 14,
    marginTop: 5,
  },
  rejectedNote: {
    color: "#DC2626",
    marginTop: 10,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#68756A",
    textAlign: "center",
    marginTop: 8,
  },
});