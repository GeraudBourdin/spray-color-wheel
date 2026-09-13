import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../preview-selection.js',import.meta.url),'utf8');
const {regionBounds,spraysInRegion}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const red={id:'red'},blue={id:'blue'},map=new Map([[0xff0000,red],[0x0000ff,blue]]);
const pixels=new Uint8ClampedArray([255,0,0,255,0,0,255,255,0,0,0,0,255,0,0,255,0,0,255,128,0,0,0,0]);
test('reverse and out-of-bounds rectangles are clipped, inclusive and direction independent',()=>{
 assert.deepEqual(regionBounds({x:20,y:20},{x:-2,y:-5},3,2),{x:0,y:0,width:3,height:2});
 assert.deepEqual(spraysInRegion(pixels,3,2,map,{x:0,y:0},{x:2,y:1}),spraysInRegion(pixels,3,2,map,{x:2,y:1},{x:0,y:0}));
});
test('area selection deduplicates sprays, weights alpha, and omits transparent pixels',()=>{
 const {entries}=spraysInRegion(pixels,3,2,map,{x:0,y:0},{x:2,y:1});assert.equal(entries.length,2);assert.equal(entries[0].color.id,'red');assert.ok(Math.abs(entries[0].share-2/(3+128/255))<1e-8);
 assert.equal(spraysInRegion(pixels,3,2,map,{x:0,y:0},{x:0,y:0}).entries.length,1);
 assert.equal(spraysInRegion(pixels,3,2,map,{x:2,y:0},{x:2,y:1}).entries.length,0);
});
