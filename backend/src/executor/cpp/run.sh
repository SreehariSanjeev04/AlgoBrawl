#!/bin/bash
set -o pipefail
JUDGE_TYPE="${JUDGE_TYPE:-string}"

if ! timeout 10s g++ -O2 -std=c++17 main.cpp -o main 2> compile_error.txt; then
  echo "--- COMPILE ERROR ---"
  cat compile_error.txt
  echo "VERDICT:ERROR"
  exit 1
fi

if ! timeout 4s ./main < input.txt > output_raw.txt 2> runtime_error.txt; then
  echo "--- RUNTIME ERROR ---"
  cat runtime_error.txt
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
