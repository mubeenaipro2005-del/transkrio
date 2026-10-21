const $=i=>document.getElementById(i);
const T={
ur:{title:'Bolo Likho',theme:'تھیم',th_onyx:'Onyx',th_graphite:'Graphite',th_gold:'Gold',th_silver:'Silver',th_snow:'Snow',drop:'آڈیو یا ویڈیو فائل منتخب کریں',lang:'آڈیو کی زبان',model:'ماڈل',ur:'اردو',en:'انگریزی',auto:'خودکار',go:'ٹرانسکرائب کریں',stop:'منسوخ کریں',vpara:'مسلسل متن',vlines:'حصہ وار',find:'تلاش',next:'اگلا',copy:'کاپی',clr:'متن حذف کریں',task:'کام',tx:'ٹرانسکرپشن',tr:'انگریزی ترجمہ',rec:'ریکارڈ کریں',recstop:'ریکارڈنگ روکیں',e5:'مائیک تک رسائی نہیں ملی۔ براؤزر میں اجازت دیں۔',lose:'ہاتھ سے کی گئی ترمیم ختم ہو جائے گی۔ جاری رکھیں؟',
dec:'آڈیو پڑھی جا رہی ہے…',dl:'ماڈل ڈاؤن لوڈ (صرف پہلی بار): ',run:'ٹرانسکرپشن جاری، حصہ ',done:'مکمل۔ آپ متن میں ترمیم کر سکتے ہیں۔',cancel:'منسوخ کر دیا گیا۔',copied:'کاپی ہو گیا۔',
e0:'فائل خالی ہے۔',e1:'فائل پڑھی نہیں جا سکی۔ فارمیٹ غیر معاون یا فائل خراب ہو سکتی ہے۔',e3:'ماڈل لوڈ نہیں ہو سکا۔ انٹرنیٹ چیک کریں؛ پہلی بار ماڈل ڈاؤن لوڈ لازمی ہے۔',e4:'خرابی: ',resume:'جاری رکھیں',reading:'فائل کی تصدیق اور آڈیو پڑھی جا رہی ہے…',valid:'فائل درست ہے۔ دورانیہ ',eta:'باقی ≈ ',e2:'آڈیو تقریباً خاموش ہے، کوئی آواز نہیں ملی۔',e6:'فائل بہت بڑی ہے یا فون کی میموری کم پڑ گئی۔ ویڈیو سے آڈیو الگ کرکے (چھوٹی فائل) دوبارہ دیں۔',e7:'میموری ختم ہو گئی۔ چھوٹا ماڈل (Base/Tiny) چنیں اور "جاری رکھیں" دبائیں۔',keep:' اب تک کا متن محفوظ ہے؛ "جاری رکھیں" دبائیں، فائل دوبارہ دینے کی ضرورت نہیں۔',keep0:' "جاری رکھیں" دبائیں، فائل دوبارہ دینے کی ضرورت نہیں۔',retry:'عارضی خرابی، خودکار دوبارہ کوشش…',e9:'یہ براؤزر معاون نہیں۔ تازہ Chrome یا Safari استعمال کریں۔',loadm:'ماڈل لوڈ ہو رہا ہے…',part:'حصہ '},
en:{title:'Bolo Likho',theme:'Theme',th_onyx:'Onyx',th_graphite:'Graphite',th_gold:'Gold',th_silver:'Silver',th_snow:'Snow',drop:'Choose an audio or video file',lang:'Audio language',model:'Model',ur:'Urdu',en:'English',auto:'Auto-detect',go:'Transcribe',stop:'Cancel',vpara:'Flowing text',vlines:'By segment',find:'Find',next:'Next',copy:'Copy',clr:'Delete text',task:'Task',tx:'Transcribe',tr:'Translate to English',rec:'Record',recstop:'Stop recording',e5:'Microphone access was denied. Allow it in the browser.',lose:'Your manual edits will be lost. Continue?',
dec:'Reading audio…',dl:'Downloading model (first time only): ',run:'Transcribing, chunk ',done:'Done. You can edit the text.',cancel:'Cancelled.',copied:'Copied.',
e0:'The file is empty.',e1:'Could not read this file. The format may be unsupported or the file damaged.',e3:'Could not load the model. Check your connection; the first run must download it.',e4:'Error: ',resume:'Resume',reading:'Checking file and reading audio…',valid:'File OK. Duration ',eta:'left ≈ ',e2:'The audio is almost silent; no speech was found.',e6:'The file is too large or the phone ran out of memory. Extract the audio from the video (smaller file) and try again.',e7:'Out of memory. Pick a smaller model (Base/Tiny) and press Resume.',keep:' Text so far is kept; press Resume. No need to upload the file again.',keep0:' Press Resume; no need to upload the file again.',retry:'Temporary error, retrying automatically…',e9:'This browser is not supported. Use a recent Chrome or Safari.',loadm:'Loading model…',part:'part '}
};

let L='ur',file,job=null,segs=[],dur=0,dirty=false,pvw='para',cache={file:null,audio:null},tok=0,tickN=0,tRun=0;
const S=(m,c='')=>{$('status').textContent=m;$('status').className=c};
const SET=['lang','model','task','view'];
function loadSet(){try{const o=JSON.parse(localStorage.getItem('sn.set')||'{}');SET.forEach(k=>{if(o[k]&&[...$(k).options].some(x=>x.value===o[k]))$(k).value=o[k]});pvw=$('view').value;return o.ui}catch{}}
function saveSet(){try{const o={ui:L};SET.forEach(k=>o[k]=$(k).value);localStorage.setItem('sn.set',JSON.stringify(o))}catch{}}
function ui(l){L=l;$('ui').value=l;document.documentElement.lang=l;document.documentElement.dir=l==='ur'?'rtl':'ltr';
  document.querySelectorAll('[data-t]').forEach(e=>e.textContent=T[l][e.dataset.t]);
  document.querySelectorAll('[data-p]').forEach(e=>e.placeholder=T[l][e.dataset.p]);document.title=T[l].title;$('theme').setAttribute('aria-label',T[l].theme);
  if(mr&&mr.state==='recording')$('rec').textContent=T[l].recstop;saveSet()}
$('ui').onchange=e=>ui(e.target.value);
SET.forEach(k=>$(k).addEventListener('change',saveSet));

const TH={onyx:'#27272A',graphite:'#18181B',gold:'#FAFAFA',silver:'#FAFAFA',snow:'#FAFAFA'},th=document.createElement('select');
th.id='theme';
Object.keys(TH).forEach(k=>{const o=document.createElement('option');o.value=k;o.dataset.t='th_'+k;th.append(o)});
$('ui').before(th);
function theme(k,keep){
  if(!Object.keys(TH).includes(k))k='onyx';
  document.documentElement.dataset.theme=k;th.value=k;
  const m=document.querySelector('meta[name=theme-color]');if(m)m.content=TH[k];
  if(keep)try{localStorage.setItem('sn.theme',k)}catch{}
}
th.onchange=e=>theme(e.target.value,true);
try{theme(localStorage.getItem('sn.theme'))}catch{theme()}

// ---------- Worker transport (single in-flight request; rebuilt on any failure) ----------
let w,pend=null,loadedKey=null,loading=null,dlFiles={},onTick=null,isBusy=false;
function mk(){
  if(w){w.onmessage=w.onerror=null;w.terminate()}
  if(pend){const p=pend;pend=null;p.rej(new Error('reset'))}
  loadedKey=null;loading=null;dlFiles={};
  const me=w=new Worker('worker.js',{type:'module'});
  w.onmessage=({data:d})=>{
    if(me!==w)return;
    if(d.type==='dl')return onDl(d.p);
    if(d.type==='tick')return onTick&&onTick();
    const p=pend;if(!p)return;
    if(d.type==='err'){pend=null;const e=new Error(d.msg);e.stage=d.stage;p.rej(e)}
    else if(d.type===p.want){pend=null;p.res(d)}
  };
  w.onerror=ev=>{
    if(me!==w)return;if(ev.preventDefault)ev.preventDefault();
    me.dead=true;const p=pend;pend=null;
    if(p){const e=new Error('worker crashed');e.stage=loadedKey?'run':'load';p.rej(e)}
  };
}
const call=(msg,want,tr)=>new Promise((res,rej)=>{if(w.dead)mk();pend={res,rej,want};w.postMessage(msg,tr||[])});
function onDl(p){
  if(!isBusy||p.status!=='progress'||!p.total)return;   // never overwrite an error/final message
  dlFiles[p.file]={l:p.loaded,t:p.total};
  let l=0,t=0;for(const k in dlFiles){l+=dlFiles[k].l;t+=dlFiles[k].t}
  if(!t)return;$('bar').hidden=false;$('bar').value=l/t;
  if(!job||job.state!=='run'||!tRun)S(T[L].dl+Math.round(100*l/t)+'%');
}
const tp={
  ensure(j){
    const m=j.opts.model;if(loadedKey===m)return Promise.resolve();
    if(!loading){S(T[L].loadm);dlFiles={};
      loading=call({cmd:'load',model:m},'ready').then(()=>{loadedKey=m},e=>{throw e}).finally(()=>{loading=null})}
    return loading;
  },
  run(pcm,o,tick){if(!tRun)tRun=performance.now();onTick=tick;return call({cmd:'run',audio:pcm,lang:o.lang,task:o.task},'win',[pcm.buffer])},
  async reset(){mk()}
};

// ---------- UI state ----------
let wl=null;
async function lock(){try{if(navigator.wakeLock&&!wl)wl=await navigator.wakeLock.request('screen');if(wl)wl.addEventListener('release',()=>{wl=null})}catch{}}
function unlock(){try{wl&&wl.release()}catch{}wl=null}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&job&&job.state==='run')lock()});
addEventListener('beforeunload',e=>{if(job&&job.state==='run'){e.preventDefault();e.returnValue=''}});

function busy(b){isBusy=b;$('go').hidden=b;$('stop').hidden=!b;$('file').disabled=b;$('rec').disabled=b&&!(mr&&mr.state==='recording');
  $('txt').readOnly=b;if(!b){$('bar').hidden=true;unlock()}else lock()}
function paused(msg,cls){busy(false);$('resume').hidden=!(job&&job.k<job.wins.length);S(msg+($('resume').hidden?'':(job.segs.length?T[L].keep:T[L].keep0)),cls)}
function errText(e){
  const m=String(e&&e.message||e);
  if(/memory|alloc|oom|out of bounds|RangeError/i.test(m))return T[L].e7;
  if(e&&e.stage==='load')return T[L].e3;
  return T[L].e4+m;
}

// ---------- Decode (any audio/video the browser can play) ----------
async function decode(f){
  if(f.size>1.5*1024**3){const e=new Error('too big');e.big=true;throw e}
  const buf=await f.arrayBuffer();
  const ctx=new AudioContext({sampleRate:Core.SR});
  try{
    const b=await ctx.decodeAudioData(buf),c=b.numberOfChannels,o=new Float32Array(b.length);
    for(let k=0;k<c;k++){const d=b.getChannelData(k);for(let i=0;i<o.length;i++)o[i]+=d[i]/c}
    return o;
  }finally{ctx.close()}
}

function showFile(){$('fname').textContent=file?file.name+' · '+(file.size/1048576).toFixed(1)+' MB':'';$('go').disabled=!file}
$('file').onchange=e=>{file=e.target.files[0];e.target.value='';cache={file:null,audio:null};showFile();if(file)start()};
$('go').onclick=()=>start();

async function start(){
  if(!file||isBusy)return;
  if(!file.size)return S(T[L].e0,'er');
  if(dirty&&segs.length&&!confirm(T[L].lose))return;
  const my=++tok;busy(true);$('resume').hidden=true;job=null;tRun=0;$('bar').hidden=true;
  let a;
  try{
    if(cache.file===file&&cache.audio)a=cache.audio;
    else{
      S(T[L].reading);
      tp.ensure({opts:{model:$('model').value}}).catch(()=>{});   // model downloads WHILE the file is decoded
      a=await decode(file);cache={file,audio:a};
    }
  }catch(e){if(my!==tok)return;busy(false);return S(e.big||/alloc|memory|RangeError/i.test(String(e&&e.message))?T[L].e6:T[L].e1,'er')}
  if(my!==tok)return;
  if(!a.length){busy(false);return S(T[L].e1,'er')}
  if(Core.peak(a)<0.002){busy(false);return S(T[L].e2,'er')}
  dur=a.length/Core.SR;
  const wa=a.slice();Core.normalize(wa);            // keep cache pristine
  job=Core.newJob(wa,{model:$('model').value,lang:$('lang').value,task:$('task').value});
  segs=[];dirty=false;$('txt').value='';$('res').hidden=true;
  S(T[L].valid+Core.fmtDur(dur));
  loop();
}
async function loop(){
  const j=job;busy(true);$('resume').hidden=true;tickN=0;
  const prog=()=>{
    const wl=j.wins.length,n=j.wins.reduce((s,x,i)=>i<j.k?s+x[1]-x[0]:s,0);
    const[a,b]=j.wins[Math.min(j.k,wl-1)],exp=Math.max(1,Math.ceil((b-a)/Core.SR/20));
    const f=Math.min(1,(n+(b-a)*Math.min(.95,tickN/exp))/j.audio.length);
    $('bar').hidden=false;$('bar').value=f;
    const el=(performance.now()-tRun)/1000;
    S(`${Math.round(f*100)}%  ·  ${wl>1?T[L].part+Math.min(j.k+1,wl)+'/'+wl+'  ·  ':''}${f>.04&&tRun?T[L].eta+Core.fmtDur(el/f*(1-f)):''}`);
  };
  try{
    const r=await Core.runJob(j,tp,{
      tick:()=>{tickN++;prog()},
      win:x=>{tickN=0;segs=x.segs;render();$('res').hidden=false;prog()},
      retry:()=>{tickN=0;S(T[L].retry)}});
    if(job!==j||r!=='done')return;
    finish();
  }catch(e){if(job!==j||j.state==='paused')return;paused(errText(e),'er')}
}
$('stop').onclick=()=>{tok++;if(!job){busy(false);return S(T[L].cancel)}Core.pause(job,tp);paused(T[L].cancel)};
$('resume').onclick=()=>{
  if(!job||isBusy)return;
  if(dirty&&!confirm(T[L].lose))return;
  Object.assign(job.opts,{model:$('model').value,lang:$('lang').value,task:$('task').value});
  loop();
};

function finish(){
  busy(false);render();$('res').hidden=false;
  const p=(performance.now()-tRun)/1000;
  S(segs.length?T[L].done:T[L].e2,segs.length?'ok':'er');
  $('diag').textContent=`${job.opts.model} | audio ${dur.toFixed(1)}s | ${job.wins.length} part(s) | transcribe ${p.toFixed(1)}s (${(dur/p).toFixed(2)}x realtime) | ${segs.length} segments | RAM ~${navigator.deviceMemory||'?'}GB`;
}
function render(){$('txt').value=segs.map(x=>x.t).join($('view').value==='lines'?'\n':' ');dirty=false;save();dl()}
function dl(){document.querySelectorAll('[data-dl=srt],[data-dl=vtt]').forEach(b=>b.disabled=!segs.length)}
$('view').onchange=()=>{if(!segs.length||(dirty&&!confirm(T[L].lose))){$('view').value=pvw;return}pvw=$('view').value;render()};

document.querySelectorAll('[data-dl]').forEach(b=>b.onclick=()=>{
  const k=b.dataset.dl;let s;
  if(k==='txt')s=$('txt').value;else{if(!segs.length)return;s=Core.subs(segs,k==='vtt')}
  saveBlob(new Blob([s],{type:'text/plain;charset=utf-8'}),k);
});
function saveBlob(b,ext){const a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download=(file?file.name.replace(/\.[^.]+$/,''):'transcript')+'.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
$('docx').onclick=()=>saveBlob(new Blob([buildDocx($('txt').value)],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),'docx');
$('pdf').onclick=()=>{$('pv').textContent=$('txt').value;window.print()};

let mr,parts=[];
$('rec').onclick=async()=>{
  if(mr&&mr.state==='recording')return mr.stop();
  if(isBusy)return;
  try{
    const st=await navigator.mediaDevices.getUserMedia({audio:true});parts=[];mr=new MediaRecorder(st);
    mr.ondataavailable=e=>parts.push(e.data);
    mr.onstop=()=>{st.getTracks().forEach(t=>t.stop());const t=mr.mimeType||'audio/webm';
      file=new File([new Blob(parts,{type:t})],'recording.'+(t.includes('mp4')?'m4a':'webm'),{type:t});cache={file:null,audio:null};
      showFile();$('rec').textContent=T[L].rec;busy(false);start()};
    mr.start();$('rec').textContent=T[L].recstop;
  }catch{S(T[L].e5,'er')}
};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('txt').value)}catch{$('txt').select();document.execCommand('copy')}S(T[L].copied,'ok')};
$('next').onclick=()=>{const q=$('find').value,t=$('txt');if(!q)return;let i=t.value.indexOf(q,t.selectionEnd);if(i<0)i=t.value.indexOf(q);if(i<0)return;t.focus();t.setSelectionRange(i,i+q.length)};

function save(){try{localStorage.setItem('sn.txt',$('txt').value);localStorage.setItem('sn.segs',JSON.stringify(segs))}catch{}}
$('txt').oninput=()=>{dirty=true;try{localStorage.setItem('sn.txt',$('txt').value)}catch{}};
$('clr').onclick=()=>{segs=[];job=null;dirty=false;$('txt').value='';$('res').hidden=true;$('resume').hidden=true;dl();try{localStorage.removeItem('sn.txt');localStorage.removeItem('sn.segs')}catch{}};
try{const v=localStorage.getItem('sn.txt');if(v){$('txt').value=v;$('res').hidden=false;
  const s=JSON.parse(localStorage.getItem('sn.segs')||'[]');if(Array.isArray(s))segs=s.filter(x=>x&&typeof x.t==='string')}}catch{}

$('go').disabled=true;dl();
ui(loadSet()==='en'?'en':'ur');
if(!window.Worker||!window.AudioContext)S(T[L].e9,'er');else mk();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
