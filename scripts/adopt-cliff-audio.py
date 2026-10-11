"""Copy user-approved F/D audition bytes; archive the previous two recordings."""
from pathlib import Path
import hashlib,json,shutil

ROOT=Path(__file__).resolve().parents[1]
REF=ROOT/'references/audio-stage3'
REVIEW=ROOT/'validation/2026-10-11/audio-maps/cliff-reselection'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
choices=json.loads((REVIEW/'candidates.json').read_text(encoding='utf-8'))
selection=json.loads((REF/'selection.json').read_text(encoding='utf-8'))
derivatives=json.loads((REF/'derivatives.json').read_text(encoding='utf-8'))
archive=REF/'cliff-reselection/superseded'
archive.mkdir(parents=True,exist_ok=True)
baseline=REF/'cliff-reselection/before-adoption.json'
if not baseline.exists():baseline.write_text(json.dumps({p.relative_to(ROOT).as_posix():sha(p) for p in (ROOT/'dist').rglob('*') if p.is_file()},indent=2),encoding='utf-8')
adopted=[]
for id,letter in [('cliff.fall','F'),('cliff.impact','D')]:
 a=next(a for a in choices if a['id']==id and a['candidate']==letter)
 audition=REVIEW/a['file'];assert sha(audition)==a['sha256']
 for source in a['sources']:
  original=ROOT/source['file'] if source['slug'].startswith('swish-') else REF/'cliff-reselection'/source['file']
  assert sha(original)==source['sha256']
 phase=id.split('.')[1];old=ROOT/f'dist/assets/audio/maps/cliff/cliff-{phase}-v1.wav'
 target=ROOT/f'dist/assets/audio/maps/cliff/cliff-{phase}-v2.wav'
 assert old.resolve().is_relative_to((ROOT/'dist/assets/audio/maps/cliff').resolve())
 assert (archive/old.name).resolve().is_relative_to(archive.resolve())
 if old.exists():
  if (archive/old.name).exists():assert sha(archive/old.name)==sha(old);old.unlink()
  else:shutil.move(str(old),str(archive/old.name))
 shutil.copyfile(audition,target);assert sha(target)==a['sha256']
 file=target.relative_to(ROOT/'dist/assets/audio').as_posix()
 record=dict(a,file=file,auditionFile='cliff-reselection/'+a['file'],selectedBy='user',selectionBasis='User explicitly chose cliff fall F and dust/impact D.',status='installed',installed=True)
 derivatives=[d for d in derivatives if d['id']!=id]+[record];adopted.append(record)
 locked=next(c for c in selection['choices'] if c['id']==id)
 locked.update(candidate=letter,sha256=a['sha256'],approvedBy='user',reason='用户明确选择'+letter,review='validation/2026-10-11/audio-maps/cliff-reselection/candidates.json',targetFile=file)
for a in choices:
 a['installed']=any(d['id']==a['id'] and d['candidate']==a['candidate'] for d in adopted)
 a['status']='installed' if a['installed'] else 'not-selected'
selection['pendingReplacement']=[]
(REF/'selection.json').write_text(json.dumps(selection,ensure_ascii=False,indent=2),encoding='utf-8')
(REF/'derivatives.json').write_text(json.dumps(derivatives,ensure_ascii=False,indent=2),encoding='utf-8')
(REVIEW/'candidates.json').write_text(json.dumps(choices,ensure_ascii=False,indent=2),encoding='utf-8')
(REF/'cliff-reselection/selection.json').write_text(json.dumps(dict(approvedBy='user',warning='A',choices=adopted),ensure_ascii=False,indent=2),encoding='utf-8')
(REF/'cliff-reselection/pending.json').write_text(json.dumps(dict(status='complete',warning='A',fall='F',impact='D',approvedBy='user'),ensure_ascii=False,indent=2),encoding='utf-8')
print('Installed exact F fall / D dust; previous two files archived.')
