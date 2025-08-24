// screens/EmergencyContactsScreen.js
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

/** Format +65XXXXXXXX to "+65 9XXX XXXX" for display */
function formatSGDisplay(e164) {
  const m = /^\+65(\d{4})(\d{4})$/.exec(String(e164 || ""));
  return m ? `+65 ${m[1]} ${m[2]}` : String(e164 || "");
}

/** Create a stable random-ish id */
function makeId(seed = "") {
  const rand = Math.random().toString(36).slice(2, 8);
  return `c_${Date.now()}_${rand}${seed ? "_" + seed : ""}`;
}

export default function EmergencyContactsScreen() {
  const nav = useNavigation();
  const { theme } = useThemeContext();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const [contacts, setContacts] = useState([]);
  const [editing, setEditing] = useState(null); // {index, item} | null
  const [open, setOpen] = useState(false);

  // delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmIndex, setConfirmIndex] = useState(-1);

  // Load + migrate missing ids (prevents key warning)
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
      await saveContacts(fixed);
    }
    setContacts(Array.isArray(fixed) ? fixed : []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onAdd = () => {
    setEditing({ index: -1, item: null });
    setOpen(true);
  };

  const onEdit = (item, index) => {
    setEditing({ index, item });
    setOpen(true);
  };

  const requestDelete = (index) => {
    setConfirmIndex(index);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (confirmIndex < 0) {
      setConfirmOpen(false);
      return;
    }
    const next = contacts.slice();
    next.splice(confirmIndex, 1);
    setContacts(next);
    await saveContacts(next);
    setConfirmOpen(false);
    setConfirmIndex(-1);
  };

  const onSave = async (payload) => {
    const next = contacts.slice();
    const normalized = { channel: "auto", ...payload };

    if (editing?.index >= 0) {
      // preserve/ensure id on edit
      const existing = next[editing.index] || {};
      const id = existing.id || normalized.id || makeId(`edit_${editing.index}`);
      next[editing.index] = { ...existing, ...normalized, id };
    } else {
      // add new with a fresh id
      next.unshift({
        id: normalized.id || makeId("new"),
        ...normalized,
      });
    }
    setContacts(next);
    await saveContacts(next);
    setOpen(false);
  };

  const Item = ({ item, index }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[s.row, { backgroundColor: theme.colors.card }]}
        onPress={() => onEdit(item, index)}
      >
        {/* Profile icon */}
        <View style={s.avatarWrap}>
          <Ionicons name="person-circle" size={42} color={theme.colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[s.name, { color: theme.colors.text }]} numberOfLines={1}>
            {item.name || "Unnamed"}
          </Text>
          <Text style={[s.sub, { color: theme.colors.subtext }]} numberOfLines={1}>
            {formatSGDisplay(item.value)}
          </Text>
        </View>

        {/* Edit & Delete actions */}
        <TouchableOpacity onPress={() => onEdit(item, index)} hitSlop={8} style={s.actBtn}>
          <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => requestDelete(index)} hitSlop={8} style={s.actBtn}>
          <Ionicons name="trash-outline" size={22} color="#DC2626" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const empty = (
    <View style={s.emptyWrap}>
      <Ionicons name="people-outline" size={36} color={theme.colors.subtext} />
      <Text style={[s.emptyTitle, { color: theme.colors.text }]}>
        No emergency contacts yet
      </Text>
      <Text style={[s.emptySub, { color: theme.colors.subtext }]}>
        Add at least one contact. When SOS activates, we'll send an SMS first. If you're
        online, we'll also prepare a WhatsApp message with your live location link.
      </Text>
      <TouchableOpacity
        onPress={onAdd}
        activeOpacity={0.9}
        style={[s.primaryBtn, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={s.primaryText}>Add Contact</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.colors.appBg }]}>
      {/* Header */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.colors.text }]}>Emergency Contacts</Text>
        <TouchableOpacity onPress={onAdd} style={s.addBtn} hitSlop={8}>
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Body */}
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
        title="Delete contact?"
        message="This contact will be removed from your emergency list."
        confirmLabel="Delete"
        cancelLabel="Cancel"
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
    backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    addBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
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
