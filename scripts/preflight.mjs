import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
const check=(label,ok,note='')=>console.log(`${ok?'PASS':'WARN'} ${label}${note?' — '+note:''}`);
const ver=process.versions.node.split('.')[0];
check('Node >=20',Number(ver)>=20,process.versions.node);
check('Node built-in crypto',typeof globalThis.crypto!=='undefined','Local mock tests only');
for(const path of ['PLAN.md','AGENTS.md','step0/FEASIBILITY_SPIKE.md','fixtures/vendors.json'])
 check('Required file',existsSync(new URL(`../${path}`,import.meta.url)),path);
for(const cmd of ['git','docker']){
 try{const args=cmd==='git'?['--version']:['--version'];check(cmd,true,execFileSync(cmd,args,{encoding:'utf8',timeout:3000}).trim().slice(0,120));}
 catch{check(cmd,false,'Needed for real project / Tide realm; not needed for mock tests');}
}
console.log('BLOCKED G1: verify official submissions status (possibly CLOSED on 2026-10-22).');
console.log('BLOCKED G4: real Tide policy + signature + external verification unimplemented.');
if(Number(ver)<20)process.exitCode=1;
