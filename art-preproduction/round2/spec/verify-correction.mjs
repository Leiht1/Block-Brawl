import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const root=fileURLToPath(new URL('../',import.meta.url)),project=path.resolve(root,'../..');
const require=createRequire(import.meta.url),modules='C:/Users/HT/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=require(modules+'/playwright'),sharp=require(modules+'/sharp');
const manifest=JSON.parse(await fs.readFile(path.join(root,'spec/manifest.json'),'utf8'));
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();
 async function typography(file,id){await page.goto(pathToFileURL(file).href+'?card='+id);await page.evaluate(()=>document.fonts.ready);return page.evaluate(()=>Object.fromEntries(['.card-render','.card-name','.description','.description small'].map(s=>{const c=getComputedStyle(s === '.card-render' ? document.querySelector('body>.card-render') : document.querySelector('body>.card-render').querySelector(s));return [s,Object.fromEntries(['fontFamily','fontSize','fontWeight','letterSpacing','textAlign','justifyContent','alignItems','gap','left','right','top','height'].map(k=>[k,c[k]]))];})));}
 const approved=await typography(path.join(root,'../round1/index.html'),'sage');
 for(const c of manifest.cards){
  if(c.isNew)assert.deepEqual(await typography(path.join(root,'index.html'),c.id),approved);
  else assert.deepEqual(await fs.readFile(path.join(root,'previews/card-'+c.id+'.png')),await fs.readFile(path.join(root,'../round1/cards',c.id+'.png')));
 }
 for(const m of manifest.maps)for(const [key,file] of Object.entries(m.nativeAssets))assert.deepEqual(await fs.readFile(path.join(root,file)),await fs.readFile(path.join(project,'dist/assets',path.basename(file).includes('jungle-')||path.basename(file)==='toy-board.svg'?path.basename(file):'maps/'+path.basename(file))));
 const composite=manifest.cards.filter(c=>c.isNew).map((c,i)=>({input:path.join(root,'previews/card-'+c.id+'.png'),left:i%3*320,top:Math.floor(i/3)*440}));
 await sharp({create:{width:960,height:880,channels:4,background:'#f4eee1'}}).composite(composite).png().toFile(path.join(root,'previews/six-finished-cards.png'));
 const qa=JSON.parse(await fs.readFile(path.join(root,'spec/qa.json'),'utf8'));qa.checks.push('All six new card computed typography matches approved sage card exactly','Previous six cards are byte-identical','All native map asset copies are byte-identical to project originals');qa.typography=approved;await fs.writeFile(path.join(root,'spec/qa.json'),JSON.stringify(qa,null,2));
 console.log('Approved typography, unchanged original cards, and native map assets verified.');
}finally{await browser.close();}
