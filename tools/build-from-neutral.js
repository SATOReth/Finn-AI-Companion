const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const BASE=64;
const INPUT=path.join(process.cwd(),"assets","input","neutral.png");
const PUB=path.join(process.cwd(),"public");
const SHEET=path.join(PUB,"spritesheet.png");
const MAP=path.join(PUB,"sprites.json");

const STATES=["neutral","cry_rage","defeated","void","profit","homeless","mcd","stupid","chad"];

// carica e porta a 64x64 (nearest) SENZA alterare il disegno
async function loadNeutral64(){
  const buf = await sharp(INPUT)
    .resize({ width: BASE, height: BASE, fit: "contain", kernel: sharp.kernel.nearest, background:{r:0,g:0,b:0,alpha:0} })
    .png()
    .toBuffer();
  return buf;
}

// genera un PNG 64x64 da una lista di "pixel" (array {x,y,fill})
async function overlayPixels(baseBuf, pixels=[], alphaRect=[]){
  // svg con pixel singoli (shape-rendering:crispEdges)
  let svg = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">`;
  for(const r of alphaRect){ svg += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}" />`; }
  for(const p of pixels){ svg += `<rect x="${p.x}" y="${p.y}" width="1" height="1" fill="${p.fill}" />`; }
  svg += `</svg>`;
  const ov = Buffer.from(svg);
  return await sharp(baseBuf).composite([{ input: ov, left: 0, top: 0 }]).png().toBuffer();
}

// funzioni overlay “a coordinate” tarate per un volto centrato a 64px (come il tuo esempio)
function makeCryRage(){ // lacrime + sopracciglia inclinate + bocca aperta
  const px=[]; const rect=[];
  // tears (linee verticali vicino agli occhi)
  for(let y=32;y<44;y++){ if(y%2===0) px.push({x:26,y,fill:"#82cfff"}); if(y%2===1) px.push({x:38,y,fill:"#82cfff"}); }
  // angry brows (sinistra leggermente su, destra leggermente giù)
  for(let i=0;i<6;i++){ px.push({x:24+i,y:27,fill:"#000"}); }
  for(let i=0;i<6;i++){ px.push({x:34+i,y:29,fill:"#000"}); }
  // mouth open
  for(let y=39;y<43;y++){ for(let x=30;x<38;x++){ px.push({x,y,fill:"#000"}); } }
  return {px,rect};
}

function makeDefeated(){ // beanie + occhiaie + sigaretta + fumo
  const px=[]; const rect=[];
  rect.push({x:16,y:18,w:32,h:6,fill:"#2b2b2b"}); // beanie
  rect.push({x:16,y:24,w:32,h:1,fill:"#151515"}); // bordo beanie
  for(let i=0;i<4;i++){ px.push({x:26+i,y:33,fill:"#b97aaa"}); px.push({x:34+i,y:33,fill:"#b97aaa"}); } // eyebags
  for(let i=0;i<6;i++){ px.push({x:38+i,y:42,fill:"#d8d8d8"}); } // sigaretta
  px.push({x:44,y:42,fill:"#ff6b6b"});
  px.push({x:48,y:39,fill:"#cfcfcf"}); px.push({x:49,y:38,fill:"#cfcfcf"}); px.push({x:50,y:37,fill:"#cfcfcf"}); // fumo
  return {px,rect};
}

function makeVoid(){ // occhi neri + bg scuro (non tocco il tuo disegno)
  const px=[]; const rect=[];
  rect.push({x:0,y:0,w:64,h:64,fill:"#000"}); // ricoloriamo lo sfondo a nero
  for(let y=30;y<36;y++){ for(let x=25;x<31;x++){ px.push({x,y,fill:"#000"}); } for(let x=33;x<39;x++){ px.push({x,y,fill:"#000"}); } }
  return {px,rect};
}

function makeProfit(){ // tint verde + griglia
  const px=[]; const rect=[];
  rect.push({x:0,y:0,w:64,h:64,fill:"#042b12"}); // sfondo verde scuro
  // leggera “aurora” verde sopra tutto per dare skin verdina ma senza stravolgere outline
  rect.push({x:0,y:0,w:64,h:64,fill:"rgba(46,204,64,0.28)"});
  // grid
  let g=8; for(let x=0;x<64;x+=g){ rect.push({x,y:0,w:1,h:64,fill:"#0d5e2a"}) }
  for(let y=0;y<64;y+=g){ rect.push({x:0,y,w:64,h:1,fill:"#0d5e2a"}) }
  return {px,rect};
}

function makeHomeless(){ // barba + occhiaie
  const px=[]; const rect=[];
  for(let i=0;i<4;i++){ px.push({x:26+i,y:33,fill:"#b97aaa"}); px.push({x:34+i,y:33,fill:"#b97aaa"}); }
  for(let y=44;y<58;y++){ for(let x=24;x<40;x++){ if((x+y)%3===0) px.push({x,y,fill:"#3a3a3a"}); } } // barba sporca
  return {px,rect};
}

function makeMcd(){ // cappellino rosso + visiera
  const px=[]; const rect=[];
  rect.push({x:20,y:18,w:24,h:6,fill:"#cc1e1e"});
  rect.push({x:14,y:22,w:16,h:2,fill:"#cc1e1e"});
  return {px,rect};
}

function makeStupid(){ // bocca derp + bavetta
  const px=[]; const rect=[];
  for(let y=39;y<43;y++){ for(let x=28;x<40;x++){ if(y===39||y===42||x===28||x===39) px.push({x,y,fill:"#000"}); } }
  px.push({x:37,y:41,fill:"#7ec8ff"});
  return {px,rect};
}

function makeChad(){ // mascella + ciuffo giallo
  const px=[]; const rect=[];
  for(let x=38;x<48;x++){ px.push({x,y:46,fill:"#000"}); }
  for(let y=40;y<46;y++){ px.push({x:47,y,fill:"#000"}); }
  // wedge capelli
  for(let y=18;y<24;y++){ for(let x=42;x<56;x++){ if(x-y>22) px.push({x,y,fill:"#ffd166"}); } }
  return {px,rect};
}

const OVERLAYS = {
  neutral: ()=>({px:[],rect:[]}),
  cry_rage: makeCryRage,
  defeated: makeDefeated,
  void: makeVoid,
  profit: makeProfit,
  homeless: makeHomeless,
  mcd: makeMcd,
  stupid: makeStupid,
  chad: makeChad
};

(async()=>{
  await fs.mkdir(PUB,{recursive:true});
  const base = await loadNeutral64();

  const cols=3, rows=STATES.length;
  const sheetW = BASE*cols, sheetH = BASE*rows;
  const composites=[];
  const mapping = { base:BASE, sheetWidth:sheetW, sheetHeight:sheetH, rows:{} };

  for(let r=0; r<STATES.length; r++){
    const st = STATES[r];
    const {px,rect} = OVERLAYS[st]();
    // frame0
    const f0 = await overlayPixels(base, px, rect);
    // frame1 jitter -1
    const f1 = await sharp(f0).extend({ top:1, background:{r:0,g:0,b:0,alpha:0} }).extract({ left:0, top:0, width:BASE, height:BASE }).png().toBuffer();
    // frame2 jitter +1
    const f2 = await sharp(f0).extend({ bottom:1, background:{r:0,g:0,b:0,alpha:0} }).extract({ left:0, top:1, width:BASE, height:BASE }).png().toBuffer();

    composites.push({ input:f0, left:0*BASE, top:r*BASE });
    composites.push({ input:f1, left:1*BASE, top:r*BASE });
    composites.push({ input:f2, left:2*BASE, top:r*BASE });

    mapping.rows[st] = { row:r, frames:3, x:0, y:r*BASE, w:BASE, h:BASE, fps:8 };
  }

  await sharp({ create:{ width:sheetW, height:sheetH, channels:4, background:{r:0,g:0,b:0,alpha:0} } })
    .composite(composites).png().toFile(SHEET);
  await fs.writeFile(MAP, JSON.stringify(mapping,null,2));
  console.log("✅ Built spritesheet from NEUTRAL base with overlays:", STATES.join(", "));
})();
