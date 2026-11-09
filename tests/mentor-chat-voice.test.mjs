import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../mentor-chat-voice-v1.js',import.meta.url),'utf8');
const name=html.includes('id="naib-message"')?'naib':html.includes('id="aurora-message"')?'aurora':'moirai';
const ids={naib:['naib-message','naib-ask','naib-clear','naib-conversation'],aurora:['aurora-message','aurora-ask','aurora-clear','aurora-answer'],moirai:['moirai-message','moirai-ask','moirai-clear','moirai-answer']}[name];
function element(tag='div'){
 const listeners=new Map();
 return {tag,children:[],listeners,value:'',textContent:'',dataset:{},disabled:false,style:{},scrollTop:0,scrollHeight:250,
 classList:{add(){}},append(...children){this.children.push(...children);},
 replaceChildren(...children){this.children=[...children];},
 insertAdjacentElement(){},
 setAttribute(k,v){this[k]=v;},
 addEventListener(k,fn){listeners.set(k,fn);},
 querySelector(k){return k==='p'?this.children.find(x=>x.tag==='p')||null:null;},
 querySelectorAll(){return [];},
 focus(){}};
}
function setup(){
 const els=new Map(ids.map(id=>[id,element()]));
 const voiced=[{name:'Arthur',lang:'en-GB',voiceURI:'a',localService:true},{name:'Samantha',lang:'en-US',voiceURI:'b',localService:true},{name:'Monica',lang:'es-ES',voiceURI:'c',localService:false}];
 const storage=new Map(),spoken=[];
 const document={getElementById:id=>els.get(id)||null,createElement:element,head:{append(){}}};
 const speechSynthesis={getVoices:()=>voiced,addEventListener(){},cancel(){},speak:u=>spoken.push(u)};
 function SpeechSynthesisUtterance(t){this.text=t;}
 const responses={naib:'NAIB guidance',aurora:'Aurora guidance',moirai:'Moirai guidance'};
 const window={speechSynthesis,SpeechSynthesisUtterance,NAIBPublicConversation:{respond:()=>responses.naib},
 AuroraConversation:{respond:()=>responses.aurora},MoiraiConversation:{respond:()=>responses.moirai}};
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 vm.runInNewContext(script,{document,window,localStorage,SpeechSynthesisUtterance},{timeout:1000});
 const panel=els.get(ids[3]);return{els,panel,spoken,storage,get:id=>els.get(id),name};
}
test('front door loads the public mentor enhancement',()=>{
 assert.match(html,/<script src="mentor-chat-voice-v1\.js"><\/script>/);
 assert.doesNotMatch(script,/fetch\s*\(|indexedDB|XMLHttpRequest/);
});
test('public chat has available voices and replay capabilities',()=>{
 const a=setup();assert.match(script,/getVoices\(\)/);
 assert.match(script,/Listen to this reply/);
 assert.match(script,/Preview voice/);
 assert.match(script,/voicePreference|vnv\.public\.voice/);
});
test('basic chat retains multiple turns with Enter-to-send when upgraded',()=>{
 if(name==='naib')return;
 const a=setup(),input=a.get(ids[0]),send=a.get(ids[1]),log=a.get(ids[3]);
 input.value='First question';send.listeners.get('click')();
 input.value='Second question';input.listeners.get('keydown')({key:'Enter',shiftKey:false,isComposing:false,preventDefault(){}});
 assert.equal(log.children.length,5);
 assert.equal(log.children[1].children[1].textContent,'First question');
 assert.equal(log.children[3].children[1].textContent,'Second question');
 assert.match(log.children[4].children[1].textContent,/guidance/);
});
test('Clear removes earlier messages without storing transcript',()=>{
 if(name==='naib')return;
 const a=setup(),input=a.get(ids[0]),send=a.get(ids[1]),clear=a.get(ids[2]),log=a.get(ids[3]);
 input.value='My question';send.listeners.get('click')();
 clear.listeners.get('click')();
 assert.equal(log.children.length,1);
 assert.equal(input.value,'');
 assert.equal(a.storage.size,0);
});
