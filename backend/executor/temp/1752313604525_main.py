def fact(val):
	if val == 0 or val == 1:
		return 1
	return val * fact(val - 1)

import sys
for line in sys.stdin:
	line = line.strip()
	if line.isdigit():
		print(fact(int(line)))