import sys
def solve(val):
    if val % 3 == 0:
        print("Fizz")
    elif val % 5 == 0:
        print("Buzz")
    else:
        print(val)
    return
for line in sys.stdin:
    val = int(line.strip())
    print(solve(val))