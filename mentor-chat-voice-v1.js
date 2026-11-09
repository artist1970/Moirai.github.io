/* Shared public mentor conversation and voice controls. Browser-only, no protected APIs. */
(function(){
"use strict";
const settings=[
 {id:"naib",name:"NAIB",input:"naib-message",send:"naib-ask",clear:"naib-clear",log:"naib-conversation",existing:true,greeting:"Welcome. What would you like to discuss?",api:"NAIBPublicConversation"},
 {id:"aurora",name:"Aurora",input:"aurora-message",send:"aurora-ask",clear:"aurora-clear",log:"aurora-answer",existing:false,greeting:"Welcome. Choose your own pace. You can stop or skip any suggestion.",api:"AuroraConversation"},
 {id:"moirai",name:"Moirai",input:"moirai-message",send:"moirai-ask",clear:"moirai-clear",log:"moirai-answer",existing:false,greeting:"Welcome. Your music and creative choices remain yours.",api:"MoiraiConversation"}
];
const cfg=settings.find(x=>document.getElementById(x.input));if(!cfg)return;
const input=document.getElementById(cfg.input),send=document.getElementById(cfg.send),clear=document.getElementById(cfg.clear),log=document.getElementById(cfg.log);
if(!input||!send||!clear||!log)return;
const root=document.createElement("div");root.className="mentor-voice-panel";
const label=document.createElement("label");label.textContent=cfg.name+" voice";label.htmlFor="mentor-voice-select";
const select=document.createElement("select");select.id="mentor-voice-select";
const preview=document.createElement("button");preview.type="button";preview.textContent="Preview voice";
const stop=document.createElement("button");stop.type="button";stop.textContent="Stop audio";
const status=document.createElement("p");status.setAttribute("role","status");status.setAttribute("aria-live","polite");status.textContent="Detecting browser voices…";
root.append(label,select,preview,stop,status);
const css=document.createElement("style");
css.textContent=".mentor-voice-panel{margin:14px 0;padding:15px;border:1px solid currentColor;border-radius:7px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:16px}.mentor-voice-panel label{width:100%;font-size:16px}.mentor-voice-panel select{flex:1;min-width:180px;max-width:100%;font:inherit;font-size:16px;padding:11px;border:1px solid #8a937f;border-radius:7px;background:#f4f0e7;color:#243038}.mentor-voice-panel button,.mentor-replay{font:inherit;font-size:16px;padding:9px 13px;border:1px solid #9d8b6d;border-radius:7px;cursor:pointer;background:#28332f;color:#f4f0e7}.mentor-voice-panel p{width:100%;margin:0;font-size:16px}.mentor-thread{display:flex;flex-direction:column;gap:12px;max-height:480px;min-height:185px;overflow-y:auto;padding:14px;border-radius:7px}.mentor-turn{max-width:93%;padding:12px 16px;border:1px solid #a59b86;border-radius:7px;background:rgba(127,127,127,.09);overflow-wrap:anywhere}.mentor-turn[data-who=you]{align-self:flex-end;background:rgba(90,121,125,.16)}.mentor-turn[data-who=mentor]{align-self:flex-start}.mentor-turn strong{display:block;font-size:16px;font-weight:400;margin-bottom:6px}.mentor-turn p{white-space:pre-wrap;margin:0;font-size:16px;line-height:1.65}.mentor-replay{display:block;margin-top:9px}@media(max-width:650px){.mentor-turn{max-width:100%}.mentor-voice-panel{padding:11px}}";
document.head.append(css);
log.insertAdjacentElement("afterend",root);
let voices=[],chosen="auto";
const pref="vnv.public.voice."+cfg.id+".v1";
const speakerAllowed=("speechSynthesis" in window)&&("SpeechSynthesisUtterance" in window);
const key=v=>JSON.stringify([v.voiceURI||"",v.name||"",v.lang||"",!!v.localService]);
try{const stored=localStorage.getItem(pref);if(stored&&stored.length<500)chosen=stored;}catch{}
function autoVoice(){return voices.find(v=>v.name==="Arthur"&&v.lang==="en-GB")||voices.find(v=>/^en/i.test(v.lang||""))||voices[0]||null;}
function current(){return chosen==="auto"?autoVoice():voices.find(v=>key(v)===chosen)||autoVoice();}
function voiceText(v){return (v.name||"Unnamed")+" · "+(v.lang||"unknown")+(v.localService?" · device":" · browser/service");}
function updateVoices(){
 if(!speakerAllowed)return;
 voices=Array.from(window.speechSynthesis.getVoices()||[]);
 select.replaceChildren();
 const option=document.createElement("option");option.value="auto";option.textContent="Automatic · preferred voice";select.append(option);
 const seen=new Set();
 for(const v of voices){const k=key(v);if(seen.has(k))continue;seen.add(k);const opt=document.createElement("option");opt.value=k;opt.textContent=voiceText(v);select.append(opt);}
 if(chosen!=="auto"&&!seen.has(chosen)&&voices.length){chosen="auto";status.textContent="Previous voice unavailable; automatic voice restored.";}
 select.value=chosen;
 if(!voices.length)status.textContent="No voices reported yet; device default may still work.";
}
function speak(text){
 if(!speakerAllowed){status.textContent="Speech playback is unavailable in this browser.";return;}
 try{
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(String(text||"").slice(0,4000));
  const v=current();if(v){utterance.voice=v;utterance.lang=v.lang;}else utterance.lang="en-US";
  utterance.rate=.95;utterance.volume=.85;
  utterance.onstart=()=>{status.textContent="Speaking with "+(v?.name||"browser default")+"."};
  utterance.onend=()=>{status.textContent="Playback finished."};
  utterance.onerror=()=>{status.textContent="Speech playback was interrupted or unavailable."};
  window.speechSynthesis.speak(utterance);
 }catch{status.textContent="Speech playback is unavailable on this device.";}
}
select.addEventListener("change",()=>{chosen=select.value||"auto";try{localStorage.setItem(pref,chosen);}catch{}status.textContent="Voice: "+(current()?voiceText(current()):"browser default");});
preview.addEventListener("click",()=>speak("Hello. I am "+cfg.name+". Welcome to our conversation."));
stop.addEventListener("click",()=>{if(speakerAllowed)window.speechSynthesis.cancel();status.textContent="Audio stopped.";});
if(speakerAllowed){updateVoices();window.speechSynthesis.addEventListener?.("voiceschanged",updateVoices);}
else{select.disabled=true;preview.disabled=true;stop.disabled=true;status.textContent="This browser does not support speech playback.";}
function replay(buttonParent,text){
 if(buttonParent.querySelector(".mentor-replay"))return;
 const button=document.createElement("button");button.type="button";button.className="mentor-replay";button.textContent="Listen to this reply";button.addEventListener("click",()=>speak(text));buttonParent.append(button);
}
if(cfg.existing){
 function decorate(){
  for(const turn of log.querySelectorAll('.naib-turn[data-speaker="naib"]')){const p=turn.querySelector("p");if(p)replay(turn,p.textContent);}
 }
 decorate();
 if("MutationObserver" in window){const observer=new MutationObserver(decorate);observer.observe(log,{childList:true});}
 return;
}
log.classList.add("mentor-thread");log.setAttribute("role","log");log.setAttribute("aria-label","Conversation with "+cfg.name);log.setAttribute("aria-live","polite");log.replaceChildren();
function append(who,text){
 const turn=document.createElement("div");turn.className="mentor-turn";turn.dataset.who=who==="You"?"you":"mentor";
 const title=document.createElement("strong");title.textContent=who;
 const p=document.createElement("p");p.textContent=text;turn.append(title,p);
 if(who!=="You")replay(turn,text);
 log.append(turn);log.scrollTop=log.scrollHeight;
}
append(cfg.name,cfg.greeting);
function refresh(){send.disabled=!input.value.trim();}
function submit(){
 const text=input.value.trim();if(!text)return;
 input.value="";refresh();append("You",text);
 let reply;
 try{reply=window[cfg.api]?.respond(text)||cfg.name+" is temporarily unavailable. Please try again.";}
 catch{reply=cfg.name+" could not respond. Please try again.";}
 append(cfg.name,reply);input.focus({preventScroll:true});
}
send.addEventListener("click",submit);
input.addEventListener("input",refresh);
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();submit();}});
clear.addEventListener("click",()=>{input.value="";log.replaceChildren();append(cfg.name,cfg.greeting);refresh();input.focus({preventScroll:true});});
refresh();
})();
