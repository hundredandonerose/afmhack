import { useCallback, useMemo, useState } from "react";
import { DimensionValue, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radii, shadow } from "../theme/colors";
import { getHistory } from "../storage/history";
import { HistoryItem, Verdict } from "../types";
import { StatCard } from "../components/StatCard";

function count(items: HistoryItem[], verdict: Verdict) {
  return items.filter((item) => item.verdict === verdict).length;
}

export function StatsScreen() {
  const [items, setItems] = useState<HistoryItem[]>([]);

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

  const stats = useMemo(() => {
    const green = count(items, "green");
    const yellow = count(items, "yellow");
    const red = count(items, "red");
    const total = items.length || 1;
    return { green, yellow, red, total };
  }, [items]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Статистика</Text>
      <Text style={styles.subtitle}>График строится только из реальной истории на этом устройстве.</Text>

      <View style={styles.cards}>
        <StatCard label="Проверено" value={items.length} />
        <StatCard label="Заблокировано" value={stats.red} tone="red" />
      </View>
      <View style={styles.cards}>
        <StatCard label="Под вопросом" value={stats.yellow} tone="amber" />
        <StatCard label="Безопасно" value={stats.green} tone="green" />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Verdict bar chart</Text>
        <Bar label="Безопасно" value={stats.green} total={stats.total} color={colors.green} />
        <Bar label="Осторожно" value={stats.yellow} total={stats.total} color={colors.amber} />
        <Bar label="Опасно" value={stats.red} total={stats.total} color={colors.red} />
      </View>
    </ScrollView>
  );
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const width = `${Math.max(4, Math.round((value / total) * 100))}%` as DimensionValue;
  return (
    <View style={styles.barBlock}>
      <View style={styles.barHead}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>{value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 18,
    paddingBottom: 120,
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
  cards: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  chartCard: {
    marginTop: 6,
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 18,
    gap: 16,
    ...shadow,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  barBlock: {
    gap: 8,
  },
  barHead: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  barLabel: {
    color: colors.text,
    fontWeight: "800",
  },
  barValue: {
    color: colors.muted,
    fontWeight: "900",
  },
  barTrack: {
    height: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.bg,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: radii.pill,
  },
});
