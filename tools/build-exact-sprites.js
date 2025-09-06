const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const { glob } = require("glob");

const BASE=64;
const INPUT_DIR=path.join(process.cwd(),"assets","input");
const PUB=path.join(process.cwd(),"public");
const SHEET=path.join(PUB,"spritesheet.png");
const MAP=path.join(PUB,"sprites.json");

// stati in ordine; keywords per match se il nome non è esatto
const STATES = [
  {key:"neutral",  kws:["neutral","base","default"]},
  {key:"cry_rage", kws:["cry","rage","tears","angry"]},
  {key:"defeated", kws:["defeated","npc","grey","avvilito","resa"]},
  {key:"void",     kws:["void","dark","abyss","nihil"]},
  {key:"profit",   kws:["profit","green","pump","moon","win"]},
  {key:"homeless", kws:["homeless","hobo","bum","barbone"]},
  {key:"mcd",      kws:["mcd","fastfood","worker","job","mc"]},
  {key:"stupid",   kws:["stupid","dumb","idiot","stupido"]},
  {key:"chad",     kws:["chad","sigma","giga","success"]},
];

function matchState(filename){
  const low = filename.toLowerCase();
  const root = low.replace(/\.[a-z0-9]+$/,"");
  for(const s of STATES){
    if(root===s.key) return s.key;
  }
  for(const s of STATES){
    if(s.kws.some(k=>low.includes(k))) return s.key;
  }
  return null;
}

(async()=>{
  await fs.mkdir(PUB,{recursive:true});
  const files = await glob("assets/input/**/*.{png,jpg,jpeg}",{nocase:true});
  const picked = new Map();
  for(const f of files){
    const st = matchState(path.basename(f));
    if(st && !picked.has(st)) picked.set(st,f);
  }
  const used = STATES.map(s=>s.key).filter(k=>picked.has(k));
  if(!used.length){
    console.error("No state images found in assets/input. Put e.g. neutral.png and rerun.");
    process.exit(1);
  }
  console.log("Using states:", used.join(", "));

  const cols=3, rows=used.length;
  const sheetW = BASE*cols, sheetH = BASE*rows;
  const composites=[];
  const mapping={ base:BASE, sheetWidth:sheetW, sheetHeight:sheetH, rows:{} };

  for(let r=0;r<used.length;r++){
    const st = used[r];
    const src = picked.get(st);
    // ridimensiona a 64x64 con nearest senza alterare i colori
    const base = await sharp(src).resize({width:BASE,height:BASE,fit:"contain",kernel:sharp.kernel.nearest,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
    // 3 frame (jitter verticale) per dare vita
    const f0 = base;
    const f1 = await sharp(base).extend({top:1,background:{r:0,g:0,b:0,alpha:0}}).extract({left:0,top:0,width:BASE,height:BASE}).png().toBuffer();
    const f2 = await sharp(base).extend({bottom:1,background:{r:0,g:0,b:0,alpha:0}}).extract({left:0,top:1,width:BASE,height:BASE}).png().toBuffer();

    composites.push({input:f0,left:0*BASE,top:r*BASE});
    composites.push({input:f1,left:1*BASE,top:r*BASE});
    composites.push({input:f2,left:2*BASE,top:r*BASE});

    mapping.rows[st] = { row:r, frames:3, x:0, y:r*BASE, w:BASE, h:BASE, fps:8 };
  }

  await sharp({create:{width:sheetW,height:sheetH,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite(composites).png().toFile(SHEET);
  await fs.writeFile(MAP, JSON.stringify(mapping,null,2));
  console.log("✅ spritesheet.png + sprites.json written.");
})();
