#!/bin/bash
python3 main.py < input.txt > output.txt

# Normalize the output by trimming whitespace and sorting lines
python3 normalizer.py output.txt > normalized_output.txt
mv normalized_output.txt output.txt
echo "Output: "
cat output.txt
if [[ -e expected.txt ]]; then
    cmp --silent output.txt expected.txt
    STATUS=$?

    if [[ $STATUS -eq 0 ]]; then
        echo "Approved"
    else
        echo "Not Approved"
    fi
else
    cat output.txt
fi
