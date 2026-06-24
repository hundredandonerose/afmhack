import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getHistory } from "../storage/history";
import { colors, radii, shadow } from "../theme/colors";
import { Assessment, HistoryItem, Verdict } from "../types";
import { SegmentedPill } from "../components/SegmentedPill";

type Props = {
  onResult: (result: Assessment) => void;
};

function verdictColor(verdict: Verdict) {
  if (verdict === "red") return colors.red;
  if (verdict === "yellow") return colors.amber;
  return colors.green;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function HistoryScreen({ onResult }: Props) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<"all" | Verdict>("all");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getHistory().then((history) => {
        if (active) setItems(history);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.verdict === filter);
  }, [filter, items]);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>История</Text>
      <Text style={styles.subtitle}>Последние проверки хранятся только на устройстве.</Text>
      <SegmentedPill
        value={filter}
        onChange={setFilter}
        options={[
          { label: "Все", value: "all" },
          { label: "🟢", value: "green" },
          { label: "🟡", value: "yellow" },
          { label: "🔴", value: "red" },
        ]}
      />

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filteredItems.length ? styles.list : styles.emptyWrap}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" color={colors.primary} size={38} />
            <Text style={styles.emptyTitle}>{items.length ? "Нет проверок в фильтре" : "Пока нет проверок"}</Text>
            <Text style={styles.emptyText}>
              {items.length ? "Переключите фильтр выше." : "Отсканируйте QR или вставьте ссылку вручную."}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => onResult(item)}>
            <View style={[styles.dot, { backgroundColor: verdictColor(item.verdict) }]} />
            <View style={styles.rowText}>
              <Text style={styles.host} numberOfLines={1}>{item.host || item.url}</Text>
              <Text style={styles.reason} numberOfLines={1}>{item.reasons[0]}</Text>
            </View>
            <View style={styles.right}>
              <Text style={[styles.risk, { color: verdictColor(item.verdict) }]}>{item.risk}</Text>
              <Text style={styles.time}>{formatTime(item.scannedAt)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 18,
  },
  title: {
    marginTop: 12,
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.muted,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 16,
  },
  list: {
    gap: 12,
    paddingTop: 14,
    paddingBottom: 120,
  },
  row: {
    minHeight: 86,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...shadow,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  rowText: {
    flex: 1,
  },
  host: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  reason: {
    color: colors.muted,
    fontWeight: "700",
    marginTop: 4,
  },
  right: {
    alignItems: "flex-end",
  },
  risk: {
    fontSize: 24,
    fontWeight: "900",
  },
  time: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyWrap: {
    flexGrow: 1,
    justifyContent: "center",
  },
  empty: {
    borderRadius: 30,
    backgroundColor: colors.surface,
    padding: 26,
    alignItems: "center",
    ...shadow,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 20,
    marginTop: 12,
  },
  emptyText: {
    color: colors.muted,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
});
