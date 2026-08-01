import sys
import re

def clean(filename, mode="string"):
    with open(filename, 'r') as f:
        content = f.read().strip().lower()
        words = content.split()

    if mode == "boolean":
        replacements = {'true': '1', 'false': '0', 'yes': '1', 'no': '0'}
        words = [replacements.get(w, w) for w in words]

    elif mode == "float":
        def to_float(w):
            try: return f"{float(w):.4f}"
            except: return w
        words = [to_float(w) for w in words]

    standardized = " ".join(words)

    with open(filename, 'w') as f:
        f.write(standardized)


def main(argv):
    if len(argv) < 2:
        print("usage: normalizer.py <output-file> [<expected-file>] [mode]", file=sys.stderr)
        sys.exit(1)
    mode = argv[3] if len(argv) > 3 else "string"
    clean(argv[1], mode)
    if len(argv) > 2:
        clean(argv[2], mode)


main(sys.argv)
