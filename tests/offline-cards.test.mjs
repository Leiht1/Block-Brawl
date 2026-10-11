import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),output=path.join(root,'方块乱斗-最新版.html');
const html=fs.existsSync(output)?fs.readFileSync(output,'utf8'):null;
const offlineOptions={skip:html===null?'Optional offline HTML is not built; run npm ci && npm run build:offline first.':false};
test('standalone card game embeds one valid JS program without replacement-token corruption',offlineOptions,()=>{
  assert.equal((html.match(/<script/g)||[]).length,2);assert.equal((html.match(/<\/script>/g)||[]).length,2);
  const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);assert.doesNotThrow(()=>new Script(script));assert.ok(!html.includes('src="app.mjs"'));assert.ok(html.includes('id="deck-selection"'));assert.ok(html.includes('id="card-dock"'));
});
test('standalone embedded build hashes match the current card modules and every source asset',offlineOptions,()=>{
  const meta=JSON.parse(html.match(/id="offline-build">([\s\S]*?)<\/script>/)[1]);
  assert.ok(meta.sources['dist/cards.mjs']);assert.ok(meta.sources['dist/card-ui.mjs']);
  for(const [source,expected] of Object.entries(meta.sources)){
    const file=path.join(root,source.startsWith('./assets/')?'dist/'+source:source);
    assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),expected,source);
  }
});
