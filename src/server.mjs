import http from 'node:http';
import {readFileSync} from 'node:fs';
import {runMockDemo} from './demo.mjs';
const port=Number(process.env.PORT||8787);
const html=readFileSync(new URL('../public/index.html',import.meta.url));
const server=http.createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.method==='GET'&&req.url==='/'){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(html);
  }
  if(req.method==='GET'&&req.url==='/api/mock-demo'){
    res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify(runMockDemo()));
  }
  if(req.method==='GET'&&req.url==='/api/status'){
    res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({mode:'MOCK_ONLY_NOT_TIDE',tide:'REAL_TIDE_NOT_WIRED'}));
  }
  res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'NOT_FOUND'}));
});
server.listen(port,'127.0.0.1',()=>console.log(`Leash MOCK_ONLY_NOT_TIDE at http://127.0.0.1:${port}`));
