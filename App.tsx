import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { ResultModal } from "./src/components/ResultModal";
import { loadLocalModel } from "./src/ml/modelManager";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { ModelScreen } from "./src/screens/ModelScreen";
import { ScanScreen } from "./src/screens/ScanScreen";
import { StatsScreen } from "./src/screens/StatsScreen";
import { colors } from "./src/theme/colors";
import { Assessment, ModelMeta, RootTabParamList } from "./src/types";

const Tab = createBottomTabNavigator<RootTabParamList>();

const defaultMeta: ModelMeta = {
  version: "bundled-gb-300",
  date: "2026-06-24",
  source: "bundled",
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AldanbaApp />
    </SafeAreaProvider>
  );
}

function AldanbaApp() {
  const insets = useSafeAreaInsets();
  const [result, setResult] = useState<Assessment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modelMeta, setModelMeta] = useState<ModelMeta>(defaultMeta);

  useEffect(() => {
    let active = true;
    loadLocalModel().then((meta) => {
      if (active) setModelMeta(meta);
    });
    return () => {
      active = false;
    };
  }, []);

  const openResult = (next: Assessment) => {
    setResult(next);
    setModalVisible(true);
  };

  return (
    <View style={styles.app}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.muted,
            tabBarLabelStyle: styles.tabLabel,
            tabBarStyle: [styles.tabBar, { height: 66 + insets.bottom, paddingBottom: Math.max(insets.bottom, 10) }],
            tabBarIcon: ({ focused, color, size }) => {
              const name =
                route.name === "Scan"
                  ? focused
                    ? "scan"
                    : "scan-outline"
                  : route.name === "History"
                    ? focused
                      ? "time"
                      : "time-outline"
                    : route.name === "Stats"
                      ? focused
                        ? "stats-chart"
                        : "stats-chart-outline"
                      : focused
                        ? "hardware-chip"
                        : "hardware-chip-outline";
              return <Ionicons name={name} color={color} size={size} />;
            },
          })}
        >
          <Tab.Screen name="Scan" options={{ title: "Скан" }}>
            {() => <ScanScreen onResult={openResult} />}
          </Tab.Screen>
          <Tab.Screen name="History" options={{ title: "История" }}>
            {() => <HistoryScreen onResult={openResult} />}
          </Tab.Screen>
          <Tab.Screen name="Stats" options={{ title: "Статы" }} component={StatsScreen} />
          <Tab.Screen name="Model" options={{ title: "Модель" }}>
            {() => <ModelScreen modelMeta={modelMeta} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
      <ResultModal result={result} visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabBar: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 14,
    borderRadius: 28,
    borderTopWidth: 0,
    backgroundColor: colors.surface,
    shadowColor: colors.deep,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "800",
  },
});
