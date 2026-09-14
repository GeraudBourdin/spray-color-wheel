// Run after npm install to refresh the locally served Three.js modules and font assets.
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
const root = new URL('../', import.meta.url);
const destination = new URL('vendor/three/', root);
await mkdir(destination, {recursive:true});
for (const file of ['three.module.min.js','three.core.min.js']) {
  await copyFile(new URL(`node_modules/three/build/${file}`, root),new URL(file,destination));
}
for (const [folder,file] of [['loaders','FontLoader.js'],['geometries','TextGeometry.js']]) {
  const code = await readFile(new URL(`node_modules/three/examples/jsm/${folder}/${file}`,root),'utf8');
  await writeFile(new URL(file,destination),code.replaceAll("from 'three'", "from './three.module.min.js'"));
}
await copyFile(new URL('node_modules/three/LICENSE',root),new URL('LICENSE',destination));
const fonts = [
  ['knewave','Knewave-Regular.ttf'],
  ['sedgwickavedisplay','SedgwickAveDisplay-Regular.ttf'],
  ['lacquer','Lacquer-Regular.ttf'],
];
for (const [id,file] of fonts) {
  const dir = new URL(`assets/fonts/${id}/`, root);
  await mkdir(dir,{recursive:true});
  for (const name of [file,'OFL.txt']) {
    const response = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${id}/${name}`);
    if (!response.ok) throw new Error(`${id}/${name}: ${response.status}`);
    await writeFile(new URL(name,dir),Buffer.from(await response.arrayBuffer()));
  }
  const bytes = await readFile(new URL(file,dir));
  const font = new TTFLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
  await writeFile(new URL('typeface.json',dir),JSON.stringify(font));
}
console.log('Updated local Three.js modules, three fonts and their licenses.');
