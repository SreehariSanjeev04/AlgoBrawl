#!/bin/bash
python3 main.py < input.txt > output.txt
cmp --silent output.txt expected.txt
STATUS=$?

if [[ $STATUS -eq 0 ]]; then
    echo "Approved"
else
    echo "Not Approved"
fi
