import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, shadow } from "../theme/colors";
import { Assessment } from "../types";
import { RiskGauge } from "./RiskGauge";
import { saveReport } from "../storage/reports";
import { useEffect, useState } from "react";
import enrich from "../ml/qrshieldOnline";
import bloom from "../../assets/qrshield_phish_bloom.json";

const labels = {
  green: "🟢 Безопасно",
  yellow: "🟡 Осторожно",
  red: "🔴 Опасно — не открывайте",
};

function tone(result: Assessment) {
  if (result.neutral) return colors.neutral;
  if (result.verdict === "red") return colors.red;
  if (result.verdict === "yellow") return colors.amber;
  return colors.green;
}

function imitationDomain(result: Assessment) {
  const first = result.reasons?.[0] || "";
  const official = first.match(/настоящий адрес ([^,\s]+)/);
  if (official?.[1]) return official[1];
  const brand = first.match(/имитирует «([^»]+)»/);
  return brand?.[1] ?? null;
}

type Props = {
  result: Assessment | null;
  visible: boolean;
  onClose: () => void;
};

export function ResultModal({ result, visible, onClose }: Props) {
  const [reported, setReported] = useState(false);
  const [displayResult, setDisplayResult] = useState<Assessment | null>(result);
  const [consentVisible, setConsentVisible] = useState(false);
  const [onlineLoading, setOnlineLoading] = useState(false);

  useEffect(() => {
    setDisplayResult(result);
    setReported(false);
    setConsentVisible(false);
    setOnlineLoading(false);
  }, [result]);

  if (!displayResult) return null;
  const color = tone(displayResult);
  const imitation = imitationDomain(displayResult);
  const openUrl = displayResult.url.includes("://") ? displayResult.url : `https://${displayResult.url}`;
  const reasons = displayResult.reasons;
  const isUnscored = displayResult.neutral === true || displayResult.risk === null;
  const canOnlineCheck = !displayResult.online && (displayResult.verdict === "yellow" || displayResult.neutral === true);

  const report = async () => {
    await saveReport(displayResult);
    setReported(true);
  };

  const close = () => {
    setReported(false);
    onClose();
  };

  const openWithRedConfirmation = () => {
    Alert.alert(
      "Открыть опасную ссылку?",
      "Aldanba пометила этот адрес как высокий риск. Открывайте только если полностью доверяете источнику.",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Открыть", style: "destructive", onPress: () => Linking.openURL(openUrl) },
      ],
    );
  };

  const runOnlineCheck = async () => {
    setConsentVisible(false);
    setOnlineLoading(true);
    try {
      const onlineResult = (await enrich(displayResult.url, {
        bloomData: bloom,
        followRedirect: true,
        consent: true,
        force: true,
      })) as Assessment;
      const facts = Array.isArray(onlineResult.facts) ? onlineResult.facts : [];
      if (onlineResult.online && facts.length === 0) {
        setDisplayResult({
          ...displayResult,
          online: true,
          neutral: true,
          verdict: "yellow",
          risk: null,
          reasons: ["онлайн-проверка недоступна"],
          facts: ["онлайн-проверка недоступна"],
        });
        return;
      }
      setDisplayResult({
        ...onlineResult,
        reasons: facts.length ? facts : onlineResult.reasons,
      });
    } catch {
      setDisplayResult({
        ...displayResult,
        online: true,
        neutral: true,
        verdict: "yellow",
        risk: null,
        reasons: ["онлайн-проверка недоступна"],
        facts: ["онлайн-проверка недоступна"],
      });
    } finally {
      setOnlineLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Результат проверки</Text>
            <Pressable onPress={close} style={styles.close} accessibilityLabel="Закрыть результат">
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {isUnscored ? (
              <View style={styles.neutralMark}>
                <Ionicons name="help-circle-outline" color={colors.neutral} size={56} />
              </View>
            ) : (
              <RiskGauge risk={displayResult.risk} verdict={displayResult.verdict} />
            )}
            <Text style={[styles.verdict, { color }]}>
              {isUnscored ? "⚪️ адрес скрыт / новый сайт" : labels[displayResult.verdict]}
            </Text>
            {isUnscored ? (
              <Text style={styles.neutralText}>Открывайте, только если доверяете источнику.</Text>
            ) : null}
            <Text style={styles.host}>{displayResult.host || displayResult.url}</Text>
            <Text style={styles.url}>{displayResult.url}</Text>

            {imitation ? (
              <View style={styles.banner}>
                <Text style={styles.bannerText}>⚠️ Имитирует {imitation}</Text>
              </View>
            ) : null}

            <View style={styles.reasonBox}>
              {reasons.map((reason, index) => (
                <Text key={`${reason}-${index}`} style={[styles.reason, index === 0 && styles.reasonHeadline]}>
                  {index === 0 ? "• " : "  "}
                  {reason}
                </Text>
              ))}
            </View>

            <Text style={styles.privacy}>
              {displayResult.online
                ? "Онлайн-проверка выполнена после вашего согласия."
                : "URL проверен локально. Он не отправлялся на сервер."}
            </Text>

            {canOnlineCheck ? (
              <Pressable
                accessibilityRole="button"
                style={[styles.onlineCheck, onlineLoading && styles.onlineCheckDisabled]}
                onPress={() => setConsentVisible(true)}
                disabled={onlineLoading}
              >
                {onlineLoading ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="search" size={19} color={colors.primary} />}
                <Text style={styles.onlineCheckText}>{onlineLoading ? "Проверяем онлайн…" : "🔍 Перепроверить онлайн"}</Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              style={[styles.report, reported && styles.reportDone]}
              onPress={report}
              disabled={reported}
            >
              <Ionicons name={reported ? "checkmark-circle" : "flag-outline"} size={19} color={reported ? colors.green : colors.primary} />
              <Text style={[styles.reportText, reported && styles.reportDoneText]}>
                {reported ? "Спасибо! Жалоба сохранена для проверки." : "Пожаловаться"}
              </Text>
            </Pressable>

            {isUnscored ? (
              <Pressable style={[styles.action, { backgroundColor: colors.neutral }]} onPress={() => Linking.openURL(openUrl)}>
                <Text style={styles.actionText}>Открыть</Text>
              </Pressable>
            ) : displayResult.verdict === "green" ? (
              <Pressable style={[styles.action, { backgroundColor: colors.green }]} onPress={() => Linking.openURL(openUrl)}>
                <Text style={styles.actionText}>Открыть</Text>
              </Pressable>
            ) : displayResult.verdict === "yellow" ? (
              <Pressable style={[styles.action, { backgroundColor: colors.amber }]} onPress={() => Linking.openURL(openUrl)}>
                <Text style={styles.actionText}>Открыть</Text>
              </Pressable>
            ) : (
              <>
                <Pressable style={styles.action} onPress={close}>
                  <Text style={styles.actionText}>Не открывать</Text>
                </Pressable>
                <Pressable style={styles.dangerOpen} onPress={openWithRedConfirmation}>
                  <Text style={styles.dangerOpenText}>Открыть</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>

      <Modal visible={consentVisible} transparent animationType="fade" onRequestClose={() => setConsentVisible(false)}>
        <View style={styles.consentBackdrop}>
          <View style={styles.consentCard}>
            <Text style={styles.consentTitle}>Онлайн-проверка</Text>
            <Text style={styles.consentText}>
              Проверка отправит адрес домена на внешние сервисы (RDAP, Google DNS, при наличии — Safe Browsing). В офлайн-режиме адрес устройство не покидает. Продолжить?
            </Text>
            <View style={styles.consentActions}>
              <Pressable style={styles.cancelButton} onPress={() => setConsentVisible(false)}>
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={runOnlineCheck}>
                <Text style={styles.confirmButtonText}>Проверить</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  neutralText: {
    color: colors.neutral,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: 8,
  },
  neutralMark: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.softNeutral,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    marginBottom: 4,
  },
  host: {
    textAlign: "center",
    color: colors.muted,
    fontWeight: "700",
    marginTop: 6,
  },
  url: {
    color: colors.text,
    textAlign: "center",
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 8,
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
    backgroundColor: colors.red,
  },
  actionText: {
    color: colors.surface,
    fontWeight: "900",
    fontSize: 16,
  },
  onlineCheck: {
    minHeight: 52,
    borderRadius: radii.pill,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },
  onlineCheckDisabled: {
    opacity: 0.72,
  },
  onlineCheckText: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 15,
  },
  dangerOpen: {
    minHeight: 50,
    borderRadius: radii.pill,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.softRed,
    borderWidth: 1,
    borderColor: "#FFD2D2",
  },
  dangerOpenText: {
    color: colors.red,
    fontWeight: "900",
    fontSize: 16,
  },
  report: {
    minHeight: 52,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reportDone: {
    backgroundColor: colors.softGreen,
    borderColor: "#CFEEDA",
  },
  reportText: {
    flex: 1,
    color: colors.primary,
    fontWeight: "900",
    lineHeight: 20,
  },
  reportDoneText: {
    color: colors.green,
  },
  consentBackdrop: {
    flex: 1,
    backgroundColor: "rgba(27,31,59,0.42)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  consentCard: {
    width: "100%",
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    padding: 20,
    ...shadow,
  },
  consentTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "900",
  },
  consentText: {
    color: colors.text,
    lineHeight: 22,
    fontWeight: "700",
    marginTop: 10,
  },
  consentActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: radii.pill,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: "900",
  },
  confirmButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    color: colors.surface,
    fontWeight: "900",
  },
});
