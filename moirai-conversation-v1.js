/* Moirai public music mentorship, read-only and local. */
(function(global){"use strict";
let records=[],state="loading";
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const ready=fetch("./knowledge/question-records.v1.json").then(r=>{if(!r.ok)throw Error("unavailable");return r.json()}).then(d=>{if(d.schema!=="moirai-public-qa-v1"||!Array.isArray(d.records))throw Error("schema");records=d.records.filter(x=>x.status==="approved"&&typeof x.response==="string");state="ready";return records.length}).catch(()=>{state="unavailable";return 0});
const patterns=[["melody",["melody","tune","motif"]],["harmony",["harmony","chord","progression"]],["rhythm",["rhythm","tempo","beat","meter"]],["songwriting",["song","songwriting","write a song"]],["lyrics",["lyric","words for music"]],["composition",["compose","composition","piece"]],["arrangement",["arrange","arrangement"]],["instrumentation",["instrument","orchestrat"]],["theory",["theory","scale","interval"]],["ear",["ear training","listen","hearing"]],["practice",["practice","rehearse"]],["performance",["perform","stage","audition"]],["recording",["record","microphone"]],["mixing",["mix","mastering"]],["research",["research","music history","composer"]],["authorship",["own my music","copyright","authorship"]],["privacy",["privacy","upload","recordings"]]];
function respond(input){const q=norm(input).slice(0,1000);if(!q)return "Tell me about a musical idea, a skill you want to learn, or a piece you are creating.";
if(["hello","hi","hey","good morning"].includes(q))return "Welcome to Moirai's music studio. Would you like to explore melody, harmony, songwriting, or a practice plan?";
if(q.includes("play a song")||q.includes("play music"))return "I can guide your original musical ideas and practice, but this chat does not play audio. Tell me what you want to create or learn.";
const topic=patterns.find(([_,terms])=>terms.some(t=>q.includes(t)))?.[0];const item=records.find(r=>r.topic===topic);if(item)return item.response;
if(q.includes("eiren"))return "Eiren is our literary mentor for poetry and language. I can help with the musical side of an original song.";
if(q.includes("zelle"))return "Zelle is our visual art mentor. I can help connect a musical idea to a visual concept without taking over her role.";
return "Let's begin with your intention: are you composing, learning a skill, rehearsing, or preparing to record? We can choose one musical next step together.";
}
global.MoiraiConversation=Object.freeze({ready,respond,status:()=>state,recordCount:()=>records.length});
})(window);
