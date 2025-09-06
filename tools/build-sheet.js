const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const { glob } = require("glob");

const BASE=64;
const INPUT=path.join(process.cwd(),"assets","input");
const PUB=path.join(process.cwd(),"public");
const SHEET=path.join(PUB,"spritesheet.png");
const MAP=path.join(PUB,"sprites.json");

const order=["neutral","cry_rage","defeated","void","profit","homeless","mcd","stupid","chad"];
const kws={
  neutral:["neutral","base","default"],
  cry_rage:["cry","crying","rage","angry","tears"],
  defeated:["defeated","beanie","cig","tired","exhausted","avvilito","resa"],
  void:["void","black","abyss","nihil","tristezza","dark"],
  profit:["profit","green","pump","moon","win","victory"],
  homeless:["homeless","hobo","bum","barbone"],
  mcd:["mcd","fastfood","worker","job"],
  stupid:["stupid","dumb","idiot","stupido"],
  chad:["chad","sigma","giga","success"]
};

function detect(b){
  const low=b.toLowerCase();
  for(const s of order){ for(const k of kws[s]){ if(low.includes(k)) return s; } }
  return null;
}

(async ()=>{
  await fs.mkdir(PUB,{recursive:true});
  const files=await glob("assets/input/**/*.{png,jpg,jpeg}",{nocase:true});
  const picked=new Map();
  for(const f of files){
    const st=detect(path.basename(f)); if(st && !picked.has(st)) picked.set(st,f);
  }
  if(!picked.has("neutral")){
    console.log("No 'neutral' found — will build placeholders.");
  }
  const states=order.filter(s=>picked.has(s));
  const rows=states.length || order.length; // if none, placeholder all
  const composites=[];
  const mapping={ base:BASE, sheetWidth:BASE, sheetHeight:rows*BASE, rows:{} };

  let row=0;
  if(states.length){
    for(const st of states){
      const src=picked.get(st);
      const buf=await sharp(src).resize({width:BASE,height:BASE,fit:"contain",kernel:sharp.kernel.nearest,
        background:{r:0,g:0,b:0,alpha:0}}).png({palette:true}).toBuffer();
      composites.push({input:buf,left:0,top:row*BASE});
      mapping.rows[st]={row,frames:1,x:0,y:row*BASE,w:BASE,h:BASE,fps:6}; row++;
    }
  }else{
    // placeholders (color blocks)
    const colors=["#aaaaaa","#ff6666","#c0a080","#222222","#55ff99","#996633","#cc0000","#88aaff","#ffe066"];
    for(const [i,st] of order.entries()){
      const buf=await sharp({ create:{ width:BASE,height:BASE,channels:4, background: colors[i%colors.length] } }).png().toBuffer();
      composites.push({input:buf,left:0,top:i*BASE});
      mapping.rows[st]={row:i,frames:1,x:0,y:i*BASE,w:BASE,h:BASE,fps:6};
    }
    mapping.sheetHeight=order.length*BASE;
  }

  await sharp({create:{width:BASE,height:mapping.sheetHeight,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite(composites).png().toFile(SHEET);
  await fs.writeFile(MAP, JSON.stringify(mapping,null,2));
  console.log("✅ spritesheet.png + sprites.json built.");
})();
