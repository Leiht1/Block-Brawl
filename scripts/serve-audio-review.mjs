import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.css':'text/css','.wav':'audio/wav','.ogg':'audio/ogg','.mp3':'audio/mpeg','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'};
const port=Number(process.argv[2]||4173);
http.createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://local').pathname).slice(1)||'validation/2026-10-11/audio-maps/index.html',file=path.resolve(root,name);if(!file.startsWith(root))throw Error('path');const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end();}}).listen(port,'127.0.0.1',()=>console.log('Audio review: http://127.0.0.1:'+port+'/validation/2026-10-11/audio-maps/index.html'));
