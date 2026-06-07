// js/utils.js
import {FP, LANGS, LEVELS, LANG_VOICE} from './config.js';
import {S, showToast} from './state.js';

export function sm2(c,q){let{easeFactor:e=2.5,interval:i=0,repetitions:r=0}=c;if(q>=3){if(r===0)i=1;else if(r===1)i=6;else i=Math.round(i*e);r++}else{r=0;i=1}e=Math.max(1.3,e+(0.1-(5-q)*(0.08+(5-q)*0.02)));const n=new Date;n.setDate(n.getDate()+i);return{easeFactor:e,interval:i,repetitions:r,nextReview:n.toISOString()}}

export function detectLang(t){const w=t.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüçñß\s'-]/g,"").split(/\s+/).filter(x=>x.length>0);if(w.length<10)return"en";const s=w.slice(0,500),sc={};for(const[l,f]of Object.entries(FP)){const st=new Set(f);sc[l]=s.filter(x=>st.has(x)).length}const b=Object.entries(sc).sort((a,b)=>b[1]-a[1]);return b[0][1]===0?"en":b[0][0]}

export async function extractPdf(file){pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const b=await file.arrayBuffer(),p=await pdfjsLib.getDocument({data:b}).promise;let t='';for(let i=1;i<=p.numPages;i++){const pg=await p.getPage(i),c=await pg.getTextContent();t+=c.items.map(x=>x.str).join(' ')+'\n\n'}return t.trim()}

export function speak(text,lang){if(!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=LANG_VOICE[lang]||'en-US';u.rate=0.85;speechSynthesis.speak(u)}

export function exportCSV(){const rows=[['Palabra','Idioma','Nivel','Traducción','Nota','Etiquetas','Texto origen','Fecha']];for(const[k,v]of Object.entries(S.vocabulary)){const src=S.library.find(t=>t.id===v.sourceTextId);rows.push([v.word,LANGS[v.language]||v.language,LEVELS[v.level]?.label||v.level,v.translation||'',v.note||'',(v.tags||[]).join('; '),src?.title||'',v.dateAdded||''])}
const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='vocabulario-linguareader.csv';a.click();URL.revokeObjectURL(url);showToast('Vocabulario exportado a CSV')}

export function todayStr(){return new Date().toISOString().slice(0,10)}
export function getStreak(history){if(!history||!history.length)return 0;const sorted=[...new Set(history)].sort().reverse();let streak=0;const today=new Date();today.setHours(0,0,0,0);for(let i=0;i<sorted.length;i++){const d=new Date(sorted[i]);d.setHours(0,0,0,0);const diff=Math.round((today-d)/(86400000));if(diff===i)streak++;else break}return streak}
