import { ModelMeta } from "../types";

const DEFAULT_META: ModelMeta = {
  version: "bundled-offline-300",
  date: "2026-06-25",
  source: "bundled",
};

export async function loadLocalModel(): Promise<ModelMeta> {
  return DEFAULT_META;
}

export async function refreshModelIfOnline(): Promise<ModelMeta> {
  return DEFAULT_META;
}
