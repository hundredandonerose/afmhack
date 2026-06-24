import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { assess } from "../ml/qrshieldEngine";
import { saveAssessment } from "../storage/history";
import { colors, radii, shadow } from "../theme/colors";
import { Assessment } from "../types";

type Props = {
  onResult: (result: Assessment) => void;
};

export function ScanScreen({ onResult }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (!scanning || reduceMotion) {
      scanAnim.stopAnimation();
      scanAnim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, scanAnim, scanning]);

  const analyze = useCallback(
    async (url: string) => {
      const clean = url.trim();
      if (!clean || busy) return;
      setBusy(true);
      setScanning(false);
      try {
        const result = assess(clean) as Assessment;
        await saveAssessment(result);
        onResult(result);
      } finally {
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[colors.primary, colors.deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.logo}>
            <Ionicons name="shield-checkmark" color={colors.surface} size={24} />
          </View>
          <Text style={styles.heroBadge}>AI Shield · Offline ML</Text>
        </View>
        <Text style={styles.heroTitle}>aldanba</Text>
        <Text style={styles.heroText}>
          Проверяйте QR-ссылку до перехода. Модель работает на устройстве, без backend и без отправки URL.
        </Text>
      </LinearGradient>

      <ThreatConsole scanning={scanning} busy={busy} />

      <View style={styles.cameraCard}>
        <View style={styles.cameraFrame}>
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
              <Text style={styles.placeholderTitle}>Камера появится здесь</Text>
              <Text style={styles.placeholderText}>Нажмите кнопку и наведите телефон на QR-код</Text>
            </View>
          )}
          {scanning && !reduceMotion ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-130, 130],
                      }),
                    },
                  ],
                },
              ]}
            />
          ) : null}
          <View pointerEvents="none" style={styles.reticle}>
            <Text style={styles.reticleText}>{scanning ? "LIVE QR CAPTURE" : "CAMERA BAY"}</Text>
          </View>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {!permission?.granted && permission?.canAskAgain === false ? (
          <View style={styles.permissionHint}>
            <Ionicons name="camera-outline" color={colors.amber} size={20} />
            <Text style={styles.permissionText}>
              Камера заблокирована. Откройте настройки приложения и разрешите доступ к камере. Поле ручной проверки ниже работает всегда.
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={scanning ? "Остановить камеру" : "Включить камеру для сканирования QR"}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={startScan}
        >
          <Ionicons name={scanning ? "stop-circle" : "scan"} size={20} color={colors.surface} />
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

        <Text style={styles.privacy}>Анализ на устройстве — ссылка никуда не отправляется</Text>
        <Text style={styles.offline}>Работает в airplane mode: модель уже внутри приложения.</Text>
      </View>
    </ScrollView>
  );
}

function ThreatConsole({ scanning, busy }: { scanning: boolean; busy: boolean }) {
  const status = busy ? "ASSESSING" : scanning ? "QR STREAM ARMED" : "STANDBY";
  const rows = [
    ["CORE", "Gradient Boosted Trees · 300"],
    ["FEATURES", "23 URL-сигнала"],
    ["PRIVACY", "offline · zero upload"],
    ["STATUS", status],
  ];

  return (
    <View style={styles.console}>
      <View style={styles.consoleHead}>
        <View>
          <Text style={styles.consoleKicker}>ALDANBA LOCAL AI</Text>
          <Text style={styles.consoleTitle}>Threat trace</Text>
        </View>
        <View style={[styles.liveDot, scanning && styles.liveDotActive]} />
      </View>

      <View style={styles.codeRail}>
        <Text style={styles.codeText}>0xA7 FISHING_VECTORS</Text>
        <Text style={styles.codeText}>HOST_RISK::ML_PROB</Text>
        <Text style={styles.codeText}>NO_CLOUD_CALL</Text>
      </View>

      {rows.map(([label, value]) => (
        <View key={label} style={styles.consoleRow}>
          <Text style={styles.consoleLabel}>{label}</Text>
          <Text style={styles.consoleValue}>{value}</Text>
        </View>
      ))}
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
    gap: 18,
  },
  hero: {
    borderRadius: 30,
    padding: 24,
    minHeight: 208,
    justifyContent: "space-between",
    ...shadow,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadge: {
    color: colors.surface,
    fontWeight: "800",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: "hidden",
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1.4,
  },
  heroText: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
  },
  cameraCard: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 16,
    ...shadow,
  },
  cameraFrame: {
    position: "relative",
    aspectRatio: 1,
    borderRadius: radii.card,
    backgroundColor: colors.terminal,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  placeholderTitle: {
    color: colors.surface,
    fontWeight: "900",
    fontSize: 18,
  },
  placeholderText: {
    color: "#A7C7CE",
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 18,
  },
  scanLine: {
    position: "absolute",
    left: 18,
    right: 18,
    height: 3,
    borderRadius: 3,
    backgroundColor: colors.scan,
    shadowColor: colors.scan,
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  reticle: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    alignItems: "center",
  },
  reticleText: {
    color: "#BDEDE7",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    backgroundColor: "rgba(7,20,23,0.72)",
    borderRadius: radii.pill,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  corner: {
    position: "absolute",
    width: 46,
    height: 46,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: 18,
    left: 18,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderTopLeftRadius: 14,
  },
  cornerTR: {
    top: 18,
    right: 18,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderTopRightRadius: 14,
  },
  cornerBL: {
    bottom: 18,
    left: 18,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderBottomLeftRadius: 14,
  },
  cornerBR: {
    bottom: 18,
    right: 18,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 14,
  },
  primaryButton: {
    marginTop: 16,
    minHeight: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  pressed: {
    opacity: 0.82,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: "900",
    fontSize: 17,
  },
  manualBox: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  input: {
    flex: 1,
    minHeight: 54,
    borderRadius: radii.card,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    color: colors.text,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    backgroundColor: colors.deep,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.surface,
    fontWeight: "900",
  },
  permissionHint: {
    marginTop: 14,
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
    color: colors.text,
    marginTop: 16,
    fontWeight: "800",
  },
  offline: {
    textAlign: "center",
    color: colors.muted,
    marginTop: 4,
    fontWeight: "700",
  },
  console: {
    backgroundColor: colors.terminal,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(123,227,214,0.28)",
    ...shadow,
  },
  consoleHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  consoleKicker: {
    color: colors.scan,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  consoleTitle: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },
  liveDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#33494D",
  },
  liveDotActive: {
    backgroundColor: colors.scan,
    shadowColor: colors.scan,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  codeRail: {
    borderRadius: 16,
    backgroundColor: "rgba(123,227,214,0.08)",
    padding: 12,
    gap: 4,
    marginBottom: 10,
  },
  codeText: {
    color: "#84BDB8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  consoleRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(123,227,214,0.14)",
  },
  consoleLabel: {
    color: "#88AEB4",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  consoleValue: {
    color: colors.surface,
    fontWeight: "800",
    maxWidth: "62%",
    textAlign: "right",
  },
});
