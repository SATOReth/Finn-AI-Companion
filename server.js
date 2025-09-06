const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
app.use(express.json());
app.use((req,res,next)=>{res.set("Cache-Control","no-store");next();});
app.use(express.static(path.join(__dirname,"public")));

// health semplice
app.get("/health", (req,res)=>{
  const f = path.join(__dirname,"public","companion","face.png");
  res.json({ ok: fs.existsSync(f) });
});

// chat: prova Ollama, altrimenti fallback
app.post("/api/chat", async (req,res)=>{
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const sys = { role:"system", content:"You are FINN. Friendly, concise, English. Avoid harmful/illegal content." };
  try{
    const url = "http://localhost:11434/api/chat";
    const body = { model:"qwen2:7b-instruct", stream:false, messages:[sys, ...messages] };
    const r = await (global.fetch ? fetch(url,{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
                                  : (await import('node-fetch')).default(url,{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
    if(!r.ok) throw new Error("Ollama HTTP "+r.status);
    const j = await r.json();
    return res.json({ text: j?.message?.content ?? "..." });
  }catch(e){
    const last = messages[messages.length-1]?.content || "";
    return res.json({ text:`I'm FINN. My model is warming up. You said: "${last}".`, fallback:true });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("✅ FINN at http://localhost:"+PORT));
