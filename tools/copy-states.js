const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const INPUT = path.join(process.cwd(),"assets","input");
const OUT   = path.join(process.cwd(),"public","states");

const STATES = [
  "neutral","cry_rage","defeated","void","profit","homeless","mcd","stupid","chad"
];
const files = {};
for(const st of STATES){
  const cands = [
    st+".png", st+".jpg", st+".jpeg",
    ...({neutral:["neutral","base","default"], cry_rage:["cry","rage","tears","angry"],
         defeated:["defeated","grey","npc","avvilito","resa"], void:["void","dark","abyss","nihil"],
         profit:["profit","green","pump","moon","win"], homeless:["homeless","hobo","bum","barbone"],
         mcd:["mcd","fastfood","worker","job","mc"], stupid:["stupid","dumb","idiot","stupido"],
         chad:["chad","sigma","giga","success"]}[st]||[]).map(k=>k+".png")
  ];
  for(const fn of cands){
    const p = path.join(INPUT, fn);
    try{ await fs.access(p); files[st]=p; break; } catch{}
  }
}

await fs.mkdir(OUT,{recursive:true});
const available = [];
for(const st of STATES){
  if(!files[st]) continue;
  const src = files[st];
  const out = path.join(OUT, st+".png");
  // 256x256 "pixelated" (nearest) mantenendo l'immagine così com'è
  const buf = await sharp(src)
    .resize({ width: 256, height: 256, fit: "contain", kernel: sharp.kernel.nearest, background:{r:0,g:0,b:0,alpha:0} })
    .png()
    .toBuffer();
  await fs.writeFile(out, buf);
  available.push(st);
}
await fs.writeFile(path.join(OUT,"states.json"), JSON.stringify({available}, null, 2));
console.log("Available states:", available.join(", "));
