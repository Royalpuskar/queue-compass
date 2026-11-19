
function obj(v){if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Expected an object');return v;}
function arr(v,label='array'){if(!Array.isArray(v)||v.length>500)throw Error(label+' must be an array with at most 500 items');return v;}
function str(v){if(typeof v!=='string'||!v.trim()||v.length>100000)throw Error('Expected nonempty text (max 100000 characters)');return v;}
function num(v,label='number',min=-1e12){if(typeof v!=='number'||!Number.isFinite(v)||v<min||Math.abs(v)>1e12)throw Error(label+' must be a finite number in range');return v;}
function bool(v){if(typeof v!=='boolean')throw Error('Expected a boolean');return v;}
function date(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))throw Error('Expected YYYY-MM-DD');const t=Date.parse(v+'T00:00:00Z');if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,10)!==v)throw Error('Invalid calendar date');return t;}
export function run(x){obj(x);if(JSON.stringify(x).length>200000)throw Error('Input exceeds 200 KB limit');

if(!['fcfs','shortest'].includes(x.policy))throw Error('Policy must be fcfs or shortest');const pending=arr(x.jobs,'jobs').map((j,i)=>{str(j.id);num(j.arrival,'arrival',0);num(j.duration,'duration',0);return {...j,i};});let time=0;const rows=[];while(pending.length){const ready=pending.filter(j=>j.arrival<=time);if(!ready.length){time=Math.min(...pending.map(j=>j.arrival));continue;}ready.sort((a,b)=>(x.policy==='shortest'?a.duration-b.duration:0)||a.arrival-b.arrival||a.i-b.i);const j=ready[0];pending.splice(pending.indexOf(j),1);rows.push({id:j.id,start:time,finish:time+j.duration,wait:time-j.arrival});time+=j.duration;}return {metrics:{jobs:rows.length,meanWait:rows.length?+(rows.reduce((a,r)=>a+r.wait,0)/rows.length).toFixed(3):0,finish:time},rows};

}
