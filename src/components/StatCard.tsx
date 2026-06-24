import { StyleSheet, Text, View } from "react-native";
import { colors, radii, shadow } from "../theme/colors";

type Props = {
  label: string;
  value: string | number;
  tone?: "green" | "amber" | "red" | "primary";
};

export function StatCard({ label, value, tone = "primary" }: Props) {
  const tint =
    tone === "green" ? colors.green : tone === "amber" ? colors.amber : tone === "red" ? colors.red : colors.primary;
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color: tint }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 116,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 18,
    justifyContent: "space-between",
    ...shadow,
  },
  value: {
    fontSize: 34,
    fontWeight: "900",
  },
  label: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 13,
  },
});
