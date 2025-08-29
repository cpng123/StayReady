/**
 * EmergencyContactsScreen
 * ---------------------------------------------------------------------------
 *   CRUD for the user's emergency contacts (Singapore-first).
 *   - Lists saved contacts
 *   - Add / edit via ContactEditorModal (validates +65 mobile)
 *   - Delete with a safety confirmation
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../theme/ThemeProvider";
import { getContacts, saveContacts } from "../utils/emergencyContacts";
import ContactEditorModal from "../components/ContactEditorModal";
import ConfirmModal from "../components/ConfirmModal";
import { useTranslation } from "react-i18next";

const DANGER = "#DC2626";

// Format +65XXXXXXXX to "+65 9XXX XXXX" for display-only (no parsing)
function formatSGDisplay(e164) {
  const m = /^\+65(\d{4})(\d{4})$/.exec(String(e164 || ""));
  return m ? `+65 ${m[1]} ${m[2]}` : String(e164 || "");
}

// Create a stable random-ish id; used when migrating legacy items w/o id
function makeId(seed = "") {
  const rand = Math.random().toString(36).slice(2, 8);
  return `c_${Date.now()}_${rand}${seed ? "_" + seed : ""}`;
}

export default function EmergencyContactsScreen() {
  const nav = useNavigation();
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const { t } = useTranslation();

  const [contacts, setContacts] = useState([]);
  const [editing, setEditing] = useState(null); // { index, item } | null
  const [open, setOpen] = useState(false);

  // Delete confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmIndex, setConfirmIndex] = useState(-1);

  // Load current contacts from storage, and migrate any missing ids
  // (older builds might have saved items without `id`; we add one and persist).
  const load = useCallback(async () => {
    const list = (await getContacts()) || [];
    let changed = false;
    const fixed = list.map((c, i) => {
      if (c && !c.id) {
        changed = true;
        return { ...c, id: makeId(String(i)) };
      }
      return c;
    });
    if (changed) {
      try {
        await saveContacts(fixed);
      } catch {
        // non-fatal; UI will still render from in-memory state
      }
    }
    setContacts(Array.isArray(fixed) ? fixed : []);
  }, []);

  // Reload whenever screen regains focus
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Start add flow (empty editor)
  const onAdd = () => {
    setEditing({ index: -1, item: null });
    setOpen(true);
  };

  // Start edit flow for a given item
  const onEdit = (item, index) => {
    setEditing({ index, item });
    setOpen(true);
  };

  // Ask for delete confirmation
  const requestDelete = (index) => {
    setConfirmIndex(index);
    setConfirmOpen(true);
  };

  // Execute deletion after user confirms
  const doDelete = async () => {
    if (confirmIndex < 0) {
      setConfirmOpen(false);
      return;
    }
    const next = contacts.slice();
    next.splice(confirmIndex, 1);
    setContacts(next);
    try {
      await saveContacts(next);
    } catch {
      // If save fails, we still close the dialog; user will re-open later
    }
    setConfirmOpen(false);
    setConfirmIndex(-1);
  };

  // Persist from modal:
  //  - On edit, merge fields and ensure we keep/assign a stable `id`
  //  - On add, prepend a new contact with a fresh `id`
  const onSave = async (payload) => {
    const next = contacts.slice();
    const normalized = { channel: "auto", ...payload };

    if (editing?.index >= 0) {
      const existing = next[editing.index] || {};
      const id =
        existing.id || normalized.id || makeId(`edit_${editing.index}`);
      next[editing.index] = { ...existing, ...normalized, id };
    } else {
      next.unshift({
        id: normalized.id || makeId("new"),
        ...normalized,
      });
    }
    setContacts(next);
    try {
      await saveContacts(next);
    } catch {
      // non-fatal
    }
    setOpen(false);
  };

  // Single list row
  // - Tap row or pencil to edit
  // - Trash opens a confirm modal before deletion
  const Item = ({ item, index }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[s.row, { backgroundColor: theme.colors.card }]}
        onPress={() => onEdit(item, index)}
        accessibilityRole="button"
        accessibilityLabel={t(
          "emergency_contacts.edit_contact",
          "Edit contact"
        )}
      >
        {/* Avatar / leading icon */}
        <View style={s.avatarWrap}>
          <Ionicons
            name="person-circle"
            size={42}
            color={theme.colors.primary}
          />
        </View>

        {/* Name + phone */}
        <View style={{ flex: 1 }}>
          <Text
            style={[s.name, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.name || t("emergency_contacts.unnamed", "Unnamed")}
          </Text>
          <Text
            style={[s.sub, { color: theme.colors.subtext }]}
            numberOfLines={1}
          >
            {formatSGDisplay(item.value)}
          </Text>
        </View>

        {/* Edit & Delete actions (separate touch targets) */}
        <TouchableOpacity
          onPress={() => onEdit(item, index)}
          hitSlop={8}
          style={s.actBtn}
          accessibilityRole="button"
          accessibilityLabel={t("common.edit", "Edit")}
        >
          <Ionicons
            name="create-outline"
            size={22}
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => requestDelete(index)}
          hitSlop={8}
          style={s.actBtn}
          accessibilityRole="button"
          accessibilityLabel={t("common.delete", "Delete")}
        >
          <Ionicons name="trash-outline" size={22} color={DANGER} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Empty state (when there are no contacts at all)
  const empty = (
    <View style={s.emptyWrap}>
      <Ionicons name="people-outline" size={36} color={theme.colors.subtext} />
      <Text style={[s.emptyTitle, { color: theme.colors.text }]}>
        {t("emergency_contacts.empty_title", "No emergency contacts yet")}
      </Text>
      <Text style={[s.emptySub, { color: theme.colors.subtext }]}>
        {t(
          "emergency_contacts.empty_sub",
          "Add at least one contact. When SOS activates, we'll send an SMS first. If you're online, we'll also prepare a WhatsApp message with your live location link."
        )}
      </Text>
      <TouchableOpacity
        onPress={onAdd}
        activeOpacity={0.9}
        style={[s.primaryBtn, { backgroundColor: theme.colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel={t("emergency_contacts.add_contact", "Add Contact")}
      >
        <Text style={s.primaryText}>
          {t("emergency_contacts.add_contact", "Add Contact")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  /* -------------------------------- Render -------------------------------- */
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.appBg }]}>
      {/* Top bar (inline, lightweight) */}
      <View style={s.topBar}>
        <TouchableOpacity
          onPress={() => nav.goBack()}
          style={s.backBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("common.back", "Back")}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={[s.title, { color: theme.colors.text }]}>
          {t("emergency_contacts.title", "Emergency Contacts")}
        </Text>

        <TouchableOpacity
          onPress={onAdd}
          style={s.addBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t(
            "emergency_contacts.add_contact",
            "Add Contact"
          )}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* List of contacts (empty component if none) */}
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 24, flexGrow: 1 }}
        data={contacts}
        keyExtractor={(it, idx) => (it?.id ? String(it.id) : `fallback_${idx}`)}
        renderItem={({ item, index }) => <Item item={item} index={index} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={empty}
      />

      {/* Add/Edit modal */}
      <ContactEditorModal
        open={open}
        initial={editing?.item}
        onClose={() => setOpen(false)}
        onSave={onSave}
      />

      {/* Delete confirmation */}
      <ConfirmModal
        visible={confirmOpen}
        title={t("emergency_contacts.delete_confirm_title", "Delete contact?")}
        message={t(
          "emergency_contacts.delete_confirm_msg",
          "This contact will be removed from your emergency list."
        )}
        confirmLabel={t("emergency_contacts.delete", "Delete")}
        // Use explicit namespace for common cancel to avoid ambiguity
        cancelLabel={t("common:cancel", "Cancel")}
        onConfirm={doDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </SafeAreaView>
  );
}

const makeStyles = (theme) =>
  StyleSheet.create({
    safe: { flex: 1 },
    topBar: {
      height: 50,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    addBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontSize: 18, fontWeight: "800" },

    row: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
      gap: 10,
    },
    avatarWrap: {
      width: 45,
      height: 45,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    name: { fontSize: 18, fontWeight: "700" },
    sub: { fontSize: 14, fontWeight: "600" },
    actBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 2,
    },

    // Empty state centered
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 20,
      marginBottom: 80,
    },
    emptyTitle: { fontSize: 16, fontWeight: "900" },
    emptySub: {
      textAlign: "center",
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
      marginBottom: 6,
    },
    primaryBtn: {
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 6,
    },
    primaryText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  });
