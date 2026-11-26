/* Live example of the link-in-bio page. It reads the same content as the portfolio
   (Supabase row "portfolio-v2", or content.js until the first save), so edits made in the
   phone preview on the portfolio show up here too. ?i=<industry key> picks the industry. */
(function(){
const CFG=window.DALLY_CONFIG||{},ROW=CFG.siteRow||'portfolio-v2';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const src=id=>/^(https?:|blob:|data:)/.test(id)||id.includes('/')?id:'media/'+id;
const ICON={key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9m-3 3l3 3m-6 0l2 2"/>',home:'<path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z"/>',tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',star:'<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',heart:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'};
const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]||ICON.star}</svg>`;
const FONTS={fraunces:['family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,400&family=Figtree:wght@400;500;600','"Fraunces",Georgia,serif','"Figtree",system-ui,sans-serif'],instrument:['family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600','"Instrument Serif",serif','"Inter",system-ui,sans-serif'],cormorant:['family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@400;500;600','"Cormorant Garamond",serif','"Montserrat",system-ui,sans-serif'],playfair:['family=Playfair+Display:ital,wght@0,400;1,400&family=Lato:wght@400;700','"Playfair Display",serif','"Lato",system-ui,sans-serif'],dmserif:['family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600','"DM Serif Display",serif','"DM Sans",system-ui,sans-serif']};
let S=window.DEFAULT_STATE,L=null,view=null;
function pick(){
  const key=new URLSearchParams(location.search).get('i')||'real-estate';
  const sec=(S.sections||[]).find(s=>s.type==='industries');if(!sec)return null;
  const ind=sec.industries.find(x=>x.key===key)||sec.industries.find(x=>x.blocks.some(b=>b.lp));
  const fb=ind&&ind.blocks.find(b=>b.kind==='feed'&&b.lp);return fb?{lp:fb.lp,pr:fb.profile}:null;
}
function theme(){
  const r=document.documentElement.style,c=(S.theme&&S.theme.colors)||{};Object.entries(c).forEach(([k,v])=>r.setProperty('--'+k,v));
  const f=FONTS[(S.theme&&S.theme.font)]||FONTS.fraunces;document.getElementById('gf').href='https://fonts.googleapis.com/css2?'+f[0]+'&display=swap';r.setProperty('--display',f[1]);r.setProperty('--sans',f[2]);
  const lc=(L&&L.lp.colors)||{};[['dark','--lpd'],['dark2','--lpd2'],['accent','--lpa'],['bg','--lpbg']].forEach(([k,v])=>{if(lc[k])r.setProperty(v,lc[k]);else r.removeProperty(v)});
}
function draw(){
  const el=document.getElementById('page');if(!L){el.innerHTML='<div class="body"><p>This example page is not set up yet.</p></div>';return}
  const p=L.lp,lg=p.logo||{};
  const hero=(inner)=>`<div class="hero">${inner}</div>`;
  if(view==null){
    document.title=(p.title||'Link in bio')+' | Example';
    el.innerHTML=hero(`${lg.id?`<div class="logo"><img src="${esc(src(lg.id))}" alt=""></div>`:''}<span class="eye">${esc(p.eyebrow)}</span><h1>${esc(p.title)}</h1><p class="sub">${esc(p.sub)}</p>${(p.chips||[]).length?`<div class="chips">${p.chips.map(c=>`<span>${esc(c)}</span>`).join('')}</div>`:''}`)+
    `<div class="body"><div class="ask">${esc(p.ask)}</div>${p.paths.map((x,i)=>`<button class="path${i?'':' first'}" data-go="${i}"><span class="ic">${icon(x.icon)}</span><div>${x.badge?`<span class="badge">${esc(x.badge)}</span>`:''}<b>${esc(x.t)}</b><small>${esc(x.d)}</small></div><i>›</i></button>`).join('')}
    <div class="btns"><a href="#" data-demo="1">${esc(p.btn1)}</a><a href="#" data-demo="1">${esc(p.btn2)}</a></div><p class="contact">${esc(p.contact)}</p></div>`;
  }else{
    const x=p.paths[view],f=x.form||{title:x.t,fields:['Your name','Email or phone'],btn:'Send',done:'Thank you! I’ll be in touch soon.'};
    document.title=x.t+' | Example';
    el.innerHTML=hero(`<button class="back" data-back="1">‹ All options</button>${x.badge?`<span class="eye">${esc(x.badge)}</span>`:''}<h1>${esc(f.title)}</h1><p class="sub">${esc(x.d)}</p>`)+
    `<div class="body"><form data-form="1">${f.fields.map((q,i)=>`<label>${esc(q)}<input name="f${i}" autocomplete="off"></label>`).join('')}<button type="submit">${esc(f.btn)}</button><p class="note">Example only: nothing you type here is sent or saved.</p></form>
    <div class="ask" style="font-size:15px;margin-top:10px">Looking for something else?</div>${p.paths.map((y,i)=>i===view?'':`<button class="path" data-go="${i}"><span class="ic">${icon(y.icon)}</span><div><b>${esc(y.t)}</b></div><i>›</i></button>`).join('')}</div>`;
  }
  scrollTo(0,0);
}
document.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]');if(g){view=+g.dataset.go;draw();return}
  if(e.target.closest('[data-back]')){view=null;draw();return}
  const d=e.target.closest('[data-demo]');if(d){e.preventDefault();d.textContent='Example only';return}
});
document.addEventListener('submit',e=>{const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();const x=L.lp.paths[view],done=(x.form&&x.form.done)||'Thank you!';
  const m=done.match(/^(.*?[.!?])\s+(.*)$/)||[0,done,''];f.outerHTML=`<div class="done"><h2>${esc(m[1])}</h2>${m[2]?`<p>${esc(m[2])}</p>`:''}<p class="note" style="margin-top:12px">In your version, this goes straight to your inbox with every answer filled in.</p></div>`});
function boot(){L=pick();theme();draw()}
boot();
(async()=>{try{if(!(CFG.supabaseUrl&&CFG.supabaseAnonKey&&window.supabase))return;const sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey);
  const r=await sb.from('site').select('data').eq('id',ROW).maybeSingle();if(r.data&&r.data.data&&r.data.data.v===2){S=r.data.data;boot()}}catch(e){}})();
})();
