/** REAL TIDE ADAPTER: intentional fail-closed boundary until G4 proven. */
export class TideForsetiSigner {
  constructor(){this.mode='real';}
  async signIfAllowed(){
    throw Object.assign(new Error('REAL_TIDE_NOT_WIRED: Complete Step 0 G4. Never substitute the mock signer.'),
      {code:'REAL_TIDE_NOT_WIRED'});
  }
}
