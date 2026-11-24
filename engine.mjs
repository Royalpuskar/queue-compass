function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Expected an object');
}
function time(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1e12) throw Error('Times must be finite numbers from 0 to 1e12');
  return value;
}
export function run(input) {
  object(input);
  if (JSON.stringify(input).length > 200000) throw Error('Input exceeds 200000 serialized characters');
  if (!['fcfs','shortest','earliest-deadline'].includes(input.policy)) throw Error('Unknown scheduling policy');
  if (!Array.isArray(input.jobs) || input.jobs.length > 500) throw Error('jobs must be an array of at most 500 items');
  const ids = new Set();
  const pending = Array.from(input.jobs, (job,index) => {
    object(job);
    if (typeof job.id !== 'string' || !job.id.trim() || job.id.length > 100000) throw Error('Expected nonempty job ID');
    if (ids.has(job.id)) throw Error('Duplicate job IDs are unsupported');
    ids.add(job.id);
    return {id:job.id,index,arrival:time(job.arrival),duration:time(job.duration),
      deadline:Object.hasOwn(job,'deadline') ? time(job.deadline) : null};
  });
  let now = 0, idleTime = 0; const rows = [];
  const deadlineRank = job => job.deadline === null ? Infinity : job.deadline;
  while (pending.length) {
    const ready = pending.filter(job=>job.arrival<=now);
    if (!ready.length) {
      const next=Math.min(...pending.map(job=>job.arrival));idleTime+=next-now;now=next;continue;
    }
    ready.sort((a,b)=>
      (input.policy==='shortest' ? a.duration-b.duration :
       input.policy==='earliest-deadline' ? (deadlineRank(a)<deadlineRank(b)?-1:deadlineRank(a)>deadlineRank(b)?1:0) : 0)
      || a.arrival-b.arrival || a.index-b.index);
    const job=ready[0]; pending.splice(pending.indexOf(job),1);
    const finish=now+job.duration;
    rows.push({id:job.id,start:now,finish,wait:now-job.arrival,turnaround:finish-job.arrival,
      deadline:job.deadline,lateness:job.deadline===null?null:finish-job.deadline,
      missedDeadline:job.deadline===null?null:finish>job.deadline});
    now=finish;
  }
  const measured=rows.filter(row=>row.deadline!==null);
  return {metrics:{jobs:rows.length,meanWait:rows.length?Number((rows.reduce((sum,row)=>sum+row.wait,0)/rows.length).toFixed(3)):0,
    finish:now,maxWait:Math.max(0,...rows.map(row=>row.wait)),idleTime,
    deadlines:measured.length,missedDeadlines:measured.filter(row=>row.missedDeadline).length,
    maxTardiness:Math.max(0,...measured.map(row=>row.lateness))},rows};
}
