// js/readaloud.js — lectura en voz alta (read-along) frase por frase
import {S} from './state.js';
import {LANG_VOICE, I} from './config.js';
import {savePositions} from './db.js';

let raPlaying=false, raIdx=0, raRate=1, raGen=0, raTextId=null;
const RATES=[1,1.25,1.5,0.75];

export function readRateLabel(){return raRate+'×'}

function sentEls(){const ra=document.getElementById('reader-area');return ra?Array.from(ra.querySelectorAll('.ra-sent')):[]}
function clearHi(els){for(const e of els)e.classList.remove('ra-active')}
function setToggleIcon(){const b=document.getElementById('ra-toggle');if(b)b.innerHTML=raPlaying?I.pause:I.play}
// La posición se guarda por texto (persistida) y es la ÚNICA fuente de verdad para continuar.
function persistPos(){if(raTextId!=null){S.audioPositions[raTextId]=raIdx;savePositions()}}

function speakCurrent(){
  if(!window.speechSynthesis)return;
  const els=sentEls();
  if(raIdx>=els.length){stopReadAloud();return}
  clearHi(els);
  const el=els[raIdx];
  el.classList.add('ra-active');
  el.scrollIntoView({block:'center',behavior:'smooth'});
  persistPos();
  const meta=S.library.find(t=>t.id===S.currentTextId);
  const lang=meta?.language||'en';
  const u=new SpeechSynthesisUtterance(el.textContent.trim());
  u.lang=LANG_VOICE[lang]||'en-US';
  u.rate=raRate;
  const myGen=++raGen;
  u.onend=()=>{if(!raPlaying||myGen!==raGen)return;raIdx++;speakCurrent()};
  window.speechSynthesis.speak(u);
}

export function toggleReadAloud(){
  if(!window.speechSynthesis)return;
  if(raPlaying){raPlaying=false;raGen++;window.speechSynthesis.cancel();persistPos();setToggleIcon();return}
  const els=sentEls();
  if(!els.length)return;
  if(raIdx>=els.length)raIdx=0;
  raPlaying=true;setToggleIcon();
  window.speechSynthesis.cancel();
  speakCurrent();
}

// Empezar a leer desde una frase concreta (botón "Leer desde aquí" del popup de palabra).
// Cierra el popup SIN re-render para no cancelar el audio ni perder el gesto del clic.
export function startReadAloudAt(si){
  if(!window.speechSynthesis)return;
  S.popup=null;
  const ov=document.querySelector('.overlay');if(ov)ov.remove();
  raIdx=si;raPlaying=true;persistPos();setToggleIcon();
  window.speechSynthesis.cancel();
  speakCurrent();
}

export function stopReadAloud(){
  raPlaying=false;raIdx=0;raGen++;
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  clearHi(sentEls());setToggleIcon();persistPos();
}

export function cycleReadRate(){
  raRate=RATES[(RATES.indexOf(raRate)+1)%RATES.length];
  const b=document.getElementById('ra-rate');if(b)b.textContent=raRate+'×';
  if(raPlaying){raGen++;window.speechSynthesis.cancel();speakCurrent();}
}

// Se llama en cada render(): corta el audio (el DOM del lector se reconstruye) y restaura raIdx
// desde la posición guardada del texto actual. Así "continuar" es a prueba de balas entre renders.
export function resetReadAloud(){
  raPlaying=false;raGen++;
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  raTextId=S.currentTextId;
  raIdx=(raTextId!=null&&S.audioPositions&&S.audioPositions[raTextId]!=null)?S.audioPositions[raTextId]:0;
}
