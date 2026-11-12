import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const html=read("index.html"),code=read("moirai-conversation-v1.js"),voice=read("mentor-chat-voice-v1.js");
const kb=JSON.parse(read("knowledge/question-records.v1.json"));
function boot(){
 const window={CreativeSparkMentorQA:{answer:()=>null,reset:()=>{}}};
 const context={window,fetch:async()=>({ok:true,json:async()=>kb}),console};
 vm.runInNewContext(code,context,{timeout:1500});
 return window;
}
test("the live music bank remains the twenty reviewed original questions",()=>{
 assert.equal(kb.records.length,20);
 assert.equal(new Set(kb.records.map(x=>x.id)).size,20);
 assert.ok(kb.records.every(x=>x.status==="approved"&&typeof x.response==="string"));
 const drafts=JSON.parse(read("knowledge/drafts/music-qa-candidates-2026-11.json"));
 assert.equal(drafts.records.length,20);
 assert.ok(drafts.records.every(x=>x.reviewStatus==="draft-public-candidate"&&!x.published));
 assert.doesNotMatch(html,/music-qa-candidates-2026-11\.json/);
});
test("a reviewed exact question still returns the original answer",async()=>{
 const w=boot();assert.equal(await w.MoiraiConversation.ready,20);
 assert.equal(w.MoiraiConversation.respond("How do I start writing a melody?"),kb.records[0].response);
 assert.equal(w.MoiraiConversation.respond("What is a simple mixing starting point?"),kb.records[13].response);
});
test("different questions in the same topic do not all receive the first answer",async()=>{
 const w=boot();await w.MoiraiConversation.ready;
 const a=w.MoiraiConversation.respond("Why is my melody too busy?");
 assert.match(a,/understanding a concept|creating original material/i);
 assert.notEqual(a,kb.records[0].response);
});
test("private information stays out; chat never claims playback or remote work",async()=>{
 const w=boot();await w.MoiraiConversation.ready;
 assert.match(w.MoiraiConversation.respond("Here is my password"),/keep credentials/);
 assert.match(w.MoiraiConversation.respond("Can you play a song?"),/does not play audio/);
 assert.doesNotMatch(code,/localStorage|sessionStorage|indexedDB|XMLHttpRequest/);
});
test("public music mentor can cite a trusted specialist but never impersonates them",async()=>{
 const w=boot();await w.MoiraiConversation.ready;
 w.CreativeSparkMentorQA.answer=()=>({sourceName:"Eiren",answer:"Try an original image.",topic:"poetry"});
 assert.match(w.MoiraiConversation.respond("How can poetry strengthen an image?"),/From Eiren's approved public knowledge/);
 assert.match(read("creative-spark-mentor-qa-v1.js"),/moirai:"Moirai"/);
 assert.ok(html.indexOf("creative-spark-mentor-qa-v1.js")<html.indexOf("moirai-conversation-v1.js"));
});
test("voice is opt-in, saved as a setting, keeps replay, and skips initial greeting",()=>{
 assert.match(voice,/vnv\.public\.voice\.autoplay\./);
 assert.match(voice,/autoRead\?"Voice On":"Voice Off"/);
 assert.match(voice,/log\.children\.length>1\)speak\(text\)/);
 assert.match(voice,/Listen to this reply/);
 assert.match(voice,/window\[cfg\.api\]\?\.reset\?\.\(\)/);
});
test("VNV styling has independent hero, sticky anchor and minimum legible labels",()=>{
 const css=read("styles/moirai-landing-refinement-v1.css");
 assert.match(html,/id="moirai-introduction"/);
 assert.match(html,/class="moirai-chat-anchor"/);
 assert.match(css,/\.moirai-chat-anchor\{position:sticky/);
 assert.match(css,/\.capability\{font:400 16px/);
 assert.match(css,/--radius:7px/);
 assert.doesNotMatch(html,/Noema → NAIB → Moirai/);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((html.match(/<footer\b/g)||[]).length,1);
});
test("public README contains no stray script/archive generator tail",()=>{
 const s=read("README.md");
 assert.doesNotMatch(s,/z\.writestr\(|z\.close\(|"""\)/);
 assert.match(s,/musician remains the creator/i);
});

test("the original private CORE is never imported by the public mentor page",()=>{
 assert.doesNotMatch(html,/MoiraiCore\.html|core_private\.json|private[_-]key/);
 assert.match(html,/vnv-ecosystem-toolbar\.js/);
 assert.match(html,/vnv-ticker-autopopulate\.js/);
 assert.match(html,/vnv-333-ticker\.js/);
});
