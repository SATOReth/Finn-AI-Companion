const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const { glob } = require("glob");

const BASE=64;
const INPUT=path.join(process.cwd(),"assets","input");
const PUB=path.join(process.cwd(),"public");
const SHEET=path.join(PUB,"spritesheet.png");
const MAP=path.join(PUB,"sprites.json");

// ordine e parole-chiave
const STATES=["neutral","cry_rage","defeated","void","profit","homeless","mcd","stupid","chad"];
const KWS={
  neutral:["neutral","base","default"],
  cry_rage:["cry","crying","tears","rage","angry"],
  defeated:["defeated","beanie","cig","cigarette","tired","exhausted","avvilito","resa"],
  void:["void","black","abyss","nihil","tristezza","dark"],
  profit:["profit","green","pump","moon","win","victory"],
  homeless:["homeless","hobo","bum","barbone"],
  mcd:["mcd","fastfood","worker","job","mc"],
  stupid:["stupid","dumb","idiot","stupido"],
  chad:["chad","sigma","giga","success"]
};
function detect(b){
  const low=b.toLowerCase(); const root=low.replace(/\.[a-z0-9]+$/,"");
  if(STATES.includes(root)) return root;
  for(const s of STATES){ for(const k of KWS[s]){ if(low.includes(k)) return s; } }
  return null;
}

// disegna sfondo opaco + bordo su 64x64
async function putOnMatte(buf, dx=0, dy=0){
  const subject = await sharp(buf)
    .resize({ width:BASE, height:BASE, fit:"contain", kernel:sharp.kernel.nearest,
              background:{r:0,g:0,b:0,alpha:0} })
    .png()
    .toBuffer();

  const matte = sharp({
    create:{ width:BASE, height:BASE, channels:4, background: { r:24,g:28,b:38,alpha:255 } } // opaco scuro
  }).png();

  // bordo SVG (chiaro) per risalto
  const borderSvg = Buffer.from(
    `<svg width="${BASE}" height="${BASE}" viewBox="0 0 ${BASE} ${BASE}" xmlns="http://www.w3.org/2000/svg">
       <rect x="1" y="1" width="${BASE-2}" height="${BASE-2}" fill="none" stroke="#a1a6af" stroke-width="2" shape-rendering="crispEdges"/>
     </svg>`
  );

  // shift soggetto
  const dxCl = Math.max(-3, Math.min(3, dx));
  const dyCl = Math.max(-3, Math.min(3, dy));

  return matte
    .composite([{ input: subject, left: dxCl, top: dyCl }])
    .composite([{ input: borderSvg, left: 0, top: 0 }])
    .png({ palette:true })
    .toBuffer();
}

(async()=>{
  await fs.mkdir(PUB,{recursive:true});
  const files = await glob("assets/input/**/*.{png,jpg,jpeg}", { nocase:true });
  const pick = new Map();
  for(const f of files){
    const st = detect(path.basename(f));
    if(st && !pick.has(st)) pick.set(st,f);
  }

  const used = STATES.filter(s=>pick.has(s));
  console.log("Found states:", used.length? used.join(", ") : "(none, will build placeholders)");

  const rows = used.length || STATES.length;
  const cols = 3; // 3 frame jitter
  const W = BASE*cols, H = BASE*rows;
  const mapping={ base:BASE, sheetWidth:W, sheetHeight:H, rows:{} };
  const composites=[];
  let r=0;

  if(used.length){
    for(const st of used){
      const b = await fs.readFile(pick.get(st));
      const f0 = await putOnMatte(b, 0, 0);
      const f1 = await putOnMatte(b, 0, -1);
      const f2 = await putOnMatte(b, 0, 1);
      composites.push({input:f0,left:0*BASE,top:r*BASE});
      composites.push({input:f1,left:1*BASE,top:r*BASE});
      composites.push({input:f2,left:2*BASE,top:r*BASE});
      mapping.rows[st] = { row:r, frames:3, x:0, y:r*BASE, w:BASE, h:BASE, fps:8 };
      r++;
    }
  } else {
    // placeholder se non troviamo immagini
    for(const [i,st] of STATES.entries()){
      const buf = await sharp({ create:{width:BASE,height:BASE,channels:4,background:{r:80+10*i,g:80+6*i,b:100+4*i,alpha:255}} }).png().toBuffer();
      composites.push({input:buf,left:0*BASE,top:i*BASE});
      composites.push({input:buf,left:1*BASE,top:i*BASE});
      composites.push({input:buf,left:2*BASE,top:i*BASE});
      mapping.rows[st] = { row:i, frames:3, x:0, y:i*BASE, w:BASE, h:BASE, fps:8 };
    }
  }

  await sharp({create:{width:W,height:H,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite(composites).png().toFile(SHEET);
  await fs.writeFile(MAP, JSON.stringify(mapping,null,2));
  console.log("✅ spritesheet.png + sprites.json written.");
})();
