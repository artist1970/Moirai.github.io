import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("index.html"),engine=read("moirai-conversation-v1.js"),source=read("creative-spark-language-request-v1.js");
function boot(){
 const window={CreativeSparkMentorLanguage:{
   lookup:(w,o)=>w==="abacus"?"abacus: a counting device":null,
   grammar:(t,o)=>({notes:/a apple/.test(t)?["Check whether 'an' fits the sound."]:[]}),
   capabilities:()=>({lexicon:"ready"})
 }};
 vm.runInNewContext(source,{window,console},{timeout:1200});
 return window.CreativeSparkLanguageRequest;
}
test("public chat loads the bounded Phase 2 bridge and initializes shared dictionary",()=>{
 assert.match(html,/creative-spark-mentor-language-v1\.js/);
 assert.match(html,/creative-spark-language-request-v1\.js/);
 assert.match(html,/CreativeSparkMentorLanguage\?\.init\("moirai"\)/);
 assert.match(engine,/CreativeSparkLanguageRequest\?\.answer\([^;]+mentorId:"moirai"/);
});
test("explicit dictionary and grammar help do not require a private model",()=>{
 const bridge=boot();
 assert.match(bridge.answer("define abacus",{mentorId:"moirai"}),/counting device/);
 assert.match(bridge.answer("check grammar: I saw a apple",{mentorId:"moirai"}),/Check whether/);
 assert.equal(bridge.answer("hello",{mentorId:"moirai"}),null);
 assert.equal(bridge.answer("define password",{mentorId:"moirai"}),null);
 assert.equal(bridge.answer("check grammar: My student record is confidential",{mentorId:"moirai"}),null);
 assert.equal(bridge.answer("define abacus",{mentorId:"noema"}),null);
});
test("no new transcript transport or private CORE resource is introduced",()=>{
 assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|indexedDB|localStorage|sessionStorage|innerHTML/);
 assert.doesNotMatch(html,/src="[^"]*CORE\//i);
});
