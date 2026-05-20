import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { app } from "../server/index.mjs";
import { gradeOutput } from "./graders.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const casesPath = path.join(__dirname, "cases.jsonl");
const resultsDir = path.join(__dirname, "results");
const latestPath = path.join(resultsDir, "latest.json");

for (const file of [".env.local", ".env_local", ".env"]) {
  const candidate = path.join(root, file);
  if (fs.existsSync(candidate)) dotenv.config({ path: candidate, override: false, quiet: true });
}

function parseArgs(argv) {
  const args = {
    caseId: null,
    list: false,
    serverUrl: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--case") {
      args.caseId = argv[index + 1];
      index += 1;
    } else if (arg === "--list") {
      args.list = true;
    } else if (arg === "--server-url") {
      args.serverUrl = argv[index + 1]?.replace(/\/$/, "");
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    }
  }

  return args;
}

function usage() {
  console.log(`Usage:
  npm run eval:local
  npm run eval:local -- --case lesson_memory_patience
  npm run eval:local -- --server-url http://127.0.0.1:8787
  npm run eval:local -- --list`);
}

function loadCases() {
  return fs
    .readFileSync(casesPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Invalid JSONL at evals/cases.jsonl:${index + 1}: ${error.message}`);
      }
    });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function postJson(baseUrl, route, payload) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: `Non-JSON response: ${text.slice(0, 240)}` };
    }
  }
  return { ok: response.ok, status: response.status, body };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  let cases = loadCases();
  if (args.list) {
    for (const testCase of cases) console.log(`${testCase.id}: ${testCase.description}`);
    return;
  }

  if (args.caseId) {
    cases = cases.filter((testCase) => testCase.id === args.caseId);
    if (cases.length === 0) throw new Error(`No eval case found with id: ${args.caseId}`);
  }

  if (!args.serverUrl && !process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to run local evals against the real OpenAI-backed API.");
  }

  let server = null;
  const baseUrl = args.serverUrl || (await listen((server = http.createServer(app))));
  const startedAt = new Date().toISOString();
  const results = [];

  try {
    for (const testCase of cases) {
      const started = Date.now();
      const response = await postJson(baseUrl, testCase.route, testCase.payload);
      const grades = response.ok
        ? gradeOutput(response.body, testCase.checks)
        : [{ name: "http", passed: false, details: `HTTP ${response.status}: ${response.body?.error || "Request failed."}` }];
      const passed = response.ok && grades.every((grade) => grade.passed);
      const durationMs = Date.now() - started;
      results.push({
        id: testCase.id,
        description: testCase.description,
        route: testCase.route,
        passed,
        durationMs,
        status: response.status,
        grades,
        output: response.body
      });
      console.log(`${passed ? "PASS" : "FAIL"} ${testCase.id} (${durationMs}ms)`);
      for (const grade of grades) {
        console.log(`  ${grade.passed ? "OK" : "NO"} ${grade.name}: ${grade.details}`);
      }
    }
  } finally {
    if (server) await close(server);
  }

  fs.mkdirSync(resultsDir, { recursive: true });
  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    baseUrl,
    total: results.length,
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    results
  };
  fs.writeFileSync(latestPath, `${JSON.stringify(summary, null, 2)}\n`);

  console.log(`\nWrote ${path.relative(root, latestPath)}`);
  if (summary.failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
