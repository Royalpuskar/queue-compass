import test from 'node:test';
import assert from 'node:assert/strict';
import {run} from './engine.mjs';
import {sample} from './sample.mjs';
test('domain behavior and boundary cases',()=>{assert.deepEqual(run(sample).rows.map(r=>r.id),['A','C','B']);assert.deepEqual(run({...sample,policy:'fcfs'}).rows.map(r=>r.id),['A','B','C']);assert.equal(run({policy:'fcfs',jobs:[]}).metrics.finish,0);});
test('deterministic result and input preservation',()=>{const copy=JSON.stringify(sample);assert.deepEqual(run(sample),run(sample));assert.equal(JSON.stringify(sample),copy);});
test('reject malformed root and oversized input',()=>{assert.throws(()=>run(null));assert.throws(()=>run([]));assert.throws(()=>run({...sample,oversized:'x'.repeat(200001)}));});
