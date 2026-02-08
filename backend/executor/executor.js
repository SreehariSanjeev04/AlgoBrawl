import { Router } from "express";
const router = Router();
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from "fs";
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

const normalizeOutput = (expected_file, mode="string") => {
  if(!existsSync(expected_file)) return null;
  const content = readFileSync(expected_file, "utf-8");
  if(mode === "string") {
    // For string outputs, trim whitespace and convert to lowercase
    return content.trim().toLowerCase();
  } else if(mode === "boolean") {
    // For boolean outputs, convert to lowercase and check for true/false
    const normalized = content.trim().toLowerCase();
    for(let string of normalized.split(" ")) {
      if(string === "true" || string === "yes") return "true";
      if(string === "false" || string === "no") return "false";
    }
  } else {
    // For other outputs, trim whitespace and sort lines
    return content
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join("\n");
  }
}
router.post("/run", async (req, res) => {
  if (containers >= MAX_CONTAINERS) {
    return res
      .status(429)
      .json({ output: "Too many submissions. Please try again shortly." });
  }
  const { language, code, testcases, mode } = req.body;
  console.log(req.body);
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
    const normalizedTestcases = normalizeOutput(inputpath, mode);
    if(normalizedTestcases === null) {
      return res.status(400).json({ error: "Invalid testcases" });
    }
    console.log("Normalized Testcases:", normalizedTestcases);
    writeFileSync(inputpath, normalizedTestcases);

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

  console.log(req.body);

  if (!config) {
    return res
      .status(400)
      .json({ output: "Unsupported language", passed: false });
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
        return res
          .status(400)
          .json({ output: stderr || "Execution error.", passed: false });
      }
      return res.status(200).json({ output: stdout, passed: true });
    });
  } catch (err) {
    containers--;
    [filepath, testcasePath, expectedPath].forEach((f) => {
      if (existsSync(f)) unlinkSync(f);
    });
    return res
      .status(500)
      .json({ output: err.message || "Internal server error", passed: false });
  }
});

export default router;
