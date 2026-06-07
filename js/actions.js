// js/actions.js
import {LANGS, LEVELS, MAX_TEXT_BYTES} from './config.js';
import {S, setState, showToast} from './state.js';
import {saveLib, saveVoc, saveFc, saveStreak, savePositions, saveTxt, delTxt} from './db.js';
import {sm2, detectLang, extractPdf, todayStr, cleanDefs} from './utils.js';
import {render} from './views.js';

export async function handleFile(e){const f=e.target?.files?.[0];if(!f)return;setState({loading:true});try{let t='';if(f.name.toLowerCase().endsWith('.pdf'))t=await extractPdf(f);else t=await f.text();if(!t.trim()){alert('Sin texto');setState({loading:false});return}
addText(f.name.replace(/\.(pdf|txt|text)$/i,''),t)}catch(er){alert('Error: '+er.message);setState({loading:false})}e.target.value=''}

export function addText(title,text){if(new TextEncoder().encode(text).length>MAX_TEXT_BYTES){setState({loading:false});showToast('Este texto es demasiado grande para guardarse (máx. ~1 MB). Divídelo en partes más pequeñas.','error');return}const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);const preview=text.slice(0,150).replace(/\s+/g,' ');const words=text.split(/\s+/).filter(Boolean).length;const lang=detectLang(text);
S.library.unshift({id,title,preview,wordCount:words,dateAdded:new Date().toISOString(),language:lang});S.texts[id]=text;saveLib();saveTxt(id,text);setState({loading:false,currentTextId:id,view:'reader'});showToast(`"${title}" — ${words.toLocaleString()} palabras (${LANGS[lang]})`)}

export function deleteText(id){S.library=S.library.filter(i=>i.id!==id);delete S.texts[id];saveLib();delTxt(id);if(S.currentTextId===id)S.currentTextId=null;setState({view:'library',confirmAction:null})}
export function setTextLang(id,l){S.library=S.library.map(i=>i.id===id?{...i,language:l}:i);saveLib();render()}

export function saveWord(text,level){const m=S.library.find(t=>t.id===S.currentTextId);const lang=m?.language||'en';const k=lang+':'+text.toLowerCase().trim();const ex=S.vocabulary[k]||{};const tr=S.popup?.translation;
S.vocabulary[k]={...ex,word:text.trim(),language:lang,level,note:ex.note||'',definitions:(ex.definitions&&ex.definitions.length)?ex.definitions:cleanDefs(tr?.translation,tr?.definition),irregularForms:ex.irregularForms||[],translation:tr?.translation||ex.translation||'',example:tr?.example||ex.example||'',exampleTranslation:tr?.exampleTranslation||ex.exampleTranslation||'',tags:ex.tags||[],sourceTextId:ex.sourceTextId||S.currentTextId,dateAdded:ex.dateAdded||new Date().toISOString(),dateModified:new Date().toISOString()};
saveVoc();if(level!=='learned'&&!S.flashcards[k]){S.flashcards[k]={easeFactor:2.5,interval:0,repetitions:0,nextReview:new Date().toISOString()};saveFc()}setState({popup:null})}

export function recordStudy(){const today=todayStr();if(!S.streakHistory.includes(today)){S.streakHistory.push(today);saveStreak()}}

export function startFc(mode){const m=mode||S.fcMode;const now=new Date();const deck=Object.keys(S.flashcards).filter(k=>{const v=S.vocabulary[k];if(!v||v.level==='learned')return false;if(S.fcLangFilter!=='all'&&v.language!==S.fcLangFilter)return false;if(m==='due'){const fc=S.flashcards[k];return!fc.nextReview||new Date(fc.nextReview)<=now}return true});deck.sort(()=>Math.random()-.5);setState({flashcardDeck:deck,fcIndex:0,fcFlipped:false,fcMode:m})}

export function answerFc(q){const k=S.flashcardDeck[S.fcIndex];S.flashcards[k]=sm2(S.flashcards[k]||{},q);saveFc();if(q>=3&&S.vocabulary[k]){S.vocabulary[k].level=q===5?'learned':'recognized';saveVoc()}recordStudy();
if(S.fcIndex+1<S.flashcardDeck.length)setState({fcIndex:S.fcIndex+1,fcFlipped:false});else setState({flashcardDeck:[],fcFlipped:false})}

export function wordStyle(w,l){const k=l+':'+w.toLowerCase().trim().replace(/[.,;:!?¿¡"""''()\[\]{}]/g,'');const v=S.vocabulary[k];if(!v)return'';return`background:${LEVELS[v.level]?.bg};border-radius:3px;padding:0 2px;`}

export function saveReadPos(){const ra=document.getElementById('reader-area');if(ra&&S.currentTextId){const pct=ra.scrollHeight>ra.clientHeight?ra.scrollTop/(ra.scrollHeight-ra.clientHeight):0;S.readingPositions[S.currentTextId]=pct;savePositions()}}
export function restoreReadPos(){const ra=document.getElementById('reader-area');if(ra&&S.currentTextId&&S.readingPositions[S.currentTextId]!=null){const pct=S.readingPositions[S.currentTextId];setTimeout(()=>{ra.scrollTop=pct*(ra.scrollHeight-ra.clientHeight)},100)}}

export function cleanOrphanedFlashcards(){let cleaned=false;for(const k of Object.keys(S.flashcards)){if(!S.vocabulary[k]){delete S.flashcards[k];cleaned=true}}if(cleaned)saveFc()}

export function getStats(){cleanOrphanedFlashcards();const it=Object.values(S.vocabulary);const now=new Date();return{total:it.length,unknown:it.filter(v=>v.level==='unknown').length,recognized:it.filter(v=>v.level==='recognized').length,learned:it.filter(v=>v.level==='learned').length,dueToday:Object.keys(S.flashcards).filter(k=>{const v=S.vocabulary[k];if(!v||v.level==='learned')return false;const f=S.flashcards[k];return!f.nextReview||new Date(f.nextReview)<=now}).length,allCards:Object.keys(S.flashcards).filter(k=>{const v=S.vocabulary[k];return v&&v.level!=='learned'}).length}}

export function getComprehension(textId){const text=S.texts[textId]||'';const meta=S.library.find(t=>t.id===textId);const lang=meta?.language||'en';const words=text.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüçñß\s'-]/g,'').split(/\s+/).filter(w=>w.length>1);if(!words.length)return{known:0,total:0,pct:0};const unique=new Set(words);let known=0;for(const w of unique){const k=lang+':'+w;if(S.vocabulary[k]&&(S.vocabulary[k].level==='recognized'||S.vocabulary[k].level==='learned'))known++}return{known,total:unique.size,pct:unique.size?Math.round(known/unique.size*100):0}}

export function getWeeklyData(){const weeks=[];const now=new Date();for(let i=6;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const ds=d.toISOString().slice(0,10);const added=Object.values(S.vocabulary).filter(v=>v.dateAdded?.slice(0,10)===ds).length;const learned=Object.values(S.vocabulary).filter(v=>v.dateModified?.slice(0,10)===ds&&v.level==='learned').length;weeks.push({date:ds,day:['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()],added,learned})}return weeks}

export function addTag(vocKey,tag){if(!tag.trim())return;const v=S.vocabulary[vocKey];if(!v)return;if(!v.tags)v.tags=[];const t=tag.trim().toLowerCase();if(!v.tags.includes(t)){v.tags.push(t);saveVoc()}setState({showTagModal:null,tagInput:''})}
export function removeTag(vocKey,tag){const v=S.vocabulary[vocKey];if(!v||!v.tags)return;v.tags=v.tags.filter(t=>t!==tag);saveVoc();render()}

export function getAllTags(){const tags=new Set();for(const v of Object.values(S.vocabulary)){if(v.tags)v.tags.forEach(t=>tags.add(t))}return[...tags].sort()}

export function addDefinition(vocKey,text){const v=S.vocabulary[vocKey];if(!v||!text||!text.trim())return;if(!v.definitions)v.definitions=[];v.definitions.push(text.trim());v.dateModified=new Date().toISOString();saveVoc();setState({addingDefFor:null})}
export function removeDefinition(vocKey,idx){const v=S.vocabulary[vocKey];if(!v||!v.definitions)return;v.definitions.splice(idx,1);v.dateModified=new Date().toISOString();saveVoc();render()}
export function addIrregular(vocKey,text){const v=S.vocabulary[vocKey];if(!v||!text||!text.trim())return;if(!v.irregularForms)v.irregularForms=[];const t=text.trim();if(!v.irregularForms.includes(t))v.irregularForms.push(t);v.dateModified=new Date().toISOString();saveVoc();setState({addingIrrFor:null})}
export function removeIrregular(vocKey,val){const v=S.vocabulary[vocKey];if(!v||!v.irregularForms)return;v.irregularForms=v.irregularForms.filter(f=>f!==val);v.dateModified=new Date().toISOString();saveVoc();render()}
