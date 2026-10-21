// Core logic, free of DOM/Worker so it can be unit-tested in Node.
(function(g){
const SR=16000;

// ---- audio helpers ----
function peak(a){let p=0;for(let i=0;i<a.length;i++){const v=a[i]<0?-a[i]:a[i];if(v>p)p=v}return p}
// Quiet recordings: raise gain (max x8) so speech is not lost in noise floor.
function normalize(a){const p=peak(a);if(p>0&&p<0.5){const k=Math.min(8,0.9/p);for(let i=0;i<a.length;i++)a[i]*=k}return p}

// Lowest-energy 50 ms frame inside [from,to): a safe place to cut between words.
function quietPoint(a,from,to,fr=800){
  from=Math.max(0,from|0);to=Math.min(a.length,to|0);
  let best=-1,bi=to;
  for(let s=from;s+fr<=to;s+=fr){let e=0;for(let i=s;i<s+fr;i++)e+=a[i]*a[i];if(best<0||e<best){best=e;bi=s+(fr>>1)}}
  return bi;
}
// Split into windows (default 5 min) cut at quiet points; tiny tail merged.
function plan(a,winSec=300){
  const W=winSec*SR,wins=[];let s=0;
  while(s<a.length){
    let e=Math.min(a.length,s+W);
    if(e<a.length){e=quietPoint(a,e-3*SR,e+3*SR);if(e<=s)e=Math.min(a.length,s+W)}
    if(a.length-e<10*SR)e=a.length;
    wins.push([s,e]);s=e;
  }
  return wins;
}

// ---- segments ----
const WORD=/[\p{L}\p{N}]/u;
// Normalise worker output; shift timestamps by window offset; drop empties and
// Whisper's repetition-loop hallucinations (same text > 2 times in a row).
function clean(chunks,text,off,end,prev){
  let list=(chunks||[]).map(c=>{
    const ts=c.timestamp||[0,null],s=(ts[0]||0)+off;
    let e=ts[1]==null?end:ts[1]+off;if(e<s)e=s;
    return{t:String(c.text||'').trim(),s,e};
  });
  if(!list.length&&text&&String(text).trim())list=[{t:String(text).trim(),s:off,e:end}];
  const out=[],ctx=(prev||[]).slice(-2).map(x=>x.t);
  for(const x of list){
    if(!x.t||!WORD.test(x.t))continue;
    const hist=ctx.concat(out.slice(-2).map(y=>y.t));
    if(hist.length>=2&&hist.slice(-2).every(h=>h===x.t))continue;
    out.push(x);
  }
  return out;
}

// ---- subtitles ----
function ts(sec,sep){
  let ms=Math.round(Math.max(0,sec||0)*1000);
  const h=Math.floor(ms/3600000);ms-=h*3600000;
  const m=Math.floor(ms/60000);ms-=m*60000;
  const s=Math.floor(ms/1000);ms-=s*1000;
  const p=(n,w)=>String(n).padStart(w,'0');
  return p(h,2)+':'+p(m,2)+':'+p(s,2)+sep+p(ms,3);
}
function subs(segs,vtt){
  const sep=vtt?'.':',';
  return(vtt?'WEBVTT\n\n':'')+segs.map((x,i)=>(vtt?'':(i+1)+'\n')+ts(x.s,sep)+' --> '+ts(Math.max(x.e,x.s+0.001),sep)+'\n'+x.t+'\n').join('\n');
}
function fmtDur(s){s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60;
  return(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(r).padStart(2,'0')}

// ---- resumable job ----
// tp: {ensure(job), run(pcm,opts,onTick)->{chunks,text}, reset()}  h: {win,tick,retry}
function newJob(audio,opts){
  return{audio,opts,wins:plan(audio),k:0,segs:[],state:'idle',run:0,error:null};
}
async function runJob(j,tp,h={}){
  const my=++j.run;j.state='run';j.error=null;
  const alive=()=>j.state==='run'&&j.run===my;
  try{
    while(j.k<j.wins.length){
      if(!alive())return'paused';
      const[a,b]=j.wins[j.k];let att=0;
      for(;;){
        try{
          await tp.ensure(j);if(!alive())return'paused';
          const piece=j.audio.slice(a,b);
          const r=await tp.run(piece,j.opts,t=>{if(alive()&&h.tick)h.tick(j.k,t)});
          if(!alive())return'paused';
          j.segs.push(...clean(r.chunks,r.text,a/SR,b/SR,j.segs));
          j.k++;if(h.win)h.win(j);break;
        }catch(e){
          if(!alive())return'paused';
          if(++att>2)throw e;
          if(h.retry)h.retry(e,att);
          await tp.reset();
        }
      }
    }
    if(!alive())return'paused';
    j.state='done';return'done';
  }catch(e){if(j.run===my&&j.state==='run')j.state='error';j.error=e;throw e}
}
function pause(j,tp){if(j.state==='run'){j.state='paused';j.run++;}if(tp)tp.reset()}

const api={SR,peak,normalize,quietPoint,plan,clean,ts,subs,fmtDur,newJob,runJob,pause};
if(typeof module!=='undefined')module.exports=api;else g.Core=api;
})(typeof self!=='undefined'?self:globalThis);
