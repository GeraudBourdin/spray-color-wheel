import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source=await readFile(new URL('../wall-math.js',import.meta.url),'utf8');
const {homography,project,validQuad,transformQuad,zoomAt}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('projective corners and straight stroke stay aligned on an oblique wall',()=>{
 const quad=[{x:70,y:40},{x:620,y:130},{x:540,y:490},{x:110,y:410}];
 assert.ok(validQuad(quad));const h=homography(quad);
 [[0,0],[1,0],[1,1],[0,1]].forEach(([x,y],i)=>{const p=project(h,x,y);near(p.x,quad[i].x);near(p.y,quad[i].y);});
 const a=project(h,.2,0),b=project(h,.2,1),p=project(h,.2,.6);near((b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x),0);
});
test('crossed, concave, nonfinite and collapsed placements are rejected',()=>{
 assert.equal(validQuad([{x:0,y:0},{x:100,y:100},{x:100,y:0},{x:0,y:100}]),false);
 assert.equal(validQuad([{x:0,y:0},{x:100,y:0},{x:20,y:20},{x:0,y:100}]),false);
 assert.equal(validQuad([{x:0,y:0},{x:100,y:0},{x:-20,y:20},{x:0,y:100}]),false);
 assert.equal(validQuad([{x:NaN,y:0},...Array(3).fill({x:0,y:0})]),false);
 assert.equal(homography(Array(4).fill({x:0,y:0})),null);
});
test('zoom stays anchored to the same doodle, including at zoom limits',()=>{
 for(const factor of [.0001,.5,1.8,1000]){const v={x:45,y:-22,scale:.7},p={x:233,y:121};const next=zoomAt(v,p,factor);near((p.x-v.x)/v.scale,(p.x-next.x)/next.scale);near((p.y-v.y)/v.scale,(p.y-next.y)/next.scale);assert.ok(next.scale>=.02&&next.scale<=32);}
});
test('rotation and scaling preserve sketch center and are reversible',()=>{
 const quad=[{x:0,y:0},{x:300,y:0},{x:300,y:200},{x:0,y:200}];
 const changed=transformQuad(quad,1.8,.72);const restored=transformQuad(changed,1/1.8,-.72);
 restored.forEach((p,i)=>{near(p.x,quad[i].x);near(p.y,quad[i].y);});assert.ok(validQuad(changed));
});
