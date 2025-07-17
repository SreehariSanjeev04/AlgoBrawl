const BOILERPLATE = {
  python: "import sys\n def solve(val):\n    # Your code here\n    return\n for line in sys.stdin:\n    val = int(line.strip())\n    print(solve(val))",
  javascript: "function solve(val) {\n    // Your code here\n    return;\n}",
  java: "public class Solution {\n    public int solve(int val) {\n        // Your code here\n        return 0;\n    }\n}",
};

module.exports = BOILERPLATE;
