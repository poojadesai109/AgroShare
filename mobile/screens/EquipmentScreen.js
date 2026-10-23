
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Alert,
  TextInput,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "http://10.50.101.100:5000";

const CATEGORY_TYPES = {
  Tractors: ["tractor"],
  Tillage: ["tillage", "tillage equipment", "rotavator"],
  Irrigation: ["irrigation", "irrigation equipment"],
  Harvesting: ["harvester", "harvesting", "harvesting equipment"],
};

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

const openEquipmentLocation = async (location) => {
  const place = String(location || "").trim();

  if (!place) {
    Alert.alert(
      "Location unavailable",
      "The owner has not provided an equipment location."
    );
    return;
  }

  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    place
  )}`;

  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert(
      "Unable to open Maps",
      "Please try opening Google Maps manually."
    );
  }
};

export default function EquipmentScreen({
  onBack,
  user,
  initialCategory = "All",
}) {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // NEW: Equipment search
  const [searchText, setSearchText] = useState("");

  // Ratings & Reviews
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  const [myBookings, setMyBookings] = useState([]);
  const [reviewBookingId, setReviewBookingId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

  const selectedEquipmentId = selectedEquipment?._id;

  useEffect(() => {
    setSelectedCategory(initialCategory || "All");
  }, [initialCategory]);

  // Load equipment
  useEffect(() => {
    let isMounted = true;

    const fetchEquipment = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/api/equipment`);

        if (!response.ok) {
          throw new Error("Unable to load equipment");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid equipment data");
        }

        if (isMounted) {
          setEquipment(data);
        }
      } catch (err) {
        console.log("Equipment loading error:", err.message);

        if (isMounted) {
          setError("Could not load equipment. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEquipment();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter by category AND search text
  const filteredEquipment = useMemo(() => {
    const search = normalize(searchText);

    return equipment.filter((item) => {
      const matchingTypes = CATEGORY_TYPES[selectedCategory];

      const matchesCategory =
        selectedCategory === "All" ||
        !matchingTypes ||
        matchingTypes.some((categoryType) => {
          const type = normalize(item.type);
          return (
            type === categoryType || type.includes(categoryType)
          );
        });

      const matchesSearch =
        !search ||
        normalize(item.name).includes(search) ||
        normalize(item.type).includes(search) ||
        normalize(item.location).includes(search) ||
        normalize(item.owner).includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [equipment, selectedCategory, searchText]);

  // Load ratings and reviews for selected equipment
  useEffect(() => {
    if (!selectedEquipmentId) {
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
      setReviewsError("");
      return;
    }

    let isMounted = true;

    const fetchReviews = async () => {
      setReviewsLoading(true);
      setReviewsError("");

      try {
        const response = await fetch(
          `${API_URL}/api/reviews/equipment/${selectedEquipmentId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load reviews.");
        }

        if (isMounted) {
          setReviews(Array.isArray(data.reviews) ? data.reviews : []);
          setAverageRating(Number(data.averageRating) || 0);
          setTotalReviews(Number(data.totalReviews) || 0);
        }
      } catch (err) {
        console.log("Fetch reviews error:", err.message);

        if (isMounted) {
          setReviewsError(
            "Could not load reviews. Please try again later."
          );
        }
      } finally {
        if (isMounted) {
          setReviewsLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, [selectedEquipmentId]);

  // Load the logged-in farmer's eligible bookings for this equipment
  useEffect(() => {
    if (!selectedEquipmentId || !user?.id) {
      setMyBookings([]);
      setReviewBookingId("");
      return;
    }

    let isMounted = true;

    const fetchMyBookings = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/bookings/${user.id}`
        );

        if (!response.ok) {
          throw new Error("Unable to load your bookings.");
        }

        const data = await response.json();

        const bookings = Array.isArray(data)
          ? data
          : Array.isArray(data.bookings)
            ? data.bookings
            : [];

        const eligibleBookings = bookings.filter(
          (booking) =>
            String(
              booking.equipmentId?._id || booking.equipmentId
            ) === String(selectedEquipmentId) &&
            booking.status === "Approved" &&
            booking.paymentStatus === "Paid"
        );

        if (isMounted) {
          setMyBookings(eligibleBookings);
        }
      } catch (err) {
        console.log("Fetch farmer bookings error:", err.message);

        if (isMounted) {
          setMyBookings([]);
        }
      }
    };

    fetchMyBookings();

    return () => {
      isMounted = false;
    };
  }, [selectedEquipmentId, user?.id]);

  // Select an eligible booking that has not already been reviewed
  useEffect(() => {
    const reviewedBookingIds = new Set(
      reviews.map((review) => String(review.bookingId))
    );

    const eligibleBooking = myBookings.find(
      (booking) => !reviewedBookingIds.has(String(booking._id))
    );

    setReviewBookingId(eligibleBooking?._id || "");
  }, [myBookings, reviews]);

  // Submit a new review
  const submitReview = async () => {
    if (!user?.id || !user?.name) {
      setReviewError("Please log in to submit a review.");
      return;
    }

    if (!reviewBookingId) {
      setReviewError(
        "You need an approved and paid booking to submit a review."
      );
      return;
    }

    const comment = reviewComment.trim();

    if (comment.length < 3) {
      setReviewError("Please write at least 3 characters.");
      return;
    }

    if (comment.length > 1000) {
      setReviewError("Your review cannot exceed 1000 characters.");
      return;
    }

    if (reviewSubmitting) return;

    setReviewSubmitting(true);
    setReviewError("");
    setReviewMessage("");

    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: reviewBookingId,
          farmerId: user.id,
          farmerName: user.name,
          rating: reviewRating,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to submit your review."
        );
      }

      setReviewMessage("Thank you! Your review was submitted.");
      setReviewComment("");
      setReviewRating(5);

      const reviewResponse = await fetch(
        `${API_URL}/api/reviews/equipment/${selectedEquipmentId}`
      );

      if (reviewResponse.ok) {
        const reviewData = await reviewResponse.json();

        setReviews(
          Array.isArray(reviewData.reviews)
            ? reviewData.reviews
            : []
        );
        setAverageRating(Number(reviewData.averageRating) || 0);
        setTotalReviews(Number(reviewData.totalReviews) || 0);
      }
    } catch (err) {
      setReviewError(
        err.message || "Unable to submit your review."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Submit booking — existing functionality preserved
  const submitBooking = async () => {
    if (!selectedEquipment) return;

    if (!user?.id || !user?.name) {
      Alert.alert(
        "Login required",
        "Your account details are unavailable. Please log in again."
      );
      return;
    }

    const dateText = bookingDate.trim();

    if (!dateText) {
      Alert.alert("Missing date", "Please enter your booking date.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
      Alert.alert(
        "Invalid date",
        "Enter the date in YYYY-MM-DD format, for example 2026-10-20."
      );
      return;
    }

    const chosenDate = new Date(`${dateText}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(chosenDate.getTime()) ||
      chosenDate.getFullYear() !== Number(dateText.slice(0, 4)) ||
      chosenDate.getMonth() + 1 !== Number(dateText.slice(5, 7)) ||
      chosenDate.getDate() !== Number(dateText.slice(8, 10))
    ) {
      Alert.alert("Invalid date", "Please enter a valid calendar date.");
      return;
    }

    if (chosenDate < today) {
      Alert.alert("Invalid date", "Please choose today or a future date.");
      return;
    }

    if (!selectedEquipment.availability) {
      Alert.alert("Unavailable", "This equipment is not available.");
      return;
    }

    if (bookingLoading) return;

    setBookingLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          equipmentId: selectedEquipment._id,
          equipmentName: selectedEquipment.name,
          farmerId: user.id,
          farmerName: user.name,
          owner: selectedEquipment.owner,
          location: selectedEquipment.location,
          date: dateText,
          pricePerDay: selectedEquipment.pricePerDay,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Booking request failed.");
      }

      Alert.alert(
        "Booking Request Sent!",
        `${data.message || "Your request was submitted."}\n\n` +
          `Farmer: ${user.name}\n` +
          `Equipment: ${selectedEquipment.name}\n` +
          `Date: ${dateText}\n` +
          `Price: ₹${selectedEquipment.pricePerDay}/day\n` +
          "Status: Pending",
        [
          {
            text: "OK",
            onPress: () => {
              setSelectedEquipment(null);
              setBookingDate("");
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        "Booking Error",
        err.message || "Could not submit booking. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  // Existing equipment card
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => {
        setBookingDate("");
        setSelectedEquipment(item);
        setReviewMessage("");
        setReviewError("");
      }}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>🚜 No image</Text>
        </View>
      )}

      <View style={styles.details}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.type}>{item.type}</Text>
        <Text style={styles.location}>📍 {item.location}</Text>

        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => openEquipmentLocation(item.location)}
          activeOpacity={0.8}
        >
          <Text style={styles.locationButtonText}>
            📍 View Location in Google Maps
          </Text>
        </TouchableOpacity>

        <Text style={styles.price}>₹{item.pricePerDay} / day</Text>

        <Text
          style={[
            styles.availability,
            { color: item.availability ? "#15803D" : "#DC2626" },
          ]}
        >
          {item.availability ? "● Available" : "● Not available"}
        </Text>

        {!!item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        <Text style={styles.tapText}>Tap to view details →</Text>
      </View>
    </TouchableOpacity>
  );

  const goBack = () => {
    if (selectedEquipment) {
      setSelectedEquipment(null);
      setBookingDate("");
      setReviewMessage("");
      setReviewError("");
    } else {
      onBack?.();
    }
  };

  // Equipment details, booking form, and Ratings & Reviews
  const renderEquipmentDetails = () => {
    const item = selectedEquipment;

    return (
      <ScrollView
        contentContainerStyle={styles.detailContainer}
        keyboardShouldPersistTaps="handled"
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.detailImage} />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>🚜 No image</Text>
          </View>
        )}

        <Text style={styles.detailName}>{item.name}</Text>
        <Text style={styles.type}>{item.type}</Text>
        <Text style={styles.detailText}>📍 Location: {item.location}</Text>
        <Text style={styles.detailPrice}>₹{item.pricePerDay} per day</Text>

        <Text
          style={[
            styles.availability,
            { color: item.availability ? "#15803D" : "#DC2626" },
          ]}
        >
          {item.availability
            ? "● Available for rent"
            : "● Currently unavailable"}
        </Text>

        <Text style={styles.sectionTitle}>Equipment Description</Text>
        <Text style={styles.detailDescription}>
          {item.description || "No description available."}
        </Text>

        <Text style={styles.sectionTitle}>Owner</Text>
        <Text style={styles.detailText}>
          {item.owner || "Owner information unavailable"}
        </Text>

        <Text style={styles.sectionTitle}>Book this Equipment</Text>

        {!item.availability ? (
          <Text style={styles.unavailableMessage}>
            This equipment is currently unavailable for booking.
          </Text>
        ) : (
          <>
            <View style={styles.userBox}>
              <Text style={styles.userLabel}>Booking as</Text>
              <Text style={styles.userName}>
                {user?.name || "Unknown user"}
              </Text>
              <Text style={styles.userEmail}>
                {user?.email || "Logged-in account"}
              </Text>
            </View>

            <Text style={styles.fieldLabel}>Booking Date</Text>

            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (e.g. 2026-10-20)"
              value={bookingDate}
              onChangeText={setBookingDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Rental price</Text>
              <Text style={styles.priceValue}>
                ₹{item.pricePerDay} / day
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.bookButton,
                bookingLoading && styles.disabledButton,
              ]}
              disabled={bookingLoading}
              onPress={submitBooking}
              activeOpacity={0.8}
            >
              {bookingLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.bookButtonText}>
                  Confirm Booking Request
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>
              Your request will be sent to the equipment owner for approval.
            </Text>
          </>
        )}

        {/* Ratings & Reviews */}
        <Text style={styles.sectionTitle}>Ratings & Reviews</Text>

        {reviewsLoading ? (
          <ActivityIndicator
            size="small"
            color="#14532D"
            style={{ marginVertical: 16 }}
          />
        ) : (
          <>
            <View style={styles.ratingSummary}>
              <Text style={styles.averageRating}>
                {averageRating.toFixed(1)} / 5
              </Text>

              <Text style={styles.stars}>
                {"★".repeat(Math.round(averageRating))}
                {"☆".repeat(5 - Math.round(averageRating))}
              </Text>

              <Text style={styles.reviewCount}>
                Based on {totalReviews}{" "}
                {totalReviews === 1 ? "review" : "reviews"}
              </Text>
            </View>

            {!!reviewsError && (
              <Text style={styles.reviewError}>{reviewsError}</Text>
            )}

            {reviews.length === 0 ? (
              <Text style={styles.reviewEmpty}>
                No reviews yet. Be the first to share your experience!
              </Text>
            ) : (
              reviews.map((review) => {
                const rating = Math.max(
                  0,
                  Math.min(5, Number(review.rating) || 0)
                );

                return (
                  <View key={String(review._id)} style={styles.reviewCard}>
                    <Text style={styles.reviewerName}>
                      {review.farmerName || "Farmer"}
                    </Text>

                    <Text style={styles.reviewStars}>
                      {"★".repeat(rating)}
                      {"☆".repeat(5 - rating)}
                    </Text>

                    <Text style={styles.reviewComment}>
                      {review.comment}
                    </Text>

                    <Text style={styles.reviewDate}>
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleDateString()
                        : ""}
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>Write a Review</Text>

        {!user?.id ? (
          <Text style={styles.reviewEmpty}>
            Please log in to write a review.
          </Text>
        ) : !reviewBookingId ? (
          <Text style={styles.reviewEmpty}>
            You can review this equipment after your booking is approved and
            payment is completed. Each booking can be reviewed only once.
          </Text>
        ) : (
          <View style={styles.reviewForm}>
            <Text style={styles.fieldLabel}>Your Rating</Text>

            <View style={styles.ratingSelector}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  onPress={() => setReviewRating(rating)}
                  accessibilityLabel={`${rating} star${
                    rating === 1 ? "" : "s"
                  }`}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.ratingStarButton,
                      rating <= reviewRating && styles.selectedRatingStar,
                    ]}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Your Comment</Text>

            <TextInput
              style={[styles.input, styles.reviewInput]}
              placeholder="Share your experience with this equipment..."
              value={reviewComment}
              onChangeText={(text) => {
                setReviewComment(text);
                setReviewError("");
              }}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />

            <Text style={styles.reviewCount}>
              {reviewComment.length}/1000 characters
            </Text>

            {!!reviewError && (
              <Text style={styles.reviewError}>{reviewError}</Text>
            )}

            {!!reviewMessage && (
              <Text style={styles.reviewSuccess}>{reviewMessage}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.bookButton,
                reviewSubmitting && styles.disabledButton,
              ]}
              onPress={submitReview}
              disabled={reviewSubmitting}
              activeOpacity={0.8}
            >
              {reviewSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.bookButtonText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#14532D" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {selectedEquipment
            ? "Equipment Details"
            : selectedCategory === "All"
              ? "Available Equipment"
              : selectedCategory}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#14532D"
          style={styles.loader}
        />
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.message}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError("");
              setLoading(true);

              fetch(`${API_URL}/api/equipment`)
                .then((response) => {
                  if (!response.ok) {
                    throw new Error("Unable to load equipment");
                  }
                  return response.json();
                })
                .then((data) => {
                  if (!Array.isArray(data)) {
                    throw new Error("Invalid equipment data");
                  }
                  setEquipment(data);
                })
                .catch(() => {
                  setError("Could not load equipment. Please try again.");
                })
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : selectedEquipment ? (
        renderEquipmentDetails()
      ) : (
        <>
          {/* NEW: Search bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search equipment, type, location..."
              placeholderTextColor="#7B877D"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              returnKeyType="search"
            />

            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.categoryBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryBarContent}
            >
              {["All", "Tractors", "Tillage", "Irrigation", "Harvesting"].map(
                (category) => {
                  const active = selectedCategory === category;

                  return (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        active && styles.activeCategoryChip,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          active && styles.activeCategoryChipText,
                        ]}
                      >
                        {category === "All" ? "All Equipment" : category}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>
          </View>

          {filteredEquipment.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔎</Text>

              <Text style={styles.emptyTitle}>
                No{" "}
                {searchText.trim()
                  ? "matching equipment"
                  : selectedCategory === "All"
                    ? "equipment"
                    : selectedCategory.toLowerCase() + " equipment"}{" "}
                found
              </Text>

              <Text style={styles.message}>
                {searchText.trim()
                  ? "Try a different name, type, location, or owner."
                  : "Try another category or select All Equipment."}
              </Text>

              {(selectedCategory !== "All" || searchText.trim()) && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setSelectedCategory("All");
                    setSearchText("");
                  }}
                >
                  <Text style={styles.retryButtonText}>
                    Show All Equipment
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredEquipment}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <Text style={styles.countText}>
                  {filteredEquipment.length} item(s) found
                </Text>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAF5" },

  header: {
    backgroundColor: "#14532D",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: { marginRight: 12, paddingVertical: 5 },
  backText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },

  // NEW: Search styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE8D9",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
  },

  searchInput: {
    flex: 1,
    paddingVertical: 13,
    color: "#173B25",
    fontSize: 14,
  },

  clearSearch: {
    color: "#526354",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 6,
  },

  categoryBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E3EBE1",
  },

  categoryBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  categoryChip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F1F5EF",
    borderWidth: 1,
    borderColor: "#E1E9DE",
    marginRight: 8,
  },

  activeCategoryChip: {
    backgroundColor: "#14532D",
    borderColor: "#14532D",
  },

  categoryChipText: {
    color: "#36533D",
    fontSize: 13,
    fontWeight: "700",
  },

  activeCategoryChipText: { color: "#FFFFFF" },

  countText: {
    color: "#526354",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },

  list: { padding: 16, paddingBottom: 28 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E7EEE5",
  },

  image: {
    width: "100%",
    height: 190,
    backgroundColor: "#E7F3E8",
  },

  noImage: {
    height: 150,
    backgroundColor: "#E7F3E8",
    alignItems: "center",
    justifyContent: "center",
  },

  noImageText: { fontSize: 16, color: "#14532D" },

  details: { padding: 16 },

  name: { fontSize: 18, fontWeight: "800", color: "#173B25" },

  type: { fontSize: 13, color: "#6B7B6D", marginTop: 4 },

  location: { fontSize: 14, color: "#4C6652", marginTop: 10 },

  price: {
    fontSize: 18,
    fontWeight: "800",
    color: "#14532D",
    marginTop: 10,
  },

  availability: { fontSize: 13, fontWeight: "700", marginTop: 8 },

  description: {
    fontSize: 13,
    color: "#526354",
    lineHeight: 19,
    marginTop: 10,
  },

  tapText: {
    color: "#15803D",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 14,
  },

  detailContainer: { padding: 16, paddingBottom: 32 },

  detailImage: {
    width: "100%",
    height: 230,
    borderRadius: 14,
    backgroundColor: "#E7F3E8",
  },

  detailName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#173B25",
    marginTop: 18,
  },

  detailText: { fontSize: 16, color: "#526354", marginTop: 12 },

  detailPrice: {
    fontSize: 23,
    fontWeight: "800",
    color: "#14532D",
    marginTop: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#173B25",
    marginTop: 24,
    marginBottom: 4,
  },

  detailDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: "#526354",
    marginTop: 8,
  },

  userBox: {
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
  },

  userLabel: { color: "#526354", fontSize: 12 },

  userName: {
    color: "#14532D",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 4,
  },

  userEmail: { color: "#526354", fontSize: 13, marginTop: 3 },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#173B25",
    marginTop: 14,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1DCCF",
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    marginTop: 7,
    color: "#173B25",
  },

  priceBox: {
    backgroundColor: "#E8F5E9",
    padding: 14,
    borderRadius: 10,
    marginTop: 18,
  },

  priceLabel: { color: "#526354", fontSize: 14 },

  priceValue: {
    color: "#14532D",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },

  bookButton: {
    backgroundColor: "#15803D",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },

  disabledButton: { backgroundColor: "#9CA3AF" },

  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  unavailableMessage: {
    color: "#DC2626",
    fontSize: 15,
    marginTop: 12,
  },

  note: {
    color: "#526354",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    textAlign: "center",
  },

  loader: { marginTop: 60 },

  message: {
    textAlign: "center",
    margin: 16,
    color: "#526354",
    fontSize: 15,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  emptyIcon: { fontSize: 40, marginBottom: 12 },

  emptyTitle: {
    color: "#173B25",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },

  retryButton: {
    backgroundColor: "#14532D",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  locationButton: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#15803D",
    padding: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },

  locationButtonText: {
    color: "#14532D",
    fontSize: 14,
    fontWeight: "800",
  },

  // Ratings & Reviews styles
  ratingSummary: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },

  averageRating: {
    fontSize: 28,
    fontWeight: "800",
    color: "#14532D",
  },

  stars: {
    fontSize: 24,
    color: "#F5A623",
    marginTop: 4,
  },

  reviewCount: {
    fontSize: 12,
    color: "#526354",
    marginTop: 6,
  },

  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3EBE1",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },

  reviewerName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#173B25",
  },

  reviewStars: {
    fontSize: 18,
    color: "#F5A623",
    marginTop: 5,
  },

  reviewComment: {
    fontSize: 14,
    lineHeight: 21,
    color: "#526354",
    marginTop: 8,
  },

  reviewDate: {
    fontSize: 11,
    color: "#7B887D",
    marginTop: 8,
  },

  reviewEmpty: {
    fontSize: 13,
    lineHeight: 20,
    color: "#526354",
    backgroundColor: "#F1F5EF",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },

  reviewForm: {
    backgroundColor: "#F1F5EF",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },

  ratingSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  ratingStarButton: {
    fontSize: 34,
    color: "#C7CEC6",
    paddingHorizontal: 5,
  },

  selectedRatingStar: {
    color: "#F5A623",
  },

  reviewInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },

  reviewError: {
    color: "#DC2626",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },

  reviewSuccess: {
    color: "#15803D",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
});
