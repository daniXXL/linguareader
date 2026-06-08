// js/utils.js
import {FP, LANGS, LEVELS, LANG_VOICE} from './config.js';
import {S, showToast} from './state.js';

// Programación estilo Anki. Cartas en aprendizaje (repetitions<2) usan pasos cortos en minutos;
// al graduarse pasan a la fase de repaso multiplicativa. El intervalo (i) está en días (puede ser
// fracción para los pasos en minutos). Garantiza orden: No la sé ≤ Difícil ≤ Regular ≤ Fácil.
export function sm2(c,q){
  const MIN=1/1440;
  let{easeFactor:e=2.5,interval:i=0,repetitions:r=0}=c;
  if(q===0){                       // No la sé → relearning: vuelve enseguida (en la sesión)
    i=MIN;r=0;e=Math.max(1.3,e-0.2);
  }else if(r<2){                    // Aprendizaje: pasos cortos, solo "Fácil" gradúa a días
    if(q===2){i=(r===0?5:10)*MIN;e=Math.max(1.3,e-0.15);}       // Difícil: 5-10 min (no gradúa)
    else if(q===3){if(r===0){i=10*MIN;r=1;}else{i=1;r=2;}}      // Regular: 10 min → gradúa a 1 día
    else{i=(r===0?1:4);r=2;e=e+0.15;}                           // Fácil: gradúa (1 día, o 4)
  }else{                            // Repaso: i siempre crece; 1.2 ≤ ease ≤ ease·1.3
    if(q===2){i=Math.round(i*1.2);e=Math.max(1.3,e-0.15);}
    else if(q===5){i=Math.round(i*e*1.3);e=e+0.15;}
    else{i=Math.round(i*e);}
    r++;
  }
  const n=new Date;n.setTime(n.getTime()+i*86400000);
  return{easeFactor:e,interval:i,repetitions:r,nextReview:n.toISOString()};
}

export function fmtDays(d){if(d<1){const m=Math.round(d*1440);if(m<1)return'<1 min';if(m<60)return m+' min';return Math.round(d*24)+' h'}const dd=Math.round(d);if(dd<=1)return'1 día';if(dd<30)return dd+' días';if(dd<365){const m=Math.round(dd/30);return'~'+m+(m===1?' mes':' meses')}const y=Math.round(dd/365);return'~'+y+(y===1?' año':' años')}

export function detectLang(t){const w=t.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüçñß\s'-]/g,"").split(/\s+/).filter(x=>x.length>0);if(w.length<10)return"en";const s=w.slice(0,500),sc={};for(const[l,f]of Object.entries(FP)){const st=new Set(f);sc[l]=s.filter(x=>st.has(x)).length}const b=Object.entries(sc).sort((a,b)=>b[1]-a[1]);return b[0][1]===0?"en":b[0][0]}

export async function extractPdf(file){pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const b=await file.arrayBuffer(),p=await pdfjsLib.getDocument({data:b}).promise;let t='';for(let i=1;i<=p.numPages;i++){const pg=await p.getPage(i),c=await pg.getTextContent();t+=c.items.map(x=>x.str).join(' ')+'\n\n'}return t.trim()}

export function speak(text,lang){if(!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=LANG_VOICE[lang]||'en-US';u.rate=0.85;speechSynthesis.speak(u)}

export function exportCSV(){const rows=[['Palabra','Idioma','Nivel','Traducción','Nota','Etiquetas','Texto origen','Fecha']];for(const[k,v]of Object.entries(S.vocabulary)){const src=S.library.find(t=>t.id===v.sourceTextId);rows.push([v.word,LANGS[v.language]||v.language,LEVELS[v.level]?.label||v.level,v.translation||'',v.note||'',(v.tags||[]).join('; '),src?.title||'',v.dateAdded||''])}
const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='vocabulario-linguareader.csv';a.click();URL.revokeObjectURL(url);showToast('Vocabulario exportado a CSV')}

export function todayStr(){return new Date().toISOString().slice(0,10)}
export function getStreak(history){if(!history||!history.length)return 0;const sorted=[...new Set(history)].sort().reverse();let streak=0;const today=new Date();today.setHours(0,0,0,0);for(let i=0;i<sorted.length;i++){const d=new Date(sorted[i]);d.setHours(0,0,0,0);const diff=Math.round((today-d)/(86400000));if(diff===i)streak++;else break}return streak}

export function escapeHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])}

export function cleanDefs(translation,definition){const t=(translation==null?'':String(translation)).trim();const d=(definition==null?'':String(definition)).trim();if(!t&&!d)return[];if(!t)return[d];if(!d)return[t];const da=s=>s.toLowerCase().replace(/[áàâäã]/g,'a').replace(/[éèêë]/g,'e').replace(/[íìîï]/g,'i').replace(/[óòôöõ]/g,'o').replace(/[úùûü]/g,'u').replace(/ñ/g,'n').replace(/ç/g,'c');const nt=da(t),nd=da(d);if(nd===nt)return[t];if(nd.startsWith(nt)){const after=d.slice(t.length).replace(/^[\s—–\-:;,]+/,'').trim();if(!after)return[t];const na=da(after);if(na===nt||na.startsWith(nt)||nt.startsWith(na))return[after.length>=t.length?after:t];return[t,after]}if(nt.startsWith(nd))return[t];return[t,d]}
