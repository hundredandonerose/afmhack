import { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "../theme/colors";
import { Verdict } from "../types";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const ARC = Math.PI * 90;

function verdictColor(verdict: Verdict) {
  if (verdict === "red") return colors.red;
  if (verdict === "yellow") return colors.amber;
  return colors.green;
}

type Props = {
  risk: number;
  verdict: Verdict;
};

export function RiskGauge({ risk, verdict }: Props) {
  const progress = useRef(new Animated.Value(0)).current;
  const [reduced, setReduced] = useState(false);
  const stroke = verdictColor(verdict);
  const safeRisk = Math.max(0, Math.min(100, risk || 0));

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => setReduced(false));
  }, []);

  useEffect(() => {
    progress.stopAnimation();
    if (reduced) {
      progress.setValue(safeRisk);
      return;
    }
    Animated.timing(progress, {
      toValue: safeRisk,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, reduced, safeRisk]);

  const dashOffset = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 100],
        outputRange: [ARC, 0],
      }),
    [progress],
  );

  return (
    <View style={styles.wrap}>
      <Svg width={220} height={128} viewBox="0 0 220 128">
        <Path
          d="M20 110 A90 90 0 0 1 200 110"
          fill="none"
          stroke={colors.line}
          strokeWidth={18}
          strokeLinecap="round"
        />
        <AnimatedPath
          d="M20 110 A90 90 0 0 1 200 110"
          fill="none"
          stroke={stroke}
          strokeWidth={18}
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${ARC}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.score, { color: stroke }]}>{safeRisk}</Text>
        <Text style={styles.caption}>risk score</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  center: {
    position: "absolute",
    bottom: 4,
    alignItems: "center",
  },
  score: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "900",
    letterSpacing: -1,
  },
  caption: {
    color: colors.muted,
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 1,
  },
});
