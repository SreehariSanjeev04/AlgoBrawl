const express = require("express");
const router = express.Router();
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

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

const TEMP_DIR = path.join(__dirname, "temp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

router.post("/run", async (req, res) => {
  if (containers >= MAX_CONTAINERS) {
    return res
      .status(429)
      .json({ output: "Too many submissions. Please try again shortly." });
  }

  const { language, code, testcases, expected } = req.body;
  const config = LANGUAGE_CONFIG[language];

  if (!config) {
    return res.status(400).json({ output: "Unsupported language" });
  }

  const timestamp = Date.now();
  const filename = `${timestamp}_${config.file}`;
  const filepath = path.join(TEMP_DIR, filename);

  const testcaseFile = `testcase_${timestamp}.txt`;
  const testcasePath = path.join(TEMP_DIR, testcaseFile);

  const expectedFile = `expected_${timestamp}.txt`;
  const expectedPath = path.join(TEMP_DIR, expectedFile);

  containers++;

  try {
    fs.writeFileSync(filepath, code);
    fs.writeFileSync(testcasePath, testcases);
    fs.writeFileSync(expectedPath, expected);

    const command = `timeout 5 docker run --rm --memory=100m --cpus=0.5 --network=none \
      -v "${filepath}:/code/${config.file}" \
      -v "${testcasePath}:/code/input.txt" \
      -v "${expectedPath}:/code/expected.txt" \
      ${config.image}`;

    exec(command, (err, stdout, stderr) => {
      containers--;

      [filepath, testcasePath, expectedPath].forEach((f) => {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      });

      if (err) {
        return res.status(400).json({ output: stderr || "Execution error." });
      }
      return res.status(200).json({ output: stdout });
    });
  } catch (err) {
    containers--;
    [filepath, testcasePath, expectedPath].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
    return res
      .status(500)
      .json({ output: err.message || "Internal server error" });
  }
});

module.exports = router;
