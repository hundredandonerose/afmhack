import { createRequire } from "node:module";
import fs from "node:fs";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const source = fs
  .readFileSync(new URL("../src/ml/qrshieldEngine.js", import.meta.url), "utf8")
  .replace("import QRS_MODEL from './qrshield_model.json';", 'const QRS_MODEL = require("../src/ml/qrshield_model.json");')
  .replace('import QRS_MODEL from "./qrshield_model.json";', 'const QRS_MODEL = require("../src/ml/qrshield_model.json");')
  .replace(/export function /g, "function ")
  .replace(/export \{[^}]+\};/g, "")
  .replace(/export default assess;/g, "");

const sandbox = {
  module: { exports: {} },
  exports: {},
  require,
  console,
  Math,
  Set,
  String,
  Array,
  Object,
  Boolean,
  Error,
};

vm.runInNewContext(`${source}\nmodule.exports = { assess };`, sandbox, {
  filename: "qrshieldEngine.js",
});

const { assess } = sandbox.module.exports;
const model = require("../src/ml/qrshield_model.json");
const checks = [
  ["https://kaspi.kz", "green", false],
  ["https://egov.kz", "green", false],
  ["https://kaspi-pay.top/login", "red", false],
  ["http://halyk-bank.kz.verify-account.xyz", "red", false],
  ["http://192.168.4.21/kaspi/pay", "red", false],
  ["https://bit.ly/kaspi-bonus", "yellow", true],
  ["https://some-random-newsite.kz", "yellow", true],
];

const info = {
  features: model.features.length,
  trees: model.trees.length,
  nodes: model.trees.reduce((sum, tree) => sum + tree.length, 0),
};
console.log("Aldanba QR-Shield offline model");
console.log(`model: Gradient Boosted Trees | trees=${info.trees} | features=${info.features} | nodes=${info.nodes}`);
console.log("network: disabled for detection | backend: none");
console.log("");

let failed = false;
for (const [url, expected, expectedNeutral] of checks) {
  const result = assess(url);
  const ok = result.verdict === expected && Boolean(result.neutral) === expectedNeutral;
  failed ||= !ok;
  const icon = result.neutral ? "⚪️" : result.verdict === "red" ? "🔴" : result.verdict === "yellow" ? "🟡" : "🟢";
  const riskText = result.neutral ? "neutral" : `risk=${String(result.risk ?? 50).padStart(3)}`;
  console.log(`${ok ? "PASS" : "FAIL"} ${icon} ${url.padEnd(40)} -> ${result.verdict.padEnd(6)} ${riskText}  ${result.reasons[0]}`);
}

if (failed) process.exit(1);
