/**
 * File: components/ContactEditorModal.js
 * Purpose: Add/Edit emergency contact via a small, themed modal (Singapore-only).
 *
 * Responsibilities:
 *  - Manage simple form state (name + mobile digits) with i18n labels.
 *  - Validate SG mobile (8 digits, starts with 8/9) and normalize to E.164 (+65…).
 *  - Invoke onSave with a normalized contact object; close on success.
 *  - Reset form fields when `initial` or `open` changes.
 *  - Respect app theme and provide accessible touch targets.
 *
 */

import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { normalizeSGToE164, isValidSGMobileDigits } from "../utils/phone";
import { useThemeContext } from "../theme/ThemeProvider";
import { useTranslation } from "react-i18next";

export default function ContactEditorModal({ open, onClose, onSave, initial }) {
  const { theme } = useThemeContext();
  const { t } = useTranslation();

  // Local form state
  const [name, setName] = useState(initial?.name || "");
  // Derive 8-digit local part if an E.164 number is provided
  const initDigits = /^\+65\d{8}$/.test(initial?.value || "")
    ? (initial.value || "").slice(-8)
    : "";
  const [digits, setDigits] = useState(initDigits);
  const [err, setErr] = useState("");

  // Reset fields when editing a different contact or reopening
  useEffect(() => {
    setName(initial?.name || "");
    setDigits(
      /^\+65\d{8}$/.test(initial?.value || "") ? initial.value.slice(-8) : ""
    );
    setErr("");
  }, [initial, open]);

  // Keep only digits; clamp to 8; clear error as user types
  const handleChangeDigits = (txt) => {
    const onlyDigits = txt.replace(/\D/g, "");
    const next = onlyDigits.slice(0, 8); // clamp to 8
    setDigits(next);
    if (err) setErr("");
  };

  // Validate + normalize, then save and close
  const save = () => {
    if (!name.trim()) {
      return setErr(
        t("contact_editor.error_name_required", "Please enter a name.")
      );
    }
    if (!isValidSGMobileDigits(digits)) {
      return setErr(
        t(
          "contact_editor.error_digits_invalid",
          "Enter a valid SG mobile number (8 digits, starts with 8 or 9)."
        )
      );
    }

    const e164 = normalizeSGToE164(digits);
    if (!e164)
      return setErr(
        t("contact_editor.error_number_invalid", "Invalid number.")
      );

    setErr("");
    onSave?.({
      id: initial?.id,
      name: name.trim(),
      value: e164,
      channel: "auto",
    });
    onClose?.();
  };

  // UI
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop (tap to dismiss) */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Card */}
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {initial
            ? t("contact_editor.title_edit", "Edit Emergency Contact")
            : t("contact_editor.title_add", "Add Emergency Contact")}
        </Text>

        {/* Name */}
        <Text style={[styles.label, { color: theme.colors.subtext }]}>
          {t("contact_editor.label_name", "Name")}
        </Text>
        <TextInput
          value={name}
          onChangeText={(v) => {
            setName(v);
            if (err) setErr("");
          }}
          placeholder={t("contact_editor.placeholder_name", "e.g., Mom")}
          placeholderTextColor={theme.colors.subtext}
          style={[
            styles.input,
            { color: theme.colors.text, borderColor: theme.colors.subtext },
          ]}
        />

        {/* Phone (+65 fixed prefix, 8 digits input) */}
        <Text
          style={[styles.label, { color: theme.colors.subtext, marginTop: 10 }]}
        >
          {t("contact_editor.label_mobile", "Mobile (Singapore only)")}
        </Text>
        <View style={styles.phoneRow}>
          <View style={[styles.prefix, { borderColor: theme.colors.subtext }]}>
            <Text style={[styles.prefixText, { color: theme.colors.text }]}>
              +65
            </Text>
          </View>
          <TextInput
            value={digits}
            onChangeText={handleChangeDigits}
            placeholder={t("contact_editor.placeholder_digits", "9XXXXXXX")}
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

        {/* Error */}
        {!!err && <Text style={[styles.err, { color: "#DC2626" }]}>{err}</Text>}

        {/* Actions */}
        <View style={{ height: 10 }} />
        <TouchableOpacity
          onPress={save}
          activeOpacity={0.9}
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={styles.primaryBtnText}>
            {t("contact_editor.save", "Save")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.9}
          style={styles.secondaryBtn}
        >
          <Text style={[styles.secondaryBtnText, { color: theme.colors.text }]}>
            {t("contact_editor.cancel", "Cancel")}
          </Text>
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
  title: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 30,
    textAlign: "center",
  },
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
  primaryBtn: {
    marginTop: 30,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  secondaryBtn: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: { fontWeight: "800" },
});
