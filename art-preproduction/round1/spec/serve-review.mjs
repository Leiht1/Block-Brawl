import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.csv':'text/csv; charset=utf-8'};
http.createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+path.sep)&&file!==path.join(root,'index.html'))throw Error('outside preview');const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}}).listen(4186,'127.0.0.1',()=>console.log('Review at http://127.0.0.1:4186'));
