// Bounds include both endpoint pixels and are clipped to the analysis bitmap.
export function regionBounds(start,end,width,height) {
  const clamp=(n,max)=>Math.max(0,Math.min(max-1,Math.floor(n)));
  const ax=clamp(start.x,width),ay=clamp(start.y,height),bx=clamp(end.x,width),by=clamp(end.y,height);
  return {x:Math.min(ax,bx),y:Math.min(ay,by),width:Math.abs(ax-bx)+1,height:Math.abs(ay-by)+1};
}
export function spraysInRegion(pixels,width,height,byRGB,start,end) {
  const bounds=regionBounds(start,end,width,height),counts=new Map();let total=0;
  for(let y=bounds.y;y<bounds.y+bounds.height;y++)for(let x=bounds.x;x<bounds.x+bounds.width;x++){
    const i=(y*width+x)*4,weight=pixels[i+3]/255;
    if(!weight)continue;
    const color=byRGB.get((pixels[i]<<16)|(pixels[i+1]<<8)|pixels[i+2]);
    if(!color)continue;
    const entry=counts.get(color.id)||{color,weight:0};entry.weight+=weight;counts.set(color.id,entry);total+=weight;
  }
  return {bounds,entries:[...counts.values()].map(entry=>({color:entry.color,share:entry.weight/total})).sort((a,b)=>b.share-a.share)};
}
