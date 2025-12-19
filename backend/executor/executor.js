import { Router } from "express";
const router = Router();
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import { exec } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";


const MAX_CONTAINERS = process.env.MAX_CONTAINERS || 5;
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

router.post("/run", async (req, res) => {
  if (containers >= MAX_CONTAINERS) {
    return res
      .status(429)
      .json({ output: "Too many submissions. Please try again shortly." });
  }
  const { language, code, testcases } = req.body;
  console.log(req.body)
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const timestamp = Date.now();
  const filename = `${timestamp}_${config.file}`;
  const filepath = join(__dirname, "temp", filename);

  const inputfile = `testcases_${timestamp}.txt`;
  const inputpath = join(__dirname, "temp", inputfile);

  containers++;
  try {
    writeFileSync(filepath, code);
    writeFileSync(inputpath, testcases)

    const command = `timeout -k 5s 5s docker run --rm --memory=100m --cpus=0.5 -v ${filepath}:/code/${config.file} -v ${inputpath}:/code/input.txt ${config.image}`;
    exec(command, (err, stdout, stderr) => {
      containers--;
      [inputpath, filepath].forEach((f) => {
        if (existsSync(f)) unlinkSync(f);
      });
      if (err) {
        return res.status(400).json({ output: stderr || "Execution error." });
      }
      return res.status(200).json({ output: stdout });
    });
  } catch (err) {
    containers--;
    [inputpath, filepath].forEach((f) => {
      if (existsSync(f)) unlinkSync(f);
    });
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
router.post("/submit", async (req, res) => {
  if (containers >= MAX_CONTAINERS) {
    return res
      .status(429)
      .json({ output: "Too many submissions. Please try again shortly." });
  }

  const { language, code, testcases, expected } = req.body;
  const config = LANGUAGE_CONFIG[language];

  console.log(req.body)

  if (!config) {
    return res.status(400).json({ output: "Unsupported language" });
  }

  const timestamp = Date.now();
  const filename = `${timestamp}_${config.file}`;
  const filepath = join(TEMP_DIR, filename);

  const testcaseFile = `testcase_${timestamp}.txt`;
  const testcasePath = join(TEMP_DIR, testcaseFile);

  const expectedFile = `expected_${timestamp}.txt`;
  const expectedPath = join(TEMP_DIR, expectedFile);

  containers++;

  try {
    writeFileSync(filepath, code);
    writeFileSync(testcasePath, testcases);
    writeFileSync(expectedPath, expected);

    const command = `timeout 5 docker run --rm --memory=100m --cpus=0.5 --network=none \
      -v "${filepath}:/code/${config.file}" \
      -v "${testcasePath}:/code/input.txt" \
      -v "${expectedPath}:/code/expected.txt" \
      ${config.image}`;

    exec(command, (err, stdout, stderr) => {
      containers--;

      [filepath, testcasePath, expectedPath].forEach((f) => {
        if (existsSync(f)) unlinkSync(f);
      });

      if (err) {
        return res.status(400).json({ output: stderr || "Execution error." });
      }
      return res.status(200).json({ output: stdout });
    });
  } catch (err) {
    containers--;
    [filepath, testcasePath, expectedPath].forEach((f) => {
      if (existsSync(f)) unlinkSync(f);
    });
    return res
      .status(500)
      .json({ output: err.message || "Internal server error" });
  }
});

export default router;
