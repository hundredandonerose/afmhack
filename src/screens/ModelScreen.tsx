import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getModelInfo } from "../ml/qrshieldEngine";
import { colors, radii, shadow } from "../theme/colors";
import { ModelMeta } from "../types";

type Props = {
  modelMeta: ModelMeta;
};

export function ModelScreen({ modelMeta }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const info = getModelInfo();

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Ionicons name="shield-checkmark" color={colors.surface} size={22} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Как работает Aldanba</Text>
            <Text style={styles.subtitle}>
              Проверяет ссылку из QR прямо на телефоне, ещё до открытия. Ничего не отправляет в интернет.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Что мы проверяем</Text>
          <Check text="Подделки под банки и сервисы: kaspi, halyk, egov и другие." />
          <Check text="Подозрительные адреса, странные домены и маскировку ссылок." />
          <Check text="Скрытые и сокращённые ссылки, где реальный адрес не виден сразу." />
          <Check text="Новые незнакомые сайты, особенно если QR пришёл из непонятного источника." />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Что значит цвет</Text>
          <Meaning color={colors.green} icon="🟢" title="Безопасно" text="известный сайт или явных признаков угрозы нет." />
          <Meaning color={colors.amber} icon="🟡" title="Осторожно" text="ссылка скрыта или сайт пока незнаком." />
          <Meaning color={colors.red} icon="🔴" title="Опасно" text="похоже на подделку, открытие блокируется." />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Собственная ML-модель работает офлайн. Точность на тестовой выборке ≈97,6%, это оценка риска, не гарантия.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Важно про Казахстан</Text>
          <Text style={styles.body}>
            Aldanba использует выверенный список доверенных сервисов и защиту от подделок. Мы не пишем, что модель
            обучена на казахстанских данных: такое дообучение в планах.
          </Text>
          <Text style={styles.body}>
            Если домен .kz новый и явных признаков угрозы нет, приложение показывает «осторожно», а не «опасно».
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={detailsOpen ? "Скрыть технические детали" : "Показать технические детали"}
          onPress={() => setDetailsOpen((value) => !value)}
          style={({ pressed }) => [styles.detailsButton, pressed && styles.pressed]}
        >
          <Text style={styles.detailsButtonText}>Подробнее</Text>
          <Ionicons name={detailsOpen ? "chevron-up" : "chevron-down"} color={colors.primary} size={20} />
        </Pressable>

        {detailsOpen ? (
          <View style={styles.details}>
            <Text style={styles.detailText}>Модель: Gradient Boosted Trees</Text>
            <Text style={styles.detailText}>Признаки: {info.features}</Text>
            <Text style={styles.detailText}>Деревья: {info.trees}</Text>
            <Text style={styles.detailText}>Узлы: {info.nodes}</Text>
            <Text style={styles.detailText}>
              Версия: {modelMeta.version}; источник: {modelMeta.source === "cached" ? "кеш" : "встроенная"}; дата:{" "}
              {modelMeta.date}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Check({ text }: { text: string }) {
  return (
    <View style={styles.checkRow}>
      <Ionicons name="checkmark-circle" color={colors.primary} size={21} />
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

function Meaning({ color, icon, title, text }: { color: string; icon: string; title: string; text: string }) {
  return (
    <View style={styles.meaningRow}>
      <Text style={styles.meaningIcon}>{icon}</Text>
      <View style={styles.meaningText}>
        <Text style={[styles.meaningTitle, { color }]}>{title}</Text>
        <Text style={styles.body}>{text}</Text>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 14,
  },
  header: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 18,
    flexDirection: "row",
    gap: 14,
    ...shadow,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 18,
    gap: 12,
    ...shadow,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  body: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  meaningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  meaningIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
  meaningText: {
    flex: 1,
  },
  meaningTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 2,
  },
  note: {
    borderRadius: radii.card,
    backgroundColor: "#E6E9FF",
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  noteText: {
    color: colors.deep,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
  },
  detailsButton: {
    minHeight: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailsButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.82,
  },
  details: {
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 6,
  },
  detailText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },
});
