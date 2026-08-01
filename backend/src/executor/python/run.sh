#!/bin/bash
set -o pipefail
JUDGE_TYPE="${JUDGE_TYPE:-string}"

if ! timeout 4s python3 main.py < input.txt > output_raw.txt 2> error.txt; then
  echo "--- RUNTIME ERROR ---"
  cat error.txt
  echo "VERDICT:ERROR"
  exit 1
fi

bash /code/normalizer.sh output_raw.txt output.txt "$JUDGE_TYPE"

if [[ -e expected.txt ]]; then
  bash /code/normalizer.sh expected.txt expected_norm.txt "$JUDGE_TYPE"
  if cmp -s output.txt expected_norm.txt; then
    echo "VERDICT:APPROVED"
  else
    echo "VERDICT:NOT_APPROVED"
  fi
else
  echo "Output:"
  cat output.txt
fi
