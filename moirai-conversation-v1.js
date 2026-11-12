/* Moirai music mentor v2 · reviewed local Q&A, safe cross-specialist reference.
   No recordings, chat transcripts or user text leave this page. */
(function(root){"use strict";
let records=[],state="loading",lastTopic="",lastId="",turn=0;
const norm=s=>String(s||"").normalize("NFKC").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
const stop=new Set(["what","how","can","please","with","from","the","and","your","some","would","should","could","help","about","have","start","begin","want"]);
const tokens=s=>new Set(norm(s).split(" ").filter(x=>x.length>=3&&!stop.has(x)));
const patterns=[
 ["melody",["melody","tune","motif"]],["harmony",["harmony","chord","progression"]],
 ["rhythm",["rhythm","tempo","beat","meter"]],["songwriting",["songwriting","song","write a song"]],
 ["lyrics",["lyrics","lyric","words for music"]],["composition",["compose","composition","piece"]],
 ["arrangement",["arrange","arrangement"]],["instrumentation",["instrument","orchestrat"]],
 ["theory",["theory","scale","interval"]],["ear",["ear training","listening exercise"]],
 ["practice",["practice","rehearse"]],["performance",["perform","stage","audition"]],
 ["recording",["record","microphone"]],["mixing",["mixing","mastering"]],
 ["research",["research","music history","composer"]],["authorship",["own my music","copyright","authorship"]],["privacy",["privacy","upload","private recording"]]
];
const sensitive=/\b(?:password|api key|secret key|bank account|credit card|social security|ssn|private address|student record|account credential|suicide|self harm|kill myself|emergency|immediate danger|medical advice|legal advice)\b/i;
const ready=fetch("./knowledge/question-records.v1.json",{credentials:"same-origin",cache:"no-store"}).then(r=>{if(!r.ok)throw Error("unavailable");return r.json()}).then(d=>{
 if(d.schema!=="moirai-public-qa-v1"||!Array.isArray(d.records)||d.records.length!==20)throw Error("schema");
 const ids=new Set(),qs=new Set();
 for(const r of d.records){
  if(r.status!=="approved"||typeof r.id!=="string"||ids.has(r.id)||typeof r.question!=="string"||
     qs.has(norm(r.question))||typeof r.response!=="string"||!r.response.trim()||r.response.length>2200||
     typeof r.topic!=="string")throw Error("unreviewed-or-malformed");
  ids.add(r.id);qs.add(norm(r.question));
 }
 records=d.records;state="ready";return records.length;
}).catch(()=>{records=[];state="unavailable";return 0});
function reset(){lastTopic="";lastId="";turn=0;root.CreativeSparkMentorQA?.reset?.({mentorId:"moirai",scope:"refrain-studio"});}
function lookup(q){
 if(state!=="ready")return null;
 const query=norm(q),inputTokens=tokens(query);
 const ranks=records.map(r=>{
  const question=norm(r.question),target=tokens(question);
  const common=[...inputTokens].filter(t=>target.has(t)).length;
  const coverage=common/Math.max(1,inputTokens.size);
  const score=query===question?100:common>=2&&coverage>=.68?Math.round(30+coverage*50):0;
  return {r,score};
 }).sort((a,b)=>b.score-a.score);
 if(!ranks[0]||ranks[0].score<70)return null;
 if(ranks[1]&&ranks[0].score===ranks[1].score)return null;
 return ranks[0].r;
}
function respond(input){
 const raw=String(input||"").trim().slice(0,1000),q=norm(raw);turn++;
 if(!q)return "Tell me about a musical idea, a skill you want to learn, or a piece you are creating.";
 if(sensitive.test(raw))return "Please keep credentials, private information and sensitive records out of this public music chat. If someone is in immediate danger, contact local emergency services or a trusted person nearby.";
 const language=root.CreativeSparkLanguageRequest?.answer(raw,{mentorId:"moirai"});
 if(language)return language;
 if(["hello","hi","hey","good morning","good afternoon"].includes(q))return "Welcome to Moirai's studio. Would you like to explore melody, harmony, songwriting, or a practice plan?";
 if(q.includes("play a song")||q.includes("play music"))return "I can guide your original musical ideas and practice, but this chat does not play audio. Tell me what you want to create or learn.";
 if(q.includes("eiren"))return "Eiren is our literary mentor for poetry and language. I can help with the musical side of an original song.";
 if(q.includes("zelle"))return "Zelle is our visual art mentor. I can help connect a musical idea to a visual concept without taking over her role.";
 if(/^(tell me more|can you explain|another example|what next|go on|continue)[.!? ]*$/.test(q)&&lastTopic){
  return "We were exploring "+lastTopic+". Would you like one practical exercise, a simpler explanation, or a question about your own music?";
 }
 const exact=lookup(raw);
 if(exact){lastTopic=exact.topic;lastId=exact.id;return exact.response;}
 const topic=patterns.find(([_,terms])=>terms.some(t=>q.includes(t)))?.[0];
 // A single topic label is not an accurate answer to an arbitrary question. Use
 // a bounded, constructive prompt instead of recycling the first Q&A blindly.
 if(topic){
  lastTopic=topic;
  const ref=records.find(r=>r.topic===topic);
  if(ref&&/\b(?:where (?:do|should) i start|how (?:do|can) i (?:start|begin)|beginner|first step)\b/.test(q))return ref.response;
  return "For "+topic+", let's find the part you're working on. Is your question about understanding a concept, creating original material, or practicing a specific skill?";
 }
 const foreign=root.CreativeSparkMentorQA?.answer(raw,{mentorId:"moirai",scope:"refrain-studio"});
 if(foreign)return "From "+foreign.sourceName+"'s approved public knowledge: "+foreign.answer+" (Source: "+foreign.sourceName+" · "+foreign.topic+".) How might that connect with your musical project?";
 return "Let's begin with your intention: are you composing, learning a skill, rehearsing, or preparing to record? We can choose one musical next step together.";
}
root.MoiraiConversation=Object.freeze({ready,respond,reset,status:()=>state,recordCount:()=>records.length});
})(window);
