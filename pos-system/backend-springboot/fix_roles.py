import os, re
import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace hasRole
    content = re.sub(r"hasRole\('([^']+)'\)", r"hasAuthority('ROLE_\1')", content)

    # Replace hasAnyRole
    def repl_any(m):
        roles = m.group(1).split(',')
        auths = ["'ROLE_" + r.strip().strip("'") + "'" for r in roles]
        return "hasAnyAuthority(" + ", ".join(auths) + ")"

    content = re.sub(r"hasAnyRole\(([^)]+)\)", repl_any, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

d = 'src/main/java/com/pos/system/controllers'
for root, _, files in os.walk(d):
    for fl in files:
        if fl.endswith('.java'):
            process_file(os.path.join(root, fl))
print('Processing complete!')
