import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { setModel } from "./qrshieldEngine";
import { ModelMeta } from "../types";

export const MODEL_URL = "https://example.com/aldanba/qrshield_model.json";

const MODEL_FILE = `${FileSystem.documentDirectory ?? ""}aldanba_qrshield_model.json`;
const META_KEY = "aldanba.modelMeta.v1";
const DEFAULT_META: ModelMeta = {
  version: "bundled-gb-300",
  date: "2026-06-24",
  source: "bundled",
};

type ModelPayload = {
  features: unknown[];
  trees: unknown[];
  version?: unknown;
  date?: unknown;
};

function validateModel(json: unknown): json is ModelPayload {
  return Boolean(
    json &&
      typeof json === "object" &&
      Array.isArray((json as { features?: unknown }).features) &&
      Array.isArray((json as { trees?: unknown }).trees),
  );
}

export async function loadLocalModel(): Promise<ModelMeta> {
  try {
    const info = await FileSystem.getInfoAsync(MODEL_FILE);
    if (!info.exists) return DEFAULT_META;
    const raw = await FileSystem.readAsStringAsync(MODEL_FILE);
    const json = JSON.parse(raw);
    if (!validateModel(json)) return DEFAULT_META;
    setModel(json);
    const metaRaw = await AsyncStorage.getItem(META_KEY);
    return metaRaw ? JSON.parse(metaRaw) : { ...DEFAULT_META, source: "cached" };
  } catch {
    return DEFAULT_META;
  }
}

export async function refreshModelIfOnline(): Promise<ModelMeta> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(MODEL_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`model fetch ${response.status}`);
    const json = await response.json();
    if (!validateModel(json)) throw new Error("invalid model payload");
    setModel(json);
    await FileSystem.writeAsStringAsync(MODEL_FILE, JSON.stringify(json));
    const meta: ModelMeta = {
      version: String(json.version || "remote-gb-300"),
      date: String(json.date || new Date().toISOString().slice(0, 10)),
      source: "cached",
    };
    await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
    return meta;
  } catch {
    return loadLocalModel();
  } finally {
    clearTimeout(timeout);
  }
}
