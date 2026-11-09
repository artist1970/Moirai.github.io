import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const script=readFileSync(new URL("../moirai-conversation-v1.js",import.meta.url),"utf8");
const bank=JSON.parse(readFileSync(new URL("../knowledge/mentor-approved-500.v1.json",import.meta.url),"utf8"));
test("500 founder-approved records have distinct normalized questions and safe textual answers",()=>{
 assert.equal(bank.schema,"vnv-public-mentor-qa-v1");
 assert.equal(bank.records.length,500);
 const seen=new Set();
 for(const r of bank.records){
  assert.ok(r.question?.trim()&&r.answer?.trim());
  assert.match(r.status,/^(founder-approved-editorial|approved|approved-public|approved-public-seed)$/);
  const key=r.question.normalize("NFKC").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
  assert.ok(key&&!seen.has(key));seen.add(key);
 }
});
test("chat loads approved public 500 but preserves legacy fallback and no mutation",async()=>{
 const requested=[];
 const win={};
 const fetch=async path=>{
   requested.push(path);
   if(path.includes("mentor-approved-500"))return {ok:true,json:async()=>bank};
   return {ok:true,json:async()=>({schema:"moirai-public-qa-v1",records:[]})};
 };
 vm.runInNewContext(script,{window:win,fetch,Error,Set}, {timeout:5000});
 const chat=win.MoiraiConversation;
 assert.ok(chat);
 await chat.approved500Ready;
 assert.equal(chat.approved500Count(),500);
 assert.equal(chat.approved500Status(),"ready");
 const sample=bank.records.find(r=>r.status==="founder-approved-editorial")||bank.records[0];
 assert.equal(chat.respond(sample.question),sample.answer);
 assert.ok(requested.some(x=>x.includes("mentor-approved-500")));
 assert.ok(requested.some(x=>x.includes("./knowledge/question-records.v1.json")));
 assert.equal(typeof chat.respond("gibberish no topic xyz"),"string");
});
test("chat degrades to legacy when approved public bank is unavailable",async()=>{
 const win={};
 const fetch=async path=>path.includes("mentor-approved-500")?{ok:false}:{
 ok:true,json:async()=>({schema:"moirai-public-qa-v1",records:[]})};
 vm.runInNewContext(script,{window:win,fetch,Error,Set},{timeout:5000});
 const chat=win.MoiraiConversation;await chat.approved500Ready;await chat.ready;
 assert.equal(chat.approved500Status(),"unavailable");
 assert.equal(chat.approved500Count(),0);
 assert.ok(chat.respond("hello").length>4);
});
