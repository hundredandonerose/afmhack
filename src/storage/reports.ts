import AsyncStorage from "@react-native-async-storage/async-storage";
import { Assessment, ReportItem } from "../types";

const REPORTS_KEY = "aldanba.reports.v1";

export async function getReports(): Promise<ReportItem[]> {
  const raw = await AsyncStorage.getItem(REPORTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveReport(result: Assessment): Promise<ReportItem> {
  const item: ReportItem = {
    ...result,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    reportedAt: new Date().toISOString(),
  };
  const reports = await getReports();
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify([item, ...reports].slice(0, 100)));
  return item;
}

export async function getReportsCount(): Promise<number> {
  return (await getReports()).length;
}
