/* Caudal · app.js */
/* ============ acciones ============ */
async function reclassAI(includeOthers){const list=S.tx.filter(t=>t.by!=='user'&&t.by!=='rule'&&(t.cat==='none'||t.by==='none'||(t.by==='ia'&&t.conf<.6)||(includeOthers&&(t.cat==='otros'||t.by==='kw'||t.by==='demo'))));if(!list.length){toast('No hay movimientos pendientes de clasificar.');return}
 const tt=toast(`La IA está clasificando ${list.length} movimientos…`,null,true);const months=new Set(list.map(t=>t.d.slice(0,7)));const n=await classifyAI(list);tt.remove();bump();save([...months]);render();toast(n?`${n} movimientos clasificados por la IA.`:'La IA no ha encontrado cambios.')}
function toast(msg,action,sticky){const el=document.createElement('div');el.className='toast';el.innerHTML=`${sticky?'<span class="spin"></span>':''}<span class="sp">${esc(msg)}</span>${action?`<button class="btn sm pri">${esc(action.label)}</button>`:''}<button class="ib" aria-label="Cerrar">${ic('x')}</button>`;
 $('#toasts').appendChild(el);const kill=()=>el.remove();el.querySelector('.ib').onclick=kill;if(action)el.querySelector('.btn').onclick=()=>{kill();action.fn()};if(!sticky)setTimeout(kill,action?9000:4500);return el}
let modalSticky=false;
function openModal(html,wide){const m=$('#modal'),s=$('#sheet');s.className='sheet'+(wide?'':' narrow');s.innerHTML=html;if(m.hidden){m.hidden=false;document.body.style.overflow='hidden'}}
function closeModal(){$('#modal').hidden=true;document.body.style.overflow='';IMP=null}
function confirmBox(title,text,ok,danger){return new Promise(res=>{openModal(`<h2>${esc(title)}</h2><p class="mut">${esc(text)}</p><div class="row mt" style="justify-content:flex-end"><button class="btn ghost" data-c="0">Cancelar</button><button class="btn ${danger?'danger':'pri'}" data-c="1">${esc(ok)}</button></div>`);$('#sheet').onclick=e=>{const b=e.target.closest('[data-c]');if(b){$('#sheet').onclick=null;closeModal();res(b.dataset.c==='1')}}})}
function addTxModal(){openModal(`<h2>Añadir movimiento</h2><div data-form id="txF" class="grid mt" style="gap:10px"><label class="f">Concepto<input type="text" name="c" required></label><div class="grid g2" style="gap:10px"><label class="f">Importe (€)<input type="number" name="a" step="0.01" min="0.01" required inputmode="decimal"></label><label class="f">Tipo<select name="t"><option value="g">Gasto</option><option value="i">Ingreso</option></select></label></div><div class="grid g2" style="gap:10px"><label class="f">Fecha<input type="date" name="d" value="${TODAY}" required></label><label class="f">Categoría<select name="cat">${catOptions('none',-1)}</select></label></div><div class="row mt" style="justify-content:flex-end"><button type="button" class="btn ghost" data-act="close">Cancelar</button><button class="btn pri" type="button" data-submit>Añadir</button></div></div>`);
 $('#txF')._submit=()=>{const fd=fdOf($('#txF'));if(!String(fd.get('c')).trim()){toast('Escribe un concepto.');return}const a=Math.abs(parseNum(fd.get('a')));if(!a)return;const c=String(fd.get('c')).trim();const t={id:uid(),d:fd.get('d'),c,a:fd.get('t')==='g'?-a:a,k:mkey(c),src:'manual',by:'user',conf:1,cat:fd.get('cat')};if(t.cat==='none'){classifyLocal([t]);if(t.by==='none')t.by='user'}S.tx.push(t);S.tx.sort((x,y)=>x.d<y.d?1:-1);bump();save([t.d.slice(0,7)]);closeModal();render();toast('Movimiento añadido.')}}
async function copyText(txt){try{await navigator.clipboard.writeText(txt);return true}catch(e){return false}}
document.addEventListener('click',async e=>{const a=e.target.closest('[data-act]');
 if(e.target===$('#modal')&&!IMP){closeModal();return}
 if(a){const act=a.dataset.act;
  if(act==='import'){openUpload()}
  else if(act==='close')closeModal();
  else if(act==='commit')commitImport();
  else if(act==='aiextract'){if(!IMP||IMP.status==='ai')return;IMP.status='ai';renderImport();for(const f of IMP.files)if(f.kind!=='error')await aiRead(f);if(!IMP)return;IMP.prog=null;await rebuildImport(true)}
  else if(act==='more'){UI.lim+=200;render()}
  else if(act==='addtx')addTxModal();
  else if(act==='reclass')reclassAI(false);
  else if(act==='runai')runAI();
  else if(act==='remdone'){S.reminder.doneAt=new Date().toISOString();save();saveReminder();render();toast(`Hecho. Próximo aviso dentro de ${S.reminder.days} días.`)}
  else if(act==='suggestbud'){const hist=monthsWithData().filter(m=>m<CUR).slice(-3);if(!hist.length){toast('Necesito al menos un mes completo de datos.');return}const nb={};for(const c of expCats()){const v=hist.reduce((s,m)=>s+(totals(m).by[c.id]||0),0)/hist.length;if(v>=30)nb[c.id]=Math.ceil(v*.95/10)*10}const tot=Math.ceil(hist.reduce((s,m)=>s+totals(m).exp,0)/hist.length*.95/50)*50;
   if(await confirmBox('Aplicar presupuestos sugeridos',`Basados en tu media de los últimos ${hist.length} meses con un 5 % de recorte: límite global ${eur(tot)} y ${Object.keys(nb).length} categorías. Sustituirá los límites actuales.`,'Aplicar')){S.budgets.byCat=nb;S.budgets.total=tot;bump();save();render();toast('Presupuestos actualizados.')}}
  else if(act==='backup'){const ok=await copyText(JSON.stringify({...stateDoc(),tx:S.tx.filter(t=>t.src!=='demo')}));if(ok)toast('Copia de seguridad copiada al portapapeles. Pégala en una nota o archivo.');else openModal(`<h2>Copia de seguridad</h2><p class="mut small">Selecciona y copia este texto:</p><textarea readonly>${esc(JSON.stringify({...stateDoc(),tx:S.tx.filter(t=>t.src!=='demo')}))}</textarea><div class="row mt" style="justify-content:flex-end"><button class="btn" data-act="close">Cerrar</button></div>`)}
  else if(act==='restore'){openModal(`<h2>Restaurar copia</h2><p class="mut small">Pega aquí una copia de seguridad. Sustituirá todos tus datos actuales.</p><textarea id="rsT"></textarea><div class="row mt" style="justify-content:flex-end"><button class="btn ghost" data-act="close">Cancelar</button><button class="btn pri" data-act="dorestore">Restaurar</button></div>`)}
  else if(act==='dorestore'){try{restoreFrom($('#rsT').value);closeModal();render();toast('Datos restaurados.')}catch(err){toast('El texto no es una copia de seguridad válida.')}}
  else if(act==='dlbackup'){downloadFile('caudal-copia-'+TODAY+'.json',JSON.stringify({...stateDoc(),tx:S.tx.filter(t=>t.src!=='demo')}),'application/json');toast('Copia descargada.')}
  else if(act==='uprestore'){const fi=$('#rsF');fi.onchange=async()=>{const f=fi.files[0];if(!f)return;if(!(await confirmBox('Restaurar copia','Sustituirá todos los datos de este navegador por los de «'+f.name+'».','Restaurar',true)))return;try{restoreFrom(await f.text());render();toast('Datos restaurados.')}catch(err){toast('Ese archivo no es una copia de seguridad válida.')}};fi.click()}
  else if(act==='savekey'){const key=$('#gkey').value.trim();if(!key){toast('Pega tu clave de Gemini.');return}const cfg={key,model:($('#gmodel').value.trim()||'gemini-flash-latest'),fast:($('#gfast').value.trim()||'gemini-flash-lite-latest')};
   try{localStorage.setItem('caudal-ai',JSON.stringify(cfg))}catch(err){}useGemini();const tt=toast('Probando la conexión con Gemini…',null,true);
   try{await SAMPLE('Responde solo con la palabra OK.',{modelTier:'quick'});tt.remove();toast('IA activada. Ya puedes leer extractos, clasificar y analizar con IA.')}catch(err){tt.remove();toast('No funciona: '+aiMsg(err)+(err&&err.message&&AIERR[err.code]?' ('+err.message+')':''))}render()}
  else if(act==='delkey'){try{localStorage.removeItem('caudal-ai')}catch(err){}SAMPLE=null;render();toast('Clave borrada de este navegador.')}
  else if(act==='cleardemo'){if(await confirmBox('Empezar desde cero','Se quitarán los movimientos y previstos de ejemplo. Tus categorías y presupuestos se mantienen.','Quitar ejemplo')){S.tx=S.tx.filter(t=>t.src!=='demo');S.planned=S.planned.filter(p=>!p.demo);S.demo=false;bump();save();render()}}
  else if(act==='wipe'){if(await confirmBox('Borrar todos los datos','Se eliminarán movimientos, categorías, reglas aprendidas, presupuestos y previsiones. No se puede deshacer.','Borrar todo',true)){const months=[...new Set(S.tx.map(t=>t.d.slice(0,7)))];S.tx=[];bump();save(months);flush();S=freshState();applyLoaded({},[]);save();saveReminder();render();toast('Datos borrados.')}}
  return}
 const mo=e.target.closest('[data-mon]');if(mo&&!mo.disabled){UI.month=addM(UI.month,+mo.dataset.mon);if(UI.month>CUR)UI.month=CUR;render();return}
 const del=e.target.closest('[data-del]');if(del){const t=S.tx.find(x=>x.id===del.dataset.del);if(!t)return;S.tx=S.tx.filter(x=>x!==t);bump();save([t.d.slice(0,7)]);render();toast('Movimiento eliminado.',{label:'Deshacer',fn:()=>{S.tx.push(t);S.tx.sort((a,b)=>a.d<b.d?1:-1);bump();save([t.d.slice(0,7)]);render()}});return}
 const dp=e.target.closest('[data-delplan]');if(dp){S.planned=S.planned.filter(p=>p.id!==dp.dataset.delplan);bump();save();render();return}
 const dr=e.target.closest('[data-delrule]');if(dr){delete S.rules[dr.dataset.delrule];bump();save();render();return}
 const dc=e.target.closest('[data-delcat]');if(dc){const c=cat(dc.dataset.delcat);const n=S.tx.filter(t=>t.cat===c.id).length;if(await confirmBox(`Eliminar «${c.name}»`,`${n} movimientos pasarán a «Sin categoría». Las reglas aprendidas para ella se olvidarán.`,'Eliminar',true)){const months=new Set();S.tx.forEach(t=>{if(t.cat===c.id){t.cat='none';t.by='none';months.add(t.d.slice(0,7))}});S.cats=S.cats.filter(x=>x.id!==c.id);for(const k in S.rules)if(S.rules[k]===c.id)delete S.rules[k];delete S.budgets.byCat[c.id];bump();save([...months]);render()}return}
 const un=e.target.closest('[data-undo]');if(un){const imp=S.imports.find(i=>i.id===un.dataset.undo);if(!imp)return;if(await confirmBox('Deshacer importación',`Se eliminarán los ${imp.n} movimientos que entraron con «${imp.name}».`,'Deshacer',true)){const months=new Set(S.tx.filter(t=>t.src===imp.id).map(t=>t.d.slice(0,7)));S.tx=S.tx.filter(t=>t.src!==imp.id);S.imports=S.imports.filter(i=>i!==imp);const lastI=S.imports[S.imports.length-1];S.reminder.lastUploadAt=lastI?lastI.at:null;bump();save([...months]);saveReminder();render();toast('Importación deshecha.')}return}
 const qb=e.target.closest('[data-q]');if(qb){sendChat(qb.dataset.q);return}});
document.addEventListener('change',e=>{const s=e.target;
 if(s.dataset.cat){const t=S.tx.find(x=>x.id===s.dataset.cat);if(!t)return;const sim=setCat(t,s.value,true);render();
  if(sim.length)toast(`¿Aplicar «${cat(s.value).name}» a ${sim.length} movimientos similares (${t.k})?`,{label:'Aplicar',fn:()=>{const months=new Set();sim.forEach(x=>{x.cat=s.value;x.by='rule';x.conf=1;months.add(x.d.slice(0,7))});bump();save([...months]);render();toast('Hecho. Lo recordaré para los próximos extractos.')}});else toast(`Aprendido: «${t.k}» → ${cat(s.value).name}.`);return}
 if(s.dataset.bud){const v=Math.max(0,parseNum(s.value)||0);if(s.dataset.bud==='_total')S.budgets.total=v;else if(v>0)S.budgets.byCat[s.dataset.bud]=v;else delete S.budgets.byCat[s.dataset.bud];bump();save();render();return}
 if(s.dataset.set){const v=+s.value;if(v>0){S.budgets[s.dataset.set]=v;bump();save();render()}return}
 if(s.dataset.color){const c=S.cats.find(x=>x.id===s.dataset.color);if(c){c.color=s.value;bump();save()}return}
 if(s.dataset.rename){const c=S.cats.find(x=>x.id===s.dataset.rename);const v=s.value.trim();if(c&&v&&c.name!==v){c.name=v;bump();save()}if(c&&v)toast(`Categoría renombrada a «${v}».`);else if(c)s.value=c.name;return}
 if(IMP&&s.dataset.map){const f=IMP.files[0];const v=+s.value;if(s.dataset.map==='concept')f.map.concept=v>=0?[v]:[];else{f.map[s.dataset.map]=v;if(s.dataset.map==='amount'&&v>=0){f.map.debit=-1;f.map.credit=-1}if(s.dataset.map==='debit'&&v>=0){f.map.amount=-1;const hdr=f.hi>=0?f.rows[f.hi]:[];const cr=hdr.findIndex((h,j)=>j!==v&&HDR.credit.test(String(h)));f.map.credit=cr}}f.movs=rowsToMovs(f.rows,f.hi,f.map,f.inv);rebuildImport(true);return}
 if(IMP&&s.hasAttribute('data-inv')){const f=IMP.files[0];f.inv=s.checked;f.movs=rowsToMovs(f.rows,f.hi,f.map,f.inv);rebuildImport(true);return}});
let renT;document.addEventListener('input',e=>{const s=e.target;if(!s.dataset||!s.dataset.rename)return;clearTimeout(renT);renT=setTimeout(()=>{const c=S.cats.find(x=>x.id===s.dataset.rename);const v=s.value.trim();if(c&&v&&c.name!==v){c.name=v;bump();save()}},500)});
document.addEventListener('focusout',()=>{if(ST.pendingRender)setTimeout(()=>{if(ST.pendingRender&&!isTyping()){ST.pendingRender=false;render()}},60)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&ST.timer){clearTimeout(ST.timer);flush()}});
function fdOf(el){const o={};el.querySelectorAll('[name]').forEach(x=>{o[x.name]=x.value});return{get:k=>o[k]??''}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-submit]');if(!b||b.disabled)return;const f=b.closest('[data-form]');if(f&&f._submit)f._submit()});
document.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.target.tagName!=='INPUT')return;const f=e.target.closest('[data-form]');if(f&&f._submit){e.preventDefault();f._submit()}});
$('#fileIn').onchange=e=>{const fs=[...e.target.files];e.target.value='';handleFiles(fs)};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').hidden)closeModal()});
window.addEventListener('hashchange',route);

/* ============ arranque ============ */
(async()=>{const ready=initStore();const slow=await Promise.race([ready.then(()=>0),new Promise(r=>setTimeout(()=>r(1),12000))]);
 if(slow){applyLoaded({},[]);route();toast('Tus datos están tardando en cargar. Los cambios no se guardarán hasta que terminen de cargar.');await ready}route()})();
