import fs from "node:fs";
import vm from "node:vm";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const esc = "\x1b[";
const color = {
  reset: `${esc}0m`,
  dim: `${esc}2m`,
  bold: `${esc}1m`,
  teal: `${esc}38;5;45m`,
  green: `${esc}38;5;46m`,
  amber: `${esc}38;5;214m`,
  red: `${esc}38;5;196m`,
  blue: `${esc}38;5;81m`,
  gray: `${esc}38;5;245m`,
};

function line(text = "", tint = color.reset) {
  console.log(`${tint}${text}${color.reset}`);
}

async function type(text, tint = color.green, delay = 8) {
  process.stdout.write(tint);
  for (const ch of text) {
    process.stdout.write(ch);
    await sleep(delay);
  }
  process.stdout.write(color.reset + "\n");
}

async function matrixRain(frames = 22, width = 76) {
  const glyphs = "01aldanbaKZQRpaysecureverifykaspi";
  for (let i = 0; i < frames; i++) {
    let row = "";
    for (let j = 0; j < width; j++) {
      const ch = glyphs[Math.floor(Math.random() * glyphs.length)];
      row += Math.random() > 0.82 ? `${color.teal}${ch}${color.green}` : ch;
    }
    process.stdout.write(`${color.green}${row}${color.reset}\r`);
    await sleep(35);
  }
  process.stdout.write("\n");
}

function loadEngine() {
  const ctx = { console, window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync("qrshield_model_data.js", "utf8"), ctx);
  vm.runInContext(fs.readFileSync("qrshield.js", "utf8"), ctx);
  const model = vm.runInContext("QRS_MODEL", ctx);
  const assess = ctx.qrShieldAssess || ctx.window.qrShieldAssess;
  if (!model || !assess) throw new Error("aldanba model engine failed to load");
  return { model, assess };
}

function box(title, rows) {
  const width = 78;
  line(`┌${"─".repeat(width)}┐`, color.teal);
  line(`│ ${title.padEnd(width - 2)} │`, color.teal + color.bold);
  line(`├${"─".repeat(width)}┤`, color.teal);
  for (const row of rows) line(`│ ${row.padEnd(width - 2)} │`, color.teal);
  line(`└${"─".repeat(width)}┘`, color.teal);
}

function verdictColor(verdict) {
  return verdict === "red" ? color.red : verdict === "yellow" ? color.amber : color.green;
}

async function main() {
  process.stdout.write(`${esc}2J${esc}H`);
  line("ALDANBA // OFFLINE QR-PHISHING DEFENSE TERMINAL", color.teal + color.bold);
  line("encrypted local inference boot sequence", color.gray);
  await matrixRain();

  await type("[OK] loading qrshield_model_data.js", color.green);
  await type("[OK] loading qrshield.js inference engine", color.green);
  await type("[OK] backend connection: DISABLED BY DESIGN", color.amber);
  await type("[OK] data exfiltration: 0 bytes", color.green);

  const { model, assess } = loadEngine();
  const totalNodes = model.trees.reduce((sum, tree) => sum + tree.length, 0);

  console.log();
  box("MODEL ARCHITECTURE", [
    `platform              aldanba`,
    `model type            Gradient Boosted Decision Trees`,
    `features              ${model.features.length}`,
    `trees                 ${model.trees.length}`,
    `tree nodes            ${totalNodes}`,
    `learning rate         ${model.lr}`,
    `base score            ${model.f0}`,
    `runtime               pure JavaScript, browser/offline`,
  ]);

  console.log();
  line("FEATURE VECTOR", color.blue + color.bold);
  for (let i = 0; i < model.features.length; i++) {
    const id = String(i + 1).padStart(2, "0");
    line(`  ${id}  ${model.features[i]}`, color.gray);
    await sleep(12);
  }

  console.log();
  line("LIVE THREAT ASSESSMENT", color.blue + color.bold);
  const samples = ["kaspi-pay.top", "forms.gle/abc", "summit2026.kz"];
  for (const url of samples) {
    await sleep(220);
    const result = assess(url);
    const tint = verdictColor(result.verdict);
    line(`  target: ${url}`, color.gray);
    line(`  verdict: ${result.verdict.toUpperCase()}  risk=${result.risk}  host=${result.host}`, tint + color.bold);
    line(`  reason: ${(result.reasons || ["no explicit flags"])[0]}`, color.dim);
    console.log();
  }

  box("STATUS", [
    "camera QR scan -> URL extracted in browser",
    "URL -> 23-feature vector",
    "vector -> 300-tree local ML inference",
    "output -> green / yellow / red with human-readable reasons",
    "network -> not required",
  ]);

  console.log();
  line("aldanba model showcase complete. Screenshot this terminal.", color.green + color.bold);
}

main().catch((error) => {
  line(`[FAIL] ${error.message}`, color.red + color.bold);
  process.exit(1);
});
