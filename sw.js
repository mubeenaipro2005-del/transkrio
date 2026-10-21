const C='bl-v3',R='bl-runtime-v1',A=['./','index.html','style.css','core.js','app.js','docx.js','worker.js','icon.svg','icon-192.png','icon-512.png','manifest.webmanifest'];
self.oninstall=e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(A)))};
self.onactivate=e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==C&&k!==R)await caches.delete(k);
  await self.clients.claim();
})());
self.onfetch=e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    // App shell: network first (so updates arrive), cache fallback (offline).
    e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r,{ignoreSearch:true})));
  }else if(u.hostname==='cdn.jsdelivr.net'){
    // Pinned library + wasm files: cache first, so the app works offline after the first run.
    e.respondWith(caches.open(R).then(async c=>{
      const hit=await c.match(r);if(hit)return hit;
      const res=await fetch(r);if(res.ok)c.put(r,res.clone());return res;
    }));
  }
};
