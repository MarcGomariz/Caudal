/* Caudal · datos.js */
/* ============ cálculos ============ */
function totals(mk,maxDay){return memoize('t'+mk+'|'+(maxDay||''),()=>{let inc=0,exp=0;const by={},byInc={};
 for(const t of S.tx){if(t.d.slice(0,7)!==mk)continue;if(maxDay&&+t.d.slice(8)>maxDay)continue;const c=cat(t.cat);if(c.kind==='neutro')continue;
  const isExp=c.kind==='gasto'||(c.kind==='auto'&&t.a<0);
  if(isExp){exp-=t.a;by[t.cat]=(by[t.cat]||0)-t.a}else{inc+=t.a;byInc[t.cat]=(byInc[t.cat]||0)+t.a}}
 return{inc,exp,sav:inc-exp,by,byInc}})}
const monthsWithData=()=>memoize('mwd',()=>[...new Set(S.tx.map(t=>t.d.slice(0,7)))].sort());
const lastUpload=()=>S.reminder.lastUploadAt||(S.imports.length?S.imports[S.imports.length-1].at:null);
function recurring(){return memoize('rec',()=>{
 const hist=monthsWithData().filter(m=>m<CUR).slice(-6);if(hist.length<2)return[];
 const need=Math.min(3,hist.length);const groups={};
 for(const t of S.tx){const m=t.d.slice(0,7);if(m<hist[0])continue;const c=cat(t.cat);if(c.kind==='neutro')continue;const g=(t.a<0?'-':'+')+t.k;(groups[g]||(groups[g]={k:t.k,sign:t.a<0?-1:1,tx:[]})).tx.push(t)}
 const out=[];
 for(const g of Object.values(groups)){const per={};for(const t of g.tx){const m=t.d.slice(0,7);per[m]=(per[m]||0)+Math.abs(t.a)}
  const hm=hist.filter(m=>per[m]);if(hm.length<need)continue;
  const vals=hm.map(m=>per[m]);const md=median(vals);if(md<1)continue;
  const near=vals.filter(v=>Math.abs(v-md)/md<=.15).length;
  const cnt=hm.map(m=>g.tx.filter(t=>t.d.slice(0,7)===m).length);if(median(cnt)>1)continue;
  if(near<Math.max(need,hm.length-1))continue;
  const sorted=[...g.tx].sort((a,b)=>a.d<b.d?-1:1);const last=sorted[sorted.length-1];
  const lastVals=hm.slice(-3).map(m=>per[m]);const amt=median(lastVals);
  const prevMd=median(hm.slice(0,Math.ceil(hm.length/2)).map(m=>per[m]));const lastMonthVal=per[hm[hm.length-1]];
  const cats={};g.tx.forEach(t=>cats[t.cat]=(cats[t.cat]||0)+1);const ct=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0][0];
  const day=Math.round(median(g.tx.map(t=>+t.d.slice(8))));
  const sub=cat(ct).id==='suscripciones'||(g.sign<0&&amt<60&&!['suministros','vivienda','seguros','salud'].includes(ct)&&vals.every(v=>Math.abs(v-md)<.02*md+.01));
  if(!sub&&g.sign<0&&['super','restaurantes','compras','ocio','transporte','viajes'].includes(ct))continue;
  out.push({k:g.k,name:last.c,sign:g.sign,amt:r2(amt),cat:ct,day,months:hm.length,sub,seenCur:!!per[CUR],curAmt:per[CUR]||0,rise:hm.length>=3&&lastMonthVal>prevMd*1.04&&lastMonthVal-prevMd>=.5?{from:prevMd,to:lastMonthVal}:null})}
 return out.sort((a,b)=>b.amt-a.amt)})}
function yearly(){return memoize('yr',()=>{const out=[];const groups={};
 for(const t of S.tx){if(t.a>=0)continue;(groups[t.k]||(groups[t.k]=[])).push(t)}
 const rec=new Set(recurring().map(r=>r.k));
 for(const[k,tx]of Object.entries(groups)){if(rec.has(k))continue;const ms=[...new Set(tx.map(t=>t.d.slice(0,7)))];if(ms.length>2)continue;
  const t=tx[0];const big=Math.abs(t.a)>=80;const kw=/SEGURO|ANUAL|MATRICULA|IBI|IMPUESTO|ITV|CUOTA ANUAL|MAPFRE|AXA|MUTUA|LINEA DIRECTA/.test(deacc(t.c.toUpperCase()))||cat(t.cat).id==='seguros';
  if(big&&kw){const lastM=ms.sort().pop();out.push({k,name:t.c,amt:Math.abs(t.a),cat:t.cat,month:+lastM.slice(5),lastM})}}
 return out})}
function varBase(){return memoize('vb',()=>{const hist=monthsWithData().filter(m=>m<CUR).slice(-6);const rec=recurring();const recK=new Set(rec.map(r=>(r.sign<0?'-':'+')+r.k));const yrK=new Set(yearly().map(y=>y.k));
 const res={};const incVar=[];
 for(const m of hist){const by={};let iv=0;for(const t of S.tx){if(t.d.slice(0,7)!==m)continue;const c=cat(t.cat);if(c.kind==='neutro')continue;const g=(t.a<0?'-':'+')+t.k;if(recK.has(g)||yrK.has(t.k))continue;const isExp=c.kind==='gasto'||(c.kind==='auto'&&t.a<0);if(isExp)by[t.cat]=(by[t.cat]||0)-t.a;else iv+=t.a}
  for(const c of Object.keys(by))res[c]=res[c]||[];for(const c of Object.keys(res))(res[c][hist.indexOf(m)]=by[c]||0);incVar.push(iv)}
 const out={};for(const[c,arr]of Object.entries(res)){const vals=hist.map((m,i)=>Math.max(0,arr[i]||0));const md=median(vals);
  if(md>0){let sw=0,sv=0;vals.forEach((v,i)=>{const w=i+1;sw+=w;sv+=w*Math.min(v,2*md)});out[c]=sw?sv/sw:0}
  else{const s=[...vals].sort((a,b)=>a-b);s.pop();out[c]=s.length?s.reduce((a,b)=>a+b,0)/s.length:0}}
 return{byCat:out,hist,incVar:median(incVar)}})}
function plannedIn(mk){return S.planned.filter(p=>{if(p.rep==='monthly')return p.d.slice(0,7)<=mk&&(!p.until||p.until>=mk);if(p.rep==='yearly')return p.d.slice(0,7)<=mk&&p.d.slice(5,7)===mk.slice(5);return p.d.slice(0,7)===mk})}
function forecast(mk){return memoize('f'+mk,()=>{const by={};const add=(c,f,v)=>{(by[c]||(by[c]={fixed:0,var:0,plan:0}))[f]+=v};let inc=0,incPlan=0;
 for(const r of recurring()){if(r.sign<0)add(r.cat,'fixed',r.amt);else inc+=r.amt}
 const mo=+mk.slice(5);for(const y of yearly())if(y.month===mo&&y.lastM<mk)add(y.cat,'fixed',y.amt);
 const vb=varBase();for(const[c,v]of Object.entries(vb.byCat))add(c,'var',v);
 for(const p of plannedIn(mk)){if(p.a<0)add(p.cat||'otros','plan',-p.a);else incPlan+=p.a}
 if(vb.hist.length===1&&!recurring().length){const t=totals(vb.hist[0]);inc=t.inc}
 let fixed=0,vr=0,plan=0;for(const v of Object.values(by)){fixed+=v.fixed;vr+=v.var;plan+=v.plan}
 const incT=inc+incPlan+(vb.incVar>0?vb.incVar*.5:0);
 return{mk,inc:incT,incPlan,exp:fixed+vr+plan,fixed,var:vr,plan,by,sav:incT-(fixed+vr+plan)}})}
function projectCur(){return memoize('pc',()=>{const t=totals(CUR);const f=forecast(CUR);const D=dim(CUR);const rem=(D-DAY)/D;let pending=0;const pendingInc=[];
 for(const r of recurring()){if(r.seenCur)continue;if(r.sign<0)pending+=r.amt;else pendingInc.push(r.amt)}
 for(const y of yearly())if(y.month===+CUR.slice(5)&&y.lastM<CUR)pending+=y.amt;
 let planned=0;for(const p of plannedIn(CUR))if(p.d>=TODAY&&p.a<0)planned-=p.a;
 const varRem=f.var*rem;const exp=t.exp+pending+varRem+planned;const inc=t.inc+pendingInc.reduce((a,b)=>a+b,0);
 const byCat={};for(const c of Object.keys({...t.by,...f.by})){const fb=f.by[c]||{fixed:0,var:0,plan:0};const pend=recurring().filter(r=>!r.seenCur&&r.sign<0&&r.cat===c).reduce((a,r)=>a+r.amt,0);byCat[c]=(t.by[c]||0)+pend+fb.var*rem}
 return{exp,inc,sav:inc-exp,byCat}})}
function expectedToDate(c){const f=forecast(CUR);const fb=f.by[c];if(!fb)return 0;const D=dim(CUR);const fixedSeen=recurring().filter(r=>r.sign<0&&r.cat===c&&r.day<=DAY).reduce((a,r)=>a+r.amt,0);return fixedSeen+fb.var*DAY/D}

function alerts(){return memoize('al',()=>{const out=[];const t=totals(CUR);const B=S.budgets;const p=projectCur();const D=dim(CUR);const el=DAY/D;
 if(B.total>0){const u=t.exp/B.total*100;
  if(u>=100)out.push({lv:'crit',t:'Has superado tu límite mensual',d:`Llevas ${eur(t.exp)} de ${eur(B.total)} (${pct(u)}).`,go:'presupuestos'});
  else if(u>=B.warn)out.push({lv:'warn',t:`Has consumido el ${pct(u)} de tu límite mensual`,d:`Te quedan ${eur(B.total-t.exp)} para ${D-DAY} días.`,go:'presupuestos'});
  if(u<100&&p.exp>B.total*1.02)out.push({lv:'ser',t:'A este ritmo superarás tu límite',d:`Previsión de cierre: ${eur(p.exp)} frente a un límite de ${eur(B.total)}.`,go:'previsiones'})}
 for(const[c,lim]of Object.entries(B.byCat||{})){if(!(lim>0)||!CM[c])continue;const sp=t.by[c]||0;const u=sp/lim*100;const pr=p.byCat[c]||sp;
  if(u>=100)out.push({lv:'crit',t:`${cat(c).name}: presupuesto superado`,d:`${eur(sp)} gastados de ${eur(lim)} (${pct(u)}).`,go:'presupuestos'});
  else if(u>=B.warn)out.push({lv:'warn',t:`${cat(c).name} al ${pct(u)} del presupuesto`,d:`Quedan ${eur(lim-sp)} y el mes va por el ${pct(el*100)}.`,go:'presupuestos'});
  else if(pr>lim*1.05&&u>el*100)out.push({lv:'ser',t:`${cat(c).name} va por encima del ritmo`,d:`Al ritmo actual cerrarás en ~${eur(pr)} (límite ${eur(lim)}).`,go:'presupuestos'})}
 const incRef=t.inc>0?Math.max(t.inc,p.inc):forecast(CUR).inc;
 if(incRef>0)for(const[c,v]of Object.entries(t.by)){const sh=v/incRef*100;if(sh>=B.share&&cat(c).kind!=='auto')out.push({lv:'warn',t:`${cat(c).name} consume el ${pct(sh)} de tus ingresos`,d:`Tu umbral de aviso está en el ${B.share} %.`,go:'dashboard'})}
 if(monthsWithData().filter(m=>m<CUR).length>=2)for(const c of Object.keys(t.by)){const exp=expectedToDate(c);const a=t.by[c];if(exp>20&&a>exp*(1+B.dev/100)&&a-exp>25)out.push({lv:'info',t:`${cat(c).name} se desvía de la previsión`,d:`Llevas ${eur(a)} y lo esperado a día ${DAY} era ~${eur(exp)} (+${pct((a/exp-1)*100)}).`,go:'previsiones'})}
 const lu=lastUpload();const ref=[lu,S.reminder.doneAt].filter(Boolean).sort().pop();
 if(S.reminder.enabled&&!S.demo){const dd=ref?daysBetween(ref.slice(0,10),TODAY):null;if(dd===null||dd>=S.reminder.days)out.push({lv:'info',t:dd===null?'Aún no has subido ningún extracto':`Hace ${dd} días que no subes un extracto`,d:'Sube el último para mantener tus datos al día.',go:'import'})}
 const ord={crit:0,ser:1,warn:2,info:3};return out.sort((a,b)=>ord[a.lv]-ord[b.lv])})}

function localInsights(){return memoize('li',()=>{const out=[];const hist=monthsWithData().filter(m=>m<CUR).slice(-3);if(!hist.length)return out;
 const t=totals(CUR);const D=dim(CUR);
 for(const c of expCats()){const avg=hist.reduce((a,m)=>a+(totals(m).by[c.id]||0),0)/hist.length;const now=t.by[c.id]||0;const proj=projectCur().byCat[c.id]||now;
  if(avg>40&&proj>avg*1.2)out.push({tone:'warn',t:`${c.name} por encima de lo habitual`,d:`Al ritmo actual cerrarás el mes en ~${eur(proj)}, frente a una media de ${eur(avg)} en los últimos ${hist.length} meses.`,imp:proj-avg})}
 const rec=recurring().filter(r=>r.sign<0);const subs=rec.filter(r=>r.sub);
 if(subs.length)out.push({tone:'info',t:`${subs.length} suscripciones activas`,d:`Suman ${eur(subs.reduce((a,r)=>a+r.amt,0),1)} al mes (${eur(subs.reduce((a,r)=>a+r.amt,0)*12)} al año): ${subs.map(s=>s.name.split(' ')[0]).slice(0,6).join(', ')}.`,imp:subs.reduce((a,r)=>a+r.amt,0)});
 for(const r of rec.filter(r=>r.rise))out.push({tone:'warn',t:`Subida de precio: ${r.name.split(' ').slice(0,2).join(' ')}`,d:`Ha pasado de ${eur(r.rise.from,1)} a ${eur(r.rise.to,1)} al mes.`,imp:r.rise.to-r.rise.from});
 const rates=hist.map(m=>{const x=totals(m);return x.inc?x.sav/x.inc*100:0});const avgR=rates.reduce((a,b)=>a+b,0)/rates.length;
 out.push({tone:avgR>=20?'ok':'info',t:`Tasa de ahorro media: ${pct(avgR)}`,d:avgR>=20?'Estás por encima del 20 % recomendado como referencia habitual.':`Llegar al 20 % supondría ahorrar unos ${eur(hist.reduce((a,m)=>a+totals(m).inc,0)/hist.length*.2)} al mes.`,imp:0});
 const merch={};for(const x of S.tx)if(x.d.slice(0,7)>=hist[0]&&x.a<0&&cat(x.cat).kind!=='neutro'&&!rec.some(r=>r.k===x.k))merch[x.k]=(merch[x.k]||0)-x.a;
 const top=Object.entries(merch).sort((a,b)=>b[1]-a[1])[0];if(top)out.push({tone:'info',t:`Donde más gastas: ${top[0]}`,d:`${eur(top[1])} en los últimos ${hist.length+1} meses, sin contar recibos fijos.`,imp:0});
 return out})}

/* ============ clasificación ============ */
const NO1=new Set('TARRAGONA REUS BARCELONA BCN MADRID VALENCIA SALOU CAMBRILS LLEIDA GIRONA SEVILLA ESPANYA BIZUM TRANSFERENCIA TRASPASO TARG TARGETA PAGAMENT REBUT ABONAMENT CARREC PENDING'.split(' '));
function ruleCat(k){const w=k1(k);const c=S.rules[k]||(NO1.has(w)||/^\d+$/.test(w)?null:S.rules['1:'+w]);return c&&(CM[c])?c:null}
const normW=x=>deacc(String(x).toUpperCase()).replace(/[^A-Z0-9&]+/g,' ');
function kwCat(concept,a){const s=' '+normW(concept)+' ';for(const[c,words]of Object.entries(KW)){if(!CM[c])continue;const kind=cat(c).kind;if(kind==='gasto'&&a>0&&c!=='compras')continue;if(kind==='ingreso'&&a<0)continue;for(const w of words){const wn=normW(w).trim();if(!wn)continue;if(w.endsWith(' ')?s.includes(' '+wn+' '):s.includes(' '+wn))return c}}return null}
function classifyLocal(list){const rest=[];for(const t of list){const r=ruleCat(t.k);if(r){t.cat=r;t.by='rule';t.conf=1;continue}const kw=kwCat(t.c,t.a);if(kw){t.cat=kw;t.by='kw';t.conf=.75}else{t.cat='none';t.by='none';t.conf=0}rest.push(t)}return rest}
async function classifyAI(list,onDone){if(!SAMPLE||!list.length)return 0;const byKey={};for(const t of list)(byKey[(t.a<0?'-':'+')+t.k]||(byKey[(t.a<0?'-':'+')+t.k]=[])).push(t);
 const keys=Object.keys(byKey);let n=0;
 const catsTxt=S.cats.map(c=>({id:c.id,nombre:c.name,tipo:c.kind}));
 const ex=Object.entries(S.rules).filter(([k])=>!k.startsWith('1:')).slice(-60).map(([k,c])=>`${k} → ${c}`).join('\n');
 for(let i=0;i<keys.length;i+=70){const chunk=keys.slice(i,i+70);const items=chunk.map((k,j)=>({i:j,concepto:byKey[k][0].c,importe:byKey[k][0].a}));
  const prompt=`Eres el clasificador de movimientos bancarios de una app de finanzas personales en España.\nAsigna a cada movimiento UNA categoría de la lista, usando su id exacto. Si de verdad no encaja ninguna, usa "none".\nCategorías (tipo gasto/ingreso/neutro): ${JSON.stringify(catsTxt)}\nImportes negativos = gastos, positivos = ingresos. No asignes una categoría de ingreso a un gasto ni al revés; los traspasos entre cuentas propias o a ahorro/inversión van a la categoría de tipo neutro.\n${ex?'Correcciones que ha hecho el usuario (concepto normalizado → id). Respétalas y generaliza a casos parecidos:\n'+ex+'\n':''}Movimientos: ${JSON.stringify(items)}\nResponde solo con JSON: {"r":[{"i":0,"cat":"id","conf":0.0}]} donde conf es tu confianza de 0 a 1.`;
  try{const res=await SAMPLE.json(prompt,{modelTier:'quick'});const arr=(res&&res.r)||[];
   for(const r of arr){const k=chunk[r.i];if(!k||!CM[r.cat]||r.cat==='none')continue;const kind=cat(r.cat).kind;for(const t of byKey[k]){if(t.by==='kw'&&(r.conf||0)<.8)continue;if(kind==='ingreso'&&t.a<0)continue;t.cat=r.cat;t.by='ia';t.conf=Math.max(0,Math.min(1,+r.conf||.6));n++}}
  }catch(e){if(e&&e.code==='not_granted'){SAMPLE=null;break}if(e&&e.code==='rate_limited'){toast('La IA está ocupada; prueba a reclasificar en unos minutos.');break}}
  onDone&&onDone()}
 return n}
function setCat(t,c,learn){const months=[t.d.slice(0,7)];t.cat=c;t.by='user';t.conf=1;
 if(learn){S.rules[t.k]=c;const one='1:'+k1(t.k);const others=S.tx.filter(x=>k1(x.k)===k1(t.k)&&x.k!==t.k&&x.by==='user'&&x.cat!==c);if(others.length||NO1.has(k1(t.k))||/^\d+$/.test(k1(t.k)))delete S.rules[one];else S.rules[one]=c}
 const similar=S.tx.filter(x=>x!==t&&x.k===t.k&&x.cat!==c&&x.by!=='user');bump();save(months);return similar}

/* ============ importación ============ */
const LIB={papa:'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js',xlsx:'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',pdf:'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',pdfw:'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'};
const loaded={};
function loadScript(src){return loaded[src]||(loaded[src]=new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>{delete loaded[src];rej(new Error('No se pudo cargar el lector de archivos. Revisa tu conexión.'))};document.head.appendChild(s)}))}
function parseNum(v){if(typeof v==='number')return v;if(v==null)return NaN;let s=String(v).trim().replace(/[\s ]|€|EUR/gi,'');if(!s)return NaN;let neg=false;
 if(/^\(.*\)$/.test(s)){neg=true;s=s.slice(1,-1)}if(s.endsWith('-')){neg=!neg;s=s.slice(0,-1)}if(s.startsWith('+'))s=s.slice(1);if(s.startsWith('-')){neg=!neg;s=s.slice(1)}
 const lc=s.lastIndexOf(','),ld=s.lastIndexOf('.');
 if(lc>-1&&ld>-1){s=lc>ld?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'')}
 else if(lc>-1){s=(s.match(/,/g).length>1)?s.replace(/,/g,''):s.replace(',','.')}
 else if(ld>-1){if(s.match(/\./g).length>1||/^\d{1,3}\.\d{3}$/.test(s))s=s.replace(/\./g,'')}
 if(!/^\d*\.?\d+$/.test(s))return NaN;return(neg?-1:1)*parseFloat(s)}
const MESX={ene:1,jan:1,feb:2,mar:3,abr:4,apr:4,may:5,jun:6,jul:7,ago:8,aug:8,sep:9,set:9,oct:10,nov:11,dic:12,dec:12};
function parseDate(v,yh){if(v==null||v==='')return null;
 if(typeof v==='number'){if(v>20000&&v<80000){const d=new Date(Date.UTC(1899,11,30)+Math.round(v)*864e5);return d.toISOString().slice(0,10)}return null}
 const s=String(v).trim();let m,y,mo,d;
 if(m=/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/.exec(s)){y=+m[1];mo=+m[2];d=+m[3]}
 else if(m=/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})\b/.exec(s)){d=+m[1];mo=+m[2];y=+m[3];if(y<100)y+=2000}
 else if(m=/^(\d{1,2})[-\/.](\d{1,2})(?![\d])/.exec(s)){d=+m[1];mo=+m[2];y=yh||+TODAY.slice(0,4)}
 else if(m=/^(\d{1,2})[\s\-\/.]*([a-zA-Z]{3})[a-zA-Z]*\.?[\s\-\/.]*(\d{2,4})?/.exec(deacc(s))){d=+m[1];mo=MESX[m[2].toLowerCase()];y=m[3]?(+m[3]<100?+m[3]+2000:+m[3]):(yh||+TODAY.slice(0,4))}
 else return null;
 if(!mo||mo>12||!d||d>31||y<1990||y>2100)return null;return y+'-'+pad(mo)+'-'+pad(d)}
const HDR={date:/^(f\.?\s*)?(fecha|data|date|dia)(\s*(de\s*)?(operaci[oó]n|oper\.?|contable|movimiento|transacci[oó]n))?\.?$/i,dateV:/valor/i,concept:/concepto|descripci[oó]n|detalle|movimiento|concept|description|observaciones|beneficiario|comercio|referencia|^texto/i,amount:/^(importe|cantidad|amount|import|valor|monto)\b/i,debit:/cargo|debe|^gastos?$|salida|debit|reintegro|d[eé]bito/i,credit:/abono|haber|^ingresos?$|entrada|credit|cr[eé]dito/i,balance:/saldo|balance|disponible/i};
function detectMap(rows){let hi=-1,map=null;
 for(let i=0;i<Math.min(rows.length,40);i++){const r=rows[i].map(x=>String(x??'').trim());const m={date:-1,concept:[],amount:-1,debit:-1,credit:-1};let dv=-1;
  r.forEach((h,j)=>{if(!h||h.length>40)return;if(HDR.balance.test(h))return;if(HDR.date.test(h)&&m.date<0)m.date=j;else if(HDR.dateV.test(h)&&/^(f\b|f\.|fecha|data|date)/i.test(h)){if(dv<0)dv=j}else if(HDR.amount.test(h)&&m.amount<0)m.amount=j;else if(HDR.debit.test(h)&&m.debit<0)m.debit=j;else if(HDR.credit.test(h)&&m.credit<0)m.credit=j;else if(HDR.concept.test(h))m.concept.push(j)});
  if(m.date<0&&dv>=0)m.date=dv;
  if(m.date>=0&&(m.amount>=0||m.debit>=0||m.credit>=0)){hi=i;map=m;break}}
 const body=rows.slice(hi+1,hi+80);const ncol=Math.max(...rows.slice(0,80).map(r=>r.length),0);
 if(!map){map={date:-1,concept:[],amount:-1,debit:-1,credit:-1};const stat=[];
  for(let j=0;j<ncol;j++){let d=0,n=0,neg=0,len=0,tot=0;for(const r of body){const v=r[j];if(v===''||v==null)continue;tot++;if(parseDate(v))d++;else if(!isNaN(parseNum(v))){n++;if(parseNum(v)<0)neg++}else len+=String(v).length}stat.push({j,d:d/(tot||1),n:n/(tot||1),neg,len:len/(tot||1)})}
  const dc=stat.filter(s=>s.d>.6).sort((a,b)=>b.d-a.d)[0];if(dc)map.date=dc.j;
  const nc=stat.filter(s=>s.n>.6&&s.j!==map.date).sort((a,b)=>b.neg-a.neg||a.j-b.j)[0];if(nc)map.amount=nc.j;
  const cc=stat.filter(s=>s.j!==map.date&&s.j!==map.amount).sort((a,b)=>b.len-a.len)[0];if(cc)map.concept=[cc.j];hi=-1}
 if(!map.concept.length){const used=new Set([map.date,map.amount,map.debit,map.credit]);let best=-1,bl=0;for(let j=0;j<ncol;j++){if(used.has(j))continue;const l=body.reduce((a,r)=>a+(isNaN(parseNum(r[j]))&&!parseDate(r[j])?String(r[j]??'').length:0),0);if(l>bl){bl=l;best=j}}if(best>=0)map.concept=[best]}
 return{hi,map,ncol}}
function rowsToMovs(rows,hi,map,inv){const out=[];for(let i=hi+1;i<rows.length;i++){const r=rows[i];const d=parseDate(r[map.date]);if(!d)continue;let a;
 if(map.amount>=0)a=parseNum(r[map.amount]);else{const db=parseNum(r[map.debit]),cr=parseNum(r[map.credit]);a=(isNaN(cr)?0:Math.abs(cr))-(isNaN(db)?0:Math.abs(db));if(isNaN(db)&&isNaN(cr))a=NaN}
 if(isNaN(a)||a===0)continue;if(inv)a=-a;const parts=map.concept.map(j=>String(r[j]??'').trim()).filter(Boolean);const c=parts.filter((x,i)=>!parts.some((y,j)=>j!==i&&y.length>x.length&&normW(y).includes(normW(x).trim()))).join(' · ').replace(/\s+/g,' ')||'Movimiento';out.push({d,c,a:r2(a)})}return out}
async function readText(file){const buf=await file.arrayBuffer();let t=new TextDecoder('utf-8').decode(buf);if(t.includes(String.fromCharCode(0xFFFD)))t=new TextDecoder('windows-1252').decode(buf);return t}
async function parseFile(file){const ext=(file.name.split('.').pop()||'').toLowerCase();
 if(ext==='pdf'||file.type==='application/pdf')return parsePDF(file);
 if(/^image\//.test(file.type)||['jpg','jpeg','png','webp','gif'].includes(ext)){const f={name:file.name,kind:'image',file,movs:[]};await aiRead(f);return f}
 let rows,text;
 if(ext==='xls'||ext==='xlsx'||ext==='ods'){await loadScript(LIB.xlsx);const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});let best=[],bs=null;for(const n of wb.SheetNames){const r=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:''});if(r.length>best.length){best=r;bs=wb.Sheets[n]}}rows=best;try{text=XLSX.utils.sheet_to_csv(bs,{FS:' | ',blankrows:false})}catch(e){text=''}}
 else{await loadScript(LIB.papa);text=await readText(file);rows=Papa.parse(text.trim(),{skipEmptyLines:true}).data}
 const det=detectMap(rows);const f={name:file.name,kind:'table',rows,text,...det,inv:false,movs:det.map.date>=0?rowsToMovs(rows,det.hi,det.map,false):[]};
 if(!f.movs.length)await aiRead(f);return f}
async function pdfOpen(file){await loadScript(LIB.pdf);await loadScript(LIB.pdfw);const lib=window.pdfjsLib;lib.GlobalWorkerOptions.workerSrc=LIB.pdfw;
 try{return await lib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise}
 catch(e){if(e&&e.name==='PasswordException')throw new Error('El PDF está protegido con contraseña. Descárgalo sin contraseña o usa el Excel/CSV de tu banca online.');throw new Error('No se pudo abrir el PDF ('+((e&&e.message)||'formato no válido')+').')}}
async function pdfText(doc){const lines=[];
 for(let p=1;p<=Math.min(doc.numPages,40);p++){const st=lines.length;const pg=await doc.getPage(p);const tc=await pg.getTextContent();const items=tc.items.filter(i=>i.str&&i.str.trim()).map(i=>({s:i.str,x:i.transform[4],y:i.transform[5],w:i.width}));
  items.sort((a,b)=>b.y-a.y||a.x-b.x);let cur=null;
  for(const it of items){if(!cur||Math.abs(cur.y-it.y)>3){cur={y:it.y,it:[]};lines.push(cur)}cur.it.push(it)}
  for(const l of lines.slice(st)){l.it.sort((a,b)=>a.x-b.x);let t='',lx=null;for(const i of l.it){t+=(lx===null?'':(i.x-lx>12?'   ':' '))+i.s;lx=i.x+i.w}l.t=t.trim()}}
 return lines.map(l=>l.t).filter(Boolean)}
function pdfHeuristic(lines){const all=lines.join('\n');const yrs=(all.match(/\b20\d{2}\b/g)||[]).reduce((m,y)=>(m[y]=(m[y]||0)+1,m),{});const yh=+(Object.entries(yrs).sort((a,b)=>b[1]-a[1])[0]||[TODAY.slice(0,4)])[0];
 const AM=/-?\d{1,3}(?:\.\d{3})*,\d{2}-?|-?\d+,\d{2}-?|-?\d{1,3}(?:,\d{3})*\.\d{2}(?![\d,])/g;const out=[];let prevBal=null,last=null;
 for(const ln of lines){const dm=/^(\d{1,2}[\/\-.]\d{1,2}(?:[\/\-.]\d{2,4})?|\d{1,2}\s+[A-Za-zÁÉÍÓÚáéíóú]{3}\.?(?:\s+\d{4})?)\s+/.exec(ln);
  if(!dm){if(/saldo/i.test(ln)){const b=ln.match(AM);AM.lastIndex=0;if(b)prevBal=parseNum(b[b.length-1])}else if(last&&!AM.test(ln)&&ln.length<70&&!last.extra){last.c+=' '+ln.trim();last.extra=1}AM.lastIndex=0;continue}
  const d=parseDate(dm[1],yh);if(!d){last=null;continue}let rest=ln.slice(dm[0].length);const dm2=/^(\d{1,2}[\/\-.]\d{1,2}(?:[\/\-.]\d{2,4})?)\s+/.exec(rest);if(dm2)rest=rest.slice(dm2[0].length);
  const ams=rest.match(AM)||[];AM.lastIndex=0;if(!ams.length){last=null;continue}
  const firstIdx=rest.search(/-?\d{1,3}(?:[.,]\d{3})*[.,]\d{2}-?(?=\s|$)/);const concept=(firstIdx>0?rest.slice(0,firstIdx):rest).replace(/\s{2,}/g,' ').trim();
  let amt=parseNum(ams.length>=2?ams[ams.length-2]:ams[0]);const bal=ams.length>=2?parseNum(ams[ams.length-1]):null;const signed=/-/.test(ams.length>=2?ams[ams.length-2]:ams[0]);
  let known=signed;if(!signed&&bal!=null&&prevBal!=null){const diff=r2(bal-prevBal);if(Math.abs(Math.abs(diff)-Math.abs(amt))<.011){amt=Math.sign(diff)*Math.abs(amt);known=true}}
  if(!known&&!/ABONO|INGRESO|NOMINA|N[OÓ]MINA|TRANSFERENCIA RECIBIDA|TRANSF\.? A SU FAVOR|BIZUM DE|BIZUM RECIBIDO|DEVOLUCI|REEMBOLSO|INTERESES/i.test(concept))amt=-Math.abs(amt);
  if(bal!=null)prevBal=bal;if(isNaN(amt)||!amt||!concept||/^saldo/i.test(concept)){continue}
  last={d,c:concept,a:r2(amt)};out.push(last)}
 return out.map(({d,c,a})=>({d,c,a}))}
async function pdfImages(doc,max){const out=[];for(let p=1;p<=Math.min(doc.numPages,max);p++){const pg=await doc.getPage(p);const v1=pg.getViewport({scale:1});const v=pg.getViewport({scale:Math.min(2.2,1700/Math.max(v1.width,v1.height))});
 const cv=document.createElement('canvas');cv.width=Math.round(v.width);cv.height=Math.round(v.height);const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
 await pg.render({canvasContext:ctx,viewport:v}).promise;const b=await new Promise(r=>cv.toBlob(r,'image/jpeg',.88));if(b)out.push(b)}return out}
const AIERR={not_granted:'No has dado permiso a Caudal para usar Claude. Recarga la página y pulsa «Permitir» cuando te lo pida.',sampling_disabled:'Claude no está disponible para tu cuenta ahora mismo.',not_declared:'La app no tiene permiso para usar la IA.',capability_disabled:'La IA no está disponible en esta vista. Abre Caudal desde claude.ai.',capability_removed:'Tu versión de la app de Claude es antigua: actualízala o abre Caudal en el navegador.',images_unavailable:'Esta vista no permite enviar imágenes a la IA. Abre Caudal desde claude.ai en el navegador o en la app de escritorio.',image_rejected:'Alguna página es demasiado grande o no se pudo procesar.',rate_limited:'Has usado la IA muchas veces seguidas o has llegado a tu límite de uso. Prueba en unos minutos.',prompt_too_large:'El extracto es demasiado largo para la IA.',invalid_json:'La respuesta de la IA llegó incompleta. Vuelve a intentarlo.',refused:'La IA no ha querido procesar este documento.',empty_completion:'La IA no ha devuelto nada. Vuelve a intentarlo.',session_expired:'Tu sesión de Claude ha caducado: vuelve a iniciar sesión.',upstream_error:'Error temporal de conexión con la IA. Vuelve a intentarlo.',no_view:'Para leer con IA, activa la IA gratuita (Gemini) en Ajustes.',bad_key:'La clave de Gemini no es válida o no tiene acceso. Revísala en Ajustes.'};
const aiMsg=e=>AIERR[e&&e.code]||(e&&e.message)||'Error desconocido';
const XRULES=`Extrae TODOS los movimientos de este extracto bancario (España). Ignora saldos, totales, cabeceras, resúmenes, comisiones informativas y publicidad.
Para cada movimiento: fecha (YYYY-MM-DD; si falta el año, dedúcelo del documento), concepto (texto original, conciso, sin la fecha) e importe (número con punto decimal; NEGATIVO si es un cargo/gasto/adeudo, POSITIVO si es un abono/ingreso). Si hay columnas separadas de cargo y abono, o una columna de saldo, úsalas para deducir el signo.
Responde solo con JSON compacto, un array por movimiento: {"m":[["2026-01-31","CONCEPTO",-12.5]]}. Si no hay movimientos: {"m":[]}.`;
function toMovs(res){const arr=(res&&(res.m||res.movs))||[];return arr.map(x=>Array.isArray(x)?{d:parseDate(x[0]),c:String(x[1]??'').trim(),a:r2(parseNum(x[2]))}:{d:parseDate(x.fecha),c:String(x.concepto??'').trim(),a:r2(parseNum(x.importe))}).filter(m=>m.d&&m.a&&isFinite(m.a)).map(m=>({...m,c:m.c||'Movimiento'}))}
function chunkText(text,size){const out=[];let cur='';for(const l of text.split('\n')){if(cur.length+l.length+1>size&&cur){out.push(cur);cur=''}cur+=l.slice(0,size)+'\n'}if(cur.trim())out.push(cur);return out}
function aiProg(i,n){if(!IMP)return;IMP.prog=n>1?`La IA está leyendo el extracto (parte ${i} de ${n})…`:'La IA está leyendo el extracto…';renderImport()}
async function aiExtractText(text){const parts=chunkText(text,10000).slice(0,12);const all=[];
 for(let i=0;i<parts.length;i++){aiProg(i+1,parts.length);const res=await SAMPLE.json(XRULES+(parts.length>1?`\n(Este es el fragmento ${i+1} de ${parts.length}: extrae solo los movimientos que aparecen en él.)`:'')+'\n\nEXTRACTO:\n'+parts[i],{modelTier:'default'});all.push(...toMovs(res))}return all}
async function aiExtractImages(blobs){const lim=await SAMPLE.limits().catch(()=>null);if(!lim||!lim.images)throw{code:'images_unavailable'};const per=Math.max(1,Math.min(lim.images.maxCount||1,3));const n=Math.ceil(blobs.length/per);const all=[];
 for(let i=0;i<n;i++){aiProg(i+1,n);const res=await SAMPLE.json(XRULES+`\n\nLas imágenes adjuntas son ${n>1?`las páginas ${i*per+1} a ${Math.min((i+1)*per,blobs.length)} de `:''}un extracto bancario escaneado o fotografiado. Lee los movimientos directamente de las imágenes.`,{images:blobs.slice(i*per,(i+1)*per),modelTier:'default'});all.push(...toMovs(res))}return all}
async function aiRead(f){f.aiErr=null;if(!SAMPLE){f.aiErr=AIERR.no_view;return}
 try{let movs;if(f.kind==='image')movs=await aiExtractImages([f.file]);else if(f.kind==='pdf'&&f.scanned)movs=await aiExtractImages(await pdfImages(f.doc,20));else movs=await aiExtractText(f.text||'');
  if(!movs.length&&f.kind==='pdf'&&!f.scanned){movs=await aiExtractImages(await pdfImages(f.doc,20))}
  if(movs.length){f.movs=movs;f.via='ia';if(f.kind==='table')f.aiTable=true}else f.aiErr='La IA no ha encontrado movimientos en el documento.'}
 catch(e){f.aiErr=aiMsg(e);if(e&&e.code==='not_granted')AIDENIED=true}finally{if(IMP)IMP.prog=null}}
let AIDENIED=false;
async function parsePDF(file){const doc=await pdfOpen(file);const lines=await pdfText(doc);const text=lines.join('\n');const scanned=text.replace(/\s/g,'').length<80*Math.min(doc.numPages,40);
 const f={name:file.name,kind:'pdf',text,doc,scanned,movs:scanned?[]:pdfHeuristic(lines),via:'lector'};
 if(f.movs.length<3)await aiRead(f);return f}
const dkey=t=>t.d+'|'+Math.round(t.a*100);
const sigW=c=>new Set(normW(c).split(' ').filter(w=>w.length>=4&&!STOP.has(w)));
function markDups(movs){const ex={};for(const t of S.tx){if(t.src==='demo')continue;(ex[dkey(t)]||(ex[dkey(t)]=[])).push({w:sigW(t.c),k:t.k,used:false})}let dup=0;
 for(const m of movs){m.k=mkey(m.c);m.dup=false;const cands=ex[dkey(m)];if(!cands)continue;const w=sigW(m.c);
  const hit=cands.find(c=>!c.used&&(c.k===m.k||[...w].some(x=>c.w.has(x))));if(hit){hit.used=true;m.dup=true;dup++}}return dup}
let IMP=null;
async function handleFiles(files){if(!files||!files.length)return;IMP={files:[],status:'parsing',ai:0,prog:null};renderImport();
 for(const f of files){try{IMP.files.push(await parseFile(f))}catch(e){IMP.files.push({name:f.name,kind:'error',err:e.message||String(e),movs:[]})}}
 await rebuildImport(true)}
async function rebuildImport(classify){const all=[];for(const f of IMP.files)for(const m of f.movs)all.push({...m,file:f.name});
 IMP.movs=all;IMP.dup=markDups(all);const fresh=all.filter(m=>!m.dup);const rest=classifyLocal(fresh);IMP.status='ready';renderImport();
 if(classify&&SAMPLE&&rest.length){IMP.status='ai';renderImport();await classifyAI(rest,()=>{});IMP.status='ready';renderImport()}}
function commitImport(){const fresh=IMP.movs.filter(m=>!m.dup);if(!fresh.length){closeModal();return}
 const wasDemo=S.demo;const id=uid();const at=new Date().toISOString();const months=new Set();
 if(wasDemo){S.tx=S.tx.filter(t=>t.src!=='demo');S.planned=S.planned.filter(p=>!p.demo);S.demo=false}
 for(const m of fresh){const t={id:uid(),d:m.d,c:m.c,a:m.a,cat:m.cat||'none',k:m.k,by:m.by||'none',conf:m.conf||0,src:id};S.tx.push(t);months.add(m.d.slice(0,7))}
 S.tx.sort((a,b)=>a.d<b.d?1:-1);const ds=fresh.map(m=>m.d).sort();
 S.imports.push({id,at,name:IMP.files.map(f=>f.name).join(', '),n:fresh.length,dup:IMP.dup,from:ds[0],to:ds[ds.length-1]});
 S.reminder.lastUploadAt=at;S.reminder.doneAt=null;const nd=IMP.dup;bump();save([...months]);saveReminder();closeModal();
 toast(`${fresh.length} movimientos importados${nd?` · ${nd} duplicados omitidos`:''}${wasDemo?' · datos de ejemplo eliminados':''}.`);UI.month=CUR;render()}
function renderImport(){const I=IMP;let h=`<div class="row" style="margin-bottom:12px"><h2 class="sp">Importar extracto</h2><button class="ib" data-act="close" aria-label="Cerrar">${ic('x')}</button></div>`;
 if(I.status==='parsing'||(I.status==='ai'&&I.prog)){h+=`<div class="empty"><div class="spin" style="margin:0 auto 12px"></div>${esc(I.prog||'Leyendo el archivo…')}<br><span class="mut small">${I.prog?'Puede tardar hasta un minuto por parte.':''}</span></div>`;return openModal(h,true)}
 const n=I.movs.length,fresh=I.movs.filter(m=>!m.dup);const ds=I.movs.map(m=>m.d).sort();
 for(const f of I.files){if(f.kind==='error')h+=`<div class="al crit">${ic('warn')}<div><div class="t">No se pudo leer ${esc(f.name)}</div><div class="d">${esc(f.err)}</div></div><span></span></div>`}
 for(const f of I.files){if(f.aiErr)h+=`<div class="al warn" style="margin-bottom:12px">${ic('warn')}<div><div class="t">La IA no ha podido leer ${esc(f.name)}</div><div class="d">${esc(f.aiErr)}</div></div>${SAMPLE&&!AIDENIED?'<button class="btn sm" data-act="aiextract">Reintentar</button>':'<span></span>'}</div>`}
 const tab=I.files.length===1&&I.files[0].kind==='table'&&!I.files[0].aiTable?I.files[0]:null;
 if(tab){const hdr=tab.hi>=0?tab.rows[tab.hi]:Array.from({length:tab.ncol},(_,j)=>'Columna '+(j+1));const opts=(sel,none)=>(none?`<option value="-1">—</option>`:'')+hdr.map((x,j)=>`<option value="${j}" ${sel===j?'selected':''}>${esc(String(x||'Columna '+(j+1)).slice(0,30))}</option>`).join('');
  h+=`<p class="mut small" style="margin:0">Columnas detectadas automáticamente. Ajústalas si algo no cuadra.</p><div class="mapg">
  <label class="f">Fecha<select data-map="date">${opts(tab.map.date)}</select></label>
  <label class="f">Concepto<select data-map="concept">${opts(tab.map.concept[0]??-1,1)}</select></label>
  <label class="f">Importe<select data-map="amount">${opts(tab.map.amount,1)}</select></label>
  <label class="f">Cargo / Abono<select data-map="debit">${opts(tab.map.debit,1)}</select></label></div>
  <label class="chk"><input type="checkbox" data-inv ${tab.inv?'checked':''}> Mi banco muestra los gastos en positivo (invertir signos)</label>`}
 const pdf=I.files.find(f=>f.kind!=='error');const canAI=SAMPLE&&!AIDENIED;
 if(!n)h+=`<div class="empty">No he encontrado movimientos en el archivo.${canAI?'<br><br><button class="btn pri" data-act="aiextract">Leer con IA</button>':SAMPLE?'':'<br><span class="small">'+esc(AIERR.no_view)+'</span>'}${tab?'<br><span class="small">También puedes ajustar arriba las columnas de fecha e importe.</span>':''}</div>`;
 else{h+=`<div class="row" style="margin:6px 0 14px"><span class="tag sky">${n} detectados</span><span class="tag ok">${fresh.length} nuevos</span>${I.dup?`<span class="tag warn">${I.dup} duplicados (se omitirán)</span>`:''}<span class="mut small">${fDate(ds[0])} – ${fDate(ds[ds.length-1])}</span><span class="sp"></span>${I.status==='ai'?'<span class="row small mut"><span class="spin"></span>La IA está clasificando…</span>':''}${pdf&&canAI&&I.status!=='ai'?`<button class="btn sm ghost" data-act="aiextract">${ic('ai')}${pdf.via==='ia'?'Leído con IA · repetir':'¿Falta algo? Leer con IA'}</button>`:''}</div>
  <div class="pv"><table><thead><tr><th></th><th>Fecha</th><th>Concepto</th><th>Categoría</th><th class="n">Importe</th></tr></thead><tbody>${I.movs.slice(0,250).map(m=>`<tr class="${m.dup?'dup':''}"><td>${m.dup?'<span class="tag">Duplicado</span>':''}</td><td style="white-space:nowrap">${fDate(m.d)}</td><td>${esc(m.c)}</td><td>${m.dup?'':`<span class="sw" style="background:${cat(m.cat).color}"></span> ${esc(cat(m.cat).name)}<span class="src ${m.by==='ia'&&m.conf<.6||m.by==='none'?'low':''}">${srcLbl(m)}</span>`}</td><td class="n ${m.a>0?'pos':''}">${eur(m.a,1)}</td></tr>`).join('')}</tbody></table></div>
  ${n>250?`<p class="mut tiny">Mostrando 250 de ${n}.</p>`:''}`}
 h+=`<div class="row mt"><span class="mut small sp">${S.demo&&fresh.length?'Al importar se eliminarán los datos de ejemplo.':'Podrás corregir cualquier categoría después; la app aprenderá de tus cambios.'}</span><button class="btn ghost" data-act="close">Cancelar</button><button class="btn pri" data-act="commit" ${fresh.length&&I.status!=='ai'?'':'disabled'}>Importar ${fresh.length||''} movimientos</button></div>`;
 openModal(h,true)}
function srcLbl(m){return m.by==='rule'?'Aprendido':m.by==='kw'?'Auto':m.by==='ia'?'IA '+Math.round((m.conf||0)*100)+'%':m.by==='user'?'Tú':m.by==='demo'?'Ejemplo':'Revisar'}
function openUpload(){openModal(`<div class="row" style="margin-bottom:14px"><h2 class="sp">Subir extracto bancario</h2><button class="ib" data-act="close" aria-label="Cerrar">${ic('x')}</button></div>
 <div class="drop" id="drop" tabindex="0" role="button">${ic('upl')}<h3 style="margin:10px 0 4px">Arrastra aquí tu extracto o pulsa para elegirlo</h3><p class="mut small" style="margin:0">Excel (.xlsx, .xls), CSV, PDF (también escaneado) o foto/captura · puedes subir varios a la vez</p></div>
 <p class="mut small">Detecto fecha, concepto, importe y tipo de movimiento. Si el extracto se solapa con otro ya subido, los movimientos repetidos se omiten.</p>`,true);
 const dz=$('#drop');dz.onclick=()=>$('#fileIn').click();dz.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#fileIn').click()}};
 dz.ondragover=e=>{e.preventDefault();dz.classList.add('on')};dz.ondragleave=()=>dz.classList.remove('on');dz.ondrop=e=>{e.preventDefault();handleFiles([...e.dataTransfer.files])}}
