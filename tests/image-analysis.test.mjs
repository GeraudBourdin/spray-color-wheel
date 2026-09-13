import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const utils=url(await readFile(new URL('../color-utils.js',import.meta.url),'utf8'));
const {hexToLab}=await import(utils);
const {analyzeImage}=await import(url((await readFile(new URL('../image-analysis.js',import.meta.url),'utf8')).replace("'./color-utils.js'",JSON.stringify(utils))));
const colors=['#FF0000','#0000FF','#000000'].map((hex,id)=>({id,hex,lab:hexToLab(hex)}));
const pixels=new Uint8ClampedArray([...Array(99).fill([255,0,0,255]).flat(),0,0,255,255,0,255,0,0]);
test('preserves a small accent, ignores transparent pixels, and reproduces exact catalog colors',()=>{
 const r=analyzeImage({pixels,colors,limit:2,accents:true});assert.equal(r.entries.length,2);assert.equal(r.entries[0].share,.99);assert.equal(r.entries[1].share,.01);assert.equal(r.error,0);assert.deepEqual(r.preview,pixels.map((v,i)=>i>=400?0:v));
});
test('respects budget, selected catalog, merges duplicate matches, and normalizes shares',()=>{
 for(const limit of [1,2,12]){const r=analyzeImage({pixels,colors:colors.slice(0,1),limit});assert.equal(r.entries.length,1);assert.equal(r.entries[0].color.id,0);assert.equal(r.entries[0].share,1);}
 assert.equal(analyzeImage({pixels,colors,limit:1}).entries.length,1);
});
test('rejects fully transparent images and empty catalogs',()=>{
 assert.throws(()=>analyzeImage({pixels:new Uint8ClampedArray(4),colors}),/transparente/);
 assert.throws(()=>analyzeImage({pixels,colors:[]}),/gamme/);
});
test('supports 100 references without the former 32-color cap',()=>{
 const palette=Array.from({length:100},(_,id)=>{
  const rgb=[(id%5)*48,Math.floor(id/5)%5*48,Math.floor(id/25)*64];
  const hex='#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('');
  return {id,hex,lab:hexToLab(hex),rgb};
 });
 const data=new Uint8ClampedArray(palette.flatMap(c=>[...c.rgb,255]));
 const result=analyzeImage({pixels:data,colors:palette,limit:100});
 assert.equal(result.entries.length,100);assert.equal(result.error,0);
 assert.equal(analyzeImage({pixels:data,colors:palette,limit:1}).entries.length,1);
});
