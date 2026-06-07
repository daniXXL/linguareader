# Fase 1 — Refactor a módulos JS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar el único `index.html` de LinguaReader en módulos JS por responsabilidad, **sin cambiar ningún comportamiento**, dejando la base lista para las fases siguientes.

**Architecture:** La app sigue siendo 100% estática (sin build). El CSS sale a `css/styles.css`. El JS se reparte en módulos ES (`js/*.js`). Un único módulo de entrada `js/app.js` importa el resto, expone al objeto `window` el estado y las funciones que usan los manejadores `onclick` en línea (para no romperlos), y arranca la app. Los scripts CDN (Firebase compat, pdf.js) se mantienen como `<script>` clásicos previos, exponiendo `firebase` y `pdfjsLib` como globales que los módulos consumen.

**Tech Stack:** HTML/CSS/JS vanilla, módulos ES nativos (`<script type="module">`), Firebase compat SDK (global), pdf.js (global). Sin Node, sin bundler.

**Estrategia de prueba:** No hay framework de tests y la app es estática por decisión de diseño. La verificación es **manual** mediante la checklist al final (equivalente a las pruebas de aceptación). Cada cambio estructural se valida abriendo la app y comprobando que el comportamiento es idéntico al de antes.

**Prerrequisito de ejecución:** servir la carpeta por HTTP (los módulos ES no cargan con `file://`). Comando recomendado durante el desarrollo: `python -m http.server 8000` desde la raíz del repo, y abrir `http://localhost:8000`.

---

## Mapa de archivos (qué vive dónde)

Origen: todo está hoy en `index.html` (369 líneas). Se reparte así:

| Archivo nuevo | Responsabilidad | Procede de (líneas de index.html) |
|---|---|---|
| `css/styles.css` | Todos los estilos | `<style>` 17–68 |
| `js/config.js` | Init Firebase + constantes + iconos | 79–123, 126 |
| `js/state.js` | Estado `S`, `setState`, `showToast` | 168, 170–171 |
| `js/db.js` | Firestore: helpers, guardado, carga | 145–165 |
| `js/utils.js` | sm2, detectLang, getStreak, todayStr, extractPdf, speak, exportCSV | 125, 127, 133, 135, 137–142 |
| `js/translate.js` | translateText, handleTranslate, translateVocabWord | 129–131, 189, 191 |
| `js/auth.js` | doLogin, doRegister, doResetPassword, doLogout | 175–178 |
| `js/actions.js` | Acciones de dominio: handleFile, addText, deleteText, setTextLang, saveWord, recordStudy, startFc, answerFc, addTag, removeTag, wordStyle, save/restoreReadPos, getStats, getComprehension, getWeeklyData, getAllTags, cleanOrphanedFlashcards | 180–220 |
| `js/views.js` | `render()` + `handleRI()` y todo el HTML/eventos | 222–365 |
| `js/app.js` | Imports, exposición de globals a `window`, `onAuthStateChanged`, arranque | 173 + glue nuevo |
| `index.html` | HTML base + carga de scripts | reemplazo de 1–16, 69–72, 366–369 |

> **Nota sobre `js/auth.js` y `js/actions.js`:** el spec listaba la agrupación a grandes rasgos; aquí se separan `auth` y `actions` de `app.js`/`views.js` para que cada archivo tenga una sola responsabilidad y sea más fácil de sostener. No cambia el comportamiento.

### Identificadores que DEBEN exponerse en `window` (usados por manejadores en línea)

Derivado de los atributos `onclick`/`onchange`/`oninput`/`onmouseenter` del HTML actual. Si alguno falta en `window`, esos clics dejarán de funcionar:

```
S, setState, render, showToast,
doLogout,
handleFile, addText, deleteText, setTextLang,
handleTranslate, translateVocabWord, saveWord,
startFc, answerFc,
exportCSV, speak, addTag, removeTag,
saveVoc, saveFc, saveLib
```

(`doLogin`, `doRegister`, `doResetPassword` NO necesitan estar en `window`: se invocan desde `addEventListener` dentro de `render()`, que vive en `views.js` y los importa directamente.)

---

## Task 0: Salvaguarda — copia de referencia del original

**Files:**
- Create: `index.original.html` (copia intacta para comparar comportamiento)

- [ ] **Step 1: Duplicar el archivo actual como referencia**

```bash
cp index.html index.original.html
```

El objetivo: `index.original.html` queda versionado como referencia exacta del comportamiento original, e `index.html` sigue existiendo para irlo vaciando durante el refactor. (Al terminar la Fase 1, `index.original.html` se borra en la Task 12.)

- [ ] **Step 2: Verificar que ambos archivos existen e son idénticos**

Run: `diff index.html index.original.html`
Expected: sin salida (son idénticos).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: copia de trabajo index.html para refactor a modulos"
```

---

## Task 1: Extraer el CSS a `css/styles.css`

**Files:**
- Create: `css/styles.css`
- Modify: `index.html` (quitar el bloque `<style>`, añadir `<link>`)

- [ ] **Step 1: Crear `css/styles.css` con el contenido del `<style>`**

Copiar EXACTAMENTE el contenido entre `<style>` y `</style>` de `index.original.html` (líneas 17–68: el bloque `:root{...}` hasta `.font-ctrl button:hover{...}`) a `css/styles.css`. No modificar ninguna regla.

- [ ] **Step 2: En `index.html`, reemplazar el bloque `<style>...</style>` por un link**

Borrar las líneas del `<style>` … `</style>` y en su lugar, dentro de `<head>`, dejar:

```html
<link rel="stylesheet" href="css/styles.css">
```

- [ ] **Step 3: Verificación manual**

Run: `python -m http.server 8000` y abrir `http://localhost:8000`
Expected: la pantalla de login se ve EXACTAMENTE igual que antes (colores, fuentes, tarjeta centrada). Si se ve sin estilos, revisar la ruta del `<link>`.

- [ ] **Step 4: Commit**

```bash
git add css/styles.css index.html
git commit -m "refactor: extraer estilos a css/styles.css"
```

---

## Task 2: Crear `js/config.js` (Firebase + constantes + iconos)

**Files:**
- Create: `js/config.js`

- [ ] **Step 1: Crear `js/config.js`**

Mover desde `index.original.html` las líneas 79–94 (firebaseConfig, init, `LANGS`, `LANG_VOICE`, `LEVELS`, `SM2Q`, `SM2L`, `SM2C`), la línea 126 (`FP`) y el objeto de iconos `I` (líneas 97–123). Añadir `export` a cada constante. El init de Firebase usa el global `firebase` (cargado por los scripts CDN antes del módulo). Estructura:

```js
// js/config.js
const firebaseConfig = {
  apiKey: "AIzaSyCZvqnmqwXspXvPVTqXPyAq-d0EXNORYz0",
  authDomain: "linguareader-7d9a3.firebaseapp.com",
  projectId: "linguareader-7d9a3",
  storageBucket: "linguareader-7d9a3.firebasestorage.app",
  messagingSenderId: "629931589943",
  appId: "1:629931589943:web:1836dc4eff63a8ab5c1ab2"
};
firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = firebase.firestore();
db.enablePersistence({synchronizeTabs:true}).catch(()=>{});

export const LANGS = {en:"Inglés",pt:"Portugués",fr:"Francés",de:"Alemán"};
export const LANG_VOICE = {en:"en-US",pt:"pt-BR",fr:"fr-FR",de:"de-DE"};
export const LEVELS = {unknown:{label:"Desconocida",color:"#E8847C",bg:"#FDE8E5"},recognized:{label:"Reconozco",color:"#D4960A",bg:"#FEF3D1"},learned:{label:"Aprendida",color:"#4D8B52",bg:"#E2F0E3"}};
export const SM2Q = {again:0,hard:2,good:3,easy:5};
export const SM2L = {again:"No la sé",hard:"Difícil",good:"Regular",easy:"Fácil"};
export const SM2C = {again:"#E8847C",hard:"#D4960A",good:"#5B9BD5",easy:"#4D8B52"};
export const FP = {en:["the","and","is","in","to","of","a","that","it","for","was","on","are","with"],pt:["de","que","e","o","a","do","da","em","um","para","é","com","não","uma"],fr:["de","la","le","et","les","des","en","un","une","du","est","que","qui","dans"],de:["der","die","und","in","den","von","zu","das","mit","sich","des","auf","für","ist"]};

export const I = {
  // ... pegar AQUÍ el objeto de iconos completo de las líneas 97–123, tal cual ...
};
```

> Importante: el objeto `I` es largo; copiarlo íntegro desde el original sin alterar ningún SVG.

- [ ] **Step 2: Verificación de sintaxis**

Run: `node --check js/config.js` (si hay Node) — o abrir el archivo y confirmar visualmente que no quedó código sin `export` y que las llaves cierran.
Expected: sin errores de sintaxis. (Si no hay Node, la verificación real ocurre en la Task 9 al cargar la app.)

- [ ] **Step 3: Commit**

```bash
git add js/config.js
git commit -m "refactor: crear js/config.js (firebase, constantes, iconos)"
```

---

## Task 3: Crear `js/state.js` (estado y render trigger)

**Files:**
- Create: `js/state.js`

- [ ] **Step 1: Crear `js/state.js`**

Mover el objeto de estado `S` (línea 168), `setState` y `showToast` (líneas 170–171). `setState`/`showToast` llaman a `render()` (que vivirá en `views.js`) y `setState` llama a `savePrefs()` (en `db.js`): importarlos. Mantener el cuerpo idéntico.

```js
// js/state.js
import {render} from './views.js';
import {savePrefs} from './db.js';

export let S = {authView:'login',user:null,authError:'',authLoading:false,view:'library',library:[],texts:{},vocabulary:{},flashcards:{},cache:{},currentTextId:null,popup:null,translating:false,flashcardDeck:[],fcIndex:0,fcFlipped:false,searchTerm:'',vocabFilter:'all',vocabLangFilter:'all',editingNote:null,noteText:'',editingWord:null,wordText:'',editingTranslation:null,translationText:'',fcMode:'due',fcLangFilter:'all',confirmAction:null,toast:null,loading:true,darkMode:false,fontSize:17,showPasteModal:false,pasteText:'',pasteLang:'en',pasteTitle:'',streakHistory:[],showTagModal:null,tagInput:'',vocabGroupBy:'none',readingPositions:{},selectMode:false};

export function setState(u){Object.assign(S,u);if(u.darkMode!==undefined){document.body.classList.toggle('dark',S.darkMode);savePrefs()}render()}
export function showToast(m,t='success'){S.toast={message:m,type:t};render();setTimeout(()=>{S.toast=null;render()},3000)}
```

> La dependencia circular `state.js ⇄ views.js` es válida con módulos ES porque `render` se llama en tiempo de ejecución (no durante la evaluación del módulo).

- [ ] **Step 2: Commit**

```bash
git add js/state.js
git commit -m "refactor: crear js/state.js (estado S, setState, showToast)"
```

---

## Task 4: Crear `js/db.js` (Firestore)

**Files:**
- Create: `js/db.js`

- [ ] **Step 1: Crear `js/db.js`**

Mover las líneas 145–165 (helpers de Firestore). Necesita `auth`, `db` de `config.js` y `S` de `state.js`. Añadir `export` a las funciones que otros módulos usan: `dbSave`, `saveLib`, `saveVoc`, `saveFc`, `saveCa`, `savePrefs`, `saveStreak`, `savePositions`, `saveTxt`, `delTxt`, `loadAll`, `userDoc`, `textsCol`. Cuerpos idénticos.

```js
// js/db.js
import {auth, db} from './config.js';
import {S} from './state.js';

export function userDoc(p){return db.collection('users').doc(auth.currentUser.uid).collection('data').doc(p)}
export function textsCol(){return db.collection('users').doc(auth.currentUser.uid).collection('texts')}
let saveT={};
export function dbSave(k,d,merge){clearTimeout(saveT[k]);saveT[k]=setTimeout(()=>{userDoc(k).set(d,merge?{merge:true}:{}).catch(e=>console.error('DB:',e))},500)}
export function saveLib(){dbSave('library',{items:S.library})}
export function saveVoc(){dbSave('vocabulary',{entries:S.vocabulary},false)}
export function saveFc(){dbSave('flashcards',{entries:S.flashcards},false)}
export function saveCa(){dbSave('cache',{entries:S.cache},true)}
export function savePrefs(){dbSave('prefs',{darkMode:S.darkMode,fontSize:S.fontSize},true)}
export function saveStreak(){dbSave('streak',{history:S.streakHistory},true)}
export function savePositions(){dbSave('positions',{entries:S.readingPositions},true)}
export async function saveTxt(id,text){await textsCol().doc(id).set({content:text})}
export async function delTxt(id){await textsCol().doc(id).delete().catch(()=>{})}

export async function loadAll(){try{const[lib,voc,fc,ca,prefs,strk,pos]=await Promise.all([userDoc('library').get(),userDoc('vocabulary').get(),userDoc('flashcards').get(),userDoc('cache').get(),userDoc('prefs').get(),userDoc('streak').get(),userDoc('positions').get()]);
S.library=lib.exists?lib.data().items||[]:[];S.vocabulary=voc.exists?voc.data().entries||{}:{};S.flashcards=fc.exists?fc.data().entries||{}:{};S.cache=ca.exists?ca.data().entries||{}:{};
if(prefs.exists){S.darkMode=prefs.data().darkMode||false;S.fontSize=prefs.data().fontSize||17}
if(strk.exists)S.streakHistory=strk.data().history||[];
if(pos.exists)S.readingPositions=pos.data().entries||{};
S.texts={};const ts=await textsCol().get();ts.forEach(d=>{S.texts[d.id]=d.data().content});
const b=S.library.length;S.library=S.library.filter(i=>S.texts[i.id]);if(S.library.length<b)saveLib()}catch(e){console.error('Load:',e)}}
```

- [ ] **Step 2: Commit**

```bash
git add js/db.js
git commit -m "refactor: crear js/db.js (helpers de Firestore)"
```

---

## Task 5: Crear `js/utils.js` (lógica pura + voz + PDF + CSV)

**Files:**
- Create: `js/utils.js`

- [ ] **Step 1: Crear `js/utils.js`**

Mover: `sm2` (125), `detectLang` (127), `extractPdf` (133), `speak` (135), `exportCSV` (137–139), `todayStr` y `getStreak` (141–142). Dependencias: `FP` de config (detectLang), `LANGS`/`LEVELS` de config y `S`/`showToast` (exportCSV usa `S`, `LANGS`, `LEVELS`, `showToast`), `LANG_VOICE` de config (speak), `pdfjsLib` global (extractPdf). Añadir `export` a todas. Cuerpos idénticos.

```js
// js/utils.js
import {FP, LANGS, LEVELS, LANG_VOICE} from './config.js';
import {S, showToast} from './state.js';

export function sm2(c,q){let{easeFactor:e=2.5,interval:i=0,repetitions:r=0}=c;if(q>=3){if(r===0)i=1;else if(r===1)i=6;else i=Math.round(i*e);r++}else{r=0;i=1}e=Math.max(1.3,e+(0.1-(5-q)*(0.08+(5-q)*0.02)));const n=new Date;n.setDate(n.getDate()+i);return{easeFactor:e,interval:i,repetitions:r,nextReview:n.toISOString()}}

export function detectLang(t){const w=t.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüçñß\s'-]/g,"").split(/\s+/).filter(x=>x.length>0);if(w.length<10)return"en";const s=w.slice(0,500),sc={};for(const[l,f]of Object.entries(FP)){const st=new Set(f);sc[l]=s.filter(x=>st.has(x)).length}const b=Object.entries(sc).sort((a,b)=>b[1]-a[1]);return b[0][1]===0?"en":b[0][0]}

export async function extractPdf(file){pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const b=await file.arrayBuffer(),p=await pdfjsLib.getDocument({data:b}).promise;let t='';for(let i=1;i<=p.numPages;i++){const pg=await p.getPage(i),c=await pg.getTextContent();t+=c.items.map(x=>x.str).join(' ')+'\n\n'}return t.trim()}

export function speak(text,lang){if(!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=LANG_VOICE[lang]||'en-US';u.rate=0.85;speechSynthesis.speak(u)}

export function exportCSV(){const rows=[['Palabra','Idioma','Nivel','Traducción','Nota','Etiquetas','Texto origen','Fecha']];for(const[k,v]of Object.entries(S.vocabulary)){const src=S.library.find(t=>t.id===v.sourceTextId);rows.push([v.word,LANGS[v.language]||v.language,LEVELS[v.level]?.label||v.level,v.translation||'',v.note||'',(v.tags||[]).join('; '),src?.title||'',v.dateAdded||''])}
const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='vocabulario-linguareader.csv';a.click();URL.revokeObjectURL(url);showToast('Vocabulario exportado a CSV')}

export function todayStr(){return new Date().toISOString().slice(0,10)}
export function getStreak(history){if(!history||!history.length)return 0;const sorted=[...new Set(history)].sort().reverse();let streak=0;const today=new Date();today.setHours(0,0,0,0);for(let i=0;i<sorted.length;i++){const d=new Date(sorted[i]);d.setHours(0,0,0,0);const diff=Math.round((today-d)/(86400000));if(diff===i)streak++;else break}return streak}
```

- [ ] **Step 2: Commit**

```bash
git add js/utils.js
git commit -m "refactor: crear js/utils.js (sm2, detectLang, speak, extractPdf, exportCSV, streak)"
```

---

## Task 6: Crear `js/translate.js`

**Files:**
- Create: `js/translate.js`

- [ ] **Step 1: Crear `js/translate.js`**

Mover `translateText` (129–131), `handleTranslate` (189) y `translateVocabWord` (191). Dependencias: `S`, `setState` de state; `saveCa`, `saveVoc` de db. Añadir `export`. Cuerpos idénticos.

```js
// js/translate.js
import {S, setState} from './state.js';
import {saveCa, saveVoc} from './db.js';

export async function translateText(text,srcL,cache){const key=srcL+':'+text.toLowerCase().trim();if(cache[key])return{...cache[key],fromCache:true};const r={translation:"",definition:"",example:"",exampleTranslation:"",fromCache:false};try{const res=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcL}|es`);const d=await res.json();if(d.responseData?.translatedText)r.translation=d.responseData.translatedText;if(d.matches?.length>1){const a=d.matches.find(m=>m.translation!==r.translation&&m.quality&&parseInt(m.quality)>50);if(a)r.definition='También: '+a.translation}}catch{r.translation="Error al traducir"}
if(srcL==="en"){try{const c=text.trim().toLowerCase().replace(/[^a-z'-]/g,"");if(c&&!c.includes(" ")){const dr=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(c)}`);if(dr.ok){const dd=await dr.json(),m=dd?.[0]?.meanings?.[0],d=m?.definitions?.[0];if(d?.definition){try{const tr=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(d.definition)}&langpair=en|es`);r.definition=(await tr.json()).responseData?.translatedText||d.definition}catch{r.definition=d.definition}}if(d?.example){r.example=d.example;try{const er=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(d.example)}&langpair=en|es`);r.exampleTranslation=(await er.json()).responseData?.translatedText||""}catch{}}}}}catch{}}
cache[key]={translation:r.translation,definition:r.definition,example:r.example,exampleTranslation:r.exampleTranslation};return r}

export async function handleTranslate(t){const m=S.library.find(x=>x.id===S.currentTextId);setState({translating:true});const r=await translateText(t,m?.language||'en',S.cache);saveCa();S.popup={...S.popup,translation:r,fromCache:r.fromCache};setState({translating:false})}

export async function translateVocabWord(vocKey){const v=S.vocabulary[vocKey];if(!v)return;setState({translating:vocKey});const r=await translateText(v.word,v.language,S.cache);saveCa();v.translation=r.translation||v.translation;if(r.definition&&!v.note)v.note=r.definition;if(r.example&&!v.example)v.example=r.example;if(r.exampleTranslation&&!v.exampleTranslation)v.exampleTranslation=r.exampleTranslation;v.dateModified=new Date().toISOString();saveVoc();setState({translating:false})}
```

- [ ] **Step 2: Commit**

```bash
git add js/translate.js
git commit -m "refactor: crear js/translate.js"
```

---

## Task 7: Crear `js/auth.js`

**Files:**
- Create: `js/auth.js`

- [ ] **Step 1: Crear `js/auth.js`**

Mover `doRegister`, `doLogin`, `doResetPassword`, `doLogout` (175–178). Dependencias: `auth` de config; `setState`, `S`, `showToast` de state; `userDoc` de db. Añadir `export`. Cuerpos idénticos.

```js
// js/auth.js
import {auth} from './config.js';
import {S, setState, showToast} from './state.js';
import {userDoc} from './db.js';

export async function doRegister(e,p,n){setState({authLoading:true,authError:''});try{const c=await auth.createUserWithEmailAndPassword(e,p);await c.user.updateProfile({displayName:n});await userDoc('profile').set({name:n,email:e})}catch(e){const m={'auth/email-already-in-use':'Email ya registrado','auth/weak-password':'Mínimo 6 caracteres','auth/invalid-email':'Email inválido'};setState({authError:m[e.code]||e.message,authLoading:false})}}
export async function doLogin(e,p){setState({authLoading:true,authError:''});try{await auth.signInWithEmailAndPassword(e,p)}catch(e){const m={'auth/user-not-found':'No existe cuenta','auth/wrong-password':'Contraseña incorrecta','auth/invalid-email':'Email inválido','auth/invalid-credential':'Email o contraseña incorrectos'};setState({authError:m[e.code]||e.message,authLoading:false})}}
export async function doResetPassword(email){if(!email||!email.trim()){setState({authError:'Escribe tu email primero'});return}setState({authLoading:true,authError:''});try{await auth.sendPasswordResetEmail(email.trim());setState({authLoading:false,authError:''});showToast('Se envió un enlace de recuperación a '+email.trim())}catch(e){const m={'auth/user-not-found':'No existe cuenta con ese email','auth/invalid-email':'Email inválido'};setState({authError:m[e.code]||e.message,authLoading:false})}}
export function doLogout(){auth.signOut();Object.assign(S,{view:'library',library:[],texts:{},vocabulary:{},flashcards:{},cache:{},currentTextId:null,popup:null})}
```

- [ ] **Step 2: Commit**

```bash
git add js/auth.js
git commit -m "refactor: crear js/auth.js"
```

---

## Task 8: Crear `js/actions.js` (acciones de dominio + selectores)

**Files:**
- Create: `js/actions.js`

- [ ] **Step 1: Crear `js/actions.js`**

Mover las líneas 180–220: `handleFile`, `addText`, `deleteText`, `setTextLang`, `saveWord`, `recordStudy`, `startFc`, `answerFc`, `wordStyle`, `saveReadPos`, `restoreReadPos`, `cleanOrphanedFlashcards`, `getStats`, `getComprehension`, `getWeeklyData`, `addTag`, `removeTag`, `getAllTags`. (NO mover `translateVocabWord` ni `handleTranslate`: ya están en `translate.js`.)

Dependencias a importar:
- de `config.js`: `LANGS`, `LEVELS`
- de `state.js`: `S`, `setState`, `showToast`
- de `db.js`: `saveLib`, `saveVoc`, `saveFc`, `saveStreak`, `savePositions`, `saveTxt`, `delTxt`
- de `utils.js`: `sm2`, `detectLang`, `extractPdf`, `todayStr`
- de `views.js`: `render` (lo usan `setTextLang`, `removeTag`)

Añadir `export` a todas. Copiar los cuerpos EXACTOS desde `index.original.html` (líneas 180–220). Bloque de imports a poner al inicio:

```js
// js/actions.js
import {LANGS, LEVELS} from './config.js';
import {S, setState, showToast} from './state.js';
import {saveLib, saveVoc, saveFc, saveStreak, savePositions, saveTxt, delTxt} from './db.js';
import {sm2, detectLang, extractPdf, todayStr} from './utils.js';
import {render} from './views.js';
```

A continuación, pegar las funciones 180–220 tal cual, anteponiendo `export` a cada `function`/`async function`. No cambiar ninguna lógica.

- [ ] **Step 2: Verificar que no quedó ninguna función duplicada**

Run: `grep -n "function translateVocabWord\|function handleTranslate" js/actions.js`
Expected: sin resultados (esas viven en `translate.js`).

- [ ] **Step 3: Commit**

```bash
git add js/actions.js
git commit -m "refactor: crear js/actions.js (acciones de dominio y selectores)"
```

---

## Task 9: Crear `js/views.js` (`render` + `handleRI`)

**Files:**
- Create: `js/views.js`

- [ ] **Step 1: Crear `js/views.js`**

Mover el bloque de render completo: `render()` (222–362, incluido el wiring de eventos del final) y `handleRI` (364). NO mover la última línea suelta `render();` (374 del original / 365): esa llamada de arranque va en `app.js`.

Dependencias a importar (todo lo que el HTML y el wiring referencian directamente dentro de `views.js`):

```js
// js/views.js
import {LANGS, LEVELS, I} from './config.js';
import {S, setState} from './state.js';
import {getStreak} from './utils.js';
import {doLogin, doRegister, doResetPassword} from './auth.js';
import {getStats, getComprehension, getWeeklyData, getAllTags, wordStyle, saveReadPos, restoreReadPos, addTag} from './actions.js';
```

> Nota: las funciones que el HTML llama mediante atributos en línea (p. ej. `onclick="setState(...)"`, `onclick="saveVoc()"`) NO necesitan importarse aquí: se resuelven contra `window` en tiempo de clic (Task 10 las expone). Sí deben importarse las que `render()`/el wiring invocan directamente en JS: `doLogin/doRegister/doResetPassword` (en los `addEventListener`), `getStats`, `getComprehension`, `getWeeklyData`, `getAllTags`, `getStreak`, `wordStyle`, `saveReadPos`, `restoreReadPos`, `addTag` (usada en el `keydown` del tag-input), `setState`, `S`, `LANGS`, `LEVELS`, `I`.

Después del bloque de imports, pegar `render()` (cuerpo idéntico 223–362) y `handleRI` (364), anteponiendo `export` a ambas:

```js
export function render(){ /* ...cuerpo idéntico... */ }
export function handleRI(e){ /* ...cuerpo idéntico... */ }
```

- [ ] **Step 2: Verificar que el wiring del reader que llama a `handleRI` lo tiene en alcance**

`handleRI` se referencia dentro de `render()` (en los `addEventListener('mouseup',handleRI)` etc.). Como ambas están en el mismo módulo, no requiere import. Confirmar visualmente que `handleRI` está definida en el mismo archivo.

- [ ] **Step 3: Commit**

```bash
git add js/views.js
git commit -m "refactor: crear js/views.js (render y handleRI)"
```

---

## Task 10: Crear `js/app.js` (glue de `window` + arranque)

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: Crear `js/app.js`**

Este módulo de entrada importa lo necesario, **expone a `window`** el estado y las funciones que usan los manejadores en línea, registra `onAuthStateChanged` (línea 173) y hace el `render()` inicial (línea 365).

```js
// js/app.js
import {auth} from './config.js';
import {S, setState, showToast} from './state.js';
import {render} from './views.js';
import {loadAll, saveVoc, saveFc, saveLib} from './db.js';
import {speak, exportCSV} from './utils.js';
import {handleTranslate, translateVocabWord} from './translate.js';
import {doLogout} from './auth.js';
import {handleFile, addText, deleteText, setTextLang, saveWord, startFc, answerFc, addTag, removeTag} from './actions.js';

// Exponer a window lo que usan los onclick/onchange/oninput en línea del HTML generado
Object.assign(window, {
  S, setState, render, showToast,
  doLogout,
  handleFile, addText, deleteText, setTextLang,
  handleTranslate, translateVocabWord, saveWord,
  startFc, answerFc,
  exportCSV, speak, addTag, removeTag,
  saveVoc, saveFc, saveLib
});

// Arranque (idéntico a la línea 173 del original)
auth.onAuthStateChanged(async u=>{if(u){S.user=u;S.loading=true;render();await loadAll();document.body.classList.toggle('dark',S.darkMode);S.loading=false;render()}else{S.user=null;S.loading=false;render()}});

render();
```

> Por qué `Object.assign(window, {...})`: con módulos ES el ámbito superior no es global; los atributos `onclick="..."` se evalúan en el ámbito global, así que el estado `S` y esas funciones deben colgar de `window` para seguir funcionando. `window.S` y la `S` importada son el MISMO objeto, así que las mutaciones en línea (`S.vocabulary[...]=...`) y las lecturas de los módulos coinciden.

- [ ] **Step 2: Commit**

```bash
git add js/app.js
git commit -m "refactor: crear js/app.js (glue de window y arranque)"
```

---

## Task 11: Reescribir `index.html` para cargar los módulos

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Dejar `index.html` con solo HTML base + scripts**

El `<head>` conserva meta, título, favicons (líneas 1–10), las fuentes de Google (11), los scripts CDN como `<script>` clásicos (12–15: pdf.js, firebase-app/auth/firestore compat) y el `<link>` al CSS (de la Task 1). El `<body>` queda con `<div id="app"></div>` y un único módulo de entrada. Resultado:

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#C4563A">
<title>LinguaReader</title>
<!-- favicons: pegar las dos líneas <link rel="icon"...> y <link rel="apple-touch-icon"...> del original (9–10) -->
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/styles.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
</head>
<body>
<div id="app"></div>
<script type="module" src="js/app.js"></script>
</body>
</html>
```

> Orden importante: los `<script>` clásicos (pdf.js, firebase) se ejecutan antes que el módulo (los módulos son `defer` por defecto), así `firebase` y `pdfjsLib` ya son globales cuando `config.js` corre.

- [ ] **Step 2: Verificación manual completa (checklist de la Fase 1)**

Run: `python -m http.server 8000` → abrir `http://localhost:8000`, abrir la consola del navegador (F12) y recorrer:

- [ ] La app carga sin errores en consola (pantalla de login)
- [ ] Registro e inicio de sesión funcionan
- [ ] Subir un PDF y un `.txt` crea textos
- [ ] Pegar texto crea un texto
- [ ] En el lector: tocar palabra → traducir → guardar en cada nivel
- [ ] Modo selección: seleccionar frase → traducir
- [ ] Vocabulario: ver, editar palabra/traducción/nota, etiquetar, filtrar, agrupar, borrar
- [ ] Flashcards: repasar (pendientes y todas), responder, racha
- [ ] Dashboard: stats, gráfico semanal, idiomas, comprensión
- [ ] Modo oscuro, tamaño de fuente, exportar CSV
- [ ] Cerrar sesión

Expected: comportamiento idéntico al de `index.original.html`. Si algo falla, lo más probable es un identificador faltante en `window` (Task 10) o un import faltante en `views.js` (Task 9) — el error de consola dirá cuál.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "refactor: index.html carga modulos JS; fin del refactor Fase 1"
```

---

## Task 12: Limpieza final

**Files:**
- Delete: `index.original.html`

- [ ] **Step 1: Confirmar que toda la checklist de la Task 11 pasó**

Si algún punto falla, NO borrar el original; volver a la task correspondiente.

- [ ] **Step 2: Eliminar la copia de referencia**

```bash
git rm index.original.html
git commit -m "chore: eliminar copia de referencia tras refactor Fase 1 verificado"
```

---

## Self-Review (cobertura del spec — Fase 1)

- **"Separar index.html en archivos por responsabilidad"** → Tasks 1–11 crean `css/styles.css` y `js/{config,state,db,utils,translate,auth,actions,views,app}.js`. ✓
- **"Sin cambiar comportamiento"** → todos los cuerpos se mueven idénticos; verificación contra `index.original.html`. ✓
- **"Punto técnico crítico: manejadores en línea / exponer globals"** → Task 10 expone la lista exacta en `window`. ✓
- **"Orden de carga (CDN clásicos antes que módulos)"** → Task 11 mantiene los `<script>` clásicos antes del `type="module"`. ✓
- **"Sigue estático, sin build"** → no se introduce Node/bundler; se sirve con `http.server`. ✓
- **Verificación de la Fase 1 del spec** → replicada como checklist en Task 11. ✓

Sin placeholders en pasos de código (el contenido grande —objeto `I`, cuerpos 180–220, render— se mueve literalmente desde `index.original.html`, que queda versionado como referencia exacta durante todo el refactor).
