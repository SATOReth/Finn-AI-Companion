const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const { glob } = require("glob");

const BASE = 64; // pixel art frame
const INPUT = path.join(process.cwd(), "assets", "input");
const PUB = path.join(process.cwd(), "public");
const SHEET = path.join(PUB, "spritesheet.png");
const MAP = path.join(PUB, "sprites.json");

// Order of states (rows)
const stateOrder = ["neutral","cry_rage","defeated","void","profit","homeless","mcd","stupid","chad"];
const keywords = {
  neutral:  ["neutral","base","default"],
  cry_rage: ["cry","crying","tears","rage","angry"],
  defeated: ["defeated","beanie","cig","cigarette","tired","exhausted","depressed","avvilito","resa"],
  void:     ["void","black","abyss","nihil","tristezza totale","total sadness","dark"],
  profit:   ["profit","green","pump","moon","victory","win"],
  homeless: ["homeless","hobo","bum","barbone","senza nulla"],
  mcd:      ["mcd","fastfood","worker","job","mc"],
  stupid:   ["stupid","dumb","idiot","stupido"],
  chad:     ["chad","giga","sigma","success","best"]
};

function detectState(basename){
  const low = basename.toLowerCase();
  // prefer exact filename root like "neutral.png"
  const root = low.replace(/\.[a-z0-9]+$/,"");
  if (stateOrder.includes(root)) return root;
  for(const st of stateOrder){
    for(const k of keywords[st]){
      if(low.includes(k)) return st;
    }
  }
  return null;
}

(async function main(){
  await fs.mkdir(PUB, { recursive: true });

  const files = await glob("assets/input/**/*.{png,jpg,jpeg}", { nocase: true });
  if(files.length === 0){
    console.log("No input images in assets/input. Put your 9 files and rerun.");
    process.exit(0);
  }

  // pick best match per state (first that matches)
  const byState = new Map();
  for(const f of files){
    const st = detectState(path.basename(f));
    if(st && !byState.has(st)) byState.set(st, f);
  }

  // Must have at least 'neutral'
  if(!byState.has("neutral")){
    console.error("Missing 'neutral' image. Name one file like neutral.png or include keyword 'neutral'.");
    process.exit(1);
  }

  // Prepare rows for states present (keep order)
  const states = stateOrder.filter(s => byState.has(s));
  const rows = states.length;
  const sheetW = BASE, sheetH = rows * BASE;

  const composites = [];
  const mapping = { base: BASE, sheetWidth: sheetW, sheetHeight: sheetH, rows: {} };

  let row = 0;
  for(const st of states){
    const src = byState.get(st);
    // pixel-art: contain into 64x64, nearest kernel, quantized palette
    const buf = await sharp(src)
      .resize({ width: BASE, height: BASE, fit: "contain", kernel: sharp.kernel.nearest,
                background: { r:0,g:0,b:0,alpha:0 } })
      .png({ palette: true, compressionLevel: 9 })
      .toBuffer();

    composites.push({ input: buf, left: 0, top: row*BASE });
    mapping.rows[st] = { row, frames: 1, x: 0, y: row*BASE, w: BASE, h: BASE, fps: 6 };
    row++;
  }

  // compose final sheet
  await sharp({ create: { width: sheetW, height: sheetH, channels: 4, background: { r:0,g:0,b:0,alpha:0 } } })
    .composite(composites)
    .png()
    .toFile(SHEET);

  await fs.writeFile(MAP, JSON.stringify(mapping, null, 2));
  console.log("✅ spritesheet.png + sprites.json ready. States:", states.join(", "));
})();
