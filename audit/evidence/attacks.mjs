import { C, E } from './harness.mjs';
const r=x=>Math.round(x*100);
const out=[];
// ---------- INFO GAP
function ig(sel){ C.state.ig.topics=C.igTopics.slice(); C.state.ig.revealedIndices=sel; C.scoreIG(); return r(C.state.scores.curiosity.cognitive); }
const T=C.igTopics, all=T.map((_,i)=>i), novel=all.filter(i=>T[i].novel), nonnovel=all.filter(i=>!T[i].novel);
out.push(['IG click all 15', ig(all)], ['IG click 1 novel card', ig([novel[0]])], ['IG click only 8 novel', ig(novel)], ['IG click 1 non-novel', ig([nonnovel[0]])], ['IG click 7 non-novel', ig(nonnovel)], ['IG click 0', ig([])]);
// ---------- WASON (partial credit per problem, identical for all problems)
function wason(selFn){ const res=C.wasonProblems.map(p=>{const sel=selFn(p); const ch=sel.filter(s=>p.correct.includes(s)).length, wr=sel.length-ch; return Math.max(0,(ch-wr*0.5)/p.correct.length);}); return r(res.reduce((a,b)=>a+b)/res.length); }
out.push(['Wason correct (P, not-Q)', wason(()=>[0,3])], ['Wason select ALL 4 cards', wason(()=>[0,1,2,3])], ['Wason P only', wason(()=>[0])], ['Wason classic error P+Q', wason(()=>[0,2])], ['Wason Q only', wason(()=>[2])]);
out.push(['Wason: problems whose answer is cards [0,3] pre-shuffle', C.wasonProblems.filter(p=>p.correct.join()==='0,3').length+'/'+C.wasonProblems.length]);
// ---------- AUT
function aut(obj, lines){ C.state.aut.object=obj; E['aut-textarea']={value:lines.join('\n'),disabled:false}; C.state.taskIndex=-1; C.scoreAUT(); return r(C.state.scores.creativity.cognitive); }
const gib=['zorp flim gax to blint','quax vend pliv to snorf','mibble track wun to grell','plon fesk tarn to wibb','yert sloom drav to kesp','vrin hamb trell to oskel','jusp ferl mabb to gweth','krenn zabb tulp to frax','nolb wisp drekk to yamb','teld varp quin to sorv'];
const brickCommon=['doorstop','paperweight','build a wall','throw it','weapon','weight'];
const brickGood=['heat it in the oven and wrap in a towel as a bed warmer','use it as a pizza stone','prop a shelf to make a bookcase','carve it into a sculpture','grind it into red pigment for paint','drill holes and use it as a planter for succulents','use as a step to reach a high cupboard','smash it into chips to make a garden path','use it as a dumbbell for workouts','mark the edge of a flower bed'];
const brickWordy=brickCommon.map(s=>s+' in order to help with things when needed by using it');
out.push(['AUT brick: 10 gibberish lines', aut('brick',gib)], ['AUT brick: 6 common uses', aut('brick',brickCommon)], ['AUT brick: 10 sensible varied uses', aut('brick',brickGood)], ['AUT brick: common uses padded with filler', aut('brick',brickWordy)]);
out.push(['AUT originality "use as ballast weight for a narrowboat"', C.autGetOriginality('use as ballast weight for a narrowboat','brick')], ['AUT originality "asdf qwerty"', C.autGetOriginality('asdf qwerty','brick')]);
// ---------- MESSAGE EDITING
function me(fn){ C.state.me.passages=C.mePassages.slice(); C.state.me.responses=C.mePassages.map(fn); C.state.taskIndex=-1; C.scoreME(); return r(C.state.scores.communication.cognitive); }
const human={ 'Ambiguity':'The team leader told the senior manager: "Your report has several errors. You need to fix them before the deadline."',
 'Buried key information':'We cannot approve your funding request at this time. We do appreciate the effort and the strength of your preliminary research.',
 'Jargon':'Teams across the organisation need to work together more to deliver better results for the people we serve.',
 'Logical gap':'Sales fell by 18% last quarter. We believe low brand awareness caused the fall, so we are raising the marketing budget by 40% to win back customers.',
 'Register inconsistency':'Dear Professor Williams, I am writing to ask whether you would supervise my dissertation. I am very interested in your research on neural plasticity and would welcome the chance to discuss it, if you have time.' };
out.push(['ME careful human rewrites', me(p=>human[p.label])], ['ME keyword salad (keywords list joined)', me(p=>p.keywords.join(' '))], ['ME original pasted back unchanged', me(p=>p.plain)], ['ME keyword salad, each kw once, comma-separated', me(p=>p.keywords.join(', '))]);
// ---------- PUBLIC GOODS
function pg(c){ C.state.pg={contributions:[],currentRound:0,totalRounds:6}; C.state.taskIndex=-1; for(const v of c){E['pg-slider']={value:String(v)}; C.pgConfirm();} return r(C.state.scores.collaboration.cognitive); }
out.push(['PG 20 every round', pg([20,20,20,20,20,20])], ['PG 0 every round', pg([0,0,0,0,0,0])], ['PG 10 every round', pg([10,10,10,10,10,10])], ['PG alternating 0/20', pg([0,20,0,20,0,20])], ['PG start 20, decline to 0 (reciprocity-like)', pg([20,16,12,8,4,0])]);
// ---------- SELF-ASSESSMENT
function sa(lv, fcPick){ const sk=C.saSkills[0]; sk.likert.forEach((_,i)=>C.state.saResponses[sk.key+'_l'+i]=Array.isArray(lv)?lv[i]:lv); sk.forcedChoice.forEach((it,i)=>C.state.saResponses[sk.key+'_fc'+i]=fcPick(it)); C.computeSAScore(sk); const s=C.state.scores[sk.key]; return `self=${r(s.self)} likert=${r(s.selfLikert)} fc=${r(s.selfFC)} r=${s.consistency.toFixed(2)}`; }
const best=it=>it.scores[0]>=it.scores[1]?'a':'b', worst=it=>it.scores[0]<it.scores[1]?'a':'b';
out.push(['SA all 1 (disagree all) + best FC', sa(1,best)], ['SA all 5 (agree all) + worst FC', sa(5,worst)], ['SA all 3 midpoint', sa(3,best)], ['SA 1,2,1,2,1 (very consistent)', sa([1,2,1,2,1],best)], ['SA 1,5,1,5,1 (inconsistent)', sa([1,5,1,5,1],best)], ['SA 2,1,2,1,2', sa([2,1,2,1,2],best)]);
// FC: obviously-desirable option check
let gaps=[]; C.saSkills.forEach(s=>s.forcedChoice.forEach(it=>gaps.push(Math.abs(it.scores[0]-it.scores[1]))));
out.push(['FC pairs with score gap >=0.5', gaps.filter(g=>g>=0.5).length+'/'+gaps.length], ['FC theoretical min/max self per skill', C.saSkills.map(s=>s.key+':'+r(s.forcedChoice.reduce((a,it)=>a+Math.min(...it.scores),0)/4)+'-'+r(s.forcedChoice.reduce((a,it)=>a+Math.max(...it.scores),0)/4)).join(' ')]);
// ---------- COMPOSITE: gamer vs honest
function comp(cog,self,flags){ const f=Math.min(flags,2)*0.05; const cw=Math.min(0.55+f,0.65), sw=Math.max(0.45-f,0.35); return r(cog*cw+self*sw); }
out.push(['Composite: cog 0.40, self 1.00, 0 flags', comp(0.40,1.0,0)], ['Composite: cog 0.60, self 0.45, 0 flags', comp(0.60,0.45,0)]);
for(const [k,v] of out) console.log(String(k).padEnd(58), v);
