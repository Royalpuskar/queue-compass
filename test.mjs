import test from 'node:test';
import assert from 'node:assert/strict';
import {run} from './engine.mjs';
import {sample} from './sample.mjs';
test('domain behavior and boundary cases',()=>{assert.deepEqual(run(sample).rows.map(r=>r.id),['A','C','B']);assert.deepEqual(run({...sample,policy:'fcfs'}).rows.map(r=>r.id),['A','B','C']);assert.equal(run({policy:'fcfs',jobs:[]}).metrics.finish,0);});
test('deterministic result and input preservation',()=>{const copy=JSON.stringify(sample);assert.deepEqual(run(sample),run(sample));assert.equal(JSON.stringify(sample),copy);});
test('reject malformed root and oversized input',()=>{assert.throws(()=>run(null));assert.throws(()=>run([]));assert.throws(()=>run({...sample,oversized:'x'.repeat(200001)}));});

test('earliest-deadline orders only ready jobs and treats absent deadlines last',()=>{
 const jobs=[{id:'a',arrival:0,duration:2},{id:'b',arrival:0,duration:1,deadline:3},{id:'c',arrival:0,duration:1,deadline:2}];
 assert.deepEqual(run({policy:'earliest-deadline',jobs}).rows.map(r=>r.id),['c','b','a']);
});
test('deadline boundary is inclusive and missing evidence remains null',()=>{
 const r=run({policy:'fcfs',jobs:[{id:'a',arrival:0,duration:2,deadline:2},{id:'b',arrival:0,duration:1,deadline:2},{id:'c',arrival:3,duration:0}]});
 assert.deepEqual(r.rows.map(x=>x.missedDeadline),[false,true,null]);
 assert.equal(r.metrics.deadlines,2);assert.equal(r.metrics.maxTardiness,1);
});
test('running jobs are not preempted by urgent arrivals',()=>{
 const r=run({policy:'earliest-deadline',jobs:[{id:'a',arrival:0,duration:5,deadline:10},{id:'b',arrival:1,duration:1,deadline:2}]});
 assert.equal(r.rows[1].start,5);assert.equal(r.rows[1].lateness,4);
});
test('idle gaps, zero-duration jobs and stable ties are accounted for',()=>{
 const r=run({policy:'earliest-deadline',jobs:[{id:'a',arrival:3,duration:0},{id:'b',arrival:3,duration:2},{id:'c',arrival:10,duration:1}]});
 assert.deepEqual(r.rows.map(x=>x.id),['a','b','c']);assert.equal(r.metrics.idleTime,8);assert.equal(r.metrics.finish,11);
});
test('deadlines before arrival are reported rather than hidden',()=>{
 const r=run({policy:'fcfs',jobs:[{id:'a',arrival:5,duration:0,deadline:2}]});
 assert.equal(r.rows[0].lateness,3);assert.equal(r.metrics.missedDeadlines,1);
});
test('reject duplicate IDs and invalid optional deadlines',()=>{
 const job={id:'a',arrival:0,duration:1};
 assert.throws(()=>run({policy:'fcfs',jobs:[job,job]}));
 for(const deadline of [null,-1,Infinity,'2'])assert.throws(()=>run({policy:'fcfs',jobs:[{...job,deadline}]}));
 assert.throws(()=>run({policy:'fcfs',jobs:new Array(1)}));
});
test('all policies conserve service plus idle time across 81 two-job fixtures',()=>{
 for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++)for(let d=0;d<3;d++){
  const jobs=[{id:'a',arrival:a,duration:b,deadline:2},{id:'b',arrival:c,duration:d,deadline:3}];
  for(const policy of ['fcfs','shortest','earliest-deadline']){
   const r=run({policy,jobs});assert.equal(r.metrics.finish,r.metrics.idleTime+b+d);
   assert.ok(r.rows.every(row=>row.wait>=0));assert.ok(r.rows[1].start>=r.rows[0].finish);
   assert.equal(new Set(r.rows.map(row=>row.id)).size,2);
  }
 }
});
