// Minimal DOCX writer, no libraries: a ZIP ("store" mode) holding 3 XML parts.
function crc32(b){let t=crc32.t;if(!t){t=crc32.t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}}
  let r=-1;for(let i=0;i<b.length;i++)r=t[(r^b[i])&255]^(r>>>8);return(r^-1)>>>0}
function zipStore(files){
  const E=new TextEncoder(),u16=v=>[v&255,v>>8&255],u32=v=>[v&255,v>>8&255,v>>16&255,v>>>24&255],out=[],cen=[];let off=0;
  for(const f of files){
    const n=E.encode(f.name),d=E.encode(f.data),mid=[...u32(crc32(d)),...u32(d.length),...u32(d.length),...u16(n.length)];
    const lh=new Uint8Array([0x50,0x4b,3,4,20,0,0,8,0,0,0,0,33,0,...mid,0,0]);
    out.push(lh,n,d);
    cen.push(new Uint8Array([0x50,0x4b,1,2,20,0,20,0,0,8,0,0,0,0,33,0,...mid,0,0,0,0,0,0,0,0,0,0,0,0,...u32(off)]),n);
    off+=lh.length+n.length+d.length;
  }
  const cs=cen.reduce((s,x)=>s+x.length,0),end=new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cs),...u32(off),0,0]);
  const parts=[...out,...cen,end],r=new Uint8Array(parts.reduce((s,x)=>s+x.length,0));let p=0;
  for(const x of parts){r.set(x,p);p+=x.length}return r}
function buildDocx(text){
  const esc=s=>s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),ar=/[\u0600-\u06FF\u0750-\u077F]/;
  const body=text.split(/\r?\n/).map(l=>{const r=ar.test(l);
    return '<w:p>'+(r?'<w:pPr><w:bidi/></w:pPr>':'')+'<w:r><w:rPr>'+(r?'<w:rtl/><w:szCs w:val="28"/>':'<w:sz w:val="26"/>')+'</w:rPr><w:t xml:space="preserve">'+esc(l)+'</w:t></w:r></w:p>'}).join('');
  const X='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return zipStore([
    {name:'[Content_Types].xml',data:X+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'},
    {name:'_rels/.rels',data:X+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
    {name:'word/document.xml',data:X+'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>'}]);
}
if(typeof module!=='undefined')module.exports={buildDocx,zipStore,crc32};
