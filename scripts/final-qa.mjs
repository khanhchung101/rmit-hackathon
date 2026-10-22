/** Offline final QA. Synthetic data/local HTTP only; never contacts Tide/provider APIs.
 * PASS on mock subchecks never promotes REAL parent cases. No production fixes here.
 */
import {readFileSync,writeFileSync,mkdirSync,readdirSync,mkdtempSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {MockSigner} from '../src/signing/mockSigner.mjs';
import {MockBank,buildBankEnvelope} from '../src/bank.mjs';
import {makePayment,validatePayment} from '../src/canonical.mjs';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
process.chdir(root);
const runId=new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8);
const runDir=join(root,'evidence','private','final-qa',runId);
mkdirSync(runDir,{recursive:true});
const temp=mkdtempSync(join(runDir,'synthetic-'));
const env={...process.env,TIDE_MODE:'mock'};
for(const key of Object.keys(env)) if(/^TIDE_/i.test(key) && key!=='TIDE_MODE') delete env[key];
const checks=[];
function snapshot(){
  const files=[];
  function walk(path){for(const e of readdirSync(path,{withFileTypes:true})){const p=join(path,e.name);if(e.isDirectory())walk(p);else if(e.isFile())files.push(p);}}
  for(const name of ['src','tests','scripts','model','fixtures','forseti']) walk(join(root,name));
  files.push(join(root,'package.json'));
  const manifest=files.sort().map(p=>({path:relative(root,p).replaceAll('\\','/'),sha256:createHash('sha256').update(readFileSync(p)).digest('hex')}));
  return {manifest,hash:createHash('sha256').update(JSON.stringify(manifest)).digest('hex')};
}
const before=snapshot();
async function check(id,parent,fn){
  try{const r=await fn();const row={id,parent,layer:'LOCAL_MOCK',status:r.ok?'PASS':'FAIL',actual:r.actual};checks.push(row);console.log(`${row.status} ${id}: ${r.actual.slice(0,240)}`);}
  catch(error){checks.push({id,parent,layer:'LOCAL_MOCK',status:'BLOCKED',actual:error.message});console.log(`BLOCKED ${id}: ${error.message}`);}
}
function command(id,args){
  const r=spawnSync(process.execPath,args,{cwd:root,env,encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024});
  writeFileSync(join(runDir,id+'.txt'),(r.stdout||'')+(r.stderr||'')+(r.error?.message||''));
  return {ok:r.status===0 && !r.error,actual:`exit=${r.status}; log=${id}.txt`};
}
const signer=new MockSigner();
const config={pinnedPublicKey:signer.publicKey.export({type:'spki',format:'pem'}),pinnedKeyId:'qa-key',pinnedPolicyId:'qa-policy'};
function artifact(){
  const p=makePayment({invoiceId:'QA-SYNTHETIC',amountMinor:55000,currency:'USD',payeeId:'acme-labs',payeeAccount:'ACME-DEMO-001'},
    {nonce:'qa-'+randomUUID(),expiresAt:new Date(Date.now()+300000).toISOString()});
  const s=signer.signIfAllowed(p,{approvals:[{approverId:'finance-a'}]});
  return buildBankEnvelope(p,s,{keyId:config.pinnedKeyId,policyId:config.pinnedPolicyId});
}
function execute(e,cfg=config){return new MockBank(cfg).execute(e);}
function worker(envelope,cfg){
  return new Promise((res,rej)=>{
    const p=spawn(process.execPath,['scripts/qa-receiver-worker.mjs'],{cwd:root,env,stdio:['pipe','pipe','pipe'],windowsHide:true});
    let out='';let err='';const timer=setTimeout(()=>{p.kill();rej(Error('worker timeout'));},10000);
    p.on('error',e=>{clearTimeout(timer);rej(e);});p.stdin.on('error',()=>{});
    p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);
    p.on('close',code=>{clearTimeout(timer);try{res({exit:code,...JSON.parse(out)});}catch{rej(Error(`worker output invalid; exit=${code}; ${err.slice(0,200)}`));}});
    p.stdin.end(JSON.stringify({config:cfg,envelope}));
  });
}
async function startServer(mode){
  const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
  const child=spawn(process.execPath,['src/server.mjs'],{cwd:root,env:{...env,PORT:String(port),TIDE_MODE:mode},stdio:['ignore','pipe','pipe'],windowsHide:true});
  let logs='';let childError;child.on('error',e=>childError=e);child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
  const base=`http://127.0.0.1:${port}`;
  const stop=async()=>{if(child.exitCode===null){const closed=once(child,'close');child.kill();await closed;}writeFileSync(join(runDir,`server-${mode}.txt`),logs);};
  try{for(let i=0;i<80;i++){
    if(childError) throw childError;if(child.exitCode!==null)throw Error('server exited during startup');
    try{await fetch(base+'/api/status',{signal:AbortSignal.timeout(300)});return {base,stop};}catch{}
    await new Promise(r=>setTimeout(r,100));
  }throw Error('server startup timeout');}catch(e){await stop();throw e;}
}
const invoice=readFileSync('fixtures/invoices/valid-low.txt','utf8');
async function post(base,payload){const r=await fetch(base+'/api/pipeline',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(3000)});return {http:r.status,...await r.json()};}

await check('baseline-unit','QA-03',()=>command('baseline-unit',['--test',...readdirSync('tests').filter(f=>f.endsWith('.test.mjs')).sort().map(f=>'tests/'+f)]));
await check('baseline-fixtures','QA-03',()=>command('baseline-fixtures',['scripts/verify-fixtures.mjs']));
await check('baseline-contracts','QA-03',()=>command('baseline-contracts',['scripts/verify-contracts.mjs']));
await check('baseline-security','QA-03',()=>command('baseline-security',['--input-type=module','-e',"import {runSecurityScenarios} from './src/securityScenarios.mjs'; const rows=await runSecurityScenarios(); if(!Array.isArray(rows)||rows.length<8)throw Error('Missing scenarios'); console.log(rows.join('\\n')); "]));
await check('unsigned-receiver','QA-14',()=>{const e=artifact();e.authorization.signatureBase64='';const r=execute(e);return {ok:r.accepted===false,actual:JSON.stringify(r)};});
await check('legacy-envelope-bypass','QA-14',()=>{const e=artifact();const r=new MockBank(config).execute(e.payment,e.authorization.signatureBase64);return {ok:r.accepted===false,actual:JSON.stringify(r)};});
await check('signed-field-tamper','QA-15',()=>{
 const e=artifact();const changes={amountMinor:55001,payeeAccount:'BETA-DEMO-002',payeeId:'beta-supply',invoiceId:'OTHER',nonce:'other-qa-nonce',expiresAt:new Date(Date.now()+600000).toISOString()};
 const results=Object.entries(changes).map(([k,v])=>({field:k,...execute({...e,payment:{...e.payment,[k]:v}})}));
 return {ok:results.every(r=>r.accepted===false),actual:JSON.stringify(results)};
});
await check('mode-relabel','QA-21',()=>{const e=artifact();e.authorization.mode='REAL_TIDE';const r=execute(e);return {ok:r.accepted===false,actual:JSON.stringify(r)};});
await check('extra-envelope-field','QA-22',()=>{const r=execute({...artifact(),extra:'caller-controlled'});return {ok:r.accepted===false,actual:JSON.stringify(r)};});
await check('wrong-key-id','QA-16',()=>{const e=artifact();e.authorization.keyId='attacker';const r=execute(e);return {ok:r.accepted===false,actual:JSON.stringify(r)};});
await check('restart-ledger-harness','QA-19',async()=>{const e=artifact();const cfg={...config,durablePath:join(temp,'restart.jsonl')};const a=await worker(e,cfg);const b=await worker(e,cfg);return {ok:a.accepted===true&&b.code==='REPLAY_NONCE',actual:JSON.stringify([a,b])};});
await check('concurrent-ledger-harness','QA-20',async()=>{const e=artifact();const cfg={...config,durablePath:join(temp,'parallel.jsonl')};const rs=await Promise.all([worker(e,cfg),worker(e,cfg)]);return {ok:rs.filter(r=>r.accepted===true).length===1&&rs.filter(r=>r.code==='REPLAY_NONCE').length===1,actual:JSON.stringify(rs)};});
await check('corrupt-ledger','QA-25',()=>{const path=join(temp,'corrupt.jsonl');writeFileSync(path,'{"nonce":"truncated');try{const r=execute(artifact(),{...config,durablePath:path});return {ok:r.accepted===false,actual:JSON.stringify(r)};}catch(e){return {ok:true,actual:'fail closed: '+e.message};}});
await check('expiry-boundary-local','QA-23',()=>{const e=artifact();const time=new Date(e.payment.expiresAt);try{validatePayment(e.payment,{at:time});return {ok:false,actual:'accepted at expiry'};}catch(err){return {ok:err.message==='EXPIRED',actual:err.message};}});

let mockServer;
try{
 mockServer=await startServer('mock');
 await check('http-positive-mock','QA-05',async()=>{const r=await post(mockServer.base,{invoiceText:invoice,approvals:[{approverId:'finance-a'}],nonce:'qa-'+randomUUID()});return {ok:r.accepted===true,actual:JSON.stringify(r)};});
 for(const variant of ['empty','missing','null']) await check('http-approvals-'+variant,'QA-08',async()=>{
   const body={invoiceText:invoice,nonce:'qa-'+randomUUID()};if(variant!=='missing')body.approvals=variant==='empty'?[]:null;
   const r=await post(mockServer.base,body);return {ok:r.accepted===false,actual:JSON.stringify(r)};
 });
 await check('http-replay','QA-18',async()=>{const body={invoiceText:invoice,approvals:[{approverId:'finance-a'}],nonce:'qa-'+randomUUID()};const a=await post(mockServer.base,body);const b=await post(mockServer.base,body);return {ok:a.accepted===true&&b.accepted===false&&b.code==='REPLAY_NONCE',actual:JSON.stringify([a,b])};});
}catch(error){checks.push({id:'http-environment',parent:'QA-08',layer:'LOCAL_MOCK',status:'BLOCKED',actual:error.message});}
finally{if(mockServer)await mockServer.stop();}
// Deliberately remove credentials and only test real mode's unconfigured failure path.
let realServer;
try{
 realServer=await startServer('real');
 await check('unconfigured-real-fail-closed','QA-24',async()=>{const r=await post(realServer.base,{invoiceText:invoice,approvals:[],nonce:'qa-'+randomUUID()});return {ok:r.accepted===false&&r.code==='REAL_TIDE_NOT_WIRED',actual:JSON.stringify(r)};});
}catch(error){checks.push({id:'real-fail-closed-environment',parent:'QA-24',layer:'LOCAL_MOCK',status:'BLOCKED',actual:error.message});}
finally{if(realServer)await realServer.stop();}

// RFC-style CSV quoting, including BOM and embedded newlines in manual notes.
function parseCSV(text){const rows=[];let row=[],cell='',quoted=false;text=text.replace(/^\uFEFF/,'');for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
const csv=rows=>rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n';
const rows=parseCSV(readFileSync('docs/FINAL_QA_RESULTS.csv','utf8'));
const header=rows[0];const index=Object.fromEntries(header.map((v,i)=>[v,i]));
if(rows.length!==43||!['test_id','status','actual','evidence_path','rc_sha','executed_at','tester'].every(k=>k in index))throw Error('Unexpected QA CSV contract');
const after=snapshot();const stable=before.hash===after.hash;
const report={runId,startedSourceHash:before.hash,endedSourceHash:after.hash,sourceStable:stable,node:process.version,scope:'OFFLINE_LOCAL_MOCK_ONLY',checks,
 warning:'Test helper subprocess is not the product receiver. REAL positive/security checks and release review require human/access; no Tide network request performed.',
 decision:'NO_GO_OR_NOT_EVALUATED'};
writeFileSync(join(runDir,'source-manifest.json'),JSON.stringify(before,null,2));
writeFileSync(join(runDir,'report.json'),JSON.stringify(report,null,2));
const evidence=relative(root,join(runDir,'report.json')).replaceAll('\\','/');
// Save a separate suggested CSV. Preserve manual results in the canonical sheet.
for(const row of rows.slice(1)){
 const id=row[index.test_id];const related=checks.filter(c=>c.parent===id);const fail=related.some(c=>c.status==='FAIL');
 if(row[index.tester]==='Automated local QA'){
   row[index.status]='NOT_RUN';row[index.actual]='';row[index.evidence_path]='';
 }
 if(!['NOT_RUN','BLOCKED'].includes(row[index.status]))continue;
 if(!stable){row[index.status]='BLOCKED';row[index.actual]='Source changed during run; rerun a frozen RC.';}
 else if(fail){row[index.status]='FAIL';row[index.actual]='LOCAL reproduction, not REAL evidence: '+related.map(c=>c.id+'='+c.status).join('; ');}
 else if(id==='QA-03'&&related.length===4&&related.every(c=>c.status==='PASS')){row[index.status]='PASS';row[index.actual]='Four local baseline checks passed; no real signing claim.';}
 else if(related.length || /REAL|Receiver|receiver/.test(row[index.layer])){row[index.status]='BLOCKED';row[index.actual]=related.length?'Local subset completed; REAL/full-case coverage still required: '+related.map(c=>c.id+'='+c.status).join('; '):'REAL access or final receiver harness/evidence required; not executed by offline runner.';}
 else continue;
 row[index.evidence_path]=evidence;row[index.rc_sha]='source-sha256:'+before.hash;row[index.executed_at]=new Date().toISOString();row[index.tester]='Automated local QA';
}
writeFileSync(join(runDir,'FINAL_QA_RESULTS.suggested.csv'),csv(rows));
if(process.argv.includes('--update-results')){
 writeFileSync(join(runDir,'FINAL_QA_RESULTS.before.csv'),readFileSync('docs/FINAL_QA_RESULTS.csv'));
 writeFileSync('docs/FINAL_QA_RESULTS.csv',csv(rows));
}
const counts=checks.reduce((a,c)=>(a[c.status]=(a[c.status]||0)+1,a),{});
const summary=`# Automated QA ${runId}\n\nScope: LOCAL MOCK only. Source stable: ${stable}.\n\n${JSON.stringify(counts)}\n\n`+
 '| Subcheck | QA ID | Status |\n|---|---|---|\n'+checks.map(c=>`| ${c.id} | ${c.parent} | ${c.status} |`).join('\n')+
 '\n\nREAL Tide, rules, eligibility, artifacts, secrets review and submission remain unverified. See report.json and suggested CSV. This is not a release approval.\n';
writeFileSync(join(runDir,'SUMMARY.md'),summary);
console.log(`\nEvidence: ${relative(root,runDir)}\n${JSON.stringify(counts)}; sourceStable=${stable}`);
process.exitCode=checks.some(c=>c.status==='FAIL')?1:checks.some(c=>c.status==='BLOCKED')||!stable?2:0;
