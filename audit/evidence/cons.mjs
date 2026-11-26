import { C } from './harness.mjs';
const sk=C.saSkills[0]; let n=0, lt3=0, lt5=0, zero=0, nan=0; const ex=[];
for(let a=1;a<=5;a++)for(let b=1;b<=5;b++)for(let c=1;c<=5;c++)for(let d=1;d<=5;d++)for(let e=1;e<=5;e++){
 const v=[a,b,c,d,e]; v.forEach((x,i)=>C.state.saResponses[sk.key+'_l'+i]=x); sk.forcedChoice.forEach((_,i)=>C.state.saResponses[sk.key+'_fc'+i]='a');
 C.computeSAScore(sk); const r=C.state.scores[sk.key].consistency; n++; if(r<0.3)lt3++; if(r<0.5)lt5++; if(r===0)zero++; if(Number.isNaN(r))nan++;
}
console.log({patterns:n, flagged_notice_lt0_3:(100*lt3/n).toFixed(1)+'%', badge_check_lt0_5:(100*lt5/n).toFixed(1)+'%', exactly_zero:(100*zero/n).toFixed(1)+'%', nan});
// straight-liners (same answer to all 5)
for(let v=1;v<=5;v++){[0,1,2,3,4].forEach(i=>C.state.saResponses[sk.key+'_l'+i]=v);C.computeSAScore(sk);console.log('straight-line',v,'r=',C.state.scores[sk.key].consistency);}
