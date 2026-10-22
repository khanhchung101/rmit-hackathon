#!/usr/bin/env python3
"""Zip source excluding secrets/build directories. Not required to use the delivered archive."""
from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
out=root.parent/'leash-kit.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
 for path in sorted(root.rglob('*')):
  if path.is_file() and not any(t in path.parts for t in ['node_modules','.git','build','.tmp','private','runtime']):
   if path.name in ['.env'] or (path.name.startswith('.env.') and path.name!='.env.example'):continue
   z.write(path,'leash-kit/'+str(path.relative_to(root)))
print(out)
