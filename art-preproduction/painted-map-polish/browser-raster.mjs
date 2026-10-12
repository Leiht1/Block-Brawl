import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),deps=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[deps]}));
export async function createRasterizer(){
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage();
 return {close:()=>browser.close(),async render(bytes,{mime='image/svg+xml',width=600,height=600}={}){
  const result=await page.evaluate(async({src,width,height})=>{
   const image=new Image();image.src=src;await image.decode();
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   canvas.getContext('2d').drawImage(image,0,0,width,height);
   return canvas.toDataURL('image/png').split(',')[1];
  },{src:'data:'+mime+';base64,'+bytes.toString('base64'),width,height});
  return Buffer.from(result,'base64');
 }};
}
