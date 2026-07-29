import { Router } from "express";
const router = Router();
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import { exec } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const MAX_CONTAINERS = Number(process.env.MAX_CONTAINERS) || 5;
let containers = 0;

const LANGUAGE_CONFIG = {
  python: {
    image: "code-runner-python",
    file: "main.py",
    buildContext: "./python",
  },
  cpp: {
    image: "code-runner-cpp",
    file: "main.cpp",
    buildContext: "./cpp",
  },
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMP_DIR = join(__dirname, "temp");
if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR);

const cleanupFiles = (paths) => {
  paths.forEach((f) => {
    if (existsSync(f)) unlinkSync(f);
  });
};

router.post("/run", async (req, res) => {
  const { language, code, testcases } = req.body;
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const timestamp = Date.now();
  const filepath = join(TEMP_DIR, `${timestamp}_${config.file}`);
  const inputpath = join(TEMP_DIR, `testcases_${timestamp}.txt`);

  try {
    writeFileSync(filepath, code);
    writeFileSync(inputpath, testcases);

    if (containers >= MAX_CONTAINERS) {
      cleanupFiles([filepath, inputpath]);
      return res.status(429).json({ output: "Too many submissions. Please try again shortly." });
    }
    containers++;

    const command = `timeout -k 5s 5s docker run --rm --memory=100m --cpus=0.5 -v ${filepath}:/code/${config.file} -v ${inputpath}:/code/input.txt ${config.image}`;
    exec(command, (err, stdout, stderr) => {
      containers--;
      cleanupFiles([filepath, inputpath]);
      if (err) {
        return res.status(400).json({ output: stderr || "Execution error." });
      }
      return res.status(200).json({ output: stdout });
    });
  } catch (err) {
    cleanupFiles([filepath, inputpath]);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/submit", async (req, res) => {
  const { language, code, testcases, expected } = req.body;
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return res.status(400).json({ output: "Unsupported language", passed: false });
  }

  const timestamp = Date.now();
  const filepath = join(TEMP_DIR, `${timestamp}_${config.file}`);
  const testcasePath = join(TEMP_DIR, `testcase_${timestamp}.txt`);
  const expectedPath = join(TEMP_DIR, `expected_${timestamp}.txt`);

  try {
    writeFileSync(filepath, code);
    writeFileSync(testcasePath, testcases);
    writeFileSync(expectedPath, expected);

    if (containers >= MAX_CONTAINERS) {
      cleanupFiles([filepath, testcasePath, expectedPath]);
      return res.status(429).json({ output: "Too many submissions. Please try again shortly.", passed: false });
    }
    containers++;

    const command = `timeout 5 docker run --rm --memory=100m --cpus=0.5 --network=none \
      -v "${filepath}:/code/${config.file}" \
      -v "${testcasePath}:/code/input.txt" \
      -v "${expectedPath}:/code/expected.txt" \
      ${config.image}`;

    exec(command, (err, stdout, stderr) => {
      containers--;
      cleanupFiles([filepath, testcasePath, expectedPath]);
      if (err) {
        return res.status(400).json({ output: stderr || "Execution error.", passed: false });
      }
      return res.status(200).json({ output: stdout, passed: true });
    });
  } catch (err) {
    cleanupFiles([filepath, testcasePath, expectedPath]);
    return res.status(500).json({ output: err.message || "Internal server error", passed: false });
  }
});

export default router;
