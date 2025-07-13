import sys

def fact(num):
    if num == 0 or num == 1:
        return 1
    return fact(num - 1) * num

for line in sys.stdin:
    line = line.strip()
    if line.isdigit():
        print(fact(int(line)))
