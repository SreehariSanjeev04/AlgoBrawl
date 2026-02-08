import sys
def solve(a, b):
    return a + b
for line in sys.stdin:
    val = line.strip().split(" ")
    print(solve(int(val[0]), int(val[1])))