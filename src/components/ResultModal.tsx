import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadow } from "../theme/colors";
import { Assessment } from "../types";
import { RiskGauge } from "./RiskGauge";

const labels = {
  green: "🟢 Безопасно",
  yellow: "🟡 Осторожно",
  red: "🔴 Опасно — не открывайте",
};

function tone(result: Assessment) {
  if (result.verdict === "red") return colors.red;
  if (result.verdict === "yellow") return colors.amber;
  return colors.green;
}

function imitationDomain(result: Assessment) {
  const first = result.reasons?.[0] || "";
  const match = first.match(/имитирует «([^»]+)»/);
  return match?.[1] ?? null;
}

type Props = {
  result: Assessment | null;
  visible: boolean;
  onClose: () => void;
};

export function ResultModal({ result, visible, onClose }: Props) {
  if (!result) return null;
  const color = tone(result);
  const imitation = imitationDomain(result);
  const canOpen = result.verdict !== "red";
  const buttonLabel =
    result.verdict === "green" ? "Открыть сайт" : "Всё равно открыть (на свой риск)";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Результат проверки</Text>
            <Pressable onPress={onClose} style={styles.close} accessibilityLabel="Закрыть результат">
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <RiskGauge risk={result.risk} verdict={result.verdict} />
            <Text style={[styles.verdict, { color }]}>{labels[result.verdict]}</Text>
            <Text style={styles.host}>{result.host || result.url}</Text>

            {imitation ? (
              <View style={styles.banner}>
                <Text style={styles.bannerText}>⚠️ Имитирует {imitation}</Text>
              </View>
            ) : null}

            <View style={styles.reasonBox}>
              {result.reasons.map((reason, index) => (
                <Text key={`${reason}-${index}`} style={[styles.reason, index === 0 && styles.reasonHeadline]}>
                  {index === 0 ? "• " : "  "}
                  {reason}
                </Text>
              ))}
            </View>

            <Text style={styles.privacy}>URL проверен локально. Он не отправлялся на сервер.</Text>

            {canOpen ? (
              <Pressable
                style={[styles.action, { backgroundColor: color }]}
                onPress={() => Linking.openURL(result.url.includes("://") ? result.url : `https://${result.url}`)}
              >
                <Text style={styles.actionText}>{buttonLabel}</Text>
              </Pressable>
            ) : (
              <View style={styles.blocked}>
                <Text style={styles.blockedText}>⛔ Открытие заблокировано</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(27,31,59,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 28,
    ...shadow,
  },
  handle: {
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.line,
    alignSelf: "center",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    color: colors.text,
    fontWeight: "900",
  },
  close: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  verdict: {
    textAlign: "center",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 6,
  },
  host: {
    textAlign: "center",
    color: colors.muted,
    fontWeight: "700",
    marginTop: 6,
  },
  banner: {
    backgroundColor: colors.softRed,
    borderColor: "#FFD2D2",
    borderWidth: 1,
    borderRadius: radii.card,
    padding: 14,
    marginTop: 18,
  },
  bannerText: {
    color: colors.red,
    fontWeight: "900",
    fontSize: 16,
  },
  reasonBox: {
    backgroundColor: colors.bg,
    borderRadius: radii.card,
    padding: 16,
    marginTop: 14,
    gap: 9,
  },
  reason: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  reasonHeadline: {
    fontWeight: "900",
  },
  privacy: {
    color: colors.muted,
    textAlign: "center",
    marginTop: 16,
    fontWeight: "700",
  },
  action: {
    minHeight: 54,
    borderRadius: radii.pill,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    color: colors.surface,
    fontWeight: "900",
    fontSize: 16,
  },
  blocked: {
    minHeight: 54,
    borderRadius: radii.pill,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.softRed,
    borderWidth: 1,
    borderColor: "#FFD2D2",
  },
  blockedText: {
    color: colors.red,
    fontWeight: "900",
    fontSize: 16,
  },
});
