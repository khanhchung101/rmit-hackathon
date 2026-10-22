// QA harness only: a separate process exercising the existing MockBank class.
// This is NOT the product's independent receiver or real Tide integration.
import {MockBank} from '../src/bank.mjs';
let input = '';
for await (const chunk of process.stdin) input += chunk;
try {
  const {config, envelope} = JSON.parse(input);
  const bank = new MockBank(config);
  console.log(JSON.stringify(bank.execute(envelope)));
} catch (error) {
  console.log(JSON.stringify({accepted:false, harnessError:true, code:error.code || error.message}));
  process.exitCode = 2;
}
