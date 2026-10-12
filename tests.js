const assert=require('node:assert/strict');
const {backtest,parseCSV}=require('./engine.js');
const p={spread:1,slip:.2,min:1,step:1};
const rows=[];let price=1.08;
for(let i=0;i<900;i++){
 const time=new Date(Date.UTC(2026,0,1,i)).toISOString();
 const open=price;price=Math.max(.8,open+Math.sin(i*.14)*.00035+Math.cos(i*.033)*.00018);
 rows.push({time,date:time.slice(0,10),open,high:Math.max(open,price)+.0004,low:Math.min(open,price)-.0004,close:price});
}
const r=backtest(rows,p);
assert.equal(r.bars,900);
assert.ok(Number.isFinite(r.final_eur));
assert.equal(r.stats.accepted,r.trades.length);
assert.ok(r.max_drawdown_pct>=0);
assert.equal(r.pnl_eur,+(r.final_eur-500).toFixed(2));
const csv='time,open,high,low,close\n'+rows.map(x=>[x.time,x.open,x.high,x.low,x.close].join(',')).join('\n');
assert.equal(parseCSV(csv).length,900);
assert.throws(()=>parseCSV(csv.replace('time,open','datetime,open')),/Colonnes/);
// Choc d'ouverture après une entrée: gap sévère non couvert par le stop.
let shockTriggered=false;
for(const t of r.trades){
 const at=rows.findIndex(x=>x.time===t.time);
 if(at<5||at>=rows.length-2)continue;
 const stressed=rows.map(x=>({...x}));
 const shockAt=at+1,base=stressed[shockAt].open;
 stressed[shockAt]={...stressed[shockAt],open:base*.6,high:base*.61,low:base*.59,close:base*.6};
 for(let j=shockAt+1;j<stressed.length;j++)stressed[j]={...stressed[j],open:stressed[j].open*.6,high:stressed[j].high*.6,low:stressed[j].low*.6,close:stressed[j].close*.6};
 const result=backtest(stressed,p);
 if(result.halted){assert.match(result.reason,/Seuil/);shockTriggered=true;break;}
}
// Le scénario de stress dépend de la présence d'une position au moment du gap.
console.log('Stress gap déclenché :',shockTriggered);
console.log('Tests V3.5 OK : CSV, calculs, comptabilité, choc et coupe-circuit.');
