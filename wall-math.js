// Projective geometry shared by the editor, export and tests.
export function project(matrix, x, y) {
  const d = matrix[6] * x + matrix[7] * y + 1;
  return { x: (matrix[0] * x + matrix[1] * y + matrix[2]) / d,
    y: (matrix[3] * x + matrix[4] * y + matrix[5]) / d };
}
export function homography(points) {
  const rows = [];
  [[0,0],[1,0],[1,1],[0,1]].forEach(([u,v], i) => {
    const {x,y} = points[i];
    rows.push([u,v,1,0,0,0,-u*x,-v*x,x], [0,0,0,u,v,1,-u*y,-v*y,y]);
  });
  for (let col=0; col<8; col++) {
    let pivot=col;
    for (let r=col+1;r<8;r++) if (Math.abs(rows[r][col]) > Math.abs(rows[pivot][col])) pivot=r;
    [rows[col],rows[pivot]]=[rows[pivot],rows[col]];
    const divisor=rows[col][col];
    if (Math.abs(divisor)<1e-10) return null;
    for (let k=col;k<9;k++) rows[col][k]/=divisor;
    for (let r=0;r<8;r++) if (r!==col) {
      const factor=rows[r][col];
      for (let k=col;k<9;k++) rows[r][k]-=factor*rows[col][k];
    }
  }
  return rows.map(row=>row[8]);
}
export function validQuad(points) {
  if (!Array.isArray(points) || points.length!==4 || points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y))) return false;
  return points.every((a,i)=> {
    const b=points[(i+1)%4],c=points[(i+2)%4];
    return (b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x)>4;
  });
}
export function transformQuad(points, scale=1, angle=0) {
  const center=points.reduce((c,p)=>({x:c.x+p.x/4,y:c.y+p.y/4}),{x:0,y:0});
  const cos=Math.cos(angle),sin=Math.sin(angle);
  return points.map(p=>({x:center.x+scale*((p.x-center.x)*cos-(p.y-center.y)*sin),y:center.y+scale*((p.x-center.x)*sin+(p.y-center.y)*cos)}));
}
export function zoomAt(view, anchor, factor, min=.02, max=32) {
  const scale=Math.max(min,Math.min(max,view.scale*factor));
  const ratio=scale/view.scale;
  return {scale,x:anchor.x-(anchor.x-view.x)*ratio,y:anchor.y-(anchor.y-view.y)*ratio};
}
