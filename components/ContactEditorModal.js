// components/ContactEditorModal.js
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,             // ⬅️ add this
} from "react-native";
import { normalizeSGToE164, isValidSGMobileDigits } from "../utils/phone";
import { useThemeContext } from "../theme/ThemeProvider";

export default function ContactEditorModal({ open, onClose, onSave, initial }) {
  const { theme } = useThemeContext();
  const [name, setName] = useState(initial?.name || "");
  const initDigits = /^\+65\d{8}$/.test(initial?.value || "")
    ? (initial.value || "").slice(-8)
    : "";
  const [digits, setDigits] = useState(initDigits);
  const [err, setErr] = useState("");

  useEffect(() => {
    setName(initial?.name || "");
    setDigits(/^\+65\d{8}$/.test(initial?.value || "") ? initial.value.slice(-8) : "");
    setErr("");
  }, [initial, open]);

  const handleChangeDigits = (txt) => {
    const onlyDigits = txt.replace(/\D/g, "");
    if (onlyDigits.length <= 8) setDigits(onlyDigits);
    if (err) setErr("");
  };

  const save = () => {
    if (!name.trim()) return setErr("Please enter a name.");
    if (!isValidSGMobileDigits(digits))
      return setErr("Enter a valid SG mobile number (8 digits, starts with 8 or 9).");

    const e164 = normalizeSGToE164(digits);
    if (!e164) return setErr("Invalid number.");

    onSave?.({
      id: initial?.id,
      name: name.trim(),
      value: e164,
      channel: "auto",
    });
    onClose?.();
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      {/* Tap outside to close */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Card */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {initial ? "Edit Emergency Contact" : "Add Emergency Contact"}
        </Text>

        <Text style={[styles.label, { color: theme.colors.subtext }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g., Mom"
          placeholderTextColor={theme.colors.subtext}
          style={[
            styles.input,
            { color: theme.colors.text, borderColor: theme.colors.subtext },
          ]}
        />

        <Text style={[styles.label, { color: theme.colors.subtext, marginTop: 10 }]}>
          Mobile (Singapore only)
        </Text>
        <View style={styles.phoneRow}>
          <View style={[styles.prefix, { borderColor: theme.colors.subtext }]}>
            <Text style={[styles.prefixText, { color: theme.colors.text }]}>+65</Text>
          </View>
          <TextInput
            value={digits}
            onChangeText={handleChangeDigits}
            placeholder="9XXXXXXX"
            placeholderTextColor={theme.colors.subtext}
            keyboardType="number-pad"
            maxLength={8}
            style={[
              styles.input,
              styles.flex1,
              { color: theme.colors.text, borderColor: theme.colors.subtext },
            ]}
          />
        </View>

        {!!err && <Text style={[styles.err, { color: "#DC2626" }]}>{err}</Text>}

        <View style={{ height: 10 }} />
        <TouchableOpacity
          onPress={save}
          activeOpacity={0.9}
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={styles.primaryBtnText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} activeOpacity={0.9} style={styles.secondaryBtn}>
          <Text style={[styles.secondaryBtnText, { color: theme.colors.text }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  card: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "18%",
    borderRadius: 16,
    padding: 16,
    elevation: 6,
  },
  title: { fontSize: 18, fontWeight: "900", marginBottom: 30, textAlign: "center" },
  label: { fontSize: 13, fontWeight: "800", marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: "600",
    marginBottom: 10,
  },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  prefix: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  prefixText: { fontWeight: "800" },
  flex1: { flex: 1 },
  err: { marginTop: 8, fontWeight: "700" },
  primaryBtn: { marginTop: 30, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  secondaryBtn: { marginTop: 8, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  secondaryBtnText: { fontWeight: "800" },
});
