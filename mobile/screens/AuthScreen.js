
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "http://10.50.101.100:5000";

export default function AuthScreen({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    if (
      !email.trim() ||
      !password ||
      (isRegister &&
        (!name.trim() ||
          !phone.trim() ||
          !location.trim()))
    ) {
      Alert.alert("Missing details", "Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/register" : "/api/login";

      const body = isRegister
        ? {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            location: location.trim(),
            password,
          }
        : {
            email: email.trim().toLowerCase(),
            password,
          };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      if (isRegister) {
        Alert.alert(
          "Registration successful",
          "Your account has been created. Please log in.",
          [
            {
              text: "OK",
              onPress: () => {
                setIsRegister(false);
                setPassword("");
              },
            },
          ]
        );
        return;
      }

      if (!data.token || !data.user) {
        throw new Error("Login response is missing account details.");
      }

      onLoginSuccess({
        token: data.token,
        user: data.user,
      });
    } catch (error) {
      Alert.alert("AgroShare", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>🌿</Text>
        <Text style={styles.title}>AgroShare</Text>
        <Text style={styles.subtitle}>
          Smart farming, shared resources
        </Text>

        <View style={styles.card}>
          <Text style={styles.heading}>
            {isRegister ? "Create Account" : "Welcome Back"}
          </Text>

          <Text style={styles.description}>
            {isRegister
              ? "Register to get started with AgroShare."
              : "Log in to continue to your account."}
          </Text>

          {isRegister && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your location"
                value={location}
                onChangeText={setLocation}
              />
            </>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isRegister ? "Create Account" : "Log In"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsRegister(!isRegister)}
            disabled={loading}
          >
            <Text style={styles.switchText}>
              {isRegister
                ? "Already have an account? Log in"
                : "New to AgroShare? Create an account"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Growing together, one farm at a time 🌱
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F7FAF5",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
  },
  logo: {
    fontSize: 45,
    textAlign: "center",
  },
  title: {
    color: "#14532D",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 5,
  },
  subtitle: {
    color: "#647568",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E3EBE0",
  },
  heading: {
    fontSize: 23,
    fontWeight: "800",
    color: "#173B25",
  },
  description: {
    fontSize: 13,
    color: "#6B7B6D",
    marginTop: 7,
    marginBottom: 20,
  },
  label: {
    color: "#23412D",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DCE5D9",
    backgroundColor: "#FBFCFA",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
    color: "#173B25",
  },
  button: {
    backgroundColor: "#14532D",
    paddingVertical: 15,
    borderRadius: 11,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  switchButton: {
    alignItems: "center",
    marginTop: 20,
  },
  switchText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    color: "#718272",
    fontSize: 12,
    textAlign: "center",
    marginTop: 25,
  },
});
