import AsyncStorage from "@react-native-async-storage/async-storage";
import { Assessment, HistoryItem } from "../types";

const HISTORY_KEY = "aldanba.scanHistory.v1";

export async function getHistory(): Promise<HistoryItem[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveAssessment(result: Assessment): Promise<HistoryItem> {
  const item: HistoryItem = {
    ...result,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    scannedAt: new Date().toISOString(),
  };
  const history = await getHistory();
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...history].slice(0, 100)));
  return item;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
