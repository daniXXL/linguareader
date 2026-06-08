// js/app.js
import {auth} from './config.js';
import {S, setState} from './state.js';
import {render} from './views.js';
import {loadAll, saveVoc, saveFc, saveLib} from './db.js';
import {speak, exportCSV} from './utils.js';
import {handleTranslate, translateVocabWord} from './translate.js';
import {doLogout} from './auth.js';
import {handleFile, addText, deleteText, setTextLang, saveWord, startFc, answerFc, addTag, removeTag, saveReadPos, addDefinition, removeDefinition, addIrregular, removeIrregular} from './actions.js';
import {toggleReadAloud, stopReadAloud, cycleReadRate} from './readaloud.js';

// Exponer a window lo que usan los onclick/onchange/oninput en línea del HTML generado
Object.assign(window, {
  S, setState, render,
  doLogout,
  handleFile, addText, deleteText, setTextLang,
  handleTranslate, translateVocabWord, saveWord,
  startFc, answerFc,
  exportCSV, speak, addTag, removeTag,
  saveVoc, saveFc, saveLib,
  saveReadPos,
  addDefinition, removeDefinition,
  addIrregular, removeIrregular,
  toggleReadAloud, stopReadAloud, cycleReadRate
});

// Arranque (idéntico a la línea 173 del original)
auth.onAuthStateChanged(async u=>{if(u){S.user=u;S.loading=true;render();await loadAll();document.body.classList.toggle('dark',S.darkMode);S.loading=false;render()}else{S.user=null;S.loading=false;render()}});

render();
