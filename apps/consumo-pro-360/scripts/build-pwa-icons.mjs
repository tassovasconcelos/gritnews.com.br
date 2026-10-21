import sharp from "sharp";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../public");
const source=await readFile(path.join(dir,"icon.svg"));

for(const size of [192,512]){
 const filename=path.join(dir,`icon-${size}.png`);
 await sharp(source).resize(size,size).png({compressionLevel:9}).toFile(filename);
 const info=await sharp(filename).metadata();
 if(info.format!=="png"||info.width!==size||info.height!==size)
   throw Error("Falha na geração do ícone "+size);
}
const maskable=path.join(dir,"icon-maskable-512.png");
await sharp(source).resize(400,400).extend({
 top:56,bottom:56,left:56,right:56,background:"#fff"
}).png({compressionLevel:9}).toFile(maskable);
const size=(await stat(maskable)).size;
if(size<500)throw Error("Ícone maskable inválido");
console.log("PWA: ícones PNG 192px, 512px e maskable gerados a partir do SVG existente.");
