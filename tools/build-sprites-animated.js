const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const { glob } = require("glob");

const BASE=64;
const INPUT=path.join(process.cwd(),"assets","input");
const PUB=path.join(process.cwd(),"public");
const SHEET=path.join(PUB,"spritesheet.png");
const MAP=path.join(PUB,"sprites.json");

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
async function pixelFrame(buf, dx=0, dy=0){
  const base = await sharp(buf).resize({
    width:BASE, height:BASE, fit:"contain", kernel:sharp.kernel.nearest,
    background:{r:0,g:0,b:0,alpha:0}
  }).png({palette:true}).toBuffer();
  const canvas = sharp({ create:{ width:BASE, height:BASE, channels:4, background:{r:0,g:0,b:0,alpha:0} } });
  return canvas.composite([{ input: base, left: Math.max(-3,Math.min(3,dx)), top: Math.max(-3,Math.min(3,dy)) }]).png().toBuffer();
}

(async()=>{
  await fs.mkdir(PUB,{recursive:true});
  const files = await glob("assets/input/**/*.{png,jpg,jpeg}", { nocase:true });
  const pick=new Map();
  for(const f of files){
    const st=detect(path.basename(f));
    if(st && !pick.has(st)) pick.set(st,f);
  }
  const used = STATES.filter(s=>pick.has(s));
  if(used.length===0){
    console.log("⚠️ No images found in assets/input. Building placeholders.");
  } else {
    console.log("Building states:", used.join(", "));
  }

  const rows = used.length || STATES.length;
  const cols = 3;
  const W = BASE*cols, H = BASE*rows;
  const mapping={ base:BASE, sheetWidth:W, sheetHeight:H, rows:{} };
  const composites=[];
  let r=0;

  if(used.length){
    for(const st of used){
      const b = await fs.readFile(pick.get(st));
      const f0 = await pixelFrame(b, 0, 0);
      const f1 = await pixelFrame(b, 0, -1);
      const f2 = await pixelFrame(b, 0, 1);
      composites.push({input:f0,left:0*BASE,top:r*BASE});
      composites.push({input:f1,left:1*BASE,top:r*BASE});
      composites.push({input:f2,left:2*BASE,top:r*BASE});
      mapping.rows[st] = { row:r, frames:3, x:0, y:r*BASE, w:BASE, h:BASE, fps:8 };
      r++;
    }
  } else {
    // placeholders colorati con etichetta
    for(const [i,st] of STATES.entries()){
      const color = [200-10*i,200-5*i,200-20*i,255];
      const buf = await sharp({ create:{width:BASE,height:BASE,channels:4,background:color} }).png().toBuffer();
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
