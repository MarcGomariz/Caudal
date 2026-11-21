/* Caudal · diag.js — elige el modelo de Gemini disponible y diagnostica la IA */
const GAPI='https://generativelanguage.googleapis.com/v1beta/';
async function geminiModels(key){let r;try{r=await fetch(GAPI+'models?pageSize=200&key='+encodeURIComponent(key))}catch(e){throw{message:'No se pudo conectar con Google (sin internet o bloqueado por la red).'}}
 const j=await r.json().catch(()=>({}));if(!r.ok)throw{status:r.status,message:'('+r.status+') '+((j.error&&j.error.message)||'error desconocido')};
 return(j.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent')).map(m=>m.name.replace(/^models\//,''))}
function pickModel(names,lite){const alias=lite?'gemini-flash-lite-latest':'gemini-flash-latest';if(names.includes(alias))return alias;
 const ok=names.filter(n=>/flash/.test(n)&&(lite?/lite/.test(n):!/lite/.test(n))&&!/image|tts|live|audio|embed|robot|native|computer/.test(n));
 const ver=n=>{const m=n.match(/gemini-(\d+(?:\.\d+)?)/);return m?parseFloat(m[1]):0};
 ok.sort((a,b)=>ver(b)-ver(a)||(/preview|exp/.test(a)?1:0)-(/preview|exp/.test(b)?1:0));return ok[0]||null}
async function autoPickModels(cfg){const names=await geminiModels(cfg.key);const main=pickModel(names,false)||pickModel(names,true);const fast=pickModel(names,true)||main;
 if(!main)throw{message:'Tu clave no tiene acceso a ningún modelo Gemini Flash ('+names.length+' modelos disponibles).'};
 const c={...cfg,model:main,fast,picked:TODAY,models:names.length};try{localStorage.setItem('caudal-ai',JSON.stringify(c))}catch(e){}return c}
function testImage(){return new Promise(res=>{const c=document.createElement('canvas');c.width=900;c.height=260;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,900,260);x.fillStyle='#000';x.font='28px Arial';
 x.fillText('EXTRACTO DE CUENTA - NOVIEMBRE 2026',30,50);x.fillText('12/11/2026   MERCADONA TARRAGONA        -23,45',30,130);x.fillText('13/11/2026   NOMINA ACME SL           1.500,00',30,190);c.toBlob(res,'image/jpeg',.9)})}
async function runAIDiag(fromSave){const cfg0=aiCfg();const steps=[];let cfg=cfg0;const box=(ok,t,d)=>steps.push({ok,t,d:d||''});
 const show=(busy)=>openModal(`<div class="row" style="margin-bottom:10px"><h2 class="sp">Diagnóstico de la IA</h2><button class="ib" data-act="close" aria-label="Cerrar">${ic('x')}</button></div>
  <div class="alerts">${steps.map(s=>`<div class="al ${s.ok===true?'ok':s.ok===false?'crit':'info'}">${ic(s.ok===true?'ok':s.ok===false?'warn':'info')}<div><div class="t">${esc(s.t)}</div>${s.d?`<div class="d">${esc(s.d)}</div>`:''}</div><span></span></div>`).join('')}</div>
  ${busy?'<div class="row mt mut small"><span class="spin"></span>Comprobando… puede tardar hasta un minuto.</div>':`<div class="row mt"><span class="mut small sp">${steps.every(s=>s.ok!==false)?'Todo funciona: ya puedes leer extractos con IA.':'Si no sabes cómo arreglarlo, copia este diagnóstico y pégaselo a Claude.'}</span><button class="btn sm" id="dgCopy">Copiar diagnóstico</button><button class="btn sm pri" data-act="close">Cerrar</button></div>`}`,true);
 const done=()=>{show(false);const b=$('#dgCopy');if(b)b.onclick=async()=>{const txt='Diagnóstico IA Caudal '+new Date().toISOString()+' | '+navigator.userAgent+'\n'+steps.map(s=>(s.ok===true?'OK ':s.ok===false?'ERROR ':'INFO ')+s.t+(s.d?' — '+s.d:'')).join('\n');try{await navigator.clipboard.writeText(txt);toast('Diagnóstico copiado.')}catch(e){openModal(`<h2>Diagnóstico</h2><textarea readonly>${esc(txt)}</textarea><div class="row mt" style="justify-content:flex-end"><button class="btn" data-act="close">Cerrar</button></div>`)}}};
 if(!cfg||!cfg.key){box(false,'No hay ninguna clave de Gemini guardada','Pega tu clave en Ajustes y pulsa «Guardar y probar».');return done()}
 box(true,'Clave guardada en este navegador','Termina en …'+cfg.key.slice(-4));show(true);
 try{cfg=await autoPickModels(cfg);box(true,'Conexión con Google correcta',`${cfg.models} modelos disponibles. Usaré «${cfg.model}» para leer y analizar, y «${cfg.fast}» para clasificar.`);SAMPLE=makeGemini(cfg);AIDENIED=false}
 catch(e){box(false,'Google rechaza la conexión',e.message||String(e));if(/location|region|country|not supported/i.test(e.message||''))box(null,'Tu país no tiene acceso gratuito a la API de Gemini','Hay que usar otro proveedor de IA. Díselo a Claude con este diagnóstico.');else if(/API key|api_key|invalid|403|401/i.test(e.message||''))box(null,'Parece un problema con la clave','Crea una clave nueva en aistudio.google.com/apikey, cópiala entera y vuelve a pegarla.');return done()}
 show(true);
 try{const r=await SAMPLE('Responde solo con la palabra OK.',{modelTier:'quick'});box(true,'Respuesta de texto correcta','Gemini respondió: '+String(r.text).trim().slice(0,40))}catch(e){box(false,'Falla la respuesta de texto',(e&&e.message)||aiMsg(e))}
 show(true);
 try{const res=await SAMPLE.json(XRULES+'\n\nEXTRACTO:\n12/11/2026  MERCADONA TARRAGONA  -23,45\n13/11/2026  NOMINA ACME SL  1.500,00',{modelTier:'default'});const m=toMovs(res);box(m.length>=2,m.length>=2?'Lee extractos en texto':'No ha leído bien un extracto de texto de prueba',m.length?m.map(x=>`${x.d} ${x.c} ${x.a}`).join(' · '):'Respuesta: '+JSON.stringify(res).slice(0,160))}
 catch(e){box(false,'Falla la lectura de extractos en texto',(e&&e.message)||aiMsg(e)+(e&&e.text?' — '+String(e.text).slice(0,160):''))}
 show(true);
 try{const blob=await testImage();const res=await SAMPLE.json(XRULES+'\n\nLa imagen adjunta es un extracto bancario. Lee los movimientos de la imagen.',{images:[blob],modelTier:'default'});const m=toMovs(res);box(m.length>=1,m.length?'Lee extractos escaneados y fotos':'No ha leído la imagen de prueba',m.length?m.map(x=>`${x.d} ${x.c} ${x.a}`).join(' · '):'Respuesta: '+JSON.stringify(res).slice(0,160))}
 catch(e){box(false,'Falla la lectura de imágenes',(e&&e.message)||aiMsg(e))}
 show(true);
 try{await loadScript(LIB.pdf);await loadScript(LIB.pdfw);box(window.pdfjsLib?true:false,window.pdfjsLib?'Lector de PDF cargado':'El lector de PDF no se ha cargado')}catch(e){box(false,'No se pudo cargar el lector de PDF',e.message||String(e))}
 done();if(UI.view==='ajustes')render()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act=savekey],[data-act=aidiag]');if(!b)return;e.stopImmediatePropagation();
 if(b.dataset.act==='savekey'){const key=($('#gkey')||{}).value;const k=String(key||'').trim().replace(/\s+/g,'');if(!k){toast('Pega tu clave de Gemini.');return}
  const old=aiCfg()||{};const m=($('#gmodel')||{}).value,f=($('#gfast')||{}).value;const cfg={key:k};if(old.key===k&&m&&m!==old.model)cfg.model=m.trim();if(old.key===k&&f&&f!==old.fast)cfg.fast=f.trim();
  try{localStorage.setItem('caudal-ai',JSON.stringify({...cfg,model:cfg.model||'gemini-flash-latest',fast:cfg.fast||'gemini-flash-lite-latest'}))}catch(err){}useGemini()}
 runAIDiag(b.dataset.act==='savekey')},true);
(()=>{const _render=render;render=function(){_render();try{if(UI.view!=='ajustes'||!STANDALONE)return;const k=$('#gkey');if(!k||$('#aidiagBtn'))return;const c=aiCfg()||{};
  const row=k.closest('.row');const b=document.createElement('button');b.className='btn ghost';b.id='aidiagBtn';b.dataset.act='aidiag';b.textContent='Diagnóstico';row.appendChild(b);
  if(c.key&&c.model){const p=document.createElement('p');p.className='mut tiny';p.style.margin='10px 0 0';p.textContent='Modelos en uso: '+c.model+' (leer y analizar) · '+(c.fast||c.model)+' (clasificar).';row.after(p)}}catch(e){}};
 const c=aiCfg();if(STANDALONE&&c&&c.key&&c.picked!==TODAY){autoPickModels(c).then(n=>{SAMPLE=makeGemini(n)}).catch(()=>{})}})();
