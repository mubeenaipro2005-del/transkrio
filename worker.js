// Whisper runs here (Web Worker) so the page never freezes.
import {pipeline,env} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1';
env.allowLocalModels=false;
let asr,loaded;
const send=m=>self.postMessage(m);
self.onmessage=async({data:d})=>{
  if(d.cmd==='load'){
    try{
      if(loaded!==d.model){
        loaded=null;asr=null;
        asr=await pipeline('automatic-speech-recognition',d.model,{dtype:'q8',progress_callback:p=>send({type:'dl',p})});
        loaded=d.model;
      }
      send({type:'ready'});
    }catch(e){send({type:'err',stage:'load',msg:String(e&&e.message||e)})}
  }else if(d.cmd==='run'){
    try{
      if(!asr)throw new Error('model not loaded');
      const o=await asr(d.audio,{language:d.lang==='auto'?null:d.lang,task:d.task||'transcribe',chunk_length_s:30,stride_length_s:5,return_timestamps:true,chunk_callback:()=>send({type:'tick'})});
      send({type:'win',text:o.text,chunks:o.chunks});
    }catch(e){send({type:'err',stage:'run',msg:String(e&&e.message||e)})}
  }
};
