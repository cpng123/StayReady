// screens/ChatbotScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const OPENROUTER_ENDPOINT = process.env.EXPO_PUBLIC_OPENROUTER_ENDPOINT;
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

export default function ChatbotScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I’m the StayReady helper. Ask me anything about preparedness or the app.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const scrollToEnd = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  useEffect(() => {
    scrollToEnd();
  }, [messages.length]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!OPENROUTER_API_KEY) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Chatbot is disabled (missing API key). Add it to .env or use a server proxy.",
        },
      ]);
      return;
    }
    
    const userMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://stayready.local",
          "X-Title": "StayReady App",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b:free",
          messages: [...messages, userMessage],
          temperature: 0.5,
          top_p: 0.95,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenRouter ${res.status}: ${text}`);
      }

      const json = await res.json();
      const reply = json?.choices?.[0]?.message;
      if (reply?.content) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply.content },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I couldn’t generate a response this time.",
          },
        ]);
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Failed to connect to the chatbot. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  };

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color="#0b6fb8" />
        </TouchableOpacity>
        <Text style={styles.title}>Chatbot</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.select({ ios: 88, android: 0 })}
      >
        {/* Chat messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={{
            padding: 16,
            // Leave room for the fixed composer height + safe-area
            paddingBottom: 90 + insets.bottom,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((m, i) => (
            <View
              key={`${m.role}-${i}`}
              style={[
                styles.bubble,
                m.role === "user" ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text style={styles.bubbleText}>{m.content}</Text>
            </View>
          ))}
          {loading && <ActivityIndicator size="small" color="#0b6fb8" />}
        </ScrollView>

        {/* Composer pinned to bottom */}
        <View style={[styles.inputRow, { paddingBottom: 8 + insets.bottom }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask something..."
            placeholderTextColor="#6b7280"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={styles.sendBtn}
            disabled={loading || !input.trim()}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const PRIMARY = "#0b6fb8";
const CARD = "#ffffff";

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
    color: PRIMARY,
  },
  chatArea: { flex: 1, backgroundColor: "#fff" },

  bubble: {
    maxWidth: "82%",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#e7f2ff",
    borderWidth: 1,
    borderColor: "#d7e8ff",
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#eee",
  },
  bubbleText: { color: "#111827", lineHeight: 20 },

  // Composer pinned to bottom with stacking
  inputRow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
    backgroundColor: CARD,
    zIndex: 10,
    elevation: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    color: "#111827",
  },
  sendBtn: {
    marginLeft: 8,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
});
