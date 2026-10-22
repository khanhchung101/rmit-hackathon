import {TideForsetiSigner} from '../src/signing/tideForsetiSigner.mjs';
try{
 await new TideForsetiSigner().signIfAllowed();
 console.error('FATAL: real mode returned without verified Tide proof.');process.exitCode=2;
}catch(err){
 console.error(`BLOCKED G4: ${err.message}`);
 console.error('Follow step0/FEASIBILITY_SPIKE.md. Do not substitute src/signing/mockSigner.mjs.');
 process.exitCode=3;
}
