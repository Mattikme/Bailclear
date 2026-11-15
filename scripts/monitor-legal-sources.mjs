import fs from "node:fs";
import crypto from "node:crypto";
const sources=JSON.parse(fs.readFileSync("legal-sources.json","utf8"));
const statePath="legal-monitor-state.json";
const state=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,"utf8")):{};
const next={...state};
const changes=[];
function normalize(html){
  return html.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<!--[\s\S]*?-->/g," ").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
}
for(const source of sources){
  try{
    const response=await fetch(source.url,{headers:{"user-agent":"BailClear-Legal-Monitor/1.0"},signal:AbortSignal.timeout(25000)});
    if(!response.ok) throw new Error("HTTP "+response.status);
    const body=await response.text();
    const digest=crypto.createHash("sha256").update(normalize(body)).digest("hex");
    const previous=state[source.id]?.sha256;
    if(previous && previous!==digest) changes.push({...source,kind:"changed",previous,current:digest});
    else if(!previous) changes.push({...source,kind:"baseline",current:digest});
    next[source.id]={sha256:digest,url:source.url};
  }catch(error){changes.push({...source,kind:"unavailable",error:String(error)});}
}
fs.writeFileSync(statePath,JSON.stringify(next,null,2)+"\n");
fs.writeFileSync("legal-monitor-changes.json",JSON.stringify(changes,null,2)+"\n");
console.log(JSON.stringify(changes,null,2));
