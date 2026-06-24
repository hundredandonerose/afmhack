export type Verdict = "green" | "yellow" | "red";

export type Assessment = {
  url: string;
  host: string;
  verdict: Verdict;
  risk: number;
  ml_prob: number | null;
  reasons: string[];
};

export type HistoryItem = Assessment & {
  id: string;
  scannedAt: string;
};

export type RootTabParamList = {
  Scan: undefined;
  History: undefined;
  Stats: undefined;
  Model: undefined;
};

export type ModelMeta = {
  version: string;
  date: string;
  source: "bundled" | "cached";
};
