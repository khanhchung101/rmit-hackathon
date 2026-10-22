#!/usr/bin/env python3
"""Pack only reviewed, redacted JSON/Markdown evidence; never include env/token/log dumps."""
import hashlib, json, pathlib, zipfile
root=pathlib.Path(__file__).resolve().parents[1]
files=[]
for base in ['evidence','docs','research','step0']:
 for p in (root/base).rglob('*'):
  if not p.is_file() or p.suffix not in ['.md','.json'] or 'private' in p.parts:continue
  b=p.read_bytes()
  suspicious=[s for s in [b'-----BEGIN PRIVATE KEY-----',b'api_key=',b'Bearer eyJ',b'"access_token":'] if s in b]
  if suspicious:raise SystemExit(f'Potential secret found in {p}: please redact before packing')
  files.append((str(p.relative_to(root)),b))
out=root/'build'/'leash-evidence.zip';out.parent.mkdir(exist_ok=True)
manifest=[{'path':path,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)} for path,data in files]
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for path,data in files:z.writestr(path,data)
 z.writestr('MANIFEST.json',json.dumps(manifest,indent=2))
print(f'Evidence bundle: {out}; files={len(files)}. REVIEW manually for sensitive information before distribution.')
