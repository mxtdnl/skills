import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
// Path to the legacy prototype: first CLI argument, or legacy/skills-assessment-hult.html by default.
const file = process.argv[2] || fileURLToPath(new URL('../../legacy/skills-assessment-hult.html', import.meta.url));
const html = readFileSync(file, 'utf8');
let js = html.match(/<script>([\s\S]*?)<\/script>/)[1];
js = js.replace(/^\s*\(function\(\) \{/, '').replace(/\}\)\(\);\s*$/, '');
function stub(){ const f=function(){return stub();}; return new Proxy(f,{get(t,k){ if(k==='value') return t._v??''; if(k===Symbol.toPrimitive) return ()=>''; if(k==='length') return 0; if(k==='forEach') return ()=>{}; if(k in t) return t[k]; return stub();}, set(t,k,v){t[k==='value'?'_v':k]=v;return true;}, apply(){return stub();}}); }
const els={};
const document={getElementById:id=>els[id]??=stub(),querySelectorAll:()=>[],createElement:()=>stub(),addEventListener:()=>{},body:stub()};
const ctx=vm.createContext({document,window:{scrollTo(){}},setTimeout:()=>0,setInterval:()=>0,clearInterval(){},console,Math,Object,Array,JSON,Blob:function(){},URL:{createObjectURL(){return''}}});
vm.runInContext(js,ctx);
export const C=ctx, E=els;
