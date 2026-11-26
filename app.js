/* Dally portfolio v2: renderer + admin editor.
   Same editing model as the current site (dally-site/index.html): one JSON state, click any
   text to edit it, uploads go to Supabase storage, "Save & publish" writes the state to the
   Supabase `site` table. This version saves to its own row (default "portfolio-v2"), so the
   live site is not touched until Dally switches over. */
(function(){
'use strict';
const CFG=window.DALLY_CONFIG||{};
const ROW=CFG.siteRow||'portfolio-v2';
const DRAFT='dally-portfolio-v2-draft';
const clone=o=>JSON.parse(JSON.stringify(o));
const DEFAULT=clone(window.DEFAULT_STATE);
/* ===== Free block (26 Nov 2026): Notion-style building =====
   A list of elements ("els"). Each element: heading, text, list, media (photo/video),
   line, icon, button, quote, stats, spacer. Each has size, align, font, color.
   Works as an industry block (kind:'free') and as a page section (type:'free'). */
const FX={
  h:{label:'Heading',make:()=>({t:'h',text:'New heading',size:'m'})},
  p:{label:'Text',make:()=>({t:'p',text:'Write something here.',size:'m'})},
  list:{label:'Bullet list',make:()=>({t:'list',items:['First point','Second point'],size:'m'})},
  media:{label:'Photo or video',make:()=>({t:'media',m:{id:'',kind:''},w:'wide'})},
  line:{label:'Line',make:()=>({t:'line',style:'solid'})},
  icon:{label:'Icon + text',make:()=>({t:'icon',icon:'star',text:'Short line next to an icon',size:'m'})},
  btn:{label:'Button',make:()=>({t:'btn',text:'Book a call with me',url:''})},
  quote:{label:'Quote',make:()=>({t:'quote',text:'A short quote or testimonial.',by:'',size:'m'})},
  stats:{label:'Number cards',make:()=>({t:'stats',items:[{v:'0',l:'What it measures'},{v:'0',l:'What it measures'}]})},
  space:{label:'Spacer',make:()=>({t:'space',size:'m'})}
};
const FXT={
  empty:{label:'Start empty',hint:'A blank canvas. Add anything with + Add',els:()=>[]},
  story:{label:'Story + photo',hint:'Heading, text, photo, quote',els:()=>[FX.h.make(),FX.p.make(),FX.media.make(),FX.quote.make()]},
  cases:{label:'Case study',hint:'Challenge, what I did, numbers, photos',els:()=>[Object.assign(FX.h.make(),{text:'The challenge'}),FX.p.make(),Object.assign(FX.h.make(),{text:'What I did'}),FX.list.make(),FX.line.make(),FX.stats.make(),FX.media.make()]},
  steps:{label:'Steps with icons',hint:'Three icon lines and a button',els:()=>[FX.h.make(),Object.assign(FX.icon.make(),{icon:'chat',text:'Step one'}),Object.assign(FX.icon.make(),{icon:'calendar',text:'Step two'}),Object.assign(FX.icon.make(),{icon:'heart',text:'Step three'}),FX.btn.make()]}
};
function freeNew(){return {kind:'free',label:'Free block',title:'New *block*',sub:'',els:[]}}
const FXFONT={'':'Default',serif:'Serif',sans:'Sans',script:'Script',caps:'Caps'};
function fxStyle(e){const st=[];if(e.align)st.push('text-align:'+e.align);if(e.color)st.push('color:'+e.color);
  if(e.font==='serif')st.push('font-family:var(--display)');if(e.font==='sans')st.push('font-family:var(--sans)');if(e.font==='script')st.push('font-family:"Great Vibes",cursive');
  return st.length?` style="${st.join(';')}"`:''}
function fxBar(e,ep,arr,i){if(!ED())return '';const hasText=!['media','line','space'].includes(e.t);
  return `<div class="fxbar"><span>${esc(FX[e.t]?FX[e.t].label:e.t)}</span>${hasText||e.t==='space'?`<button data-cyc="${ep}.size" data-opts="s|m|l|xl">Size: ${(e.size||'m').toUpperCase()}</button>`:''}${hasText?`<button data-cyc="${ep}.align" data-opts="left|center|right">Align: ${e.align||'left'}</button><button data-cyc="${ep}.font" data-opts="|serif|sans|script|caps">Font: ${FXFONT[e.font||'']}</button><label class="fxcol" title="Text color"><input type="color" data-fxcol="${ep}.color" value="${esc(e.color||'#2B2B2B')}">Color</label>${e.color?`<button data-fxclr="${ep}.color">Reset color</button>`:''}`:''}${e.t==='media'?`<button data-cyc="${ep}.w" data-opts="half|wide|full">Width: ${e.w||'wide'}</button>`:''}${e.t==='line'?`<button data-cyc="${ep}.style" data-opts="solid|dashed|dotted|double|fade">Style: ${e.style||'solid'}</button>`:''}${e.t==='icon'?`<button data-cyc="${ep}.icon" data-opts="star|key|home|tag|search|chat|calendar|heart">Icon: ${e.icon||'star'}</button>`:''}<button data-dupi="${arr}" data-i="${i}">Duplicate</button></div>${itools(arr,i)}`}
function fxEl(e,ep,arr,i){const sz=' fx-'+(e.size||'m')+(e.font==='caps'?' fx-caps':'');let body='';
  switch(e.t){
    case 'h':body=`<div class="fx-h${sz}"${fxStyle(e)}>${T(ep+'.text','h3','',{ph:'Heading (wrap a word in *stars* for italics)'})}</div>`;break;
    case 'p':body=`<div class="fx-p${sz}"${fxStyle(e)}>${T(ep+'.text','p','',{ml:1,ph:'Write something'})}</div>`;break;
    case 'list':body=`<ul class="fx-list${sz}"${fxStyle(e)}>${(e.items||[]).map((t,j)=>`<li${di(ep+'.items',j)}>${itools(ep+'.items',j,{nomove:1})}${T(ep+'.items.'+j,'span','',{ph:'Point'})}</li>`).join('')}</ul>${ADD(ep+'.items','Point','point')}`;break;
    case 'media':{const m=e.m||{};if(!m.id&&!ED())return '';body=`<div class="fx-media fx-w-${e.w||'wide'}"><div class="mbox">${m.id?mediaTag(m):'<div class="ph"><b>Photo or video</b><small>Click to add</small></div>'}${m.id&&m.kind==='video'?'<button class="playbtn" data-play="1">▶ Play with sound</button>':''}${upCtl(ep+'.m',m)}</div>${T(ep+'.cap','p','fx-cap',{ph:'Caption (optional)'})}</div>`;break}
    case 'line':body=`<hr class="fx-line fx-line-${e.style||'solid'}">`;break;
    case 'icon':body=`<div class="fx-icon${sz}"${fxStyle(e)}><span class="fx-ic">${lpIcon(e.icon||'star')}</span>${T(ep+'.text','span','',{ph:'Text'})}</div>`;break;
    case 'btn':{const u=e.url||'';body=`<div class="fx-btn"${fxStyle(e)}><a class="btn pri" ${u?`href="${esc(u)}" target="_blank" rel="noopener"`:bookA()}>${T(ep+'.text','span','',{plain:1,ph:'Button text'})}</a>${ED()?`<div class="fx-url">Link: ${T(ep+'.url','span','',{plain:1,ph:'Leave empty to open your booking form'})}</div>`:''}</div>`;break}
    case 'quote':body=`<blockquote class="fx-quote${sz}"${fxStyle(e)}>${T(ep+'.text','p','',{ml:1,ph:'Quote'})}${T(ep+'.by','cite','',{plain:1,ph:'Who said it (optional)'})}</blockquote>`;break;
    case 'stats':body=`<div class="fx-stats">${(e.items||[]).map((st,j)=>`<div class="fx-stat"${di(ep+'.items',j)}>${itools(ep+'.items',j)}<b>${T(ep+'.items.'+j+'.v','span','',{plain:1})}</b><small>${T(ep+'.items.'+j+'.l','span','',{plain:1})}</small></div>`).join('')}</div>${ADD(ep+'.items','Number card','stat')}`;break;
    case 'space':body=`<div class="fx-space fx-sp-${e.size||'m'}">${ED()?'<small>Space</small>':''}</div>`;break;
    default:body='';
  }
  return `<div class="fx-el fx-t-${e.t}"${di(arr,i)}>${fxBar(e,ep,arr,i)}${body}</div>`}
function freeHTML(b,p){const arr=p+'.els',els=b.els||[];
  const add=ED()?`<div class="fx-add"><button class="addbtn" data-fxadd="${arr}">+ Add</button>${els.length?'':`<button class="addbtn" data-fxtpl="${arr}">Use a template</button>`}</div>`:'';
  if(!els.length&&!ED())return '';
  return `<div class="fx rv">${els.map((e,i)=>fxEl(e,arr+'.'+i,arr,i)).join('')}${add}</div>`}
function freeTemplates(arr){const p=panel(`<h3>Start this block</h3><p>Pick a starting point. You can change, move or delete everything after.</p><div class="picker">${Object.entries(FXT).map(([k,v])=>`<button data-fxt="${k}">${v.label}<small>${v.hint}</small></button>`).join('')}</div>`);
  p.querySelectorAll('[data-fxt]').forEach(b=>b.onclick=()=>{const a=get(arr);a.push(...FXT[b.dataset.fxt].els());markDirty();closePanel();render();toast('Ready. Click any text to edit it.')})}
function freeAdd(arr){const p=panel(`<h3>Add to this block</h3><p>Adds to the end. Drag ⠿ or use ‹ › to move it.</p><div class="picker">${Object.entries(FX).map(([k,v])=>`<button data-fx="${k}">${v.label}</button>`).join('')}</div>`);
  p.querySelectorAll('[data-fx]').forEach(b=>b.onclick=()=>{get(arr).push(FX[b.dataset.fx].make());markDirty();closePanel();render();toast(FX[b.dataset.fx].label+' added.')})}
document.addEventListener('click',e=>{if(!ED())return;const t=e.target;
  const a=t.closest&&t.closest('[data-fxadd]');if(a){e.preventDefault();e.stopPropagation();freeAdd(a.dataset.fxadd);return}
  const tp=t.closest&&t.closest('[data-fxtpl]');if(tp){e.preventDefault();e.stopPropagation();freeTemplates(tp.dataset.fxtpl);return}
  const c=t.closest&&t.closest('[data-fxclr]');if(c){e.preventDefault();e.stopPropagation();set(c.dataset.fxclr,'');markDirty();render()}
},true);
document.addEventListener('input',e=>{const c=e.target.closest&&e.target.closest('[data-fxcol]');if(!c||!ED())return;set(c.dataset.fxcol,c.value);const el=c.closest('.fx-el');const tx=el&&el.querySelector('.fx-h,.fx-p,.fx-list,.fx-icon,.fx-quote,.fx-btn');if(tx)tx.style.color=c.value;markDirty(true)});
document.addEventListener('change',e=>{const c=e.target.closest&&e.target.closest('[data-fxcol]');if(c&&ED())render()});
let S=clone(DEFAULT),LOADED=JSON.stringify(S);
const OPENIND=new Set();let ADMIN=false,LOCAL=false,EDIT=false,PREVIEW=false,DIRTY=0,LWI=0,pending=null,SB=null;
const isLocalHost=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

/* ---------- fonts and color presets (Design panel) ---------- */
const FONTS={
  fraunces:{name:'Fraunces + Figtree',note:'Dally brand board',q:'family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Figtree:wght@400;500;600',d:'"Fraunces",Georgia,serif',s:'"Figtree",system-ui,sans-serif'},
  instrument:{name:'Instrument Serif + Inter',note:'Tall, fashion-editorial',q:'family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600',d:'"Instrument Serif","Times New Roman",serif',s:'"Inter",system-ui,sans-serif'},
  cormorant:{name:'Cormorant + Montserrat',note:'Classic luxury',q:'family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@400;500;600',d:'"Cormorant Garamond",Georgia,serif',s:'"Montserrat",system-ui,sans-serif'},
  playfair:{name:'Playfair + Lato',note:'Warm and familiar',q:'family=Playfair+Display:ital,wght@0,400;1,400&family=Lato:wght@400;700',d:'"Playfair Display",Georgia,serif',s:'"Lato",system-ui,sans-serif'},
  dmserif:{name:'DM Serif + DM Sans',note:'Modern and clean',q:'family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600',d:'"DM Serif Display",Georgia,serif',s:'"DM Sans",system-ui,sans-serif'}
};
const PRESETS={
  merlot:{name:'Merlot & cream',c:{paper:'#F7F2EB',stone:'#EEE7DE',cover:'#EAE2D8',ink:'#211417',muted:'#75666A',wine:'#7A2337',merlot:'#3A1220',sand:'#CBB79A'}},
  brand:{name:'Dally brand board',c:{paper:'#FAF7F2',stone:'#E8DCCB',cover:'#F1E8DC',ink:'#2B2B2B',muted:'#7A6A61',wine:'#7A1F2B',merlot:'#4E1220',sand:'#CBB79A'}},
  sand:{name:'Soft sand',c:{paper:'#FBF8F3',stone:'#F0E9DF',cover:'#E9DFD2',ink:'#2A2522',muted:'#7B6F66',wine:'#8A5A44',merlot:'#3B2A22',sand:'#D8C3A5'}},
  ink:{name:'Ink & white',c:{paper:'#FFFFFF',stone:'#F4F4F2',cover:'#ECEBE8',ink:'#161616',muted:'#6B6B6B',wine:'#7A2337',merlot:'#1C1C1C',sand:'#C9C2B8'}}
};
const COLOR_NAMES={paper:'Page background',stone:'Alternate background',cover:'Cover & contact background',ink:'Text',muted:'Soft text',wine:'Accent (italic words, labels)',merlot:'Dark (buttons, results band)',sand:'Highlight on dark'};
function applyTheme(){
  const t=S.theme||(S.theme=clone(DEFAULT.theme));const r=document.documentElement.style;
  Object.entries(t.colors||{}).forEach(([k,v])=>r.setProperty('--'+k,v));
  const f=FONTS[t.font]||FONTS.fraunces;r.setProperty('--display',f.d);r.setProperty('--sans',f.s);
  let l=document.getElementById('gf');if(!l){l=document.createElement('link');l.id='gf';l.rel='stylesheet';document.head.appendChild(l)}
  const href='https://fonts.googleapis.com/css2?'+f.q+'&display=swap';if(l.href!==href)l.href=href;
  const m=document.querySelector('meta[name=theme-color]');m&&m.setAttribute('content',t.colors.merlot);
}

/* ---------- helpers ---------- */
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rich=s=>esc(s).replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/\n/g,'<br>');
const get=p=>p.split('.').reduce((o,k)=>o==null?o:o[k],S);
function set(p,v){const ks=p.split('.'),l=ks.pop();ks.reduce((o,k)=>o[k],S)[l]=v}
const ED=()=>EDIT&&!PREVIEW;
const pad=n=>String(n).padStart(2,'0');
const src=id=>/^(https?:|blob:|data:)/.test(id)||id.includes('/')?id:'media/'+id;
function T(p,tag='span',cls='',o={}){const v=get(p);if(!ED()&&(v==null||v===''))return '';
  return `<${tag}${cls?` class="${cls}"`:''}${ED()?` data-p="${p}" data-ph="${esc(o.ph||'Type here')}"${o.ml?' data-ml="1"':''}`:''}>${ED()?esc(v):(o.plain?esc(v):rich(v))}</${tag}>`}
function mediaTag(m){if(!m||!m.id)return '';return m.kind==='video'?`<video src="${esc(src(m.id))}"${m.poster?` poster="${esc(src(m.poster))}"`:''} muted playsinline loop preload="metadata"></video>`:`<img src="${esc(src(m.id))}" alt="${esc(m.label||m.cap||'')}" loading="lazy">`}
function upCtl(p,m,accept){if(!ED())return '';const vid=m&&m.kind==='video',acc=accept||'image/*,video/*';return `<div class="uprow"><label class="upbtn">${m&&m.id?(vid?'Replace video':'Replace'):'Add photo / video'}<input type="file" accept="${acc}" data-up="${p}"></label>${vid?`<label class="upbtn">${m.poster?'Change cover':'Add cover image'}<input type="file" accept="image/*" data-up="${p}" data-poster="1"></label>`:''}${m&&m.id&&!vid&&acc.includes('video')?'<span class="uphint">Upload a video to make it playable. This image becomes its cover.</span>':''}${m&&m.id?`<button class="upbtn" data-clear="${p}">Remove${vid&&m.poster?' video':''}</button>`:''}</div>`}
function itools(arr,i,o={}){if(!ED())return '';return `<div class="itools"><button class="dh" title="Drag to move" aria-label="Drag to move">⠿</button>${o.nomove?'':`<button data-im="${arr}" data-i="${i}" data-d="-1" title="Move earlier" aria-label="Move earlier">‹</button><button data-im="${arr}" data-i="${i}" data-d="1" title="Move later" aria-label="Move later">›</button>`}<button data-del="${arr}" data-i="${i}" title="Remove" aria-label="Remove">×</button></div>`}
const di=(arr,i)=>ED()?` data-dpath="${arr}" data-di="${i}"`:'';
const ADD=(arr,label,tpl)=>ED()?`<button class="addbtn" data-add="${arr}" data-tpl="${tpl}">+ ${label}</button>`:'';
const book=()=>esc(S.site.book||'#contact');
const mail=()=>S.site.email?'mailto:'+esc(S.site.email):book();
const bookA=()=>`href="${book()}" target="_blank" rel="noopener" data-book="1"`;
function embedURL(u){try{const x=new URL(u);if(/(^|\.)calendly\.com$/.test(x.hostname)){x.searchParams.set('embed_domain',location.hostname);x.searchParams.set('embed_type','Inline');return x.href}
  if(x.hostname==='calendar.google.com'&&/appointments/.test(x.pathname)){x.searchParams.set('gv','true');return x.href}
  if(x.hostname==='docs.google.com'&&/\/forms\/d\/e\/.+\/viewform/.test(x.pathname)){x.searchParams.set('embedded','true');return x.href}}catch(e){}return null}
function openBooking(){const u=embedURL(S.site.book||'');if(!u)return false;closeBooking();
  const el=document.createElement('div');el.id='bk';el.className='bk';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Book a call');
  el.innerHTML=`<div class="bkbox"><div class="bktop"><b>Book a call with ${esc(S.site.brand)}</b><button data-bkx="1" aria-label="Close">×</button></div><iframe src="${esc(u)}" title="Booking form" loading="lazy"></iframe><a class="bkalt" href="${book()}" target="_blank" rel="noopener">Form not loading? Open it in a new tab</a></div>`;
  document.body.appendChild(el);document.body.style.overflow='hidden';el.querySelector('[data-bkx]').focus();return true}
function closeBooking(){const el=document.getElementById('bk');if(el){el.remove();document.body.style.overflow=''}}
function phone(m,p,o={}){
  const has=m&&m.id;
  return `<div class="phone"><div class="screen"${has&&m.kind!=='video'&&o.open?` data-open="${o.open}" data-at="${o.at}" role="button" tabindex="0"`:''}>${has?mediaTag(m):`<div class="ph"><b>${esc(o.ph||'Your reel')}</b><small>${esc(o.phs||'Coming soon')}</small></div>`}${o.chip||''}${has&&m.kind==='video'?'<button class="playbtn" data-play="1">▶ Play with sound</button>':''}${upCtl(p,m)}</div></div>`;
}
const TPL={
  reel:{id:'',kind:'',type:'Type',cap:''},slide:{id:'',kind:''},car:{pillar:'Pillar',cap:'',slides:[{id:'',kind:''},{id:'',kind:''},{id:'',kind:''}]},
  media:{id:'',kind:'',label:''},latest:{id:'',kind:'',label:'Brand',cap:'Reel',tag:'Concept campaign'},stat:{v:'0',l:'What it measures'},rstat:{v:'0',l:'What it measures',src:'Where it is from'},
  svc:{t:'New service',d:'What it includes.',tag:''},way:{t:'New option',d:'How it works.'},step:{t:'New step',d:'What happens.'},client:{name:'Client name',ind:'Industry',logo:{id:'',kind:''}},
  para:'New paragraph.',point:'New point',shot:'New shot',setup:{k:'Angle',d:'How to set it up'},
  guide:{reel:{id:'',kind:''},title:'New filming guide',hook:'Add the hook',script:'Add a short script',shots:['Shot 1','Shot 2'],setup:[{k:'Close-up',d:''},{k:'Eye level',d:''}]},
  card:{k:'book',t:'Book a call',d:''},aireel:{fmt:'reel',type:'AI reel',cap:'',id:'',kind:''},aiphoto:{fmt:'photo',type:'AI photo',cap:'',id:'',kind:''},lpchip:'New badge',lppath:{badge:'',t:'New path',d:'What they get',icon:'star'}
};
function stripMedia(o){if(Array.isArray(o)){o.forEach(stripMedia);return o}if(o&&typeof o==='object'){if('id' in o&&'kind' in o){o.id='';o.kind=''}Object.values(o).forEach(stripMedia)}return o}
function uniq(base,taken){let k=base,n=2;while(taken.includes(k))k=base+'-'+n++;return k}

/* ---------- section renderers ---------- */
const NAMES={hero:'Cover',about:'About',latest:'Latest work',industries:'Industries',services:'Services',process:'How I work',results:'Results',clients:'Clients',contact:'Contact',text:'Text',free:'Free section'};
const SEC_CLS={hero:'hero dots',about:'about dots band-paper',latest:'latest band-paper',industries:'industries band-paper',services:'services dots band-paper',process:'process band-stone',results:'results',clients:'clients band-stone',contact:'contact dots',text:'textblk band-paper',free:'freesec band-paper'};
const head=(bp,o={})=>`<div class="shead${o.center?' center':''} rv"><div>${T(bp+'.title','h2','',{ph:'Heading (wrap a word in *stars* for italics)'})}${o.sub?T(bp+'.sub','p','sub',{ph:'Short intro'}):''}</div>${o.extra||''}</div>`;
const firstId=t=>{const s=S.sections.find(x=>x.type===t&&!x.hidden);return s?'#'+s.id:'#contact'};

const R={
hero(s,bp){
  const ph=s.photo||{};
  const ig=S.site.instagram;
  return `<div class="wrap"><div class="pic">${ph.id?`<img src="${esc(src(ph.id))}" alt="${esc(S.site.brand)}" fetchpriority="high">`:`<div class="ph"><b>Your photo</b><small>Cut-out PNG works best</small></div>`}${upCtl(bp+'.photo',ph,'image/*')}</div>
  <div class="txt">${T(bp+'.eyebrow','span','label eyebrow')}<h1><span>${T(bp+'.name','span','',{plain:1})}</span><span><em>${T(bp+'.nameEm','span','',{plain:1})}</em></span></h1>${T(bp+'.intro','p','intro')}
  <div class="cta"><a class="btn pri" href="${firstId('industries')}">${T(bp+'.btn1')} <span aria-hidden="true">↓</span></a><a class="btn" ${bookA()}>${T(bp+'.btn2')}</a></div>
  <div class="meta">${S.site.email?`<a href="mailto:${esc(S.site.email)}">${esc(S.site.email)}</a>`:''}${ig?`<a href="${esc(ig)}" target="_blank" rel="noopener">Instagram</a>`:''}<span><i class="dot"></i>${T(bp+'.line')}</span></div></div></div>`;
},
about(s,bp){
  const ph=s.photo||{};
  return `<div class="wrap grid"><div>${head(bp)}<div class="paras rv">${s.paras.map((p,i)=>`<p style="position:relative"${di(bp+'.paras',i)}>${itools(bp+'.paras',i)}${T(bp+'.paras.'+i,'span','',{ml:1})}</p>`).join('')}</div>${ADD(bp+'.paras','Paragraph','para')}<p class="sig">${T(bp+'.signoff','span')}</p></div>
  <div class="photo"><div class="frame">${ph.id?`<img src="${esc(src(ph.id))}" alt="Dally" loading="lazy">`:'<div class="ph"><b>Your photo</b></div>'}${upCtl(bp+'.photo',ph,'image/*')}</div>
  ${s.stats.slice(0,3).map((st,i)=>`<div class="stat s${i}"${di(bp+'.stats',i)}>${itools(bp+'.stats',i,{nomove:1})}<i>${['✦','↗','◎'][i]}</i><div><b>${T(bp+'.stats.'+i+'.v','span','',{plain:1})}</b><small>${T(bp+'.stats.'+i+'.l')}</small></div></div>`).join('')}</div>
  ${s.stats.length<3?ADD(bp+'.stats','Stat card','stat'):''}</div>`;
},
latest(s,bp){
  const items=s.items,n=items.length;if(LWI>=n)LWI=0;
  const inds=(S.sections.find(x=>x.type==='industries')||{industries:[]}).industries.filter(x=>!x.hidden).slice(0,3);
  const cur=items[LWI]||{};
  return `<div class="wrap">${head(bp,{center:1})}
  <div class="stage" data-stage="1">${items.map((m,i)=>`<div class="lw" data-k="${i}"${di(bp+'.items',i)}>${itools(bp+'.items',i)}${phone(m,bp+'.items.'+i,{ph:m.label||'Your reel',phs:m.tag||'Coming soon',open:bp+'.items',at:i})}</div>`).join('')}
  ${inds.map((x,i)=>`<a class="floatchip fc${i}" href="#ind-${esc(x.key)}"><i></i>${esc(x.name)}</a>`).join('')}</div>
  <div class="lwcap">${ED()?`${T(bp+'.items.'+LWI+'.label','h3','',{ph:'Brand or industry'})}<p>${T(bp+'.items.'+LWI+'.cap','span','',{ph:'What it is'})} · ${T(bp+'.items.'+LWI+'.tag','span','',{ph:'Client work or Concept campaign'})}</p>`:`<h3 data-lwl>${esc(cur.label||'')}</h3><p data-lwc>${esc([cur.cap,cur.tag].filter(Boolean).join(' · '))}</p>`}</div>
  ${n?`<div class="ctrls"><span class="ctr"><b data-lwn>${pad(LWI+1)}</b> <span>/ ${pad(n)}</span></span><button data-lw="-1" aria-label="Previous">‹</button><div class="dotsnav">${items.map((_,i)=>`<i class="${i===LWI?'on':''}"></i>`).join('')}</div><button data-lw="1" aria-label="Next">›</button></div>`:''}
  <div style="text-align:center">${ADD(bp+'.items','Slide','latest')}</div></div>`;
},
industries(s,bp){
  const all=s.industries,vis=all.map((x,k)=>({x,k})).filter(o=>ED()||!o.x.hidden);
  let band=0;
  return `<div class="wrap ind-head">${head(bp,{center:1,sub:1})}</div>
  <nav class="inav" aria-label="Industries"><div class="bar">${vis.map(({x})=>{const c=countMedia(x);return `<a href="#ind-${esc(x.key)}" data-ikey="${esc(x.key)}">${esc(x.name)}<span>${c||(x.status==='soon'?'Soon':'New')}</span></a>`}).join('')}</div></nav>
  ${vis.map(({x,k},j)=>industry(x,bp+'.industries.'+k,k,bp+'.industries',band++%2?'band-paper':'band-stone',vis[j+1]&&vis[j+1].x)).join('')}
  ${ED()?`<div class="wrap" style="padding:28px var(--gut) 72px;text-align:center"><button class="addbtn" data-addind="${bp}">+ Add industry</button><p class="editnote">Copies the full structure of your first industry (reels, carousels, feed, AI note, filming guide) with empty slots.</p></div>`:''}`;
},
services(s,bp){
  const tog=ED()?`<button class="addbtn" style="margin:0" data-cyc="${bp}.layout" data-opts="|list">Layout: ${s.layout==='list'?'List':'Cards'}</button>`:'';
  return `<div class="wrap">${head(bp,{extra:tog})}<div class="svcs ${s.layout==='list'?'list':''}">${s.items.map((it,i)=>`<div class="svc rv"${di(bp+'.items',i)}>${itools(bp+'.items',i)}<span class="n">${pad(i+1)}</span>${(it.tag||ED())?T(bp+'.items.'+i+'.tag','span','chip soft',{ph:'Tag',plain:1}):''}<h3>${T(bp+'.items.'+i+'.t','span','',{plain:1})}</h3>${T(bp+'.items.'+i+'.d','p')}</div>`).join('')}</div>${ADD(bp+'.items','Service','svc')}</div>`;
},
process(s,bp){
  return `<div class="wrap">${head(bp)}<div class="steps">${s.items.map((it,i)=>`<div class="step rv${/follow up/i.test(it.t)?' hl':''}"${di(bp+'.items',i)}>${itools(bp+'.items',i)}<h3>${T(bp+'.items.'+i+'.t','span','',{plain:1})}</h3>${T(bp+'.items.'+i+'.d','p')}</div>`).join('')}</div>${ADD(bp+'.items','Step','step')}</div>`;
},
results(s,bp){
  const pr=s.proof||{};
  return `<div class="wrap">${head(bp,{sub:1})}<div class="rgrid">${s.items.map((it,i)=>`<div class="rcard rv"${di(bp+'.items',i)}>${itools(bp+'.items',i)}<b class="count">${T(bp+'.items.'+i+'.v','span','',{plain:1})}</b><p>${T(bp+'.items.'+i+'.l')}</p>${T(bp+'.items.'+i+'.src','small','',{plain:1})}</div>`).join('')}</div>${ADD(bp+'.items','Result','rstat')}
  ${pr.id||ED()?`<div class="rproof rv"><div class="shot"${pr.id?` data-one="${bp}.proof" role="button" tabindex="0"`:''}>${pr.id?mediaTag(pr):'<div class="ph"><b>Proof screenshot</b><small>Insights or Meta results</small></div>'}${upCtl(bp+'.proof',pr,'image/*')}</div><div><span class="label" style="color:var(--sand)">Proof</span>${T(bp+'.proof.label','p','sub',{ph:'Where these numbers come from'})}</div></div>`:''}</div>`;
},
clients(s,bp){
  return `<div class="wrap">${head(bp)}<div class="cwall">${s.items.map((c,i)=>{const lg=c.logo||{};return `<div class="client rv${/your brand/i.test(c.name)?' ghost':''}"${di(bp+'.items',i)}>${itools(bp+'.items',i)}<div class="logo" style="position:relative">${lg.id?mediaTag(lg):esc((c.name||'?').trim()[0]||'?')}${upCtl(bp+'.items.'+i+'.logo',lg,'image/*')}</div><b>${T(bp+'.items.'+i+'.name','span','',{plain:1})}</b>${T(bp+'.items.'+i+'.ind','small','',{plain:1})}</div>`}).join('')}</div>${ADD(bp+'.items','Client','client')}</div>`;
},
contact(s,bp){
  const IC={book:'◷',email:'✉',instagram:'◎',facebook:'f',linkedin:'in',tiktok:'♪'};
  const href=k=>k==='book'?book():k==='email'?(S.site.email?'mailto:'+esc(S.site.email):''):esc(S.site[k]||'');
  const val=k=>k==='email'?S.site.email:k==='book'?'':(S.site[k]||'').replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,'');
  return `<div class="wrap grid"><div class="rv">${T(bp+'.title','h2')}${T(bp+'.text','p','lead')}</div><div class="ccards rv">${s.cards.map((c,i)=>{const h=href(c.k);if(!h&&!ED())return '';return `<a class="ccard" href="${h||'#'}"${/^https?:/.test(h)?' target="_blank" rel="noopener"':''}${c.k==='book'?' data-book="1"':''}${di(bp+'.cards',i)}>${itools(bp+'.cards',i)}<i>${IC[c.k]||'→'}</i><div><small>${T(bp+'.cards.'+i+'.t','span','',{plain:1})}</small><b>${T(bp+'.cards.'+i+'.d','span','',{plain:1,ph:'Optional note'})||esc(val(c.k)||'')}${ED()&&!h?' <em style="color:var(--wine);font-size:12px">(add the link in Links)</em>':''}</b></div><span class="go">↗</span></a>`}).join('')}</div></div>`;
},
free(s,bp){return `<div class="wrap">${head(bp,{sub:1})}${freeHTML(s,bp)}</div>`},
text(s,bp){return `<div class="wrap">${head(bp)}<div class="paras">${s.paras.map((p,i)=>`<p style="position:relative"${di(bp+'.paras',i)}>${itools(bp+'.paras',i)}${T(bp+'.paras.'+i,'span','',{ml:1})}</p>`).join('')}</div>${ADD(bp+'.paras','Paragraph','para')}</div>`}
};

/* ---------- industries ---------- */
function countMedia(x){return industryMedia(x).length}
function industryMedia(x){const out=[];(function w(o,k){if(Array.isArray(o))o.forEach(v=>w(v));else if(o&&typeof o==='object'){if('id' in o&&'kind' in o&&o.id&&k!=='avatar')out.push(o);Object.entries(o).forEach(([kk,v])=>w(v,kk))}})(x.blocks);return out}
const STATUS={concept:['Concept campaign','Sample work I created to show my approach. Not a paid client.'],client:['Client results','Real work for a real client, with real numbers.'],soon:['Coming soon','Campaign in progress.'],own:['My own work','Real content from my own accounts and campaigns.']};
function industry(x,p,k,arr,band,nx){
  const st=STATUS[x.status]||STATUS.concept,c=countMedia(x);
  const bar=ED()?`<div class="inbar"><span>Industry</span><button data-cyc="${p}.status" data-opts="concept|client|own|soon">Label: ${st[0]}</button><button data-im="${arr}" data-i="${k}" data-d="-1" aria-label="Move industry up">↑</button><button data-im="${arr}" data-i="${k}" data-d="1" aria-label="Move industry down">↓</button><button data-dupi="${arr}" data-i="${k}">Duplicate</button><button data-hidei="${p}">${x.hidden?'Show':'Hide'}</button><button data-del="${arr}" data-i="${k}" data-confirm="1">Delete</button><button data-badd="${p}">+ Add block</button></div>`:'';
  const open=OPENIND.has(x.key),hasMore=x.blocks.some(b=>!b.preview&&(!b.hidden||ED())),pv=x.blocks.some(b=>b.preview);
  let n=0;const blocks=(x.status==='soon'&&!ED())?soonTeaser(x):x.blocks.map((b,i)=>(b.hidden&&!ED())?'':(ED()||open||b.preview||!pv)?block(b,p+'.blocks.'+i,n++,p+'.blocks',x,i):'').join('');
  const more=x.status!=='soon'&&hasMore&&pv&&!ED()?`<button class="seeall" data-more="${esc(x.key)}" aria-expanded="${open}">${open?'Show less':'See more of this content'} <span class="arrow">${open?'↑':'→'}</span></button>`:'';
  const cta=x.status!=='soon'?`<div class="indcta rv"><a class="btn pri" ${bookA()}>Book a call with me</a>${more?`<span>or</span>${more}`:''}</div>`:'';
  return `<section class="ind ${band}${x.hidden?' is-hidden':''}" id="ind-${esc(x.key)}" data-ind="${esc(x.key)}"><div class="wrap">${bar}
  <div class="ind-top rv"><div><div class="badges"><span class="chip ${x.status==='soon'?'soft':'wine'}">${st[0]}</span></div>${T(p+'.name','h3','',{plain:1})}</div>${more}</div>
  <div class="ind-intro rv">${T(p+'.intro','p','big')}<div>${T(p+'.lede','p','sub',{ph:'Who this is for'})}<span class="honest">${st[1]}</span></div></div>
  ${blocks}${cta}${nx?`<div class="next"><a href="#ind-${esc(nx.key)}"><small>Next</small> ${esc(nx.name)} <span class="arrow">→</span></a></div>`:''}</div></section>`;
}
function soonTeaser(x){return `<div class="soon rv"><div><p class="callout">This campaign is in the works.</p><p class="sub" style="margin:12px 0 22px">I’m building a campaign for a new industry every week. Want yours to be next?</p><a class="btn pri" ${bookA()}>Book a call with me</a></div><div class="ghosts">${[0,1,2].map(()=>`<div class="phone"><div class="screen"><div class="ph"><small>Soon</small></div></div></div>`).join('')}</div></div>`}
function block(b,p,i,arr,x,ri){if(ri==null)ri=i;
  const tools=ED()?`<div class="inbar" style="margin-bottom:10px"><span>Block · ${esc(BLOCKS[b.kind]?BLOCKS[b.kind].label:b.kind)}</span><button data-cyc="${p}.hidden" data-opts="|1" title="Hidden blocks are only seen by you in admin">${b.hidden?'◌ Hidden from visitors':'● Shown to visitors'}</button><button data-cyc="${p}.preview" data-opts="|1" title="Preview blocks show first; the rest appear after See more">${b.preview?'In preview ✓':'Only after See more'}</button><button data-im="${arr}" data-i="${ri}" data-d="-1" aria-label="Move block up">↑</button><button data-im="${arr}" data-i="${ri}" data-d="1" aria-label="Move block down">↓</button>${b.kind==='reels'?`<button data-cyc="${p}.layout" data-opts="|grid">${b.layout==='grid'?'Grid':'Scroll row'}</button>`:''}${b.kind==='gallery'?`<button data-cyc="${p}.shape" data-opts="auto|sq">${b.shape==='sq'?'Square':'Natural shape'}</button>`:''}<button data-dupi="${arr}" data-i="${ri}">Duplicate</button><button data-del="${arr}" data-i="${ri}" data-confirm="1">Delete</button></div>`:'';
  return `<div class="blk">${tools}<div class="bhead rv"><span class="num">${pad(i+1)}</span>${T(p+'.label','span','label',{plain:1})}${T(p+'.title','h4')}${T(p+'.sub','p','sub',{ph:'Optional short intro'})}</div>${(BR[b.kind]||(()=>''))(b,p,x)}</div>`;
}
const BR={
free(b,p){return freeHTML(b,p)},
reels(b,p){const a=p+'.items';return `<div class="rail${b.layout==='grid'?' grid':''}">${b.items.map((m,i)=>`<div class="ritem" style="position:relative"${di(a,i)}>${itools(a,i)}${phone(m,a+'.'+i,{ph:m.type,phs:'Reel coming soon',open:a,at:i,chip:(m.type||ED())?T(a+'.'+i+'.type','span','chip typechip',{plain:1,ph:'Type'}):''})}${T(a+'.'+i+'.cap','p','cap',{ph:'What this reel does'})}</div>`).join('')}${ED()?`<button class="addtile" data-add="${a}" data-tpl="reel">+ Reel</button>`:''}</div>`},
carousels(b,p){const a=p+'.items';return `<div class="cars">${b.items.map((c,i)=>{const cp=a+'.'+i;return `<div class="car"${di(a,i)}>${itools(a,i)}${T(cp+'.pillar','span','chip wine pill',{plain:1,ph:'Pillar'})||`<span class="chip wine pill">${esc(c.pillar)}</span>`}<div class="ctrack" data-ctrack="1">${c.slides.map((sl,j)=>`<div class="slide">${sl.id?mediaTag(sl):`<div class="ph"><b>Slide ${j+1}</b><small>${esc(c.pillar||'')}</small></div>`}${upCtl(cp+'.slides.'+j,sl,'image/*,video/*')}${ED()?`<div class="itools"><button data-del="${cp}.slides" data-i="${j}" title="Remove slide" aria-label="Remove slide">×</button></div>`:''}</div>`).join('')}</div>${c.slides.length>1?`<button class="carr l" data-car="-1" aria-label="Previous slide">‹</button><button class="carr r" data-car="1" aria-label="Next slide">›</button>`:''}<div class="cdots">${c.slides.map((_,j)=>`<i class="${j?'':'on'}"></i>`).join('')}</div><div class="cfoot">${T(cp+'.cap','p','',{ph:'What this carousel is about'})}${ED()?`<button class="upbtn" data-add="${cp}.slides" data-tpl="slide">+ Slide</button>`:`<span class="label">${c.slides.length} slides</span>`}</div></div>`}).join('')}</div>${ADD(a,'Carousel','car')}`},
feed(b,p,x){const pr=b.profile,pp=p+'.profile',av=pr.avatar||{};const hls=pr.hls||['Start here','Reviews','Offers','About'];
  const shot=pr.shot||{};const shotUI=ED()?`<div class="shotctl">${upCtl(pp+'.shot',shot,'image/*')}${shot.id?`<button class="upbtn" data-del="${pp}" data-i="shot" data-obj="1">Use the editable mockup</button>`:''}</div>`:'';
  if(shot.id)return `<div class="feedwrap${b.lp?' has-lp':''}"><div class="shotcol rv"><div class="phone"><div class="screen"><div class="igshot" tabindex="0" aria-label="Scrollable profile screenshot">${mediaTag(shot)}</div></div></div>${shotUI}${T(pp+'.shotcap','p','cap shotcap',{ph:'Caption under the phone'})}</div>
  ${b.lp?lpPhone(b,p,x):''}<div class="feedtxt rv"><div class="lead"><i>↗</i><div><span class="label">Bio link = lead magnet</span>${T(p+'.linkNote','p','',{ph:'Why the link matters'})}</div></div><ul>${(b.points||[]).map((t,i)=>`<li style="position:relative"${di(p+'.points',i)}>${itools(p+'.points',i)}${T(p+'.points.'+i,'span','',{plain:1})}</li>`).join('')}</ul>${ADD(p+'.points','Point','point')}</div></div>`;
  return `<div class="feedwrap${b.lp?' has-lp':''}"><div class="phone rv"><div class="screen"><div class="ig"><div class="handle">${T(pp+'.handle','span','',{plain:1})}</div>
  <div class="top"><div class="av"><div style="position:relative">${av.id?mediaTag(av):esc((pr.name||'Y')[0])}${upCtl(pp+'.avatar',av,'image/*')}</div></div><div class="nums"><span><b>${T(pp+'.posts','span','',{plain:1})}</b>posts</span><span><b>${T(pp+'.followers','span','',{plain:1})}</b>followers</span><span><b>${T(pp+'.following','span','',{plain:1})}</b>following</span></div></div>
  <div class="bio"><b>${T(pp+'.name','span','',{plain:1})}</b>${T(pp+'.bio','span','',{plain:1,ml:1})}</div>
  <div class="lnk"><span aria-hidden="true">🔗</span>${T(pp+'.link','span','',{plain:1})}${T(pp+'.linkTag','span','chip',{plain:1})}</div>
  <div class="igbtns"><span>Follow</span><span>Message</span></div><div class="hls">${hls.map(h=>`<span>${esc(h)}</span>`).join('')}</div>
  <div class="gridp">${b.posts.map((m,i)=>`<div>${mediaTag(m)}${upCtl(p+'.posts.'+i,m)}</div>`).join('')}</div></div></div>${shotUI}</div>
  ${b.lp?lpPhone(b,p,x):''}<div class="feedtxt rv"><div class="lead"><i>↗</i><div><span class="label">Bio link = lead magnet</span>${T(p+'.linkNote','p','',{ph:'Why the link matters'})}</div></div><ul>${(b.points||[]).map((t,i)=>`<li style="position:relative"${di(p+'.points',i)}>${itools(p+'.points',i)}${T(p+'.points.'+i,'span','',{plain:1})}</li>`).join('')}</ul>${ADD(p+'.points','Point','point')}${ED()?'<p class="editnote">Tip: hover a grid square in the phone to add a post. Edit the name, bio and link right in the phone.</p>':''}${ED()&&!b.lp?`<button class="addbtn" data-addlp="${p}">+ Add link-in-bio page</button>`:''}${ED()&&b.lp?`<button class="addbtn" data-del="${p}" data-i="lp" data-obj="1" data-confirm="1">Remove link-in-bio page</button>`:''}</div></div>`},
ai(b,p){const a=p+'.items',it=b.items.map((m,i)=>({m,i})),reels=it.filter(o=>o.m.fmt==='reel'),photos=it.filter(o=>o.m.fmt!=='reel');
  const fmtBtn=i=>ED()?`<button class="upbtn aifmt" data-cyc="${a}.${i}.fmt" data-opts="reel|photo">Show as ${get(a+'.'+i+'.fmt')==='reel'?'photo':'reel'}</button>`:'';
  const card=({m,i})=>m.fmt==='reel'?`<div class="ritem" style="position:relative"${di(a,i)}>${itools(a,i)}${phone(m,a+'.'+i,{ph:m.type||m.label||'AI reel',phs:'AI reel coming soon',open:a,at:i,chip:T(a+'.'+i+'.type','span','chip typechip',{plain:1,ph:'Type'})})}${T(a+'.'+i+'.cap','p','cap',{ph:'What it is'})}${fmtBtn(i)}</div>`
   :`<div class="aiph"${di(a,i)}><div class="mbox"${m.id&&!ED()?` data-open="${a}" data-at="${i}" role="button" tabindex="0"`:''}>${itools(a,i)}${m.id?mediaTag(m):'<div class="ph"><small>AI photo coming soon</small></div>'}${T(a+'.'+i+'.type','span','chip tag',{plain:1,ph:'Type'})||(m.label?`<span class="chip tag">${esc(m.label)}</span>`:'')}${upCtl(a+'.'+i,m)}</div>${T(a+'.'+i+'.cap','p','cap',{ph:'What it is'})}${fmtBtn(i)}</div>`;
  return `<div class="aiwrap${reels.length?'':' noreels'}"><div class="note rv"><span class="label">A note from ${esc(S.site.brand)}</span>${T(p+'.note','p','',{ml:1})}</div>${reels.length?`<div class="aireels rv">${reels.map(card).join('')}</div>`:''}</div>${photos.length?`<div class="aiphotos rv">${photos.map(card).join('')}</div>`:''}${ED()?`<button class="addbtn" data-add="${a}" data-tpl="aireel">+ AI reel</button> <button class="addbtn" data-add="${a}" data-tpl="aiphoto">+ AI photo</button>`:''}`},
film(b,p){const a=p+'.guides',w=p+'.ways';const ways=(b.ways&&(b.ways.length||ED()))?`<div class="ways rv"><span class="label">Pick how you want to be guided</span><div class="wayrow">${(b.ways||[]).map((o,j)=>`<div class="way"${di(w,j)}>${itools(w,j)}<b class="wnum">${j+1}</b>${T(w+'.'+j+'.t','h6','',{plain:1})}${T(w+'.'+j+'.d','p','',{plain:1,ph:'How it works'})}</div>`).join('')}</div>${ADD(w,'Option','way')}</div>`:'';return ways+b.guides.map((g,i)=>{const gp=a+'.'+i;return `<div class="guide rv${(g.reel&&g.reel.id)||ED()?'':' noreel'}"${di(a,i)}>${itools(a,i)}${(g.reel&&g.reel.id)||ED()?`<div><div class="gtag"><span class="chip wine">Finished reel</span></div>${phone(g.reel||{},gp+'.reel',{ph:'Finished reel',phs:'Shown next to its guide'})}</div>`:''}
  <div>${T(gp+'.title','h5','',{plain:1})}<div class="gcols">
  <div class="gpart hook"><span class="label">What to say · the hook</span>${T(gp+'.hook','p','',{plain:1})}</div>
  <div class="gpart"><span class="label">Short script</span>${T(gp+'.script','p','',{plain:1,ml:1})}</div>
  <div class="gpart"><span class="label">Shot list</span><ol>${g.shots.map((t,j)=>`<li${di(gp+'.shots',j)}>${itools(gp+'.shots',j,{nomove:1})}${T(gp+'.shots.'+j,'span','',{plain:1})}</li>`).join('')}</ol>${ADD(gp+'.shots','Shot','shot')}</div>
  <div class="gpart"><span class="label">Angles & setup</span><div class="setup">${g.setup.map((s,j)=>`<div${di(gp+'.setup',j)}>${itools(gp+'.setup',j,{nomove:1})}${T(gp+'.setup.'+j+'.k','b','',{plain:1})}${T(gp+'.setup.'+j+'.d','span','',{plain:1,ph:'How to set it up'})}</div>`).join('')}</div>${ADD(gp+'.setup','Angle','setup')}</div>
  </div></div></div>`}).join('')+ADD(a,'Filming guide','guide')},
gallery(b,p){const a=p+'.items';const list=b.items.map((m,i)=>({m,i})).filter(o=>ED()||o.m.id);const clip=!ED()&&list.length>8;
  return `<div class="gal${b.shape==='sq'?' sq':''}${clip?' clip':''}">${list.map(({m,i})=>`<div${di(a,i)}${m.id&&!ED()?` data-open="${a}" data-at="${i}" role="button" tabindex="0" aria-label="Open image"`:''}>${itools(a,i)}${m.id?mediaTag(m):'<div class="ph"><small>Add photo</small></div>'}${upCtl(a+'.'+i,m)}</div>`).join('')}</div>${clip?`<div style="text-align:center;margin-top:8px"><button class="seeall" data-open="${a}" data-at="${list[8].i}">See all ${list.length} <span class="arrow">→</span></button></div>`:''}${ADD(a,'Photo','media')}`},
proof(b,p){const m=b.media||{};const showShot=m.id||ED();return `<div class="proof${showShot?'':' noshot'}">${showShot?`<div class="shot rv"${m.id?` data-one="${p}.media" role="button" tabindex="0"`:''}>${m.id?mediaTag(m):'<div class="ph" style="position:relative;aspect-ratio:1"><b>Optional photo</b><small>Hidden from visitors while empty</small></div>'}${upCtl(p+'.media',m,'image/*')}</div>`:''}<div class="rv"><div class="pstats">${b.stats.map((s,i)=>`<div${di(p+'.stats',i)}>${itools(p+'.stats',i)}<b class="count">${T(p+'.stats.'+i+'.v','span','',{plain:1})}</b>${T(p+'.stats.'+i+'.l','small','',{plain:1})}</div>`).join('')}</div>${ADD(p+'.stats','Stat','stat')}${T(p+'.callout','p','callout',{ph:'One-line takeaway'})}</div></div>`}
};
const LPI={key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9m-3 3l3 3m-6 0l2 2"/>',home:'<path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z"/>',tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',star:'<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'};
const lpIcon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LPI[n]||LPI.star}</svg>`;
function lpPhone(b,p,x){
  const L=b.lp,lp=p+'.lp',sh=L.shot||{},lg=L.logo||{},c=L.colors||{};
  const vars=`--lpd:${c.dark||'var(--merlot)'};--lpd2:${c.dark2||'var(--wine)'};--lpa:${c.accent||'var(--sand)'};--lpbg:${c.bg||'var(--paper)'}`;const TC=S.theme.colors,dflt={dark:TC.merlot,dark2:TC.wine,accent:TC.sand,bg:TC.paper};
  const mock=`<div class="lpg" style="${vars}"><div class="lphero"><div class="lplogo">${lg.id?mediaTag(lg):(ED()?'<span>Logo</span>':'')}${upCtl(lp+'.logo',lg,'image/*')}</div>
   ${T(lp+'.eyebrow','span','lpeye',{plain:1})}${T(lp+'.title','b','lptitle',{plain:1})}${T(lp+'.sub','p','lpsub',{plain:1})}
   <div class="lpchips">${L.chips.map((x,i)=>`<span${di(lp+'.chips',i)}>${itools(lp+'.chips',i,{nomove:1})}${T(lp+'.chips.'+i,'span','',{plain:1})}</span>`).join('')}${ED()?`<button class="upbtn" data-add="${lp}.chips" data-tpl="lpchip">+ Badge</button>`:''}</div></div>
   <div class="lpbody">${T(lp+'.ask','b','lpask',{plain:1})}
   ${L.paths.map((x,i)=>`<div class="lppath${i===0?' first':''}"${di(lp+'.paths',i)}>${itools(lp+'.paths',i)}<span class="lpic"${ED()?` data-cyc="${lp}.paths.${i}.icon" data-opts="key|home|tag|search|star|chat|calendar|heart" title="Click to change the icon" role="button"`:''}>${lpIcon(x.icon)}</span><div>${(x.badge||ED())?T(lp+'.paths.'+i+'.badge','span','lpbadge',{plain:1,ph:'Badge (optional)'}):''}${T(lp+'.paths.'+i+'.t','b','',{plain:1})}${T(lp+'.paths.'+i+'.d','small','',{plain:1})}</div><i>›</i></div>`).join('')}
   ${ED()?`<button class="upbtn" data-add="${lp}.paths" data-tpl="lppath">+ Path</button>`:''}
   <div class="lpbtns">${T(lp+'.btn1','span','',{plain:1})}${T(lp+'.btn2','span','',{plain:1})}</div>${T(lp+'.contact','small','lpcontact',{plain:1})}</div></div>`;
  const colors=ED()?`<div class="lpcols">Page colors ${['dark','dark2','accent','bg'].map(k=>`<input type="color" data-lpcol="${lp}.colors.${k}" value="${esc(c[k]||dflt[k])}" title="${({dark:'Header',dark2:'Header fade',accent:'Accent',bg:'Background'})[k]}" aria-label="${k}">`).join('')}</div>`:'';
  return `<div class="lpcol rv"><span class="lparrow" aria-hidden="true">Tap the link →</span><div class="phone"><div class="screen">${sh.id?`<div class="lpshot"${ED()?'':` data-one="${lp}.shot" role="button" tabindex="0"`}>${mediaTag(sh)}</div>`:mock}${ED()?`<div class="lpup"><label class="upbtn">${sh.id?'Replace screenshot':'Use a screenshot instead'}<input type="file" accept="image/*" data-up="${lp}.shot"></label>${sh.id?`<button class="upbtn" data-clear="${lp}.shot">Back to the editable page</button>`:''}</div>`:''}</div></div>${colors}${T(lp+'.cap','p','lpcap',{ph:'Caption under the page'})}${L.url?`<a class="lplive" href="${esc(L.url)}${L.url.includes('?')?'&':'?'}i=${esc((x&&x.key)||'')}" target="_blank" rel="noopener">Open the live example <span class="arrow">↗</span></a>`:''}${ED()&&L.colors&&Object.keys(L.colors).length?`<button class="upbtn" style="margin:8px auto 0;display:flex" data-lpreset="${lp}.colors">Use my brand colors</button>`:''}</div>`;
}
const BLOCKS={
  free:{label:'Free block',hint:'Notion-style: start empty or from a template, add anything',make:()=>freeNew()},
  reels:{label:'Reels',hint:'Phone-frame reels, each labeled by type',make:()=>({kind:'reels',label:'Reels',title:'Reels for your *brand*',sub:'',items:['Type 1','Type 2','Type 3','Type 4'].map(t=>Object.assign(clone(TPL.reel),{type:t}))})},
  carousels:{label:'Carousels',hint:'Swipeable posts labeled by pillar',make:()=>({kind:'carousels',label:'Carousels',title:'Carousels by *content pillar*',sub:'',items:[clone(TPL.car),clone(TPL.car),clone(TPL.car)]})},
  feed:{label:'Your feed',hint:'Instagram profile mockup with lead-magnet link',make:()=>stripMedia(clone(DEFAULT.sections.find(s=>s.type==='industries').industries[0].blocks.find(b=>b.kind==='feed')))},
  ai:{label:'AI content',hint:'Your note on AI + AI reels and photos',make:()=>({kind:'ai',label:'AI content',title:'Where AI *fits*',note:'Your note about how you use AI for this industry.',items:[clone(TPL.aireel),clone(TPL.aiphoto),clone(TPL.aiphoto)]})},
  film:{label:'How to film this',hint:'Hook, script, shot list, angles',make:()=>({kind:'film',label:'How to film this',title:'I guide you *from zero* on camera',sub:'',ways:[{t:'Shot list & angles',d:'Your script, a shot list and angle guides. You film on your own time.'},{t:'Guide videos',d:'Sample videos showing each shot, so you can copy the framing and timing.'}],guides:[clone(TPL.guide)]})},
  gallery:{label:'Photo gallery',hint:'Graphics, posts or photos',make:()=>({kind:'gallery',label:'Graphics',title:'Posts *and graphics*',sub:'',shape:'auto',items:[0,1,2,3].map(()=>clone(TPL.media))})},
  proof:{label:'Results proof',hint:'Screenshot + numbers',make:()=>({kind:'proof',label:'Client results',title:'The *results*',sub:'',media:clone(TPL.media),stats:[clone(TPL.stat)],callout:''})}
};

/* ---------- page shell ---------- */
function navHTML(){
  const links=S.sections.filter(s=>s.nav&&!s.hidden).map(s=>`<a href="#${esc(s.id)}" data-nid="${esc(s.id)}">${esc(s.nav)}</a>`).join('');
  return `<nav class="nav" id="nav" aria-label="Main"><a class="brand" href="#top">${esc(S.site.brand)} <em>${esc(S.site.brandEm)}</em></a><div class="nlinks">${links}</div><a class="btn pri" ${bookA()}>${T('site.navCta','span','',{plain:1})||'Work with me'}</a><button class="mtog" data-mtog="1" aria-label="Open menu" aria-expanded="false"><span></span></button></nav>`;
}
function sectionsHTML(){
  let out='';
  S.sections.forEach((s,i)=>{
    if(s.hidden&&!ED())return;
    const bp='sections.'+i,r=R[s.type];if(!r)return;
    const bar=ED()?`<div class="secbar"><button class="dh dsec" title="Drag to move this section" aria-label="Drag section">⠿</button><span>${NAMES[s.type]||s.type}</span><button data-im="sections" data-i="${i}" data-d="-1" aria-label="Move section up">↑</button><button data-im="sections" data-i="${i}" data-d="1" aria-label="Move section down">↓</button>${s.type==='about'?`<button data-cyc="${bp}.flip" data-opts="|1">Photo: ${s.flip?'Left':'Right'}</button>`:''}<button data-dupi="sections" data-i="${i}">Copy</button><button data-hidei="${bp}">${s.hidden?'Show':'Hide'}</button><button data-del="sections" data-i="${i}" data-confirm="1">Delete</button></div>`:'';
    const tag=s.type==='hero'?'header':'section';
    out+=`<${tag} class="sec ${SEC_CLS[s.type]||'band-paper'}${s.flip?' flip':''}${s.hidden?' is-hidden':''}" id="${esc(s.id)}"${di('sections',i)}>${bar}${s.hidden&&ED()?'<span class="hidtag">Hidden from visitors</span>':''}${r(s,bp)}</${tag}>`;
    if(ED())out+=`<div class="addsec"><button class="addbtn" style="margin:0" data-addsec="${i+1}">+ Add section here</button></div>`;
  });
  return out;
}
function footHTML(){return `<footer class="foot"><div class="wrap"><span>© ${new Date().getFullYear()} ${esc(S.site.brand)} ${esc(S.site.brandEm)} · ${T('site.footer','span','',{plain:1})}</span><span class="r"><a href="#top">Back to top ↑</a><a href="#" data-login="1">Admin</a></span></div></footer>`}
let IOs=[];
function render(keep=true){
  const y=scrollY;applyTheme();
  document.getElementById('root').innerHTML=navHTML()+'<main>'+sectionsHTML()+'</main>'+footHTML();
  document.body.classList.toggle('editing',ED());document.body.classList.toggle('admin',ADMIN);
  if(ED())document.querySelectorAll('[data-p]').forEach(el=>{el.contentEditable=PT?'plaintext-only':'true';el.spellcheck=true});
  wire();renderAdmin();
  if(keep)scrollTo(0,y);
}
const PT=(()=>{const d=document.createElement('div');try{d.contentEditable='plaintext-only';return d.contentEditable==='plaintext-only'}catch(e){return false}})();

/* ---------- behaviour: reveal, counters, videos, slideshow, nav ---------- */
function wire(){
  IOs.forEach(o=>o.disconnect());IOs=[];
  const io=(fn,opt)=>{const o=new IntersectionObserver(fn,opt);IOs.push(o);return o};
  const rv=io(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');rv.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.rv').forEach(el=>rv.observe(el));
  if(!ED()){const cn=io(es=>es.forEach(e=>{if(e.isIntersecting){countUp(e.target);cn.unobserve(e.target)}}),{threshold:.5});document.querySelectorAll('.count').forEach(el=>cn.observe(el))}
  const vio=io(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting&&e.intersectionRatio>.55){if(!v.dataset.user)v.play().catch(()=>{})}else{v.pause()}}),{threshold:[0,.55,1]});
  document.querySelectorAll('.screen video').forEach(v=>vio.observe(v));
  // section + industry nav highlighting
  const nl=io(es=>es.forEach(e=>{if(e.isIntersecting){document.querySelectorAll('.nlinks a').forEach(a=>a.classList.toggle('on',a.dataset.nid===e.target.id))}}),{rootMargin:'-45% 0px -50% 0px'});
  S.sections.forEach(s=>{const el=document.getElementById(s.id);el&&nl.observe(el)});
  const il=io(es=>es.forEach(e=>{if(e.isIntersecting){const k=e.target.dataset.ind;document.querySelectorAll('.inav a').forEach(a=>{const on=a.dataset.ikey===k;a.classList.toggle('on',on);if(on){const b=a.parentElement;b.scrollTo({left:a.offsetLeft-b.clientWidth/2+a.clientWidth/2,behavior:'smooth'})}})}}),{rootMargin:'-40% 0px -55% 0px'});
  document.querySelectorAll('[data-ind]').forEach(el=>il.observe(el));
  document.querySelectorAll('[data-ctrack]').forEach(t=>t.addEventListener('scroll',()=>{const i=Math.round(t.scrollLeft/t.clientWidth);t.parentElement.querySelectorAll('.cdots i').forEach((d,j)=>d.classList.toggle('on',j===i))},{passive:true}));
  layoutLatest();
  const st=document.querySelector('[data-stage]');
  if(st){let sx=null;st.addEventListener('pointerdown',e=>{if(e.target.closest('.uprow,.itools,[data-p],.playbtn'))return;sx=e.clientX});st.addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx;sx=null;if(Math.abs(dx)>40)stepLatest(dx<0?1:-1)})}
}
function layoutLatest(){
  const items=[...document.querySelectorAll('.lw')],n=items.length;if(!n)return;
  items.forEach((el,i)=>{const d=((i-LWI)%n+n)%n;el.className='lw '+(d===0?'p0':d===1?'p1':d===n-1?'pm1':d===2?'p2':d===n-2?'pm2':'');
    const v=el.querySelector('video');if(v){if(d===0){if(!v.dataset.user)v.play().catch(()=>{})}else{v.pause()}}});
  const s=S.sections.find(x=>x.type==='latest');if(!s)return;const m=s.items[LWI]||{};
  const n1=document.querySelector('[data-lwn]');n1&&(n1.textContent=pad(LWI+1));
  const l=document.querySelector('[data-lwl]');l&&(l.textContent=m.label||'');
  const c=document.querySelector('[data-lwc]');c&&(c.textContent=[m.cap,m.tag].filter(Boolean).join(' · '));
  document.querySelectorAll('.dotsnav i').forEach((d,i)=>d.classList.toggle('on',i===LWI));
}
function stepLatest(d){const s=S.sections.find(x=>x.type==='latest');if(!s||!s.items.length)return;LWI=(LWI+d+s.items.length)%s.items.length;if(ED())render();else layoutLatest()}
function countUp(el){
  const orig=el.textContent,parts=orig.split(/(\d[\d,]*(?:\.\d+)?)/);if(parts.length<2)return;
  const nums=parts.map((p,i)=>i%2?{v:parseFloat(p.replace(/,/g,'')),dec:(p.split('.')[1]||'').length,comma:p.includes(',')}:null);
  const t0=performance.now(),dur=1600;
  const f=now=>{const k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,4);
    el.textContent=parts.map((p,i)=>{if(!(i%2))return p;const o=nums[i],v=o.v*e;let s=v.toFixed(o.dec);if(o.comma)s=Number(s).toLocaleString('en-US',{minimumFractionDigits:o.dec,maximumFractionDigits:o.dec});return s}).join('');
    if(k<1)requestAnimationFrame(f);else el.textContent=orig};
  requestAnimationFrame(f);
}

/* ---------- lightbox ---------- */
let LB=null;
function openLB(list,idx){if(!list.length)return;LB={list,idx:Math.max(0,idx),prev:document.activeElement};drawLB()}
function drawLB(){let el=document.getElementById('lb');if(!LB){el&&el.remove();return}
  if(!el){el=document.createElement('div');el.id='lb';el.className='lb';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Viewer');document.body.appendChild(el);document.body.style.overflow='hidden'}
  const m=LB.list[LB.idx];
  el.innerHTML=`<div class="top"><span>${pad(LB.idx+1)} / ${pad(LB.list.length)}</span><button data-lb="x" aria-label="Close">×</button></div><div class="stg"><button data-lb="-1" aria-label="Previous">‹</button><div class="box">${m.kind==='video'?`<video src="${esc(src(m.id))}" controls autoplay playsinline></video>`:`<img src="${esc(src(m.id))}" alt="${esc(m.label||m.cap||'')}">`}</div><button data-lb="1" aria-label="Next">›</button></div><div class="cap">${esc([m.type,m.label,m.cap].filter(Boolean).join(' · '))}</div>`;
  el.querySelector('[data-lb="x"]').focus();
  const box=el.querySelector('.box');let sx=null;box.addEventListener('pointerdown',e=>sx=e.clientX);box.addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx;sx=null;if(Math.abs(dx)>50)stepLB(dx<0?1:-1)});
}
function stepLB(d){if(!LB)return;LB.idx=(LB.idx+d+LB.list.length)%LB.list.length;drawLB()}
function closeLB(){const p=LB&&LB.prev;LB=null;const el=document.getElementById('lb');el&&el.remove();document.body.style.overflow='';p&&p.focus&&p.focus()}

/* ---------- events ---------- */
document.addEventListener('input',e=>{const el=e.target.closest&&e.target.closest('[data-p]');if(!el||!ED())return;set(el.dataset.p,el.innerText.replace(/\n+$/,''));markDirty(true)});
document.addEventListener('keydown',e=>{
  if(LB){if(e.key==='Escape')closeLB();if(e.key==='ArrowRight')stepLB(1);if(e.key==='ArrowLeft')stepLB(-1);return}
  const el=e.target.closest&&e.target.closest('[data-p]');
  if(el&&ED()&&e.key==='Enter'&&!e.shiftKey&&!el.dataset.ml){e.preventDefault();el.blur();return}
  const op=e.target.closest&&e.target.closest('[data-open],[data-one]');if(op&&!ED()&&(e.key==='Enter'||e.key===' ')){e.preventDefault();op.click()}
  if(e.key==='Escape'){closeBooking();const n=document.getElementById('nav');n&&n.classList.remove('open');closePanel()}
});
document.addEventListener('click',e=>{
  const t=e.target;
  const lb=t.closest('[data-lb]');if(lb){lb.dataset.lb==='x'?closeLB():stepLB(+lb.dataset.lb);return}
  if(t.id==='lb'){closeLB();return}
  const mt=t.closest('[data-mtog]');if(mt){const n=document.getElementById('nav'),o=!n.classList.contains('open');n.classList.toggle('open',o);mt.setAttribute('aria-expanded',o);return}
  if(t.closest('.nlinks a'))document.getElementById('nav').classList.remove('open');
  const lg=t.closest('[data-login]');if(lg){e.preventDefault();openLogin();return}
  if(ED()&&t.closest('[data-p]')){if(t.closest('a,button'))e.preventDefault();return}
  if(ED()&&t.closest('a[href]')&&!t.closest('.panel')){e.preventDefault()}
  const pl=t.closest('[data-play]');if(pl){const v=pl.parentElement.querySelector('video');document.querySelectorAll('.screen video').forEach(o=>{if(o!==v){o.muted=true}});v.dataset.user='1';if(v.paused||v.muted){v.currentTime=0;v.muted=false;v.play().catch(()=>{});pl.textContent='❚❚ Pause'}else{v.pause();pl.textContent='▶ Play with sound'}return}
  const lw=t.closest('[data-lw]');if(lw){stepLatest(+lw.dataset.lw);return}
  const side=t.closest('.lw.p1,.lw.pm1');if(side&&!t.closest('.uprow,.itools')){stepLatest(side.classList.contains('p1')?1:-1);return}
  const ca=t.closest('[data-car]');if(ca){const tr=ca.parentElement.querySelector('[data-ctrack]');tr.scrollBy({left:(+ca.dataset.car)*tr.clientWidth,behavior:'smooth'});return}
  const bk=t.closest('[data-book]');if(bk&&!ED()){if(openBooking()){e.preventDefault();return}}
  if(t.closest('[data-bkx]')||t.id==='bk'){closeBooking();return}
  const mo=t.closest('[data-more]');if(mo){const k=mo.dataset.more;const was=OPENIND.has(k);was?OPENIND.delete(k):OPENIND.add(k);render();if(was){const el=document.getElementById('ind-'+k);el&&el.scrollIntoView({behavior:'smooth'})}return}
  const sa=t.closest('[data-seeall]');if(sa){openLB(industryMedia(get(sa.dataset.seeall)),0);return}
  if(!ED()){
    const op=t.closest('[data-open]');if(op){const arr=get(op.dataset.open),tg=arr[+op.dataset.at];const list=arr.filter(m=>m&&m.id);openLB(list,list.indexOf(tg));return}
    const one=t.closest('[data-one]');if(one){openLB([get(one.dataset.one)],0);return}
    return;
  }
  /* ----- edit-only actions ----- */
  if(t.closest('.dh'))return;
  const del=t.closest('[data-del]');if(del){e.preventDefault();const key=del.dataset.del+'#'+del.dataset.i;if(del.dataset.confirm&&pending!==key){pending=key;del.textContent='Click again to delete';del.classList.add('danger');return}pending=null;if(del.dataset.obj)delete get(del.dataset.del)[del.dataset.i];else get(del.dataset.del).splice(+del.dataset.i,1);markDirty();render();toast('Removed. Use Discard to undo before saving.');return}
  const add=t.closest('[data-add]');if(add){const a=get(add.dataset.add);a.push(clone(TPL[add.dataset.tpl]??TPL.media));markDirty();render();return}
  const im=t.closest('[data-im]');if(im){const a=get(im.dataset.im),i=+im.dataset.i,j=i+(+im.dataset.d);if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];if(im.dataset.im.endsWith('.items')&&a===(S.sections.find(x=>x.type==='latest')||{}).items)LWI=j;markDirty();render();return}
  const dup=t.closest('[data-dupi]');if(dup){const a=get(dup.dataset.dupi),i=+dup.dataset.i,c=clone(a[i]);if(c.key)c.key=uniq(c.key,a.map(x=>x.key));if(c.type&&c.id&&dup.dataset.dupi==='sections')c.id=uniq(c.id,S.sections.map(x=>x.id));a.splice(i+1,0,c);markDirty();render();toast('Copied. The copy is right below.');return}
  const hd=t.closest('[data-hidei]');if(hd){const o=get(hd.dataset.hidei);o.hidden=!o.hidden;markDirty();render();return}
  const cy=t.closest('[data-cyc]');if(cy){const ops=cy.dataset.opts.split('|'),cur=get(cy.dataset.cyc)??'';let v=ops[(ops.indexOf(String(cur===true?'1':cur))+1)%ops.length];set(cy.dataset.cyc,v==='1'?true:v);markDirty();render();return}
  const cl=t.closest('[data-clear]');if(cl){e.preventDefault();const m=get(cl.dataset.clear);if(m.kind==='video'&&m.poster){m.id=m.poster;m.kind='image'}else{m.id='';m.kind=''}delete m.poster;markDirty();render();return}
  const lr=t.closest('[data-lpreset]');if(lr){set(lr.dataset.lpreset,{});markDirty();render();return}
  const al=t.closest('[data-addlp]');if(al){const d=DEFAULT.sections.find(x=>x.type==='industries').industries[0].blocks.find(x=>x.kind==='feed').lp;const n=stripMedia(clone(d));n.cap='Where your leads land when they tap the bio link.';n.eyebrow='[Your brand] · [your city]';n.title='Your one-line promise.';n.sub='Who you help and how, in one sentence.';n.chips=['[X] happy clients','5.0 rating · [X] reviews'];n.paths=[{badge:'Free offer',t:'I’m new here',d:'Your free offer or first-visit deal',icon:'star'},{badge:'',t:'Book now',d:'See times available',icon:'calendar'},{badge:'',t:'See prices',d:'Services and packages',icon:'tag'}];n.contact='[Your number]';n.paths.forEach(x=>x.form={title:x.t,fields:['Your name','Email or phone'],btn:'Send',done:'Thank you! I’ll be in touch within a day.'});get(al.dataset.addlp).lp=n;markDirty();render();return}
  const ai=t.closest('[data-addind]');if(ai){addIndustry(ai.dataset.addind);return}
  const ba=t.closest('[data-badd]');if(ba){blockPicker(ba.dataset.badd);return}
  const as=t.closest('[data-addsec]');if(as){sectionPicker(+as.dataset.addsec);return}
});
function addIndustry(bp){
  const s=get(bp),a=s.industries,base=a.find(x=>x.key==='real-estate')||a[0]||clone(DEFAULT.sections.find(x=>x.type==='industries').industries[0]);
  const n=stripMedia(clone(base));n.name='New industry';n.key=uniq('new-industry',a.map(x=>x.key));n.status='soon';n.hidden=false;n.lede='One line about who this campaign is for.';
  a.push(n);markDirty();render();const el=document.getElementById('ind-'+n.key);el&&el.scrollIntoView({behavior:'smooth'});
  toast('Industry added with the full structure. Click “New industry” to rename it. It shows as “Coming soon” until you change its label.');
}

/* uploads */
const MAX=50*1024*1024;
document.addEventListener('input',e=>{const c=e.target.closest&&e.target.closest('[data-lpcol]');if(!c||!ED())return;set(c.dataset.lpcol,c.value);const g=c.closest('.lpcol').querySelector('.lpg');const k=c.dataset.lpcol.split('.').pop();g&&g.style.setProperty({dark:'--lpd',dark2:'--lpd2',accent:'--lpa',bg:'--lpbg'}[k],c.value);markDirty(true)});
document.addEventListener('change',async e=>{
  const inp=e.target.closest&&e.target.closest('[data-up]');if(!inp||!inp.files[0])return;
  const file=inp.files[0],p=inp.dataset.up;
  if(file.size>MAX){toast('That file is '+(file.size/1048576).toFixed(0)+' MB. The limit is 50 MB. Export reels at 720p (see Storage).');inp.value='';return}
  const host=inp.closest('.screen,.slide,.mbox,.pic,.frame,.shot,.logo,.av>div,.gal>div,.gridp>div')||document.body;
  const ov=document.createElement('div');ov.className='uploading';ov.textContent='Uploading…';host.appendChild(ov);
  try{
    const r=LOCAL?{id:URL.createObjectURL(file),contentType:file.type}:await uploadMedia(file);
    const m=get(p),isVid=(r.contentType||file.type||'').startsWith('video');if(inp.dataset.poster){m.poster=r.id}else{if(isVid&&m.id&&m.kind==='image')m.poster=m.id;m.id=r.id;m.kind=isVid?'video':'image';if(!isVid)delete m.poster}markDirty();render();
    toast(LOCAL?'Added for this preview only. On the live site, uploads are saved to Supabase.':(file.type.startsWith('video')&&file.size>20*1048576?'Added. Tip: this video is large; 720p exports load faster. Click Save & publish.':'Added. Click Save & publish to make it live.'));
  }catch(err){ov.remove();toast(err&&err.code==='too_large'?'That file is too large for storage. Keep it under 50 MB.':'Upload failed: '+((err&&err.message)||'please try again'))}
});

/* drag and drop (sections and items) */
let DRAG=null;
document.addEventListener('mousedown',e=>{if(!ED())return;const h=e.target.closest('.dh');if(h){const it=h.closest('[data-dpath]');if(it)it.draggable=true}});
document.addEventListener('mouseup',()=>{if(!DRAG)document.querySelectorAll('[draggable="true"]').forEach(n=>n.draggable=false)});
document.addEventListener('dragstart',e=>{const n=e.target;if(!n.dataset||n.dataset.dpath==null)return;DRAG={path:n.dataset.dpath,i:+n.dataset.di};n.classList.add('dragging');try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','move')}catch(_){}});
function dropTarget(t){if(!DRAG||!t.closest)return null;let n=t.closest('[data-dpath]');while(n&&n.dataset.dpath!==DRAG.path)n=n.parentElement&&n.parentElement.closest('[data-dpath]');return n}
document.addEventListener('dragover',e=>{const d=dropTarget(e.target);if(!d)return;e.preventDefault();document.querySelectorAll('.dropover').forEach(n=>n!==d&&n.classList.remove('dropover'));d.classList.add('dropover')});
document.addEventListener('drop',e=>{const d=dropTarget(e.target);if(!d)return;e.preventDefault();const a=get(DRAG.path),to=+d.dataset.di;if(to!==DRAG.i){const[x]=a.splice(DRAG.i,1);a.splice(to,0,x)}DRAG=null;markDirty();render()});
document.addEventListener('dragend',()=>{DRAG=null;document.querySelectorAll('.dragging,.dropover').forEach(n=>n.classList.remove('dragging','dropover'));document.querySelectorAll('[draggable="true"]').forEach(n=>n.draggable=false)});

/* ---------- admin bar and panels ---------- */
let saveTimer;
function markDirty(quiet){DIRTY++;clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem(DRAFT,JSON.stringify({state:S,at:Date.now()}))}catch(e){}},400);if(!quiet||DIRTY===1)renderAdmin()}
function draft(){try{const d=JSON.parse(localStorage.getItem(DRAFT)||'null');return d&&d.state&&JSON.stringify(d.state)!==JSON.stringify(S)?d:null}catch(e){return null}}
function renderAdmin(){
  let bar=document.getElementById('adminbar');
  if(!ADMIN){bar&&bar.remove();return}
  if(!bar){bar=document.createElement('div');bar.id='adminbar';bar.className='adminbar';bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Admin tools');document.body.appendChild(bar)}
  bar.innerHTML=PREVIEW?`<span class="who">Visitor view</span><button data-a="prev" aria-pressed="true">Back to admin</button>`:
  `<span class="who">${LOCAL?'Local preview':'Admin'}</span><button data-a="edit" aria-pressed="${EDIT}">${EDIT?'Done editing':'Edit page'}</button><button data-a="prev">View as visitor</button><button data-a="design">Design</button><button data-a="secs">Sections</button><button data-a="links">Links</button><button data-a="storage">Storage</button>${!DIRTY&&draft()?'<button data-a="restore">Restore draft</button>':''}${DIRTY?'<button data-a="undo">Discard</button>':''}<button data-a="save" class="save" ${DIRTY?'':'disabled'}>${DIRTY?'Save & publish':'All saved'}</button>${LOCAL?'':'<button data-a="out">Sign out</button>'}`;
}
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-a]');if(!a)return;const v=a.dataset.a;
  if(v==='edit'){EDIT=!EDIT;closePanel();render()}
  if(v==='prev'){PREVIEW=!PREVIEW;closePanel();render()}
  if(v==='design')openDesign();if(v==='secs')openSections();if(v==='links')openLinks();if(v==='storage')openStorage();
  if(v==='restore'){const d=draft();if(d){S=d.state;DIRTY=1;EDIT=true;render();toast('Draft restored.')}}
  if(v==='undo'){S=JSON.parse(LOADED);DIRTY=0;try{localStorage.removeItem(DRAFT)}catch(e){}closePanel();render();toast('Changes discarded.')}
  if(v==='save')save();if(v==='out')signOut();
});
function closePanel(){const p=document.getElementById('ddpanel');p&&p.remove()}
function panel(html){closePanel();const p=document.createElement('div');p.id='ddpanel';p.className='panel';p.setAttribute('role','dialog');p.innerHTML='<button class="x" data-pclose="1" aria-label="Close">×</button>'+html;document.body.appendChild(p);p.querySelector('[data-pclose]').onclick=closePanel;return p}
function openDesign(){
  const t=S.theme;
  const p=panel(`<h3>Design</h3><p>Colors and fonts change across the whole site. Click Save & publish to keep them.</p>
  <h4>Color presets</h4><div class="swrow">${Object.entries(PRESETS).map(([k,v])=>`<button class="preset${t.preset===k?' on':''}" data-preset="${k}"><span class="sw">${['paper','stone','wine','merlot','ink'].map(c=>`<i style="background:${v.c[c]}"></i>`).join('')}</span>${v.name}</button>`).join('')}</div>
  <h4>Your colors</h4>${Object.keys(COLOR_NAMES).map(k=>`<div class="colrow"><span>${COLOR_NAMES[k]}</span><input type="color" data-col="${k}" value="${esc(t.colors[k])}" aria-label="${COLOR_NAMES[k]}"></div>`).join('')}
  <h4>Fonts</h4>${Object.entries(FONTS).map(([k,f])=>`<button class="fontopt${t.font===k?' on':''}" data-font="${k}"><b style="font-family:${esc(f.d)}">Dally <i>Tampus</i></b><small>${f.name} · ${f.note}</small></button>`).join('')}`);
  FONTS_PRELOAD();
  p.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{t.preset=b.dataset.preset;t.colors=clone(PRESETS[t.preset].c);applyTheme();markDirty();openDesign()});
  p.querySelectorAll('[data-col]').forEach(i=>i.oninput=()=>{t.colors[i.dataset.col]=i.value;t.preset='custom';applyTheme();markDirty(true)});
  p.querySelectorAll('[data-font]').forEach(b=>b.onclick=()=>{t.font=b.dataset.font;applyTheme();markDirty();openDesign()});
}
let fontsPre=false;function FONTS_PRELOAD(){if(fontsPre)return;fontsPre=true;const l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?'+Object.values(FONTS).map(f=>f.q).join('&')+'&display=swap';document.head.appendChild(l)}
function openSections(){
  const p=panel(`<h3>Sections</h3><p>Reorder or hide sections. The menu name is what shows in the top menu; leave it empty to keep a section out of the menu.</p>
  ${S.sections.map((s,i)=>`<div class="srow"><span class="t">${NAMES[s.type]||s.type}</span><input data-navl="${i}" value="${esc(s.nav||'')}" placeholder="(not in menu)" aria-label="Menu name"><button class="ib" data-sm="${i}" data-d="-1" aria-label="Move up">↑</button><button class="ib" data-sm="${i}" data-d="1" aria-label="Move down">↓</button><button class="ib" data-sh="${i}" title="${s.hidden?'Hidden':'Visible'}" aria-label="Show or hide">${s.hidden?'◌':'●'}</button></div>`).join('')}
  <div class="row"><button class="pbtn pri" id="spAdd">+ Add section</button>${S.sections.some(s=>s.type==='industries')?'<button class="pbtn" id="spInd">+ Add industry</button>':''}</div>
  <h4>Industries</h4>${(S.sections.find(s=>s.type==='industries')||{industries:[]}).industries.map(x=>`<div class="srow"><span class="t">${STATUS[x.status]?STATUS[x.status][0].split(' ')[0]:''}</span><span style="flex:1;font-size:13px">${esc(x.name)}${x.hidden?' (hidden)':''}</span></div>`).join('')}<p style="margin-top:8px">Move, hide, duplicate or delete industries with the dark bar on each industry (Edit page).</p>`);
  p.querySelectorAll('[data-navl]').forEach(i=>i.onchange=()=>{S.sections[+i.dataset.navl].nav=i.value.trim();markDirty();render()});
  p.querySelectorAll('[data-sm]').forEach(b=>b.onclick=()=>{const i=+b.dataset.sm,j=i+(+b.dataset.d);if(j<0||j>=S.sections.length)return;[S.sections[i],S.sections[j]]=[S.sections[j],S.sections[i]];markDirty();render();openSections()});
  p.querySelectorAll('[data-sh]').forEach(b=>b.onclick=()=>{const s=S.sections[+b.dataset.sh];s.hidden=!s.hidden;markDirty();render();openSections()});
  p.querySelector('#spAdd').onclick=()=>sectionPicker(S.sections.length);
  const pi=p.querySelector('#spInd');pi&&(pi.onclick=()=>{closePanel();if(!EDIT){EDIT=true}addIndustry('sections.'+S.sections.findIndex(s=>s.type==='industries'))});
}
function sectionPicker(at){
  const types=['free','about','latest','industries','services','process','results','clients','contact','text'];
  const p=panel(`<h3>Add a section</h3><p>New sections start with sample content you can edit.</p><div class="picker">${types.map(k=>`<button data-pick="${k}">${NAMES[k]}</button>`).join('')}</div>`);
  p.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const k=b.dataset.pick;const d=DEFAULT.sections.find(s=>s.type===k);
    const n=k==='free'?Object.assign({type:'free',id:'free',nav:'',title:'',sub:''},{els:[]}):d?clone(d):{type:'text',id:'text',nav:'',title:'New *section*',paras:['Write something here.']};n.id=uniq(n.id,S.sections.map(s=>s.id));n.hidden=false;
    S.sections.splice(at,0,n);EDIT=true;markDirty();closePanel();render();if(k==='free'){freeTemplates('sections.'+at+'.els');return}const el=document.getElementById(n.id);el&&el.scrollIntoView({behavior:'smooth'});toast(NAMES[k]+' added. Click any text to edit it.')});
}
function blockPicker(indPath){
  const p=panel(`<h3>Add a block</h3><p>Adds to the end of this industry. Move it with the arrows on its dark bar.</p><div class="picker">${Object.entries(BLOCKS).map(([k,v])=>`<button data-bk="${k}">${v.label}<small>${v.hint}</small></button>`).join('')}</div>`);
  p.querySelectorAll('[data-bk]').forEach(b=>b.onclick=()=>{get(indPath).blocks.push(BLOCKS[b.dataset.bk].make());markDirty();closePanel();render();toast('Block added.')});
}
function openLinks(){
  const f=(k,l,ph)=>`<label>${l}<input data-k="${k}" value="${esc(S.site[k]||'')}" placeholder="${ph}"></label>`;
  const p=panel(`<h3>Links</h3><p>Every “Book a call” button uses your booking link. A Google Form, a Google Calendar booking page or a Calendly link opens right on your site as a pop-up; any other link opens in a new tab.</p><p>Right now it opens your form first (step 1). The form's thank-you message links to your calendar (step 2), which needs at least 5 hours' notice so you always have time to prepare.</p>${f('book','Booking link','https://calendly.com/…')}${f('email','Email','you@example.com')}${f('instagram','Instagram','https://instagram.com/…')}${f('facebook','Facebook','https://facebook.com/…')}${f('linkedin','LinkedIn','https://linkedin.com/in/…')}${f('tiktok','TikTok','https://tiktok.com/@…')}<h4>Name in the menu</h4>${f('brand','First word','Dally')}${f('brandEm','Second word (italic)','Tampus')}<div class="row"><button class="pbtn pri" id="lnA">Apply</button></div>`);
  p.querySelector('#lnA').onclick=()=>{p.querySelectorAll('[data-k]').forEach(i=>S.site[i.dataset.k]=i.value.trim());closePanel();markDirty();render();toast('Links updated. Click Save & publish.')};
}
async function openStorage(){
  const p=panel(`<h3>Storage</h3><p>Your Supabase free plan holds <b>1 GB</b> in total, and each file can be up to <b>50 MB</b>.</p>
  <div id="stUse"><p>${LOCAL||!SB?'Usage shows here when you are signed in on the live site.':'Checking usage…'}</p></div>
  <h4>Reels and videos</h4><p>• Export at <b>720p</b> (720 × 1280, vertical), MP4, 30 fps.<br>• A 30 to 60 second reel is usually 8 to 20 MB.<br>• About 50 to 60 reels fit in 1 GB, so keep only your best ones here.</p>
  <h4>Photos and graphics</h4><p>• Export at <b>1080 px</b> wide (1080 × 1350 for 4:5 posts), JPG.<br>• Usually under 500 KB each, so photos barely use space.</p>
  <h4>Tip</h4><p>Removing a photo from the page does not delete the file from storage. To free up space, delete old files in Supabase → Storage → media.</p>`);
  if(LOCAL||!SB||!ADMIN)return;
  try{let total=0,count=0;const root=await SB.storage.from('media').list('',{limit:1000});
    for(const f of root.data||[]){if(f.id){total+=(f.metadata&&f.metadata.size)||0;count++}else{const sub=await SB.storage.from('media').list(f.name,{limit:1000});(sub.data||[]).forEach(x=>{total+=(x.metadata&&x.metadata.size)||0;count++})}}
    const mb=total/1048576,pct=Math.min(100,mb/1024*100);
    p.querySelector('#stUse').innerHTML=`<div class="meter"><i style="width:${pct.toFixed(1)}%"></i></div><p><b>${mb.toFixed(1)} MB</b> of 1,024 MB used · ${count} files</p>`;
  }catch(e){p.querySelector('#stUse').innerHTML='<p>Could not read usage right now.</p>'}
}

/* ---------- Supabase: content, sign-in, uploads ---------- */
try{if(CFG.supabaseUrl&&CFG.supabaseAnonKey&&window.supabase)SB=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey)}catch(e){}
function migrate(d){if(!d||d.v!==2||!Array.isArray(d.sections))return null;d.theme=d.theme||clone(DEFAULT.theme);d.site=Object.assign(clone(DEFAULT.site),d.site||{});return d}
async function loadContent(){if(!SB)return;try{const r=await SB.from('site').select('data').eq('id',ROW).maybeSingle();const d=migrate(r.data&&r.data.data);if(!r.error&&d){S=d;LOADED=JSON.stringify(S);render(false)}}catch(e){}}
async function checkAdmin(quiet){if(!SB)return;try{const r=await SB.auth.getSession();const email=r.data&&r.data.session&&r.data.session.user&&r.data.session.user.email;if(!email){ADMIN=false;return}
  const q=await SB.from('admins').select('email').eq('email',email.toLowerCase()).maybeSingle();
  if(q.data){if(!ADMIN){ADMIN=true;render();if(!quiet)toast('Signed in. Click Edit page to start.')}}
  else if(q.error){toast('Signed in as '+email+', but the admin check failed: '+q.error.message)}
  else{toast(email+' is not on the admin list in Supabase (table: admins).');await SB.auth.signOut()}}catch(e){}}
async function uploadMedia(file){const ext=((file.name||'').split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'')||'bin';const path=new Date().toISOString().slice(0,10)+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
  const up=await SB.storage.from('media').upload(path,file,{contentType:file.type||undefined,upsert:false});
  if(up.error)throw {code:/size|large|exceed/i.test(up.error.message)?'too_large':'upload',message:up.error.message};
  return {id:SB.storage.from('media').getPublicUrl(path).data.publicUrl,contentType:file.type}}
function openLogin(){
  if(LOCAL||ADMIN){toast('You are already in admin mode.');return}
  if(!SB){panel('<h3>Admin</h3><p>The admin is not connected. Add your Supabase details to config.js.</p>');return}
  const p=panel('<h3>Admin sign-in</h3><p>Enter your admin email and we will email you a one-time sign-in link. (The free plan sends only about 2 sign-in emails per hour, so request it once and wait for it.)</p><label>Email<input id="lgE" type="email" autocomplete="email" placeholder="you@example.com"></label><div class="row"><button class="pbtn pri" id="lgS">Email me a link</button></div>');
  p.querySelector('#lgS').onclick=async()=>{const em=p.querySelector('#lgE').value.trim();if(!em){p.querySelector('#lgE').focus();return}
    const r=await SB.auth.signInWithOtp({email:em,options:{emailRedirectTo:location.origin+location.pathname}});
    if(r.error){toast(/rate|limit|seconds/i.test(r.error.message)?'Too many sign-in emails this hour. Wait about an hour, then try once. Use the newest email.':'Could not send the link: '+r.error.message);return}
    closePanel();toast('Check your email for the sign-in link. Open the newest one.')};
}
async function signOut(){if(SB)await SB.auth.signOut();ADMIN=false;EDIT=false;PREVIEW=false;closePanel();render();toast('Signed out.')}
async function save(){
  if(!ADMIN){toast('Sign in as admin to save.');return}
  const b=document.querySelector('[data-a="save"]');if(b){b.disabled=true;b.textContent='Saving…'}
  try{localStorage.setItem(DRAFT,JSON.stringify({state:S,at:Date.now()}))}catch(e){}
  if(LOCAL){LOADED=JSON.stringify(S);DIRTY=0;renderAdmin();toast('Saved on this computer only (local preview). On the live site this publishes your changes.');return}
  if(JSON.stringify(S).includes('"blob:')){toast('Some media were added in local preview and cannot be published. Re-upload them while signed in.');renderAdmin();return}
  const r=await SB.from('site').upsert({id:ROW,data:S,updated_at:new Date().toISOString()});
  if(r.error){toast('Could not save: '+r.error.message);renderAdmin();return}
  try{localStorage.removeItem(DRAFT)}catch(e){}LOADED=JSON.stringify(S);DIRTY=0;renderAdmin();toast('Saved. Your website is updated.');
}
let tt;function toast(m){let t=document.getElementById('ddtoast');if(!t){t=document.createElement('div');t.id='ddtoast';t.className='toast';t.setAttribute('role','status');document.body.appendChild(t)}t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,4200)}
addEventListener('beforeunload',e=>{if(DIRTY){e.preventDefault();e.returnValue=''}});

/* ---------- start ---------- */
if(isLocalHost&&new URLSearchParams(location.search).has('admin')){ADMIN=true;LOCAL=true}
render(false);
if(location.hash){const el=document.getElementById(location.hash.slice(1));el&&setTimeout(()=>el.scrollIntoView(),50)}
(async()=>{await loadContent();if(SB&&!LOCAL){await checkAdmin(true);SB.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_IN')checkAdmin()})}})();
window.__dally={get state(){return S}};
})();

/* One sound at a time (26 Nov 2026): when a video starts playing with sound, every
   other video the visitor started (or that has sound) stops, goes silent, and its
   button goes back to "Play with sound". Silent preview loops keep playing. */
(function(){
  function hush(except){
    document.querySelectorAll('video').forEach(function(o){
      if(o===except)return;
      if(!o.muted||o.dataset.user==='1'){o.pause();o.muted=true;delete o.dataset.user}
    });
    document.querySelectorAll('[data-play]').forEach(function(b){
      var v=b.parentElement&&b.parentElement.querySelector('video');
      if(v!==except&&/Pause/.test(b.textContent))b.textContent='▶ Play with sound';
    });
  }
  function check(e){var v=e.target;if(v&&v.tagName==='VIDEO'&&!v.muted)hush(v)}
  document.addEventListener('play',check,true);
  document.addEventListener('playing',check,true);
  document.addEventListener('volumechange',check,true);
})();

/* Highlight previews (26 Nov 2026): silent preview loops start at the video's best
   moment (the #t= time in its file name) and loop from there. "Play with sound"
   still plays the whole video from the start. */
(function(){
  function start(v){var m=/#t=([\d.]+)/.exec(v.getAttribute('src')||'');return m?+m[1]:0}
  document.addEventListener('timeupdate',function(e){
    var v=e.target;if(!v||v.tagName!=='VIDEO'||!v.muted||v.dataset.user==='1')return;
    var s=start(v);if(s&&v.currentTime<s-0.3)v.currentTime=s;
  },true);
  document.addEventListener('loadedmetadata',function(e){
    var v=e.target;if(v&&v.tagName==='VIDEO'&&v.muted&&v.dataset.user!=='1'){var s=start(v);if(s)v.currentTime=s}
  },true);
})();

