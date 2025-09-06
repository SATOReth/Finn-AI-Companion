const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const ROOT = process.cwd();
const INPUT_DIR = path.join(ROOT, "assets", "input");
const DEFAULT   = path.join(INPUT_DIR, "ritratto.jpg");
const OUT_BASE  = path.join(ROOT, "public", "base.png");

(async()=>{
  let src = null;
  try{ await fs.access(DEFAULT); src = DEFAULT; }catch{}
  if(!src){
    const files = (await fs.readdir(INPUT_DIR).catch(()=>[])).filter(f=>/\.(png|jpg|jpeg)$/i.test(f));
    if(files.length) src = path.join(INPUT_DIR, files[0]);
  }
  if(!src){ console.error("NO_INPUT"); process.exit(2); }

  const m = await sharp(src).metadata();
  const side = Math.min(m.width,m.height);
  const left = Math.floor((m.width - side)/2), top = Math.floor((m.height - side)/2);

  await sharp(src)
    .extract({left,top,width:side,height:side})
    .resize(1024,1024,{kernel:sharp.kernel.nearest})
    .png()
    .toFile(OUT_BASE);

  console.log("OK base.png");
})().catch(e=>{ console.error("ERR",e); process.exit(1); });
