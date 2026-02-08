import sys
def solve(val):
    return val == val[::-1]
for line in sys.stdin:
    val = line.strip()
    print(solve(val))