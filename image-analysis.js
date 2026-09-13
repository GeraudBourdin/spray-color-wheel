import { hexToLab, rgbToHex, hexToRgb } from './color-utils.js';
const distance = (a,b) => (a.l-b.l)**2+(a.a-b.a)**2+(a.b-b.b)**2;
const nearest = (lab, colors) => {
  let index=0, error=Infinity;
  colors.forEach((c,i)=>{const d=distance(lab,c.lab);if(d<error){error=d;index=i;}});
  return {index,error};
};

// Bounded histogram and perceptual clustering; alpha weights exclude transparent background.
export function analyzeImage({pixels, colors, limit=12, accents=true}) {
  if(!colors.length) throw new Error('Aucune gamme disponible.');
  const bins=new Map();
  for(let i=0;i<pixels.length;i+=4){
    const weight=pixels[i+3]/255;if(!weight)continue;
    const key=(pixels[i]>>4)*256+(pixels[i+1]>>4)*16+(pixels[i+2]>>4);
    let bin=bins.get(key);if(!bin){bin={r:0,g:0,b:0,weight:0};bins.set(key,bin);}
    bin.r+=pixels[i]*weight;bin.g+=pixels[i+1]*weight;bin.b+=pixels[i+2]*weight;bin.weight+=weight;
  }
  const points=[...bins.values()].map(p=>({...p,lab:hexToLab(rgbToHex({r:p.r/p.weight,g:p.g/p.weight,b:p.b/p.weight}))}));
  if(!points.length)throw new Error('Cette image est entièrement transparente.');
  const count=Math.min(Math.max(1,Math.round(limit)),100,points.length,colors.length);
  const centers=[{...points.reduce((a,b)=>a.weight>b.weight?a:b).lab}];
  while(centers.length<count){
    let best=null,score=0;
    for(const p of points){const d=Math.min(...centers.map(c=>distance(p.lab,c)));const s=d*Math.pow(p.weight,accents?.35:1);if(s>score){score=s;best=p;}}
    if(!best||score<.001)break;centers.push({...best.lab});
  }
  for(let iteration=0;iteration<14;iteration++){
    const sums=centers.map(()=>({l:0,a:0,b:0,w:0}));
    const centerColors=centers.map(lab=>({lab}));
    for(const p of points){const {index}=nearest(p.lab,centerColors);const s=sums[index],w=accents?Math.sqrt(p.weight):p.weight;s.l+=p.lab.l*w;s.a+=p.lab.a*w;s.b+=p.lab.b*w;s.w+=w;}
    sums.forEach((s,i)=>{if(s.w)centers[i]={l:s.l/s.w,a:s.a/s.w,b:s.b/s.w};});
  }
  let selected=[...new Set(centers.map(lab=>nearest(lab,colors).index))].map(i=>colors[i]);
  // Discard vanishing edge/antialiasing colors (under 0.1%); reassign their pixels.
  const preliminary=selected.map(()=>0);
  for(const p of points)preliminary[nearest(p.lab,selected).index]+=p.weight;
  const minimum=points.reduce((sum,p)=>sum+p.weight,0)*.001;
  selected=selected.filter((c,i)=>preliminary[i]>=minimum);
  const usage=selected.map(color=>({color,weight:0,error:0}));
  const mapping=new Map();let total=0,error=0;
  [...bins.keys()].forEach((key,i)=>{const p=points[i],match=nearest(p.lab,selected);mapping.set(key,match.index);usage[match.index].weight+=p.weight;usage[match.index].error+=Math.sqrt(match.error)*p.weight;total+=p.weight;error+=Math.sqrt(match.error)*p.weight;});
  const rgb=selected.map(c=>hexToRgb(c.hex)),preview=new Uint8ClampedArray(pixels.length);
  for(let i=0;i<pixels.length;i+=4){if(!pixels[i+3])continue;const key=(pixels[i]>>4)*256+(pixels[i+1]>>4)*16+(pixels[i+2]>>4),c=rgb[mapping.get(key)];preview[i]=c.r;preview[i+1]=c.g;preview[i+2]=c.b;preview[i+3]=pixels[i+3];}
  return {preview,error:error/total,entries:usage.filter(u=>u.weight>0).map(u=>({color:u.color,share:u.weight/total,error:u.error/u.weight})).sort((a,b)=>b.share-a.share)};
}
