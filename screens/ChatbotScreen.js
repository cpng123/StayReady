// screens/ChatbotScreen.js
import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useThemeContext } from "../theme/ThemeProvider";

const OPENROUTER_ENDPOINT = process.env.EXPO_PUBLIC_OPENROUTER_ENDPOINT ?? "";
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? "";
const OPENROUTER_MODEL =
  process.env.EXPO_PUBLIC_OPENROUTER_MODEL ??
  "mistralai/mistral-7b-instruct:free";

// Singapore-first system prompt
const SYSTEM_PROMPT_SG = `
StayReady, a disaster-preparedness assistant for SINGAPORE.
Always prioritise Singapore-specific guidance, laws, and agencies.
If advice differs by country, give the SINGAPORE answer first.
Emergency numbers (Singapore): 995 (ambulance & fire/SCDF), 999 (police), 1777 (non-emergency ambulance).
Answer concisely and do NOT include analysis steps—just the final response.
`.trim();

/* -------------------- Quick FAQs: pick 3 at random once -------------------- */
const PRESET_QUESTIONS = [
  "What should I do during a flash flood?",
  "What is PM2.5 and why does it matter?",
  "How do I stay safe in a thunderstorm?",
  "How do I prevent dengue at home?",
  "Any tips for strong winds?",
  "How do I do CPR on an adult?",
  "What are key fire safety tips?",
  "What goes into an emergency kit?",
  "How to prepare for a disease outbreak?",
  "What to do during an earthquake?",
];
function pick3(arr) {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c.slice(0, 3);
}

// Topic → resource actions
const openGuide = (id, label) => ({
  label,
  to: { screen: "PreparednessGuide", params: { id } },
});
const openEarlyWarnings = {
  label: "See Early Warnings",
  to: { screen: "EarlyWarning" },
};

function actionsForTopic(text) {
  const s = String(text || "").toLowerCase();
  const acts = [];
  if (/(flood|flash\s*flood)/.test(s))
    acts.push(openGuide("flood", "Open Flash Flood guide"), openEarlyWarnings);
  if (/(pm2\.?5|haze|air quality)/.test(s))
    acts.push(openGuide("haze", "Open Haze (PM2.5) guide"), openEarlyWarnings);
  if (/(thunder|lightning|storm)/.test(s))
    acts.push(openGuide("storm", "Open Thunderstorm guide"), openEarlyWarnings);
  if (/(dengue|mosquito)/.test(s))
    acts.push(openGuide("dengue", "Open Dengue Prevention guide"));
  if (/(strong\s*wind|gust|gale)/.test(s))
    acts.push(openGuide("wind", "Open Strong Wind guide"), openEarlyWarnings);
  if (/(cpr|first\s*aid|aeds?)/.test(s))
    acts.push(openGuide("aid", "Open CPR & First Aid guide"));
  if (/(fire|smoke alarm)/.test(s))
    acts.push(openGuide("fire", "Open Fire Safety guide"));
  if (/(emergency\s*kit|go\s*bag)/.test(s))
    acts.push(openGuide("kit", "Open Emergency Kits guide"));
  if (/(disease|outbreak|pandemic)/.test(s))
    acts.push(openGuide("disease", "Open Disease Outbreak guide"));
  if (/(earthquake|tremor|aftershock)/.test(s))
    acts.push(openGuide("earthquake", "Open Earthquake guide"));
  return acts;
}

/* ---------------------- Post-process the model reply ----------------------- */
function cutAfterFinalMarkers(text) {
  if (!text) return null;
  const markers = [
    /\bassistantfinal\b/i,
    /\bfinal(?:ly)?\s*:\s*/i,
    /<\s*final\s*>/i,
    /###\s*final\b/i,
  ];
  for (const re of markers) {
    const m = re.exec(text);
    if (m) return text.slice(m.index + m[0].length).trim();
  }
  return null;
}
function sanitizeReply(text) {
  if (!text) return "";
  const after = cutAfterFinalMarkers(text);
  text = after || text;
  text = text.replace(
    /```(?:analysis|reasoning|thoughts?|scratchpad)[\s\S]*?```/gi,
    ""
  );
  text = text.replace(/<\s*think(?:ing)?\s*>[\s\S]*?<\s*\/\s*think\s*>/gi, "");
  text = text.replace(/^\s*analysis[^\n]*\n+/i, "");
  text = text.replace(
    /^(?:\s*(?:Analysis|Reasoning|Thoughts?)\s*:\s*[\s\S]*?\n\n)/i,
    ""
  );
  return text.trim();
}
function localizeSG(text) {
  if (!text) return text;
  return text
    .replace(/\b911\b/g, "999 (police) or 995 (ambulance & fire)")
    .replace(/\b112\b/g, "999 (police) or 995 (ambulance & fire)");
}
function addFriendlyEmojis(text) {
  if (!text) return text;
  let out = text;
  out = out.replace(/\bcall\s*995\b/gi, "📞 Call 995");
  out = out.replace(/\bcall\s*999\b/gi, "📞 Call 999");
  out = out.replace(
    /\bnon-?emergency ambulance\b/gi,
    "🚑 Non-emergency ambulance (1777)"
  );
  out = out.replace(/\bstay (indoors|inside)\b/gi, "🏠 Stay $1");
  out = out.replace(/\bavoid\b/gi, "⚠️ avoid");
  out = out.replace(/\bmove to higher ground\b/gi, "⬆️ Move to higher ground");
  out = out.replace(/\bwear (an )?n95\b/gi, "😷 Wear an N95");
  out = out.replace(/\buse (a )?purifier\b/gi, "🧼 Use an air purifier");
  if (!/^[🤖✅⚠️🏠⬆️😷📞🚑]/.test(out)) out = `🤖 ${out}`;
  return out;
}
function looksEmergency(s) {
  if (!s) return false;
  const x = s.toLowerCase();
  return /emergency|bleed|broken|fracture|unconscious|not breathing|heart attack|choke|burn|fire|crime|assault|accident|fainted|seizure|stroke|poison|overdose/.test(
    x
  );
}
function emergencyCTAs() {
  return [
    { label: "Call 995 (Ambulance/SCDF)", tel: "995" },
    { label: "Call 999 (Police)", tel: "999" },
    { label: "Open SOS", to: { screen: "SOSTab" } },
  ];
}

/* -------------------------------- Component ------------------------------- */
export default function ChatbotScreen() {
  const { theme } = useThemeContext();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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

  // show 3 random FAQs at start; hide after the first user message
  const startFAQs = useMemo(() => pick3(PRESET_QUESTIONS), []);
  const [showStartFaqs, setShowStartFaqs] = useState(true);

  const scrollRef = useRef(null);
  const scrollToEnd = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  useEffect(() => {
    scrollToEnd();
  }, [messages.length]);

  const handleActionPress = async (a) => {
    try {
      if (a?.tel) {
        const url = `tel:${a.tel}`;
        if (await Linking.canOpenURL(url)) await Linking.openURL(url);
        return;
      }
      if (a?.url) {
        if (await Linking.canOpenURL(a.url)) await Linking.openURL(a.url);
        return;
      }
      if (a?.to?.screen) {
        navigation.navigate(a.to.screen, a.to.params || {});
      }
    } catch {}
  };

  const sendMessage = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // hide start FAQs after first user action
    if (showStartFaqs) setShowStartFaqs(false);

    const userMessage = { role: "user", content: trimmed };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setLoading(true);

    if (!OPENROUTER_ENDPOINT || !OPENROUTER_API_KEY) {
      setMessages([
        ...updated,
        {
          role: "assistant",
          content:
            "⚠️ Missing envs: EXPO_PUBLIC_OPENROUTER_ENDPOINT / EXPO_PUBLIC_OPENROUTER_API_KEY.",
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          temperature: 0.2,
          messages: [
            { role: "system", content: SYSTEM_PROMPT_SG },
            {
              role: "user",
              content:
                "User locale: Singapore. Reply with concise, practical steps appropriate to Singapore.",
            },
            ...updated,
          ],
        }),
      });

      const textBody = await res.text();
      if (!res.ok) {
        let msg = "";
        try {
          const j = JSON.parse(textBody);
          msg = j?.error?.message || j?.message || j?.error || "";
        } catch {}
        throw new Error(msg || `HTTP ${res.status} ${textBody.slice(0, 200)}`);
      }

      let data;
      try {
        data = JSON.parse(textBody);
      } catch {
        throw new Error(`Bad JSON from server: ${textBody.slice(0, 200)}`);
      }

      let ai = data?.choices?.[0]?.message?.content?.trim();
      if (!ai) throw new Error("No choices in response.");
      ai = addFriendlyEmojis(localizeSG(sanitizeReply(ai)));

      let actions = actionsForTopic(trimmed);
      if (looksEmergency(trimmed)) actions = [...actions, ...emergencyCTAs()];

      setMessages([...updated, { role: "assistant", content: ai, actions }]);
    } catch (err) {
      setMessages([
        ...updated,
        { role: "assistant", content: `❌ ${err.message}` },
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
          style={styles.headerBtn}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chatbot</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.select({ ios: 88, android: 0 })}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 14 + insets.bottom,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((m, i) =>
            m.role === "assistant" ? (
              <View key={`${m.role}-${i}`} style={styles.rowLeft}>
                <Image
                  source={require("../assets/General/bot.png")}
                  style={styles.avatar}
                />
                <View style={[styles.bubble, styles.botBubble]}>
                  <Text style={styles.bubbleText}>{m.content}</Text>
                  {Array.isArray(m.actions) && m.actions.length > 0 && (
                    <View style={styles.ctaRow}>
                      {m.actions.map((a, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.ctaBtn}
                          activeOpacity={0.85}
                          onPress={() => handleActionPress(a)}
                        >
                          <Text style={styles.ctaText}>{a.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View key={`${m.role}-${i}`} style={styles.rowRight}>
                <View style={[styles.bubble, styles.userBubble]}>
                  <Text style={styles.bubbleText}>{m.content}</Text>
                </View>
              </View>
            )
          )}

          {loading && (
            <View style={[styles.rowLeft, { alignItems: "center" }]}>
              <Image
                source={require("../assets/General/bot.png")}
                style={styles.avatar}
              />
              <View style={[styles.bubble, styles.botBubble]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.bubbleText, { marginTop: 6 }]}>
                  typing…
                </Text>
              </View>
            </View>
          )}

          {/* Mini FAQs — only at start, disappear after first user message */}
          {showStartFaqs && !loading && (
            <View
              style={styles.faqOverlay}
              pointerEvents="box-none"
            >
              <View style={styles.faqInner}>
                {startFAQs.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestChip}
                    onPress={() => sendMessage(q)}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.suggestText} numberOfLines={1}>
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Composer */}
        <View style={[styles.inputRow, { paddingBottom: 8 + insets.bottom }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask something…"
            placeholderTextColor={theme.colors.subtext}
            style={styles.input}
            editable={!loading}
            returnKeyType="send"
            onSubmitEditing={() => !loading && input.trim() && sendMessage()}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={loading || !input.trim()}
            activeOpacity={0.8}
            style={[
              styles.sendBtn,
              (loading || !input.trim()) && { opacity: 0.5 },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* --------------------------------- Styles --------------------------------- */
const makeStyles = (theme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.colors.appBg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor:
        theme.key === "dark" ? "rgba(255,255,255,0.08)" : "#E5E7EB",
      backgroundColor: theme.colors.appBg,
    },
    headerBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontWeight: "800",
      color: theme.colors.text,
      fontSize: 18,
    },

    chatArea: { flex: 1, backgroundColor: theme.colors.appBg },

    rowLeft: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 8,
      maxWidth: "92%",
    },
    rowRight: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 8,
    },
    avatar: { width: 28, height: 28, borderRadius: 6, marginRight: 8 },

    bubble: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 12,
      maxWidth: "86%",
    },
    userBubble: {
      backgroundColor:
        theme.key === "dark" ? "rgba(59,130,246,0.25)" : "#e7f2ff",
      borderWidth: 1,
      borderColor: theme.key === "dark" ? "rgba(59,130,246,0.35)" : "#d7e8ff",
      alignSelf: "flex-end",
    },
    botBubble: {
      backgroundColor: theme.key === "dark" ? "#1F2937" : "#f5f5f5",
      borderWidth: 1,
      borderColor: theme.key === "dark" ? "rgba(255,255,255,0.08)" : "#eee",
      alignSelf: "flex-start",
    },
    bubbleText: { color: theme.colors.text, lineHeight: 20 },

    ctaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    ctaBtn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
    },
    ctaText: { color: "#fff", fontWeight: "800", fontSize: 12 },

    // Mini FAQ chips (3 rows, centered)
    suggestWrap: { marginTop: 8, marginBottom: 6, alignItems: "center" },
    suggestChip: {
      backgroundColor: theme.key === "dark" ? "#0b2942" : "#dfefff",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginVertical: 4,
      maxWidth: "92%",
      borderWidth: 1,
      borderColor: theme.key === "dark" ? "rgba(255,255,255,0.08)" : "#bddbff",
    },
    suggestText: {
      fontSize: 13,
      textAlign: "center",
      color: theme.colors.primary,
      fontWeight: "700",
    },

    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor:
        theme.key === "dark" ? "rgba(255,255,255,0.08)" : "#eef2f7",
      backgroundColor: theme.colors.card,
    },
    input: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: theme.key === "dark" ? "rgba(255,255,255,0.12)" : "#e5e7eb",
      borderRadius: 10,
      paddingHorizontal: 12,
      backgroundColor: theme.key === "dark" ? "#0b1320" : "#fff",
      color: theme.colors.text,
    },
    sendBtn: {
      marginLeft: 8,
      height: 40,
      width: 44,
      borderRadius: 10,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    faqOverlay: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 470,

      alignItems: "center",
      zIndex: 5,
    },
    faqInner: {
      width: "92%",
      alignItems: "center",
    },
  });
