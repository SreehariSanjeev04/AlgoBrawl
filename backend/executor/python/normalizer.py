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


clean(sys.argv[1], sys.argv[3]) 
clean(sys.argv[2], sys.argv[3])