import { exec as execCb } from "child_process";
import { promisify } from "util";
import crypto from "crypto";
import { writeFile, unlink, mkdir, access } from "fs/promises";
import { constants } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMP_DIR = join(__dirname, "..", "executor", "temp");
const NORMALIZER_PATH = join(__dirname, "..", "executor", "normalizer.sh");
const exec = promisify(execCb);

try { await exec(`rm -rf "${TEMP_DIR}"`); } catch {}
await mkdir(TEMP_DIR, { recursive: true });

const LANGUAGE_CONFIG = {
  python: { image: "code-runner-python", file: "main.py", mem: "256m", cpus: "0.5", time: "10s", killAfter: "2s" },
  cpp: { image: "code-runner-cpp", file: "main.cpp", mem: "512m", cpus: "1", time: "20s", killAfter: "3s" },
};

const MAX_OUTPUT_BYTES = 1024 * 1024;

let activeContainers = 0;

const acquireContainer = () => {
  if (activeContainers >= env.maxContainers) return false;
  activeContainers++;
  return true;
};

const releaseContainer = () => {
  if (activeContainers > 0) activeContainers--;
};

const runDocker = async (language, mounts, extraEnv = []) => {
  const config = LANGUAGE_CONFIG[language];
  const mountArgs = mounts.map(({ src, dst }) => `-v "${src}:${dst}"`).join(" ");
  const envArgs = extraEnv.map((entry) => `-e ${entry}`).join(" ");
  const uid = process.getuid?.() ?? 1000;
  const gid = process.getgid?.() ?? 1000;
  const cmd = [
    "bash -c 'set -o pipefail; timeout -k", config.killAfter, config.time,
    "docker run --rm --network=none --cap-drop=ALL --pids-limit=64",
    `--user ${uid}:${gid} --memory=${config.mem} --cpus=${config.cpus}`,
    envArgs, mountArgs, config.image, "2>&1 | head -c", String(MAX_OUTPUT_BYTES), "'",
  ].join(" ");
  try {
    const { stdout } = await exec(cmd);
    return { output: stdout, status: 200 };
  } catch (err) {
    return { output: err.stdout || err.stderr || "Execution error.", status: 400 };
  }
};

const safeUnlink = (p) => unlink(p).catch(() => {});

export const executorService = {
  getConfig(language) {
    return LANGUAGE_CONFIG[language] || null;
  },

  async runCode(language, code, testcases) {
    const config = LANGUAGE_CONFIG[language];
    if (!config) return { error: "Unsupported language", status: 400 };

    if (!acquireContainer()) {
      return { output: "Too many submissions. Please try again shortly.", status: 429 };
    }

    const suffix = crypto.randomBytes(8).toString("hex");
    const filepath = join(TEMP_DIR, `${suffix}_${config.file}`);
    const inputpath = join(TEMP_DIR, `testcases_${suffix}.txt`);

    try {
      await Promise.all([
        writeFile(filepath, code),
        writeFile(inputpath, testcases),
      ]);
      const result = await runDocker(language, [
        { src: filepath, dst: `/code/${config.file}` },
        { src: inputpath, dst: "/code/input.txt" },
        { src: NORMALIZER_PATH, dst: "/code/normalizer.sh:ro" },
      ]);
      return result;
    } catch (err) {
      return { error: err.message || "Execution error.", status: 400 };
    } finally {
      releaseContainer();
      await Promise.allSettled([safeUnlink(filepath), safeUnlink(inputpath)]);
    }
  },

  async submitCode(language, code, testcases, expected, judgeType = "string") {
    const config = LANGUAGE_CONFIG[language];
    if (!config) return { output: "Unsupported language", passed: false, status: 400 };

    if (!acquireContainer()) {
      return { output: "Too many submissions. Please try again shortly.", passed: false, status: 429 };
    }

    const suffix = crypto.randomBytes(8).toString("hex");
    const filepath = join(TEMP_DIR, `${suffix}_${config.file}`);
    const testcasePath = join(TEMP_DIR, `testcase_${suffix}.txt`);
    const expectedPath = join(TEMP_DIR, `expected_${suffix}.txt`);

    try {
      await Promise.all([
        writeFile(filepath, code),
        writeFile(testcasePath, testcases),
        writeFile(expectedPath, expected),
      ]);
      const result = await runDocker(language, [
        { src: filepath, dst: `/code/${config.file}` },
        { src: testcasePath, dst: "/code/input.txt" },
        { src: expectedPath, dst: "/code/expected.txt" },
        { src: NORMALIZER_PATH, dst: "/code/normalizer.sh:ro" },
      ], [`JUDGE_TYPE=${judgeType}`]);

      const trimmed = result.output.trim();
      if (/VERDICT:APPROVED\s*$/.test(trimmed)) {
        return { output: result.output, passed: true, status: 200 };
      }
      if (/VERDICT:NOT_APPROVED\s*$/.test(trimmed)) {
        return { output: result.output, passed: false, status: 200 };
      }
      if (/VERDICT:ERROR\s*$/.test(trimmed)) {
        return { output: result.output, passed: false, status: 400 };
      }
      return { output: result.output || "Judge produced no verdict.", passed: false, status: 500 };
    } catch (err) {
      return { output: err.message || "Execution error.", passed: false, status: 400 };
    } finally {
      releaseContainer();
      await Promise.allSettled([
        safeUnlink(filepath), safeUnlink(testcasePath), safeUnlink(expectedPath),
      ]);
    }
  },
};
