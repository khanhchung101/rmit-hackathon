/** TEST ONLY. A local Ed25519 keypair exists in this process. NOT threshold signing. */
import {generateKeyPairSync,sign} from 'node:crypto';
import {canonicalize} from '../canonical.mjs';
import {evaluateMockPolicy} from '../policy.mjs';
export class MockSigner {
  constructor(){
    const {privateKey,publicKey}=generateKeyPairSync('ed25519');
    this._privateKey=privateKey; this.publicKey=publicKey;
  }
  signIfAllowed(payment,{approvals=[],executor='agent'}={}){
    const decision=evaluateMockPolicy(payment,approvals,executor);
    if(!decision.ok)return {ok:false,code:'POLICY_DENIED',detail:decision.code,signer:'MOCK_LOCAL_ONLY'};
    const bytes=canonicalize(payment);
    return {ok:true,code:'MOCK_SIGNED',signature:sign(null,bytes,this._privateKey).toString('base64'),signer:'MOCK_LOCAL_ONLY'};
  }
}
