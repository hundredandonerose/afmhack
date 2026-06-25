import { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import assess from "../ml/qrshieldEngine";
import { saveAssessment } from "../storage/history";
import { colors, radii, shadow } from "../theme/colors";
import { Assessment } from "../types";

type Props = {
  onResult: (result: Assessment) => void;
};

const ANALYZING_STEPS = ["Читаю ссылку…", "Проверяю домен…", "Сверяю с базой брендов РК…", "Оцениваю риск…"];

const DEMO_URLS = [
  "https://kaspi-pay.top/login",
  "http://halyk-bank.kz.verify-account.xyz",
  "http://192.168.4.21/kaspi/pay",
  "https://bit.ly/kaspi-bonus",
  "https://kaspi.kz",
  "https://egov.kz",
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function ScanScreen({ onResult }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();
  const compact = height < 700;
  const cameraSize = Math.min(width - 32, compact ? 220 : 360);

  const analyze = useCallback(
    async (url: string) => {
      const clean = url.trim();
      if (!clean || busy) return;
      setBusy(true);
      setScanning(false);
      try {
        const result = assess(clean) as Assessment;
        await saveAssessment(result);
        for (const step of ANALYZING_STEPS) {
          setAnalyzingStep(step);
          await wait(300);
        }
        setAnalyzingStep(null);
        onResult(result);
      } finally {
        setAnalyzingStep(null);
        setBusy(false);
      }
    },
    [busy, onResult],
  );

  const handleBarcode = ({ data }: BarcodeScanningResult) => {
    if (!scanning || busy || !data) return;
    analyze(data);
  };

  const startScan = async () => {
    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response.granted) return;
    }
    setScanning((value) => !value);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Aldanba</Text>
            <Text style={styles.tagline}>видит то, что ты не можешь</Text>
            <Text style={styles.subtitle}>Наведите камеру на QR-код. Ссылка проверится до открытия.</Text>
          </View>
          <Pressable accessibilityRole="button" style={styles.demoButton} onPress={() => setDemoOpen(true)}>
            <Text style={styles.demoButtonText}>Демо</Text>
          </Pressable>
        </View>

        <View style={[styles.cameraFrame, { width: cameraSize, height: cameraSize }]}>
          {scanning && permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={handleBarcode}
            />
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="qr-code-outline" color={colors.primary} size={48} />
              <Text style={styles.placeholderTitle}>Камера выключена</Text>
              <Text style={styles.placeholderText}>Нажмите «Сканировать QR», чтобы открыть камеру.</Text>
            </View>
          )}
          <View pointerEvents="none" style={styles.focusBox}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {!permission?.granted && permission?.canAskAgain === false ? (
          <View style={styles.permissionHint}>
            <Ionicons name="camera-outline" color={colors.amber} size={20} />
            <Text style={styles.permissionText}>
              Камера заблокирована. Разрешите доступ в настройках приложения или вставьте ссылку вручную ниже.
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={scanning ? "Остановить камеру" : "Включить камеру для сканирования QR"}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={startScan}
        >
          <Ionicons name={scanning ? "stop-circle" : "scan"} size={21} color={colors.surface} />
          <Text style={styles.primaryButtonText}>{scanning ? "Остановить камеру" : "Сканировать QR"}</Text>
        </Pressable>

        <View style={styles.manualBox}>
          <TextInput
            value={manualUrl}
            onChangeText={setManualUrl}
            placeholder="Вставить ссылку"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Ручной ввод ссылки для проверки"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            style={styles.input}
            onSubmitEditing={() => analyze(manualUrl)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Проверить введённую ссылку"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={() => analyze(manualUrl)}
          >
            <Text style={styles.secondaryButtonText}>Проверить</Text>
          </Pressable>
        </View>

        <Text style={styles.privacy}>Анализ на устройстве — ссылка никуда не отправляется.</Text>
      </ScrollView>

      <Modal visible={Boolean(analyzingStep)} transparent animationType="fade">
        <View style={styles.analyzingBackdrop}>
          <View style={styles.analyzingCard}>
            <View style={styles.analyzingIcon}>
              <Ionicons name="shield-checkmark" color={colors.surface} size={28} />
            </View>
            <Text style={styles.analyzingTitle}>Проверяем ссылку</Text>
            <Text style={styles.analyzingStep}>{analyzingStep}</Text>
            <View style={styles.stepDots}>
              {ANALYZING_STEPS.map((step) => (
                <View key={step} style={[styles.stepDot, step === analyzingStep && styles.stepDotActive]} />
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={demoOpen} transparent animationType="slide" onRequestClose={() => setDemoOpen(false)}>
        <View style={styles.demoBackdrop}>
          <View style={styles.demoSheet}>
            <View style={styles.demoHeader}>
              <Text style={styles.demoTitle}>Демо-ссылки</Text>
              <Pressable accessibilityLabel="Закрыть демо" style={styles.demoClose} onPress={() => setDemoOpen(false)}>
                <Ionicons name="close" color={colors.text} size={22} />
              </Pressable>
            </View>
            <Text style={styles.demoText}>Каждая ссылка проверяется настоящей offline-моделью.</Text>
            {DEMO_URLS.map((url) => (
              <Pressable
                key={url}
                style={({ pressed }) => [styles.demoRow, pressed && styles.pressed]}
                onPress={() => {
                  setDemoOpen(false);
                  setManualUrl(url);
                  analyze(url);
                }}
              >
                <Text style={styles.demoUrl} numberOfLines={1}>{url}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 96,
    gap: 12,
    alignItems: "stretch",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  tagline: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 3,
    maxWidth: 260,
  },
  demoButton: {
    minHeight: 46,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    ...shadow,
  },
  demoButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "900",
  },
  cameraFrame: {
    position: "relative",
    alignSelf: "center",
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  cameraPlaceholder: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
  },
  placeholderTitle: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 18,
  },
  placeholderText: {
    color: colors.muted,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 20,
  },
  focusBox: {
    position: "absolute",
    width: "68%",
    aspectRatio: 1,
  },
  corner: {
    position: "absolute",
    width: 42,
    height: 42,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 12,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: "900",
    fontSize: 17,
  },
  manualBox: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    backgroundColor: colors.deep,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.surface,
    fontWeight: "900",
    fontSize: 15,
  },
  pressed: {
    opacity: 0.82,
  },
  permissionHint: {
    borderRadius: radii.card,
    backgroundColor: colors.softAmber,
    padding: 14,
    flexDirection: "row",
    gap: 10,
  },
  permissionText: {
    flex: 1,
    color: colors.text,
    fontWeight: "700",
    lineHeight: 20,
  },
  privacy: {
    textAlign: "center",
    color: colors.muted,
    fontWeight: "700",
    lineHeight: 20,
  },
  analyzingBackdrop: {
    flex: 1,
    backgroundColor: "rgba(27,31,59,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  analyzingCard: {
    width: "100%",
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 24,
    alignItems: "center",
    ...shadow,
  },
  analyzingIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  analyzingTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 16,
  },
  analyzingStep: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "center",
  },
  stepDots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  stepDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.line,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  demoBackdrop: {
    flex: 1,
    backgroundColor: "rgba(27,31,59,0.35)",
    justifyContent: "flex-end",
  },
  demoSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.surface,
    padding: 20,
    paddingBottom: 34,
    gap: 10,
  },
  demoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  demoTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  demoClose: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  demoText: {
    color: colors.muted,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 6,
  },
  demoRow: {
    minHeight: 48,
    borderRadius: radii.card,
    backgroundColor: colors.bg,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  demoUrl: {
    color: colors.text,
    fontWeight: "800",
  },
});
