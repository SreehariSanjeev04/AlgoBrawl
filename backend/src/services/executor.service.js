import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import { exec } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMP_DIR = join(__dirname, "..", "executor", "temp");

if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });

const LANGUAGE_CONFIG = {
  python: { image: "code-runner-python", file: "main.py" },
  cpp: { image: "code-runner-cpp", file: "main.cpp" },
};

const cleanupFiles = (paths) => {
  paths.forEach((f) => {
    if (existsSync(f)) unlinkSync(f);
  });
};

let containers = 0;

export const executorService = {
  getConfig(language) {
    return LANGUAGE_CONFIG[language] || null;
  },

  async runCode(language, code, testcases) {
    const config = this.getConfig(language);
    if (!config) return { error: "Unsupported language", status: 400 };

    const timestamp = Date.now();
    const filepath = join(TEMP_DIR, `${timestamp}_${config.file}`);
    const inputpath = join(TEMP_DIR, `testcases_${timestamp}.txt`);

    try {
      writeFileSync(filepath, code);
      writeFileSync(inputpath, testcases);
      if (containers >= env.maxContainers) {
        cleanupFiles([filepath, inputpath]);
        return { output: "Too many submissions. Please try again shortly.", status: 429 };
      }
      containers++;

      return new Promise((resolve) => {
        const command = `timeout -k 5s 5s docker run --rm --memory=100m --cpus=0.5 \
          -v ${filepath}:/code/${config.file} \
          -v ${inputpath}:/code/input.txt \
          ${config.image}`;
        exec(command, (err, stdout, stderr) => {
          containers--;
          cleanupFiles([filepath, inputpath]);
          if (err) {
            resolve({ output: stderr || "Execution error.", status: 400 });
          } else {
            resolve({ output: stdout, status: 200 });
          }
        });
      });
    } catch (err) {
      cleanupFiles([filepath, inputpath]);
      return { error: "Internal Server Error", status: 500 };
    }
  },

  async submitCode(language, code, testcases, expected) {
    const config = this.getConfig(language);
    if (!config) return { output: "Unsupported language", passed: false, status: 400 };

    const timestamp = Date.now();
    const filepath = join(TEMP_DIR, `${timestamp}_${config.file}`);
    const testcasePath = join(TEMP_DIR, `testcase_${timestamp}.txt`);
    const expectedPath = join(TEMP_DIR, `expected_${timestamp}.txt`);

    try {
      writeFileSync(filepath, code);
      writeFileSync(testcasePath, testcases);
      writeFileSync(expectedPath, expected);

      if (containers >= env.maxContainers) {
        cleanupFiles([filepath, testcasePath, expectedPath]);
        return { output: "Too many submissions. Please try again shortly.", passed: false, status: 429 };
      }
      containers++;

      return new Promise((resolve) => {
        const command = `timeout 5 docker run --rm --memory=100m --cpus=0.5 --network=none \
          -v "${filepath}:/code/${config.file}" \
          -v "${testcasePath}:/code/input.txt" \
          -v "${expectedPath}:/code/expected.txt" \
          ${config.image}`;
        exec(command, (err, stdout, stderr) => {
          containers--;
          cleanupFiles([filepath, testcasePath, expectedPath]);
          if (err) {
            resolve({ output: stderr || "Execution error.", passed: false, status: 400 });
          } else {
            resolve({ output: stdout, passed: true, status: 200 });
          }
        });
      });
    } catch (err) {
      cleanupFiles([filepath, testcasePath, expectedPath]);
      return { output: err.message || "Internal server error", passed: false, status: 500 };
    }
  },
};
