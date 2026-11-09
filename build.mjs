import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const file of ['index.html','style.css','app.js','core.js','data.js','sw.js','icon.svg','manifest.webmanifest','offline-assets.json','.nojekyll','asset-bundle.js','ATTRIBUTION.md'])await cp(file,`dist/${file}`,{recursive:true});
console.log('Static site ready in dist/');
