import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import EquipmentScreen from "./screens/EquipmentScreen";
import AuthScreen from "./screens/AuthScreen";
import MyBookingsScreen from "./screens/MyBookingsScreen";
import RecommendationsScreen from "./screens/RecommendationsScreen";
import MyEquipmentScreen from "./screens/MyEquipmentScreen";
import OwnerRequestsScreen from "./screens/OwnerRequestsScreen";

const API_URL = "http://10.50.101.100:5000";

const categories = [
  { icon: "🚜", title: "Tractors", color: "#E8F5E9" },
  { icon: "🌱", title: "Tillage", color: "#FFF3E0" },
  { icon: "💧", title: "Irrigation", color: "#E3F2FD" },
  { icon: "🌾", title: "Harvesting", color: "#F3E5F5" },
];

const navigationTabs = [
  { key: "Home", icon: "🏠", label: "Home" },
  { key: "Equipment", icon: "🚜", label: "Equipment" },
  { key: "Bookings", icon: "📋", label: "Bookings" },
  { key: "Recommendations", icon: "✨", label: "Smart AI" },
];

export default function App() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  const [session, setSession] = useState(null);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");

  // Stores the category selected on the Home screen.
  const [equipmentCategory, setEquipmentCategory] = useState("All");
  const [showMyEquipment, setShowMyEquipment] = useState(false);
  const [showOwnerRequests, setShowOwnerRequests] = useState(false);

  const navigateToTab = (tab) => {
    setActiveTab(tab);

    if (tab === "Equipment") {
      setEquipmentCategory("All");
    }

    setShowEquipment(tab === "Equipment");
    setShowMyBookings(tab === "Bookings");
    setShowRecommendations(tab === "Recommendations");
    setShowMyEquipment(false);
  };

  // Open one specific category from the Home screen.
  const openCategory = (category) => {
    setEquipmentCategory(category);
    setActiveTab("Equipment");
    setShowEquipment(true);
    setShowMyBookings(false);
    setShowRecommendations(false);
  };

  const goHome = () => {
    setShowEquipment(false);
    setShowMyBookings(false);
    setShowRecommendations(false);
    setShowMyEquipment(false);
    setActiveTab("Home");
    setEquipmentCategory("All");
    setShowOwnerRequests(false);
  };

  const handleLoginSuccess = (loginData) => {
    setSession(loginData);
    goHome();
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Do you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => {
          setSession(null);
          setEquipment([]);
          goHome();
        },
      },
    ]);
  };

  const loadEquipment = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/equipment`);

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected equipment data received");
      }

      setEquipment(data);

      Alert.alert(
        "AgroShare",
        `Connection successful! Found ${data.length} equipment item(s).`
      );
    } catch (error) {
      console.log("Equipment fetch error:", error.message);

      Alert.alert(
        "Connection Error",
        "Could not load equipment. Check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderBottomNavigation = () => (
    <View style={styles.bottomNav}>
      {navigationTabs.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => navigateToTab(tab.key)}
          >
            <View
              style={[
                styles.navIconContainer,
                isActive && styles.activeNavIconContainer,
              ]}
            >
              <Text style={styles.navIcon}>{tab.icon}</Text>
            </View>

            <Text
              style={[
                styles.navLabel,
                isActive && styles.activeNavLabel,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>

            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // Login and registration remain unchanged.
  if (!session) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }
  if (showOwnerRequests) {
    return (
      <OwnerRequestsScreen
        user={session.user}
        onBack={goHome}
      />
    );
  }

  if (showMyEquipment) {
    return (
      <MyEquipmentScreen
        user={session.user}
        token={session.token}
        onBack={goHome}
      />
    );
  }
  if (showMyBookings) {
    return (
      <MyBookingsScreen
        user={session.user}
        onBack={goHome}
      />
    );
  }

  if (showEquipment) {
    return (
      <EquipmentScreen
        onBack={goHome}
        user={session.user}
        initialCategory={equipmentCategory}
      />
    );
  }

  if (showRecommendations) {
    return (
      <RecommendationsScreen
        onBack={goHome}
      />
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <StatusBar backgroundColor="#14532D" barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logo}>🌿</Text>
          </View>

          <View style={styles.brandText}>
            <Text style={styles.brandName}>AgroShare</Text>
            <Text style={styles.tagline}>
              Smart farming, shared resources
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.75}
          >
            <Text style={styles.logoutButtonText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <View style={styles.welcomeBar}>
          <Text style={styles.welcomeText}>
            Welcome, {session.user.name}!
          </Text>
          <Text style={styles.welcomeSubtext}>
            Your farming journey starts here.
          </Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>WELCOME TO AGROSHARE</Text>

          <Text style={styles.heroTitle}>
            Better farming,{"\n"}together.
          </Text>

          <Text style={styles.heroDescription}>
            Find and rent agricultural equipment for your farm, all in one place.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigateToTab("Equipment")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              Explore Equipment →
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigateToTab("Bookings")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              My Bookings →
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowMyEquipment(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              My Equipment →
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowOwnerRequests(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              Owner Booking Requests →
            </Text>
          </TouchableOpacity>

          <View style={styles.heroDecoration}>
            <Text style={styles.heroEmoji}>🚜</Text>
          </View>
        </View>

        {/* Equipment Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Equipment Categories
              </Text>
              <Text style={styles.sectionSubtitle}>
                Find the right tools for your farm
              </Text>
            </View>
          </View>

          <View style={styles.categoryGrid}>
            {categories.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={styles.categoryCard}
                activeOpacity={0.75}
                onPress={() => openCategory(item.title)}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: item.color },
                  ]}
                >
                  <Text style={styles.categoryEmoji}>{item.icon}</Text>
                </View>

                <Text style={styles.categoryTitle}>{item.title}</Text>
                <Text style={styles.categoryAction}>
                  View equipment →
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Backend Connection Test */}
        <View style={styles.connectionSection}>
          <TouchableOpacity
            style={styles.connectionButton}
            onPress={loadEquipment}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.connectionButtonText}>
                Test Backend Connection
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {equipment.length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>
              Backend Connection Successful
            </Text>
            <Text style={styles.resultsText}>
              {equipment.length} equipment item(s) received from your backend.
            </Text>

            <TouchableOpacity
              onPress={() => navigateToTab("Equipment")}
              activeOpacity={0.7}
            >
              <Text style={styles.resultsLink}>
                View all equipment →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Smart Recommendations */}
        <TouchableOpacity
          style={styles.recommendationCard}
          activeOpacity={0.85}
          onPress={() => navigateToTab("Recommendations")}
        >
          <Text style={styles.recommendationIcon}>✨</Text>

          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>
              Smart Recommendations
            </Text>

            <Text style={styles.recommendationDescription}>
              Discover equipment suited to your crop, land size and budget.
            </Text>

            <View style={styles.recommendationButton}>
              <Text style={styles.recommendationButtonText}>
                Get Recommendations →
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Growing together, one farm at a time 🌱
          </Text>
        </View>
      </ScrollView>

      {renderBottomNavigation()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAF5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  header: {
    backgroundColor: "#14532D",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { fontSize: 25 },
  brandText: { flex: 1, marginLeft: 12 },
  brandName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  tagline: {
    color: "#D1FAE5",
    fontSize: 11,
    marginTop: 3,
  },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  logoutButtonText: {
    color: "#14532D",
    fontSize: 12,
    fontWeight: "800",
  },
  welcomeText: {
    color: "#14532D",
    fontSize: 18,
    fontWeight: "800",
  },
  welcomeSubtext: {
    color: "#4C6652",
    fontSize: 12,
    marginTop: 4,
  },
  hero: {
    margin: 18,
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#14532D",
    overflow: "hidden",
  },
  eyebrow: {
    color: "#BBF7D0",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 41,
    marginTop: 15,
  },
  heroDescription: {
    color: "#E5F5E9",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 260,
  },
  primaryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 22,
    minWidth: 170,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#14532D",
    fontSize: 13,
    fontWeight: "800",
  },
  heroDecoration: {
    position: "absolute",
    right: -14,
    bottom: -18,
    opacity: 0.15,
  },
  heroEmoji: { fontSize: 115 },
  section: {
    paddingHorizontal: 20,
    marginTop: 6,
  },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: {
    color: "#173B25",
    fontSize: 20,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: "#6B7B6D",
    fontSize: 12,
    marginTop: 5,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E7EEE5",
  },
  categoryIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryEmoji: { fontSize: 27 },
  categoryTitle: {
    color: "#23412D",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },
  categoryAction: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 7,
  },
  connectionSection: {
    paddingHorizontal: 18,
    marginTop: 4,
    marginBottom: 8,
  },
  connectionButton: {
    backgroundColor: "#286541",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 45,
  },
  connectionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  resultsCard: {
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#E7F3E8",
    borderWidth: 1,
    borderColor: "#C5E3CA",
  },
  resultsTitle: {
    color: "#14532D",
    fontSize: 15,
    fontWeight: "800",
  },
  resultsText: {
    color: "#23412D",
    fontSize: 13,
    marginTop: 6,
  },
  resultsLink: {
    color: "#14532D",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
  },
  recommendationCard: {
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 12,
    padding: 19,
    borderRadius: 20,
    backgroundColor: "#E7F3E8",
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#D4E8D5",
  },
  recommendationIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  recommendationContent: { flex: 1 },
  recommendationTitle: {
    color: "#14532D",
    fontSize: 17,
    fontWeight: "800",
  },
  recommendationDescription: {
    color: "#4C6652",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  recommendationButton: {
    alignSelf: "flex-start",
    marginTop: 13,
    backgroundColor: "#14532D",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  recommendationButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    padding: 22,
    alignItems: "center",
  },
  footerText: {
    color: "#718272",
    fontSize: 12,
  },

  // Bottom navigation
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E3EBE1",
    paddingHorizontal: 5,
    paddingTop: 8,
    paddingBottom: 5,
    elevation: 12,
    shadowColor: "#163D24",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    minWidth: 0,
  },
  navIconContainer: {
    width: 42,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeNavIconContainer: {
    backgroundColor: "#E7F3E8",
  },
  navIcon: { fontSize: 19 },
  navLabel: {
    color: "#7B877C",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
  activeNavLabel: {
    color: "#14532D",
    fontWeight: "800",
  },
  activeIndicator: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#2E7D32",
    marginTop: 4,
  },
});