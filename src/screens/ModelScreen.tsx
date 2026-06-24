import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { getModelInfo } from "../ml/qrshieldEngine";
import { colors, radii, shadow } from "../theme/colors";
import { ModelMeta } from "../types";

type Props = {
  modelMeta: ModelMeta;
};

export function ModelScreen({ modelMeta }: Props) {
  const info = getModelInfo();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient colors={[colors.deep, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Ionicons name="hardware-chip" color={colors.surface} size={34} />
        <Text style={styles.heroTitle}>О модели</Text>
        <Text style={styles.heroText}>Собственная offline ML-модель для риск-флагов QR-ссылок. Без ChatGPT, API и сервера.</Text>
      </LinearGradient>

      <View style={styles.grid}>
        <Info label="Тип" value="Gradient Boosted Trees" />
        <Info label="Признаки" value={`${info.features}`} />
        <Info label="Деревья" value={`${info.trees}`} />
        <Info label="Узлы" value={`${info.nodes}`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Версия модели</Text>
        <Text style={styles.body}>Источник: {modelMeta.source === "cached" ? "кешированная модель" : "встроенная модель"}</Text>
        <Text style={styles.body}>Версия: {modelMeta.version}</Text>
        <Text style={styles.body}>Дата: {modelMeta.date}</Text>
        <Text style={styles.body}>Accuracy: ≈97.6%. Это честная оценка, не гарантия и не 99%.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Как принимать вердикт</Text>
        <Text style={styles.body}>🟢 green: явных признаков фишинга не обнаружено.</Text>
        <Text style={styles.body}>🟡 yellow: осторожно, ссылка скрыта или домен незнакомый.</Text>
        <Text style={styles.body}>🔴 red: высокий риск, открытие блокируется.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Честность по Казахстану</Text>
        <Text style={styles.body}>
          KZ-покрытие сейчас основано на allowlist банков, look-alike правилах и fail-safe поведении.
          Незнакомый .kz домен уходит в 🟡 by design. Казахская fine-tuning модель в roadmap.
        </Text>
      </View>
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
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
    gap: 14,
  },
  hero: {
    borderRadius: 30,
    padding: 24,
    minHeight: 190,
    justifyContent: "space-between",
    ...shadow,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 34,
    fontWeight: "900",
  },
  heroText: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
    lineHeight: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  info: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 16,
    ...shadow,
  },
  infoValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "900",
  },
  infoLabel: {
    color: colors.muted,
    fontWeight: "700",
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 18,
    ...shadow,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 10,
  },
  body: {
    color: colors.text,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 4,
  },
});
