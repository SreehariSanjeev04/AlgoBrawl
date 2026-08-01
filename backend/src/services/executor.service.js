import { exec as execCb } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, mkdir, access } from "fs/promises";
import { constants } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMP_DIR = join(__dirname, "..", "executor", "temp");
const exec = promisify(execCb);

try { await access(TEMP_DIR, constants.F_OK); }
catch { await mkdir(TEMP_DIR, { recursive: true }); }

const LANGUAGE_CONFIG = {
  python: { image: "code-runner-python", file: "main.py" },
  cpp: { image: "code-runner-cpp", file: "main.cpp" },
};

let activeContainers = 0;

const acquireContainer = () => {
  if (activeContainers >= env.maxContainers) return false;
  activeContainers++;
  return true;
};

const releaseContainer = () => {
  if (activeContainers > 0) activeContainers--;
};

const runDocker = async (language, filepath, inputpath, extraMounts = [], extraEnv = []) => {
  const config = LANGUAGE_CONFIG[language];
  const mountArgs = [
    `-v "${filepath}:/code/${config.file}"`,
    `-v "${inputpath}:/code/input.txt"`,
    ...extraMounts,
  ].join(" ");
  const envArgs = extraEnv.map((entry) => `-e ${entry}`).join(" ");
  const cmd = `timeout -k 5s 5s docker run --rm --memory=100m --cpus=0.5 ${envArgs} ${mountArgs} ${config.image}`;
  try {
    const { stdout } = await exec(cmd);
    return { output: stdout, status: 200 };
  } catch (err) {
    return { output: err.stderr || "Execution error.", status: 400 };
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

    const timestamp = Date.now();
    const filepath = join(TEMP_DIR, `${timestamp}_${config.file}`);
    const inputpath = join(TEMP_DIR, `testcases_${timestamp}.txt`);

    try {
      await Promise.all([
        writeFile(filepath, code),
        writeFile(inputpath, testcases),
      ]);
      const result = await runDocker(language, filepath, inputpath);
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

    const timestamp = Date.now();
    const filepath = join(TEMP_DIR, `${timestamp}_${config.file}`);
    const testcasePath = join(TEMP_DIR, `testcase_${timestamp}.txt`);
    const expectedPath = join(TEMP_DIR, `expected_${timestamp}.txt`);

    try {
      await Promise.all([
        writeFile(filepath, code),
        writeFile(testcasePath, testcases),
        writeFile(expectedPath, expected),
      ]);
      const result = await runDocker(language, filepath, testcasePath, [
        `-v "${expectedPath}:/code/expected.txt"`,
        "--network=none",
      ], [`JUDGE_TYPE=${judgeType}`]);
      const passed = result.status === 200;
      return { output: result.output, passed, status: passed ? 200 : 400 };
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
