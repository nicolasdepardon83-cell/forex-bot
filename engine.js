"use strict";
const $=id=>document.getElementById(id);let last=null,synthetic=false;
const initial=500,pip=0.0001;
function parseCSV(text){
 const lines=text.replace(/^\uFEFF/,"").trim().split(/\r?\n/);if(lines.length<101)throw Error("Au moins 100 bougies H1 sont requises.");
 const sep=lines[0].includes(';')?';':',';const head=lines.shift().split(sep).map(s=>s.trim().toLowerCase());const ids=['time','open','high','low','close'].map(x=>head.indexOf(x));if(ids.some(x=>x<0))throw Error('Colonnes : time,open,high,low,close');
 let prev=-Infinity;const rows=lines.filter(x=>x.trim()).map((line,i)=>{const c=line.split(sep),raw=c[ids[0]].trim();if(!/(Z|[+-]\d\d:?\d\d)$/.test(raw))throw Error('Dates avec fuseau UTC requis, ligne '+(i+2));const t=Date.parse(raw),a=ids.slice(1).map(j=>Number(c[j]));if(!Number.isFinite(t)||t<=prev||a.some(x=>!Number.isFinite(x)||x<=0)||a[1]<Math.max(a[0],a[3])||a[2]>Math.min(a[0],a[3])||a[2]>a[1])throw Error('OHLC/date invalide ligne '+(i+2));if(prev!==-Infinity&&(t-prev)%3600000!==0)throw Error('Horodatage non H1 ligne '+(i+2));prev=t;return {time:new Date(t).toISOString(),date:new Date(t).toISOString().slice(0,10),open:a[0],high:a[1],low:a[2],close:a[3]};});return rows;
}
function backtest(rows,p){
 if(!rows||rows.length<100)throw Error('Historique insuffisant');
 if([p.spread,p.slip].some(v=>!Number.isFinite(v)||v<0||v>20)||![p.min,p.step].every(v=>Number.isSafeInteger(v)&&v>=1))throw Error('Paramètres invalides');
 const cost=(p.spread/2+p.slip)*pip;
 let cash=initial,pos=null,ema20=null,ema50=null,atr=null,prevClose=null,pending=false,halted=false,day='',dayBase=initial,peak=initial,maxdd=0,reason='',trades=[],equity=[];
 const stats={signals:0,accepted:0,rejectedVolume:0,rejectedRisk:0,rejectedHalt:0,rejectedBusy:0,stops:0,targets:0,gaps:0,breakerExits:0};
 const mark=price=>cash+(pos?pos.units*(price-pos.entry)/price:0);
 function close(price,time,why){const pnl=pos.units*(price-pos.entry)/price;cash+=pnl;trades.push({time,reason:why,units:pos.units,pnl_eur:+pnl.toFixed(5),balance_eur:+cash.toFixed(5)});if(why==='stop'||why==='gap_stop')stats.stops++;if(why==='target')stats.targets++;if(why==='gap_stop')stats.gaps++;if(why==='circuit_breaker')stats.breakerExits++;pos=null;}
 function observe(value,why){
  if(!Number.isFinite(value))throw Error('Valeur de portefeuille invalide');
  peak=Math.max(peak,value);
  maxdd=Math.max(maxdd,(peak-value)/peak);
  if(!halted&&(value<=dayBase*.99+1e-9||value<=peak*.97+1e-9)){
   halted=true;reason=why+(value<=peak*.97+1e-9?' (drawdown 3 %)':' (perte journalière 1 %)');
  }
 }
 for(let i=0;i<rows.length;i++){
  const r=rows[i];
  if(r.date!==day){day=r.date;dayBase=mark(r.open);}
  // Le signal de la bougie précédente ne peut entrer qu'à l'ouverture suivante.
  // On vérifie d'abord le risque sur l'ouverture, avant toute nouvelle entrée.
  observe(mark(r.open),'Seuil à ouverture');
  if(halted&&pos)close(r.open-cost,r.time,'circuit_breaker');
  if(pending){stats.signals++;if(halted)stats.rejectedHalt++;else if(pos)stats.rejectedBusy++;else if(atr===null||atr<=0)stats.rejectedRisk++;else{
   const entry=r.open+cost,stop=entry-2*atr,target=entry+3*atr,exitWorst=stop-cost;
   const lossPerUnit=exitWorst>0?(entry-exitWorst)/exitWorst:Infinity;
   const exposureMax=Math.floor(cash/p.step)*p.step;
   const riskMax=Math.floor((initial*.0025/lossPerUnit)/p.step)*p.step;
   const units=Math.min(exposureMax,riskMax);
   if(!Number.isFinite(units)||lossPerUnit<=0||stop<=cost)stats.rejectedRisk++;
   else if(units<p.min||units<=0)stats.rejectedVolume++;
   else {pos={entry,stop,target,units};stats.accepted++;}
  }}pending=false;
  // Convention OHLC conservatrice : stop prioritaire si stop et cible touchés.
  // Les gaps à l'ouverture s'appliquent seulement aux positions déjà ouvertes.
  if(pos){
   let exitPrice=null,why='';
   if(r.open<=pos.stop){exitPrice=r.open-cost;why='gap_stop';}
   else if(r.open>=pos.target){exitPrice=pos.target-cost;why='target';}
   else if(r.low<=pos.stop){exitPrice=pos.stop-cost;why='stop';}
   else if(r.high>=pos.target){exitPrice=pos.target-cost;why='target';}
   if(exitPrice!==null)close(exitPrice,r.time,why);
  }
  // Contrôle sur pertes réalisées et, pour une position survivante, pire extrême OHLC.
  observe(cash,'Seuil après clôture de transaction');
  if(pos){observe(mark(r.low),'Seuil latent intrabougie');if(halted)close(r.low-cost,r.time,'circuit_breaker');}
  observe(mark(r.close),'Seuil à clôture');
  if(halted&&pos)close(r.close-cost,r.time,'circuit_breaker');
  const marked=mark(r.close);observe(marked,'Seuil après liquidation');
  equity.push({time:r.time,equity_eur:+marked.toFixed(5)});
  const tr=Math.max(r.high-r.low,Math.abs(r.high-(prevClose??r.close)),Math.abs(r.low-(prevClose??r.close)));
  const old20=ema20,old50=ema50;
  ema20=ema20===null?r.close:ema20+(2/21)*(r.close-ema20);
  ema50=ema50===null?r.close:ema50+(2/51)*(r.close-ema50);
  atr=atr===null?tr:(atr*13+tr)/14;prevClose=r.close;
  if(i>=51&&old20!==null&&old50!==null&&old20<=old50&&ema20>ema50)pending=true;
 }
 if(pos){const r=rows[rows.length-1];close(r.close-cost,r.time,'end_of_data');equity[equity.length-1].equity_eur=+cash.toFixed(5);observe(cash,'Seuil à fin de données');}
 const wins=trades.filter(t=>t.pnl_eur>0),losses=trades.filter(t=>t.pnl_eur<0),gain=wins.reduce((a,t)=>a+t.pnl_eur,0),loss=-losses.reduce((a,t)=>a+t.pnl_eur,0);
 return {initial_eur:initial,final_eur:+cash.toFixed(2),pnl_eur:+(cash-initial).toFixed(2),max_drawdown_pct:+(maxdd*100).toFixed(2),trades,equity,stats,bars:rows.length,halted,reason,win_pct:trades.length?100*wins.length/trades.length:null,profit_factor:loss>0?gain/loss:null,avg_win:wins.length?gain/wins.length:null,avg_loss:losses.length?-loss/losses.length:null};
}
function chart(vals){const c=$('chart'),ctx=c.getContext('2d'),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);if(!vals.length)return;const lo=Math.min(...vals),hi=Math.max(...vals);ctx.strokeStyle='#4fa3ff';ctx.lineWidth=2;ctx.beginPath();vals.forEach((v,i)=>{const x=12+i*(w-24)/Math.max(1,vals.length-1),y=h-12-(v-lo)/Math.max(.00001,hi-lo)*(h-24);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
function show(r){last=r;$('results').hidden=false;$('label').textContent=synthetic?'DONNÉES FICTIVES : aucun résultat financier exploitable.':'Données importées : résultats de recherche, non validés pour trading réel.';for(const [id,val] of [['final',r.final_eur.toFixed(2)+' €'],['pnl',r.pnl_eur.toFixed(2)+' €'],['dd',r.max_drawdown_pct.toFixed(2)+' %'],['count',String(r.trades.length)],['win',r.win_pct===null?'—':r.win_pct.toFixed(1)+' %'],['pf',r.profit_factor===null?'n.d.':r.profit_factor.toFixed(2)],['avgwin',r.avg_win===null?'—':r.avg_win.toFixed(2)+' €'],['avgloss',r.avg_loss===null?'—':r.avg_loss.toFixed(2)+' €']])$(id).textContent=val;
 $('halt').textContent=r.halted?'COUPE-CIRCUIT ACTIVÉ : '+r.reason:'Coupe-circuit non activé';const s=r.stats;$('diagnostics').textContent=`${r.bars} bougies · ${s.signals} signaux · ${s.accepted} acceptés · ${s.rejectedVolume} refus volume/exposition · ${s.rejectedRisk} refus risque · ${s.rejectedBusy} déjà en position · ${s.rejectedHalt} après arrêt · ${s.stops} stops (${s.gaps} gaps) · ${s.targets} objectifs · ${s.breakerExits} sorties coupe-circuit.`;
 $('trades').replaceChildren();for(const t of r.trades){const tr=document.createElement('tr');for(const v of [t.time.slice(0,16),t.reason,t.units,t.pnl_eur.toFixed(4),t.balance_eur.toFixed(2)]){const td=document.createElement('td');td.textContent=v;tr.append(td)}$('trades').append(tr);}chart(r.equity.map(x=>x.equity_eur));}
function settings(){return {spread:Number($('spread').value),slip:Number($('slip').value),min:Number($('min').value),step:Number($('step').value)};}
function qualityCheck(rows){
 let gaps=0,weekend=0,maxGap=0,missing=0;
 for(let i=1;i<rows.length;i++){
  const dt=(Date.parse(rows[i].time)-Date.parse(rows[i-1].time))/3600000;
  if(dt>1){gaps++;maxGap=Math.max(maxGap,dt);const day=new Date(rows[i-1].time).getUTCDay();if(day===5||day===6||day===0)weekend++;else missing+=dt-1;}
 }
 return {gaps,weekend,maxGap,missing};
}
function compare(rows,p){
 const cut=Math.floor(rows.length*Number($('split').value));
 if(cut<100||rows.length-cut<100)throw Error('Historique insuffisant pour séparer apprentissage et validation (100 bougies minimum par période).');
 const sections=[['Apprentissage',rows.slice(0,cut)],['Validation hors échantillon',rows.slice(cut)]];
 $('splits').replaceChildren();
 for(const [label,data] of sections){const r=backtest(data,p),tr=document.createElement('tr');
 for(const v of [label,String(data.length),String(r.trades.length),r.pnl_eur.toFixed(2)+' €',r.max_drawdown_pct.toFixed(2)+' %',r.win_pct===null?'—':r.win_pct.toFixed(1)+' %',r.profit_factor===null?'n.d.':r.profit_factor.toFixed(2)]){const td=document.createElement('td');td.textContent=v;tr.append(td)}$('splits').append(tr);}
}
function execute(text){const rows=parseCSV(text),q=qualityCheck(rows),limit=Number($('gap').value);if(!Number.isInteger(limit)||limit<1||limit>24)throw Error('Limite des écarts invalide');if(!synthetic&&q.missing>limit)throw Error('Historique incomplet : écart de '+q.maxGap+' heures. Vérifier les trous de cotation avant simulation.');
 show(backtest(rows,settings()));
 $('quality').textContent=(synthetic?'Données artificielles — aucun usage financier. ':'Contrôle qualité : ')+`${q.gaps} écarts horaires dont ${q.weekend} liés à une fin de semaine probable ; ${q.missing} heures manquantes estimées hors week-end ; écart maximum ${q.maxGap} h. Les fuseaux et changements d’heure doivent être vérifiés auprès de la source.`;
 compare(rows,settings());try{localStorage.setItem('forex-v35-settings',JSON.stringify(settings()));}catch(e){}}
if(typeof document!=='undefined'){
for(const id of ['spread','slip','min','step'])$(id).addEventListener('change',()=>{try{localStorage.setItem('forex-v35-settings',JSON.stringify(settings()));}catch(e){}});
try{const p=JSON.parse(localStorage.getItem('forex-v35-settings')||'null');if(p)for(const [id,key] of [['spread','spread'],['slip','slip'],['min','min'],['step','step']])if(Number.isFinite(p[key]))$(id).value=p[key];}catch(e){}
$('run').onclick=async()=>{const f=$('file').files[0];$('error').textContent='';if(!f){$('error').textContent='Choisir un CSV.';return;}try{synthetic=false;execute(await f.text());$('source').textContent=f.name+' — fichier local, non transmis';}catch(e){$('results').hidden=true;$('error').textContent=e.message;}};
$('demo').onclick=()=>{try{synthetic=true;let lines=['time,open,high,low,close'],v=1.085;for(let i=0;i<750;i++){const o=v;v=Math.max(.8,o+Math.sin(i*.14)*.00035+Math.cos(i*.033)*.00018);const h=Math.max(o,v)+.0004,l=Math.min(o,v)-.0004;lines.push(new Date(Date.UTC(2024,0,1,i)).toISOString()+','+[o,h,l,v].map(x=>x.toFixed(6)).join(','));}execute(lines.join('\n'));$('source').textContent='Jeu fictif intégré — 750 bougies';$('error').textContent='';}catch(e){$('error').textContent=e.message;}};
$('export').onclick=()=>{if(!last)return;const lines=['time,reason,units,pnl_eur,balance_eur',...last.trades.map(t=>[t.time,t.reason,t.units,t.pnl_eur,t.balance_eur].join(','))];const blob=new Blob([lines.join('\n')],{type:'text/csv'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=synthetic?'demo_fictive_v35.csv':'backtest_v35.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
if(typeof module!=='undefined')module.exports={parseCSV,backtest};
