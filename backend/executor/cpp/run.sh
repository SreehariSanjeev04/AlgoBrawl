#!/bin/bash
g++ main.cpp -o main && ./main < input.txt > output.txt
if [[ -e expected.txt ]]; then
    cmp --silent output.txt expected.txt
    STATUS=$?

    if [[ STATUS -eq 0 ]]; then
        echo "Approved"
    else
        echo "Not Approved"
    fi
else 
    cat output.txt
fi