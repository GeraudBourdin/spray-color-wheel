import * as THREE from './vendor/three/three.module.min.js';
import { FontLoader } from './vendor/three/FontLoader.js';
import { TextGeometry } from './vendor/three/TextGeometry.js';

// Loaded only when the preview is opened. Render on demand, without an animation loop.
export function createGraffitiScene(canvas) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor('#ebece8');
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-200,200,150,-150,1,5000);
  camera.position.set(0,0,1500);
  const front = new THREE.MeshStandardMaterial({color:'#dd763e',roughness:.85});
  const sides = new THREE.MeshStandardMaterial({color:'#58487e',roughness:.85});
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(),[front,sides]);
  scene.add(mesh, new THREE.HemisphereLight(0xffffff,0x686868,1.5));
  const light = new THREE.DirectionalLight(0xffffff,3);
  scene.add(light);
  let settings, generation = 0, geometryKey = '', disposed = false;
  const fonts = new Map();
  let fillKey='';
  function updateFace() {
    const gradient=settings.fill==='gradient';
    if(front.vertexColors!==gradient){front.vertexColors=gradient;front.needsUpdate=true;}
    front.color.set(gradient?'#ffffff':settings.face);
    const positions=mesh.geometry.getAttribute('position');
    if(!gradient || !positions)return;
    const key=JSON.stringify([geometryKey,settings.face,settings.gradientEnd,settings.gradientAngle]);
    if(key===fillKey)return;
    // A single local-space projection keeps the gradient continuous across letters
    // and attached to the lettering when the mesh rotates. Sides use another material.
    const angle=THREE.MathUtils.degToRad(settings.gradientAngle);
    const dx=Math.cos(angle),dy=-Math.sin(angle);
    let min=Infinity,max=-Infinity;
    for(let i=0;i<positions.count;i++){
      const projection=positions.getX(i)*dx+positions.getY(i)*dy;
      min=Math.min(min,projection);max=Math.max(max,projection);
    }
    const start=new THREE.Color(settings.face),end=new THREE.Color(settings.gradientEnd);
    const color=new THREE.Color(),colors=new Float32Array(positions.count*3);
    for(let i=0;i<positions.count;i++){
      const projection=positions.getX(i)*dx+positions.getY(i)*dy;
      color.copy(start).lerp(end,(projection-min)/Math.max(max-min,1e-6));
      color.toArray(colors,i*3);
    }
    mesh.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    fillKey=key;
  }
  function loadFont(id) {
    if (!fonts.has(id)) {
      const promise = new FontLoader().loadAsync(`./assets/fonts/${id}/typeface.json`);
      fonts.set(id,promise);
      promise.catch(()=>fonts.delete(id));
    }
    return fonts.get(id);
  }
  function render() {
    if (!settings || disposed || !canvas.clientWidth || !canvas.clientHeight) return;
    const width=canvas.clientWidth, height=canvas.clientHeight;
    renderer.setSize(width,height,false);
    mesh.rotation.set(THREE.MathUtils.degToRad(settings.tilt),THREE.MathUtils.degToRad(settings.turn),0);
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.isEmpty() ? new THREE.Vector3(250,150,0) : box.getSize(new THREE.Vector3());
    const aspect=width/height, span=Math.max(size.y, size.x/aspect, 110)*1.35;
    camera.left=-span*aspect/2; camera.right=span*aspect/2;
    camera.top=span/2; camera.bottom=-span/2; camera.updateProjectionMatrix();
    updateFace(); sides.color.set(settings.side);
    const az=THREE.MathUtils.degToRad(settings.lightAngle), el=THREE.MathUtils.degToRad(settings.lightHeight);
    light.position.set(Math.sin(az)*Math.cos(el)*500,Math.sin(el)*500,Math.cos(az)*Math.cos(el)*500);
    light.intensity=settings.intensity;
    renderer.render(scene,camera);
  }
  async function update(next) {
    settings={...next};
    const request=++generation;
    const key=JSON.stringify([next.text,next.font,next.depth]);
    if (key!==geometryKey) {
      const font=await loadFont(next.font);
      if (request!==generation || disposed) return false;
      // Unknown glyphs use the font's question mark; never silently drop input.
      const supported=Array.from(next.text).every(c=>font.data.glyphs[c]);
      const geometry=next.text.trim() ? new TextGeometry(next.text, {
        font,size:100,depth:next.depth,curveSegments:6,bevelEnabled:false,
      }) : new THREE.BufferGeometry();
      if (geometry.getAttribute('position')?.count) geometry.center();
      mesh.geometry.dispose(); mesh.geometry=geometry; geometryKey=key;fillKey='';
      mesh.visible=Boolean(next.text.trim());
      canvas.dataset.font=next.font;
      canvas.dataset.text=next.text;
      canvas.dataset.supported=String(supported);
    }
    render();
    return true;
  }
  const observer=new ResizeObserver(render); observer.observe(canvas);
  return {update,resize:render,dispose(){disposed=true;++generation;observer.disconnect();mesh.geometry.dispose();front.dispose();sides.dispose();renderer.dispose();}};
}
