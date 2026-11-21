/* Caudal · core.js */
/* ============ utilidades ============ */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let NF0,NF2;
try{NF0=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0,useGrouping:'always'});NF2=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:'always'});NF0.format(1)}catch(e){NF0=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0});NF2=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2})}
const eur=(n,d)=>(d?NF2:NF0).format(Math.abs(n)<.005?0:n);
const pct=n=>isFinite(n)?Math.round(n)+' %':'—';
const r2=n=>Math.round(n*100)/100;
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MES3=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const pad=n=>String(n).padStart(2,'0');
const isoD=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const NOW=new Date();const TODAY=isoD(NOW);const CUR=TODAY.slice(0,7);const DAY=NOW.getDate();
const addM=(mk,n)=>{let[y,m]=mk.split('-').map(Number);m+=n;y+=Math.floor((m-1)/12);m=((m-1)%12+12)%12+1;return y+'-'+pad(m)};
const dim=mk=>{const[y,m]=mk.split('-').map(Number);return new Date(y,m,0).getDate()};
const mLabel=(mk,s)=>{const[y,m]=mk.split('-');return s?MES3[m-1]+' '+y.slice(2):cap(MES[m-1])+' '+y};
const fDate=d=>{const[y,m,dd]=d.split('-');return +dd+' '+MES3[m-1]+(y!==TODAY.slice(0,4)?' '+y.slice(2):'')};
const median=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),h=s.length>>1;return s.length%2?s[h]:(s[h-1]+s[h])/2};
const daysBetween=(a,b)=>Math.floor((new Date(b)-new Date(a))/864e5);
const deacc=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'');
const ICON={
 dash:'<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
 movs:'<path d="M4 6h16M4 12h16M4 18h10"/>',
 bud:'<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 4"/>',
 fc:'<path d="M3 17l5-5 4 4 8-9"/><path d="M15 7h5v5"/>',
 ai:'<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
 set:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
 warn:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
 bell:'<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"/>',
 up:'<path d="M7 17L17 7M9 7h8v8"/>',down:'<path d="M7 7l10 10M17 9v8H9"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',ok:'<path d="M5 12l5 5L20 7"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',upl:'<path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>'
};
const ic=(n,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

/* ============ categorías y estado ============ */
const PAL=['#3987e5','#199e70','#d95926','#c98500','#d55181','#9085e9','#e66767','#0ca30c'];
const EXTRA=['#6aa9c9','#a8916a','#5fbfae','#b39ddb','#8796ab','#c9a0a0','#7fb07f','#a0a6c9'];
function defaultCats(){return[
 {id:'vivienda',name:'Vivienda',kind:'gasto',color:PAL[0]},{id:'super',name:'Supermercado',kind:'gasto',color:PAL[1]},
 {id:'restaurantes',name:'Restaurantes',kind:'gasto',color:PAL[2]},{id:'transporte',name:'Transporte',kind:'gasto',color:PAL[3]},
 {id:'compras',name:'Compras',kind:'gasto',color:PAL[4]},{id:'suscripciones',name:'Suscripciones',kind:'gasto',color:PAL[5]},
 {id:'suministros',name:'Suministros',kind:'gasto',color:PAL[6]},{id:'ocio',name:'Ocio',kind:'gasto',color:PAL[7]},
 {id:'salud',name:'Salud y deporte',kind:'gasto',color:EXTRA[0]},{id:'seguros',name:'Seguros',kind:'gasto',color:EXTRA[1]},
 {id:'viajes',name:'Viajes',kind:'gasto',color:EXTRA[2]},{id:'formacion',name:'Formación',kind:'gasto',color:EXTRA[3]},
 {id:'otros',name:'Otros gastos',kind:'gasto',color:EXTRA[4]},
 {id:'nomina',name:'Nómina',kind:'ingreso',color:'#8fd3ff'},{id:'otrosing',name:'Otros ingresos',kind:'ingreso',color:'#c4ebff'},
 {id:'traspasos',name:'Traspasos y ahorro',kind:'neutro',color:'#5a7391'}]}
const NONE={id:'none',name:'Sin categoría',kind:'auto',color:'#6b7f96'};
const KW={super:['MERCADONA','LIDL','CARREFOUR','ALDI','DIA ','EROSKI','CONSUM','BONPREU','BON PREU','CAPRABO','ALCAMPO','CONDIS','SUPERMERCADO','HIPERCOR','SPAR','AHORRAMAS','FROIZ','GADIS','PLUSFRESC','FRUTERIA','CARNICERIA','PANADERIA'],
 restaurantes:['RESTAURANT','BAR ','CAFE','CAFETERIA','GLOVO','JUST EAT','UBER EATS','DELIVEROO','MCDONALD','BURGER','STARBUCKS','TELEPIZZA','PIZZ','TAPAS','KFC','TAGLIATELLA','FOSTER','100 MONTADITOS','GOIKO','VIPS','TABERNA','BRASERIA','CERVECERIA','SUSHI','KEBAB'],
 transporte:['REPSOL','CEPSA','GALP','SHELL','BP ','GASOLINERA','ESTACION SERVICIO','PETRONOR','PLENOIL','BALLENOIL','RENFE','UBER','CABIFY','BOLT','METRO','TMB','T-MOBILITAT','PARKING','APARCAMIENTO','PEAJE','AUTOPISTA','AUTOPISTAS','ALSA','TAXI','BICING','ITV','TALLER'],
 viajes:['VUELING','RYANAIR','IBERIA','BOOKING','AIRBNB','HOTEL','EDREAMS','EASYJET','EXPEDIA','HOSTAL','TRAINLINE'],
 suscripciones:['NETFLIX','SPOTIFY','HBO','DISNEY','PRIME VIDEO','AMAZON PRIME','APPLE.COM','APPLE COM','ICLOUD','YOUTUBE','DAZN','FILMIN','AUDIBLE','CHATGPT','OPENAI','GOOGLE ONE','PLAYSTATION PLUS','XBOX','NINTENDO','MICROSOFT 365','ADOBE','CANVA','NOTION'],
 suministros:['ENDESA','IBERDROLA','NATURGY','HOLALUZ','REPSOL LUZ','TOTALENERGIES','AGUA','AIGUES','AIGÜES','GAS NATURAL','DIGI','VODAFONE','MOVISTAR','ORANGE','JAZZTEL','MASMOVIL','PEPEPHONE','SIMYO','LOWI','O2 ','YOIGO','FINETWORK','TELEFONICA'],
 vivienda:['ALQUILER','HIPOTECA','COMUNIDAD PROP','COMUNIDAD DE PROP','LLOGUER','IBI '],
 compras:['AMAZON','ZARA','MANGO','PRIMARK','CORTE INGLES','DECATHLON','IKEA','MEDIA MARKT','MEDIAMARKT','ALIEXPRESS','SHEIN','PCCOMPONENTES','FNAC','PULL&BEAR','BERSHKA','H&M','LEROY MERLIN','SEPHORA','DRUNI','PRIMOR','TEMU','WALLAPOP','VINTED','LEFTIES'],
 ocio:['CINE','CINESA','YELMO','OCINE','TEATRO','ENTRADAS','TICKETMASTER','STEAM','CONCIERTO','MUSEO','BOLERA','PADEL','DISCOTECA','FNAC TICKET'],
 salud:['FARMACIA','FARMACIA','CLINICA','DENTAL','DENTISTA','OPTICA','GIMNASIO','GYM','FITNESS','DIR ','BASIC FIT','MCFIT','FISIOTERAP','HOSPITAL','VETERINARI'],
 seguros:['SEGURO','MAPFRE','AXA','ALLIANZ','MUTUA','LINEA DIRECTA','SANITAS','ADESLAS','GENERALI','ZURICH','OCASO','SANTALUCIA','DKV','ASISA'],
 formacion:['ACADEMIA','CURSO','UNIVERSIDAD','UNIVERSITAT','MATRICULA','UDEMY','COURSERA','LIBRERIA','CASA DEL LIBRO','ESCUELA'],
 nomina:['NOMINA','SALARIO','NÒMINA','PAYROLL'],
 otrosing:['BIZUM DE','BIZUM RECIBIDO','TRANSFERENCIA RECIBIDA','DEVOLUCION','REEMBOLSO','ABONO ','INTERESES'],
 traspasos:['TRASPASO','CUENTA AHORRO','A CUENTA PROPIA','HUCHA','INVERSION','MYINVESTOR','INDEXA','TRADE REPUBLIC']};
const STOP=new Set('COMPRA COMPRAS TARJ TARJETA PAGO PAGOS EN CON DE DEL LA EL LOS LAS A Y TRANSACCION OPERACION CONTACTLESS RECIBO RECIBOS ADEUDO DOMICILIACION DOMICILIADO SEPA CARGO FECHA VISA MASTERCARD DEBITO CREDITO SL SA ES ESP SPAIN ESPANA NUM REF NO TRANSF TRANSFERENCIA INMEDIATA ONLINE WWW COM MOVIL APLICACION APP CAJERO OP'.split(' '));
const mkey=c=>{const w=deacc(String(c).toUpperCase()).replace(/APPLE PAY|GOOGLE PAY|SAMSUNG PAY/g,' ').replace(/[^A-Z ]/g,' ').split(/\s+/).filter(w=>w.length>1&&!STOP.has(w));return w.slice(0,2).join(' ')||deacc(String(c).toUpperCase()).replace(/[^A-Z0-9]/g,'').slice(0,18)||'X'};
const k1=k=>k.split(' ')[0];

let S=freshState();
function freshState(){return{v:1,demo:true,cats:defaultCats(),rules:{},budgets:{total:1650,byCat:{super:320,restaurantes:180,compras:150,ocio:90,transporte:140},warn:80,share:35,dev:20},planned:[],imports:[],ai:null,reminder:{enabled:true,days:10,lastUploadAt:null,doneAt:null},tx:[]}}
const catMap=()=>{const m={none:NONE};for(const c of S.cats)m[c.id]=c;return m};
let CM=catMap();
const cat=id=>CM[id]||NONE;
const expCats=()=>S.cats.filter(c=>c.kind==='gasto');
let VER=0;const bump=()=>{VER++;CM=catMap();memo={}};
let memo={};const memoize=(k,f)=>k in memo?memo[k]:(memo[k]=f());

/* ============ datos de ejemplo ============ */
function demoData(){
 let s=20261120;const rnd=()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const R=(a,b)=>r2(a+rnd()*(b-a)),pick=a=>a[Math.floor(rnd()*a.length)];
 const out=[];const add=(mk,d,c,a,ct)=>{const dd=Math.min(d,dim(mk));const date=mk+'-'+pad(dd);if(date>TODAY)return;out.push({id:uid(),d:date,c,a:r2(a),cat:ct,k:mkey(c),by:'demo',src:'demo'})};
 const start=addM(CUR,-11);
 for(let i=0;i<12;i++){const mk=addM(start,i);const mo=+mk.slice(5);const late=i>=9;
  add(mk,27,'TRANSFERENCIA NOMINA CONSULTORIA MEDITERRANIA SL',2040,'nomina');
  add(mk,1,'RECIBO ALQUILER VIVIENDA C/ UNIO',-680,'vivienda');
  add(mk,2,'TRASPASO A CUENTA AHORRO',-200,'traspasos');
  add(mk,8,'RECIBO ENDESA ENERGIA',-([12,1,2].includes(mo)?R(64,79):[7,8].includes(mo)?R(55,66):R(38,50)),'suministros');
  add(mk,12,'RECIBO DIGI SPAIN TELECOM',-25,'suministros');
  if(mo%2===0)add(mk,18,'RECIBO AIGUES DE TARRAGONA',-R(26,31),'suministros');
  add(mk,15,'NETFLIX.COM',-13.99,'suscripciones');
  add(mk,3,'SPOTIFY P1A2B3',i<9?-11.99:-12.99,'suscripciones');
  add(mk,20,'APPLE.COM/BILL ICLOUD',-2.99,'suscripciones');
  add(mk,5,'DIR SPORT TARRAGONA CUOTA',-42.9,'salud');
  if(i>=4)add(mk,9,'AMAZON PRIME ES',-4.99,'suscripciones');
  const nSup=5+Math.floor(rnd()*3);for(let j=0;j<nSup;j++)add(mk,1+Math.floor(rnd()*28),pick(['COMPRA TARJ MERCADONA TARRAGONA','COMPRA TARJ MERCADONA TARRAGONA','COMPRA TARJ LIDL REUS','COMPRA TARJ BONPREU TARRAGONA','COMPRA TARJ CARREFOUR EXPRESS']),-R(18,74),'super');
  const nRes=(late?7:4)+Math.floor(rnd()*3);for(let j=0;j<nRes;j++)add(mk,1+Math.floor(rnd()*28),pick(['GLOVO APP','BAR EL PUERTO TARRAGONA','RESTAURANT LA PLACA','STARBUCKS BARCELONA','JUST EAT ESPANA','CAFETERIA CENTRAL','100 MONTADITOS']),-(late?R(12,48):R(8,34)),'restaurantes');
  for(let j=0;j<2;j++)add(mk,6+j*12+Math.floor(rnd()*4),'COMPRA TARJ REPSOL ESTACION TARRAGONA',-R(44,61),'transporte');
  add(mk,10+Math.floor(rnd()*10),'RENFE VIAJEROS TARRAGONA BCN',-R(9,24),'transporte');
  const nCom=1+Math.floor(rnd()*3);for(let j=0;j<nCom;j++)add(mk,1+Math.floor(rnd()*28),pick(['AMAZON EU SARL','AMAZON EU SARL','ZARA TARRAGONA','DECATHLON REUS','PCCOMPONENTES']),-R(14,79),'compras');
  if(mo===11)add(mk,19,'AMAZON EU SARL BLACK FRIDAY',-129.9,'compras');
  if(rnd()>.35)add(mk,8+Math.floor(rnd()*18),pick(['CINESA PARC CENTRAL','TICKETMASTER ENTRADAS','STEAM GAMES','PADEL CLUB TARRAGONA']),-R(9,46),'ocio');
  if(rnd()>.5)add(mk,1+Math.floor(rnd()*28),'FARMACIA RAMBLA NOVA',-R(6,24),'salud');
  if(rnd()>.55)add(mk,1+Math.floor(rnd()*28),pick(['BIZUM DE LAURA M CENA','BIZUM DE JORDI P']),R(15,45),'otrosing');
  if(mo===1)add(mk,14,'MAPFRE SEGURO AUTOMOVIL ANUAL',-412.6,'seguros');
  if(mo===3)add(mk,10,'SEGURO HOGAR LINEA DIRECTA',-148.2,'seguros');
  if(mo===8){add(mk,2,'VUELING AIRLINES BCN-LIS',-214.4,'viajes');add(mk,4,'BOOKING.COM HOTEL LISBOA',-386,'viajes');add(mk,6,'RESTAURANT TASCA LISBOA',-58.4,'restaurantes')}
  if(mo===4)add(mk,17,'RYANAIR DAC',-96.3,'viajes');
  if(mo===12){add(mk,16,'EL CORTE INGLES REGALOS',-164.5,'compras');add(mk,22,'NOMINA PAGA EXTRA',1020,'nomina')}
  if(mo===9)add(mk,12,'CASA DEL LIBRO TARRAGONA',-38.9,'formacion');
 }
 return out.sort((a,b)=>a.d<b.d?1:-1);
}
function demoPlanned(){const n1=addM(CUR,1),n2=addM(CUR,2);return[
 {id:uid(),c:'Regalos de Navidad',a:-300,d:n1+'-15',rep:'once',cat:'compras',demo:true},
 {id:uid(),c:'Escapada de Reyes',a:-420,d:n2+'-04',rep:'once',cat:'viajes',demo:true}]}

/* ============ almacenamiento ============ */
const ST={mode:'memory',db:null,uidv:null,dirtyState:false,dirtyMonths:new Set(),timer:null,chains:{},busy:0,err:null,loaded:false,blocked:false,revs:{},base:{},hist:{},q:new Set(),pumping:false,pendingRender:false,warned:false};
function setSync(){const el=$('#sync');if(!el)return;const el2=$('#sync2');const t=!ST.loaded?'Cargando tus datos…':ST.blocked?'Sin conexión: cambios sin guardar':ST.busy?'Guardando…':ST.err?ST.err:ST.mode==='db'?'Guardado en tu cuenta':ST.mode==='local'?'Solo en este navegador':'Sin guardar (vista previa)';el.innerHTML=`<span class="dot ${ST.busy?'busy':ST.mode==='db'&&!ST.err&&!ST.blocked&&ST.loaded?'on':''}"></span><span>${esc(t)}</span>`;if(el2)el2.innerHTML=`<span class="dot ${ST.busy?'busy':ST.mode==='db'&&!ST.err&&!ST.blocked&&ST.loaded?'on':''}"></span><span>${esc(ST.busy?'Guardando…':!ST.loaded?'Cargando…':ST.blocked||ST.err?'Sin guardar':ST.mode==='db'?'Guardado':'Local')}</span>`}
function writeDoc(path,data,del){ST.busy++;setSync();const run=()=>del?ST.db.doc(path).delete():ST.db.doc(path).set(data);
 ST.chains[path]=(ST.chains[path]||Promise.resolve()).then(run).then(()=>{ST.err=null},e=>{ST.err=e&&e.code==='quota_exceeded'?'Espacio lleno':'Error al guardar';toast(e&&e.code==='quota_exceeded'?'No queda espacio para guardar más datos. Borra importaciones antiguas en Ajustes.':'No se pudieron guardar los cambios. Se reintentará con el próximo cambio.');if(path.includes('/tx-'))ST.dirtyMonths.add(path.split('/tx-')[1]);else ST.dirtyState=true}).finally(()=>{ST.busy--;setSync()});return ST.chains[path]}
function stateDoc(){const{tx,...rest}=S;return JSON.parse(JSON.stringify({...rest,appv:APPV,planned:S.planned.filter(p=>!p.demo||S.demo)}))}
function save(months){ST.dirtyState=true;(months||[]).forEach(m=>ST.dirtyMonths.add(m));clearTimeout(ST.timer);ST.timer=setTimeout(flush,600)}
const monthItems=m=>S.tx.filter(t=>t.src!=='demo'&&t.d.slice(0,7)===m).map(({id,d,c,a,cat,k,by,conf,src})=>({id,d,c,a,cat,k,by,conf,src}));
function flush(){ST.timer=null;if(!ST.loaded||ST.blocked){setSync();if(!ST.warned){ST.warned=true;toast(ST.blocked?'Los cambios no se están guardando porque tus datos no cargaron bien. Recarga la página.':'Tus datos aún están cargando; espera unos segundos y repite el cambio.')}return}
 if(ST.mode==='db'){if(ST.dirtyState)ST.q.add('state');for(const m of ST.dirtyMonths)ST.q.add('tx-'+m);ST.dirtyState=false;ST.dirtyMonths.clear();pump()}
 else if(ST.mode==='local'){try{localStorage.setItem('caudal-v1',JSON.stringify({...stateDoc(),tx:S.tx.filter(t=>t.src!=='demo')}))}catch(e){}ST.dirtyState=false;ST.dirtyMonths.clear()}
}
async function saveReminder(){const r=S.reminder;if(ST.mode!=='db')return;const data={enabled:!!r.enabled,days:+r.days||10,lastUploadAt:r.lastUploadAt||null,doneAt:r.doneAt||null,updatedAt:new Date().toISOString(),app:'caudal'};
 const ref=ST.db.doc('reminder/status');ST.chains.rem=(ST.chains.rem||Promise.resolve()).then(()=>ref.update(data).catch(e=>{if(e&&e.code==='invalid_argument')return ref.set(data);throw e})).catch(()=>{})}
function applyLoaded(st,txs){
 const base=freshState();S={...base,...st,budgets:{...base.budgets,...(st.budgets||{}),byCat:{...((st.budgets||{}).byCat||base.budgets.byCat)}},reminder:{...base.reminder,...(st.reminder||{})},cats:st.cats&&st.cats.length?st.cats:base.cats,tx:txs||[]};
 if(S.demo){S.tx=[...S.tx,...demoData()];if(!S.planned.some(p=>p.demo)&&!st._noDemoPlan)S.planned=[...S.planned,...demoPlanned()]}
 for(const[id,w]of Object.entries(S.catKw||{}))KW[id]=w;
 S.tx.sort((a,b)=>a.d<b.d?1:-1);bump()}
let SAMPLE=null;
const STANDALONE=!(window.claude&&window.claude.use);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const b64=b=>new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(String(fr.result).split(',')[1]);fr.onerror=rej;fr.readAsDataURL(b)});
function aiCfg(){try{return JSON.parse(localStorage.getItem('caudal-ai')||'null')}catch(e){return null}}
function makeGemini(cfg){
 const call=async(input,opts,json)=>{opts=opts||{};const msgs=typeof input==='string'?[{role:'user',content:input}]:input;
  const contents=msgs.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
  if(opts.images){const last=contents[contents.length-1];for(const b of [].concat(opts.images))last.parts.push({inline_data:{mime_type:b.type||'image/jpeg',data:await b64(b)}})}
  let gc=json?{responseMimeType:'application/json'}:null;const mk=()=>JSON.stringify(gc?{contents,generationConfig:gc}:{contents});
  let model=(opts.modelTier==='quick'?cfg.fast:cfg.model)||cfg.model||'gemini-flash-latest';
  for(let i=0;i<4;i++){let r;
   try{r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent?key='+encodeURIComponent(cfg.key),{method:'POST',headers:{'Content-Type':'application/json'},body:mk(),signal:opts.signal})}
   catch(e){throw{code:'gemini_error',message:'No se pudo conectar con Gemini. Revisa tu conexión a internet.'}}
   const j=await r.json().catch(()=>({}));const msg=(j.error&&j.error.message)||('HTTP '+r.status);
   if(r.status===429||r.status===503){if(i<3){if(IMP&&IMP.prog){IMP.prog=IMP.prog.replace(/ · esperando.*$/,'')+' · esperando al límite gratuito…';renderImport()}await sleep(20000*(i+1));continue}throw{code:'rate_limited',message:msg}}
   if(r.status===404&&model!==cfg.model&&cfg.model){model=cfg.model;continue}
   if(r.status===400&&gc&&/mime|generation|config|json/i.test(msg)&&i<3){gc=null;continue}
   if(!r.ok){const badKey=(r.status===400&&/api key|api_key/i.test(msg))||r.status===401||r.status===403;throw{code:badKey?'bad_key':'gemini_error',message:badKey?'La clave de Gemini no es válida o no tiene acceso ('+msg+'). Revísala en Ajustes.':'Gemini respondió con un error ('+r.status+'): '+msg}}
   const text=((((j.candidates||[])[0]||{}).content||{}).parts||[]).map(p=>p.text||'').join('');
   if(!text)throw{code:'gemini_error',message:'Gemini no devolvió texto'+((j.promptFeedback&&j.promptFeedback.blockReason)?' (bloqueado: '+j.promptFeedback.blockReason+')':(((j.candidates||[])[0]||{}).finishReason?' (motivo: '+j.candidates[0].finishReason+')':''))+'.'};
   if(opts.onText)opts.onText({text,delta:text});return text}};
 const f=async(input,opts)=>({text:await call(input,opts,false),truncated:false});
 f.json=async(input,opts)=>{const t=await call(input,opts,true);try{return JSON.parse(t)}catch(e){const m=t.match(/[\[{][\s\S]*[\]}]/);if(m){try{return JSON.parse(m[0])}catch(e2){}}throw{code:'invalid_json',text:t}}};
 f.limits=async()=>({maxPromptBytes:900000,images:{maxCount:6,maxInputBytes:2e7,mediaTypes:['image/jpeg','image/png','image/webp']}});
 f.gemini=true;return f}
function useGemini(){const c=aiCfg();SAMPLE=c&&c.key?makeGemini(c):null;AIDENIED=false}
function downloadFile(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
function restoreFrom(text){const o=JSON.parse(text);if(!o||!Array.isArray(o.cats))throw 0;const old=new Set(S.tx.map(t=>t.d.slice(0,7)));const{tx,...rest}=o;applyLoaded({...strip(rest),demo:false},tx||[]);S.demo=false;S.tx=S.tx.filter(t=>t.src!=='demo');bump();save([...old,...S.tx.map(t=>t.d.slice(0,7))]);saveReminder()}

const WID=uid();const APPV=4;
const sj=o=>o===undefined?undefined:JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((a,x)=>(a[x]=v[x],a),{}):v);
function hist(id,c){const h=ST.hist[id]||(ST.hist[id]=[]);if(!h.includes(c)){h.push(c);if(h.length>12)h.shift()}}
let verWarned=false;function checkVer(x){if(x&&x.appv>APPV&&!verWarned){verWarned=true;toast('Hay una versión nueva de Caudal. Recarga la página para usarla.',{label:'Recargar',fn:()=>location.reload()},false)}}
const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));const strip=o=>{if(!o)return o;const{rev,wid,appv,...r}=o;return r};
function localDoc(id){return id==='state'?stateDoc():{items:monthItems(id.slice(3))}}
function mergeById(b,l,r){b=b||[];l=l||[];r=r||[];const B=new Map(b.map(x=>[x.id,sj(x)])),Lm=new Map(l.map(x=>[x.id,x])),Rm=new Map(r.map(x=>[x.id,x]));const out=[];
 for(const id of new Set([...Lm.keys(),...Rm.keys(),...B.keys()])){const bj=B.get(id),lx=Lm.get(id),rx=Rm.get(id);const lj=lx&&sj(lx),rj=rx&&sj(rx);const v=lj===bj?rx:rj===bj?lx:(lx||rx);if(v)out.push(v)}return out}
function mergeMap(b,l,r){b=b||{};l=l||{};r=r||{};const out={};for(const k of new Set([...Object.keys(l),...Object.keys(r),...Object.keys(b)])){const bj=sj(b[k]),lj=sj(l[k]),rj=sj(r[k]);const v=lj===bj?r[k]:rj===bj?l[k]:(l[k]!==undefined?l[k]:r[k]);if(v!==undefined)out[k]=v}return out}
function mergeState(b,l,r){const out={};for(const k of new Set([...Object.keys(l),...Object.keys(r),...Object.keys(b)])){if(k==='rev'||k==='wid'||k==='appv')continue;const bj=sj(b[k]),lj=sj(l[k]),rj=sj(r[k]);
  if(lj===bj){if(r[k]!==undefined)out[k]=r[k];continue}if(rj===bj||rj===lj){if(l[k]!==undefined)out[k]=l[k];continue}
  if(['cats','planned','imports'].includes(k))out[k]=mergeById(b[k],l[k],r[k]);
  else if(['rules','catKw','reminder'].includes(k))out[k]=mergeMap(b[k],l[k],r[k]);
  else if(k==='budgets')out[k]={...mergeMap(b[k],l[k],r[k]),byCat:mergeMap((b[k]||{}).byCat,(l[k]||{}).byCat,(r[k]||{}).byCat)};
  else out[k]=l[k]}return out}
function applyDoc(id,data){if(id==='state'){const keep=UI.month;applyLoaded(data,S.tx.filter(t=>t.src!=='demo'));UI.month=keep}
 else{const m=id.slice(3);S.tx=S.tx.filter(t=>t.src==='demo'||t.d.slice(0,7)!==m).concat(clone(data.items||[]));S.tx.sort((a,b)=>a.d<b.d?1:-1);bump()}}
const isTyping=()=>{const a=document.activeElement;return!!a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=='checkbox'};
function softRender(){if(isTyping())ST.pendingRender=true;else render()}
function rememberDocs(docs){for(const d of docs){if(!d.exists)continue;const x=d.data();ST.revs[d.id]=x.rev||0;ST.base[d.id]=strip(clone(x));hist(d.id,sj(ST.base[d.id]));if(d.id==='state')checkVer(x)}}
async function syncDoc(id){const ref=ST.db.doc('data/users/'+ST.uidv+'/'+id);let local=localDoc(id);const g=await ref.get();const remote=g.exists?g.data():null;const rrev=(remote&&remote.rev)||0;let merged=false;
 if(id==='state')checkVer(remote);const rs=remote?sj(strip(remote)):null;const known=ST.hist[id]||[];
 if(remote&&(rrev>(ST.revs[id]||0)||(rs!==sj(ST.base[id])&&!known.includes(rs)))){const base=ST.base[id]||{};local=id==='state'?mergeState(base,local,strip(remote)):{items:mergeById(base.items,local.items,remote.items)};merged=true}
 const rev=Math.max(ST.revs[id]||0,rrev)+1;
 if(id!=='state'&&!local.items.length){if(remote)await ref.delete();ST.revs[id]=rev;delete ST.base[id]}
 else{const doc={...local,rev,wid:WID};await ref.set(doc);ST.revs[id]=rev;ST.base[id]=strip(clone(doc));hist(id,sj(ST.base[id]))}
 if(merged)applyDoc(id,local);return merged}
async function pump(){if(ST.pumping)return;ST.pumping=true;ST.busy++;setSync();let re=false;
 try{while(ST.q.size){const id=ST.q.values().next().value;ST.q.delete(id);
   try{if(await syncDoc(id))re=true;ST.err=null}
   catch(e){ST.err=e&&e.code==='quota_exceeded'?'Espacio lleno':'Error al guardar';if(id==='state')ST.dirtyState=true;else ST.dirtyMonths.add(id.slice(3));toast(e&&e.code==='quota_exceeded'?'No queda espacio para guardar más datos. Borra importaciones antiguas en Ajustes.':'No se pudieron guardar los cambios ('+((e&&(e.code||e.message))||'error')+'). Se reintentará con el próximo cambio.');ST.q.clear();break}}}
 finally{ST.pumping=false;ST.busy--;setSync();if(re)softRender()}}
function onRemote(snap){if(!ST.loaded||ST.blocked||ST.busy||ST.timer||ST.pumping||!snap||(snap.metadata&&snap.metadata.hasPendingWrites))return;let ch=false;
 for(const d of snap.docs){if(!d.exists)continue;const id=d.id;if(id!=='state'&&!id.startsWith('tx-'))continue;const x=d.data();if(id==='state')checkVer(x);const rv=x.rev||0;const cs=sj(strip(x));if(cs===sj(ST.base[id]))continue;
  if(!(rv>(ST.revs[id]||0))&&(ST.hist[id]||[]).includes(cs))continue;ST.revs[id]=Math.max(rv,ST.revs[id]||0);ST.base[id]=strip(clone(x));hist(id,cs);applyDoc(id,strip(x));ch=true}
 if(ch)softRender()}
async function initStore(){
 const C=window.claude;let db=null,user=null,smp=null;
 if(C&&C.use){try{[db,user,smp]=await Promise.all([C.use('db').catch(()=>null),C.use('user').catch(()=>null),C.use('sample').catch(()=>null)])}catch(e){}}
 SAMPLE=smp||null;if(STANDALONE){useGemini();try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}}
 let id=null;if(db&&user){try{id=await user.id()}catch(e){}}
 if(db&&id){ST.mode='db';ST.db=db;ST.uidv=id;
  try{const snap=await Promise.race([db.collection('data/users/'+id).limit(1000).get(),new Promise((_,rej)=>setTimeout(()=>rej({code:'timeout'}),10000))]);
   let st=null;const txs=[];for(const d of snap.docs){if(!d.exists)continue;if(d.id==='state')st=strip(d.data());else if(d.id.startsWith('tx-'))txs.push(...clone((d.data().items)||[]))}
   if(st)applyLoaded(st,txs);else if(txs.length)applyLoaded({demo:false},txs);else applyLoaded({},[]);
   rememberDocs(snap.docs);ST.loaded=true;
   try{db.collection('data/users/'+id).limit(1000).onSnapshot(onRemote,()=>{})}catch(e){}
  }catch(e){ST.blocked=true;ST.loaded=true;applyLoaded({},[]);toast('No se han podido cargar tus datos guardados. Recarga la página; hasta entonces los cambios no se guardarán.')}
 }else{let st=null;try{const raw=localStorage.getItem('caudal-v1');if(raw){st=JSON.parse(raw);ST.mode='local'}else{localStorage.setItem('caudal-t','1');localStorage.removeItem('caudal-t');ST.mode='local'}}catch(e){ST.mode='memory'}
  if(st){const{tx,...rest}=st;applyLoaded(rest,tx||[])}else applyLoaded({},[]);ST.loaded=true}
 setSync();
}
