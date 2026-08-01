#!/bin/bash
# usage: normalizer.sh <input-file> <output-file> <mode>
# modes: string | ignore_case | boolean | float
set -o pipefail

INPUT="$1"
OUTPUT="$2"
MODE="${3:-string}"

case "$MODE" in
  float)
    awk '{ for (i = 1; i <= NF; i++) {
           if ($i ~ /^[+-]?([0-9]+(\.[0-9]*)?|\.[0-9]+)([eE][+-]?[0-9]+)?$/ && $i + 0 == $i) printf "%.4f ", $i;
           else printf "%s ", $i }
         print "" }' "$INPUT" | tr -s ' '
    ;;
  boolean)
    tr '[:upper:]' '[:lower:]' < "$INPUT" \
      | sed 's/\btrue\b/1/g; s/\bfalse\b/0/g; s/\byes\b/1/g; s/\bno\b/0/g' \
      | tr -s '[:space:]' ' '
    ;;
  ignore_case)
    tr '[:upper:]' '[:lower:]' < "$INPUT" | tr -s '[:space:]' ' '
    ;;
  *)
    tr -s '[:space:]' ' ' < "$INPUT"
    ;;
esac | sed 's/^ *//; s/ *$//' > "$OUTPUT"
