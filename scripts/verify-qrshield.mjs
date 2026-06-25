import { createRequire } from "node:module";
import fs from "node:fs";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const source = fs
  .readFileSync(new URL("../src/ml/qrshieldEngine.js", import.meta.url), "utf8")
  .replace("import bundledModel from './qrshield_model.json';", 'const bundledModel = require("../src/ml/qrshield_model.json");')
  .replace('import bundledModel from "./qrshield_model.json";', 'const bundledModel = require("../src/ml/qrshield_model.json");')
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

vm.runInNewContext(`${source}\nmodule.exports = { assess, setModel, getModelInfo };`, sandbox, {
  filename: "qrshieldEngine.js",
});

const { assess, getModelInfo } = sandbox.module.exports;
const checks = [
  ["https://kaspi.kz", "green"],
  ["https://egov.kz", "green"],
  ["https://kaspi-pay.top/login", "red"],
  ["http://halyk-bank.kz.verify-account.xyz", "red"],
  ["http://192.168.4.21/kaspi/pay", "red"],
  ["https://bit.ly/kaspi-bonus", "yellow"],
];

const info = getModelInfo();
console.log("Aldanba QR-Shield offline model");
console.log(`model: Gradient Boosted Trees | trees=${info.trees} | features=${info.features} | nodes=${info.nodes}`);
console.log("network: disabled for detection | backend: none");
console.log("");

let failed = false;
for (const [url, expected] of checks) {
  const result = assess(url);
  const ok = result.verdict === expected;
  failed ||= !ok;
  const icon = result.verdict === "red" ? "🔴" : result.verdict === "yellow" ? "🟡" : "🟢";
  console.log(`${ok ? "PASS" : "FAIL"} ${icon} ${url.padEnd(40)} -> ${result.verdict.padEnd(6)} risk=${String(result.risk ?? 50).padStart(3)}  ${result.reasons[0]}`);
}

if (failed) process.exit(1);
