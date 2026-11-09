/* Moirai public music mentorship, read-only and local. */
(function(global){"use strict";
let records=[],state="loading";
let approved500=[],approved500State="loading";
const normalize500=s=>String(s||"").normalize("NFKC").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const approved500Ready=fetch("./knowledge/mentor-approved-500.v1.json",{cache:"no-store"})
.then(r=>{if(!r.ok)throw Error("bank unavailable");return r.json()})
.then(d=>{if(d.schema!=="vnv-public-mentor-qa-v1"||d.mentorId!=="moirai"||!Array.isArray(d.records)||d.records.length!==500)throw Error("bank schema");
const seen=new Set();approved500=d.records.filter(r=>{const key=normalize500(r.question);if(!key||typeof r.answer!=="string"||!r.answer.trim()||seen.has(key))return false;seen.add(key);return r.status==="founder-approved-editorial"||/^approved/.test(r.status)});
if(approved500.length!==500)throw Error("bank not completely approved");approved500State="ready";return 500;})
.catch(()=>{approved500State="unavailable";return 0;});
function answerFrom500(input){if(approved500State!=="ready")return null;const q=normalize500(input);if(!q)return null;
const exact=approved500.find(r=>normalize500(r.question)===q);if(exact)return exact.answer;
const tokens=new Set(q.split(" ").filter(w=>w.length>=4));if(tokens.size<2)return null;
let chosen=null,high=0;
for(const r of approved500){const words=new Set(normalize500(r.question).split(" ").filter(w=>w.length>=4));let shared=0;for(const w of tokens)if(words.has(w))shared++;
const score=shared/Math.max(tokens.size,words.size,1);if(shared>=2&&score>high){high=score;chosen=r;}}
return high>=0.64?chosen.answer:null;}

const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const ready=fetch("./knowledge/question-records.v1.json").then(r=>{if(!r.ok)throw Error("unavailable");return r.json()}).then(d=>{if(d.schema!=="moirai-public-qa-v1"||!Array.isArray(d.records))throw Error("schema");records=d.records.filter(x=>x.status==="approved"&&typeof x.response==="string");state="ready";return records.length}).catch(()=>{state="unavailable";return 0});
const patterns=[["melody",["melody","tune","motif"]],["harmony",["harmony","chord","progression"]],["rhythm",["rhythm","tempo","beat","meter"]],["songwriting",["song","songwriting","write a song"]],["lyrics",["lyric","words for music"]],["composition",["compose","composition","piece"]],["arrangement",["arrange","arrangement"]],["instrumentation",["instrument","orchestrat"]],["theory",["theory","scale","interval"]],["ear",["ear training","listen","hearing"]],["practice",["practice","rehearse"]],["performance",["perform","stage","audition"]],["recording",["record","microphone"]],["mixing",["mix","mastering"]],["research",["research","music history","composer"]],["authorship",["own my music","copyright","authorship"]],["privacy",["privacy","upload","recordings"]]];
function respond(input){const q=norm(input).slice(0,1000);if(!q)return "Tell me about a musical idea, a skill you want to learn, or a piece you are creating.";
if(["hello","hi","hey","good morning"].includes(q))return "Welcome to Moirai's music studio. Would you like to explore melody, harmony, songwriting, or a practice plan?";
if(q.includes("play a song")||q.includes("play music"))return "I can guide your original musical ideas and practice, but this chat does not play audio. Tell me what you want to create or learn.";
const from500=answerFrom500(input);if(from500)return from500;
const topic=patterns.find(([_,terms])=>terms.some(t=>q.includes(t)))?.[0];const item=records.find(r=>r.topic===topic);if(item)return item.response;
if(q.includes("eiren"))return "Eiren is our literary mentor for poetry and language. I can help with the musical side of an original song.";
if(q.includes("zelle"))return "Zelle is our visual art mentor. I can help connect a musical idea to a visual concept without taking over her role.";
return "Let's begin with your intention: are you composing, learning a skill, rehearsing, or preparing to record? We can choose one musical next step together.";
}
global.MoiraiConversation=Object.freeze({ready,approved500Ready,approved500Status:()=>approved500State,approved500Count:()=>approved500.length,respond,status:()=>state,recordCount:()=>records.length});
})(window);
