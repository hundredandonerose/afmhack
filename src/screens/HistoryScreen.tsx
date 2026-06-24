import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        <View style={styles.list}>
          {filteredItems.length ? (
            filteredItems.map((item) => (
              <Pressable key={item.id} style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => onResult(item)}>
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
            ))
          ) : (
            <View style={styles.empty}>
              <Ionicons name="time-outline" color={colors.primary} size={36} />
              <Text style={styles.emptyTitle}>{items.length ? "Нет проверок в фильтре" : "Пока нет проверок"}</Text>
              <Text style={styles.emptyText}>
                {items.length ? "Переключите фильтр выше." : "Отсканируйте QR или вставьте ссылку вручную."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 20,
  },
  list: {
    gap: 12,
    marginTop: 14,
  },
  row: {
    minHeight: 78,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...shadow,
  },
  pressed: {
    opacity: 0.82,
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  host: {
    color: colors.text,
    fontSize: 16,
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
    fontSize: 22,
    fontWeight: "900",
  },
  time: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  empty: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    padding: 24,
    alignItems: "center",
    ...shadow,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 19,
    marginTop: 12,
  },
  emptyText: {
    color: colors.muted,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },
});
