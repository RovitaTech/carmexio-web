"""Validate src/locale/en.translations.py against the extracted messages and
write src/locale/messages.en.json. Fails on missing ids or placeholder drift."""
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
source = json.loads((ROOT / 'src/locale/messages.json').read_text())['translations']
spec = importlib.util.spec_from_file_location('en', ROOT / 'src/locale/en.translations.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
EN: dict[str, str] = module.EN

placeholders = lambda s: sorted(re.findall(r'\{\$[\w]+\}', s))
missing = [k for k in source if k not in EN]
unused = [k for k in EN if k not in source]
drift = [k for k in source if k in EN and placeholders(source[k]) != placeholders(EN[k])]

for k in missing:
    print(f'missing: {k} = {json.dumps(" ".join(source[k].split()), ensure_ascii=False)}')
for k in drift:
    print(f'placeholders differ: {k}: {placeholders(source[k])} vs {placeholders(EN[k])}')
for k in unused:
    print(f'unused (safe to delete): {k}')

if missing or drift:
    sys.exit(1)
out = {'locale': 'en', 'translations': {k: EN[k] for k in source}}
(ROOT / 'src/locale/messages.en.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
print(f'messages.en.json: {len(out["translations"])} messages')
