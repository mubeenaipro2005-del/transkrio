const C=require('../core.js'),assert=require('assert');
let pass=0;const T=async(n,f)=>{try{await f();pass++;console.log('PASS',n)}catch(e){console.log('FAIL',n,'\n',e.message);process.exitCode=1}};
const SR=16000;
(async()=>{
await T('ts: rounding never yields 60.000 seconds',()=>{
  assert.equal(C.ts(59.9996,','),'00:01:00,000');assert.equal(C.ts(3661.5,'.'),'01:01:01.500');assert.equal(C.ts(0,','),'00:00:00,000');assert.equal(C.ts(-5,','),'00:00:00,000')});
await T('subs: SRT and VTT format',()=>{
  const s=[{t:'سلام',s:0,e:1.5},{t:'hello',s:1.5,e:3}];
  assert.equal(C.subs(s,false),'1\n00:00:00,000 --> 00:00:01,500\nسلام\n\n2\n00:00:01,500 --> 00:00:03,000\nhello\n');
  assert(C.subs(s,true).startsWith('WEBVTT\n\n00:00:00.000 --> 00:00:01.500'))});
await T('plan: 12 min audio cut at the silent gap, windows cover everything contiguously',()=>{
  const a=new Float32Array(12*60*SR).fill(0.2);
  for(let i=Math.round(299.5*SR);i<Math.round(300.5*SR);i++)a[i]=0; // silence near 300s
  const w=C.plan(a);assert(w.length>=3);assert.equal(w[0][0],0);assert.equal(w.at(-1)[1],a.length);
  for(let i=1;i<w.length;i++)assert.equal(w[i][0],w[i-1][1]);
  assert(Math.abs(w[0][1]/SR-300)<1,'cut near the silence, got '+w[0][1]/SR)});
await T('plan: short audio = 1 window; tiny tail merged',()=>{
  assert.equal(C.plan(new Float32Array(60*SR)).length,1);
  const w=C.plan(new Float32Array(305*SR).fill(.1));assert.equal(w.length,1)});
await T('normalize: quiet audio boosted, loud untouched, silence safe',()=>{
  const q=new Float32Array([0.01,-0.02]);C.normalize(q);assert(Math.abs(q[1])>0.15);
  const l=new Float32Array([0.9,-0.8]);C.normalize(l);assert.equal(l[0],Float32Array.of(0.9)[0]);
  assert.doesNotThrow(()=>C.normalize(new Float32Array(10)))});
await T('clean: offsets, null end, empty/punctuation-only dropped, loops removed',()=>{
  const r=C.clean([{text:' سلام ',timestamp:[1,2]},{text:'...',timestamp:[2,3]},{text:'آخر',timestamp:[3,null]}],'',100,130,[]);
  assert.deepEqual(r,[{t:'سلام',s:101,e:102},{t:'آخر',s:103,e:130}]);
  const loop=Array.from({length:6},(_,i)=>({text:'شکریہ',timestamp:[i,i+1]}));
  assert.equal(C.clean(loop,'',0,10,[]).length,2);
  assert.equal(C.clean([{text:'شکریہ',timestamp:[0,1]}],'',0,1,[{t:'شکریہ'},{t:'شکریہ'}]).length,0,'loop across windows');
  assert.equal(C.clean([],'پورا متن',0,5,[])[0].t,'پورا متن')});

// fake transport
function mkTp(opts={}){
  const log=[];let loaded=false,ok=0;
  return{log,
    async ensure(){if(!loaded){log.push('load');if(opts.loadFail&&opts.loadFail--)throw new Error('net');loaded=true}},
    async run(pcm,o,tick){const id=ok;log.push('run'+id+':'+pcm.length);
      if(opts.failAt&&opts.failAt[id]>0){opts.failAt[id]--;throw new Error('boom')}
      if(opts.hang&&id===opts.hang.at){await opts.hang.p}
      tick(1);ok++;return{chunks:[{text:'متن'+id,timestamp:[0,1]}],text:''}},
    async reset(){log.push('reset');loaded=false}};
}
const audio=()=>{const a=new Float32Array(15*60*SR).fill(.3);return a};
await T('runJob: full run, segments in order with correct global times',async()=>{
  const j=C.newJob(audio(),{}),tp=mkTp();const r=await C.runJob(j,tp);
  assert.equal(r,'done');assert.equal(j.k,j.wins.length);assert.equal(j.segs.length,j.wins.length);
  assert.equal(j.segs[1].s,j.wins[1][0]/SR);assert.equal(tp.log.filter(x=>x==='load').length,1)});
await T('runJob: transient error retried automatically, no window skipped/duplicated',async()=>{
  const j=C.newJob(audio(),{}),tp=mkTp({failAt:{1:1}});let retries=0;
  await C.runJob(j,tp,{retry:()=>retries++});
  assert.equal(retries,1);assert.equal(j.state,'done');assert.deepEqual(j.segs.map(s=>s.t).filter(t=>t.startsWith('متن')).length,j.wins.length)});
await T('runJob: permanent error -> throws, completed windows kept; resume continues WITHOUT redoing them',async()=>{
  const j=C.newJob(audio(),{}),n=j.wins.length,tp=mkTp({failAt:{1:99}});
  await assert.rejects(()=>C.runJob(j,tp),/boom/);
  assert.equal(j.state,'error');assert.equal(j.k,1);assert.equal(j.segs.length,1);
  const tp2=mkTp();await C.runJob(j,tp2);
  assert.equal(j.state,'done');assert.equal(j.segs.length,n);
  assert.equal(tp2.log.filter(x=>x.startsWith('run')).length,n-1,'only remaining windows processed')});
await T('runJob: model load failure retried then reported',async()=>{
  const j=C.newJob(new Float32Array(30*SR).fill(.2),{});await C.runJob(j,mkTp({loadFail:1}));assert.equal(j.state,'done');
  const j2=C.newJob(new Float32Array(30*SR).fill(.2),{});await assert.rejects(()=>C.runJob(j2,mkTp({loadFail:9})),/net/)});
await T('pause mid-run keeps finished windows; resume finishes; stale loop cannot corrupt state',async()=>{
  let rel;const p=new Promise(r=>rel=r);
  const j=C.newJob(audio(),{}),n=j.wins.length,tp=mkTp({hang:{at:1,p}});
  const first=C.runJob(j,tp);
  await new Promise(r=>setTimeout(r,20));assert.equal(j.k,1);
  C.pause(j,tp);rel();                       // cancel while window 1 is in flight
  assert.equal(await first,'paused');assert.equal(j.k,1);assert.equal(j.segs.length,1);
  const tp2=mkTp();assert.equal(await C.runJob(j,tp2),'done');assert.equal(j.segs.length,n);
  for(let q=1;q<j.segs.length;q++)assert(j.segs[q].s>j.segs[q-1].s,'ordered, no duplicates');
});
console.log(pass+' passed');
})();
