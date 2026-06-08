# Fase 4 — Lector con audio (read-along) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir escuchar el texto del lector mientras se lee, resaltando la frase actual y avanzando sola, con controles de reproducir/pausar, detener y velocidad.

**Architecture:** Se usa la Web Speech API (`speechSynthesis`, ya usada en `speak()`). El texto del lector se envuelve por **frases** en `<span class="ra-sent" data-si="N">` (sin cambiar los `word-span` internos, así la traducción al tocar sigue igual). Un módulo nuevo `js/readaloud.js` gestiona la reproducción: lee las frases del DOM, resalta la activa y encadena utterances con `onend`. El resaltado y los controles se manipulan **por DOM directo, sin `setState`/`render`**, para no reconstruir el lector durante la reproducción. Cualquier `render()` real (tocar palabra, cambiar tamaño, navegar) corta el audio vía `resetReadAloud()`.

**Tech Stack:** Web Speech API (`SpeechSynthesisUtterance`), módulos ES.

**Estrategia de prueba:** sin tests (estático, sin build, Node no disponible). Verificación **manual en el navegador** (requiere login Firebase y un navegador con TTS). El implementador valida sintaxis/balance y que sirva por HTTP.

**Degradación:** si el navegador no tiene `speechSynthesis`, los controles no se renderizan.

---

## Mapa de archivos

| Archivo | Cambio |
|---|---|
| `js/config.js` | Iconos `play`, `pause`, `stop` en `I` |
| `js/readaloud.js` | **Nuevo**: lógica de reproducción frase por frase |
| `css/styles.css` | Resaltado `.ra-sent.ra-active` + estilos de control `.ra-ctrl` |
| `js/views.js` | Envolver frases en el lector; controles en la barra; `resetReadAloud()` en `render()` |
| `js/app.js` | Exponer `toggleReadAloud`, `stopReadAloud`, `cycleReadRate` en `window` |

---

## Task 1: Iconos play/pause/stop en config.js

**Files:**
- Modify: `js/config.js` (objeto `I`)

- [ ] **Step 1: Añadir tres iconos al objeto `I`**

Dentro del objeto `export const I = {...}`, añadir estas tres entradas (junto a las demás, antes del `}` de cierre del objeto):

```js
play:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
pause:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>`,
stop:`<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>`,
```

- [ ] **Step 2: Verificación**

Run: `python -m http.server 8000`, abrir la consola y ejecutar `const {I}=await import('/js/config.js');console.log(!!I.play,!!I.pause,!!I.stop)` → `true true true`.

- [ ] **Step 3: Commit**

```bash
git add js/config.js
git commit -m "feat(fase4): iconos play/pause/stop"
```

---

## Task 2: Módulo `js/readaloud.js`

**Files:**
- Create: `js/readaloud.js`

- [ ] **Step 1: Crear `js/readaloud.js` con este contenido completo**

```js
// js/readaloud.js — lectura en voz alta (read-along) frase por frase
import {S} from './state.js';
import {LANG_VOICE, I} from './config.js';

let raPlaying=false, raIdx=0, raRate=1, raGen=0;
const RATES=[1,1.25,1.5,0.75];

export function readRateLabel(){return raRate+'×'}

function sentEls(){const ra=document.getElementById('reader-area');return ra?Array.from(ra.querySelectorAll('.ra-sent')):[]}
function clearHi(els){for(const e of els)e.classList.remove('ra-active')}
function setToggleIcon(){const b=document.getElementById('ra-toggle');if(b)b.innerHTML=raPlaying?I.pause:I.play}

function speakCurrent(){
  if(!window.speechSynthesis)return;
  const els=sentEls();
  if(raIdx>=els.length){stopReadAloud();return}
  clearHi(els);
  const el=els[raIdx];
  el.classList.add('ra-active');
  el.scrollIntoView({block:'center',behavior:'smooth'});
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
  if(raPlaying){raPlaying=false;raGen++;window.speechSynthesis.cancel();setToggleIcon();return}
  const els=sentEls();
  if(!els.length)return;
  if(raIdx>=els.length)raIdx=0;
  raPlaying=true;setToggleIcon();
  window.speechSynthesis.cancel();
  speakCurrent();
}

export function stopReadAloud(){
  raPlaying=false;raIdx=0;raGen++;
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  clearHi(sentEls());setToggleIcon();
}

export function cycleReadRate(){
  raRate=RATES[(RATES.indexOf(raRate)+1)%RATES.length];
  const b=document.getElementById('ra-rate');if(b)b.textContent=raRate+'×';
  if(raPlaying){window.speechSynthesis.cancel();speakCurrent()}
}

// Se llama en cada render(): corta el audio porque el DOM del lector se reconstruye.
export function resetReadAloud(){raPlaying=false;raIdx=0;raGen++;if(window.speechSynthesis)window.speechSynthesis.cancel()}
```

> El contador `raGen` evita el problema de que `speechSynthesis.cancel()` dispare el `onend` de la utterance anterior: cada `speakCurrent` toma un número nuevo y los `onend` viejos se ignoran.

- [ ] **Step 2: Commit**

```bash
git add js/readaloud.js
git commit -m "feat(fase4): modulo readaloud (reproduccion frase por frase)"
```

---

## Task 3: Estilos de resaltado y controles

**Files:**
- Modify: `css/styles.css`

- [ ] **Step 1: Añadir al final de `css/styles.css`**

```css
/* Read-along (Fase 4) */
.ra-sent{transition:background .2s,box-shadow .2s}
.ra-sent.ra-active{background:rgba(188,74,43,.14);border-radius:4px;box-shadow:0 0 0 4px rgba(188,74,43,.14)}
.dark .ra-sent.ra-active{background:rgba(217,105,74,.22);box-shadow:0 0 0 4px rgba(217,105,74,.22)}
.ra-ctrl{display:inline-flex;align-items:center;gap:2px;margin-right:6px;border-right:1px solid var(--border);padding-right:6px}
.ra-ctrl button{padding:6px}
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "feat(fase4): estilos de resaltado de frase y controles de audio"
```

---

## Task 4: Envolver frases + cortar audio en render (views.js)

**Files:**
- Modify: `js/views.js` (import; `render()` línea 9; bucle de tokens línea 46)

- [ ] **Step 1: Importar de readaloud.js**

Tras la línea de import de actions (la que importa `getStats, ...`), añadir:

```js
import {resetReadAloud, readRateLabel} from './readaloud.js';
```

- [ ] **Step 2: Cortar audio al re-renderizar**

En `render()` (línea 9), justo después de `app.style.minHeight='100vh';`, añadir `resetReadAloud();`. La línea queda:

```js
export function render(){const app=document.getElementById('app');app.style.display='flex';app.style.flexDirection='column';app.style.minHeight='100vh';resetReadAloud();
```

- [ ] **Step 3: Envolver el texto del lector por frases**

Reemplazar la línea 46 completa:

```js
for(const para of paras){const toks=para.split(/(\s+)/);h+='<p style="margin-bottom:18px">';for(const tok of toks){if(/^\s+$/.test(tok)){h+=tok;continue}const c=tok.replace(/[.,;:!?¿¡"""''()\[\]{}]/g,'');if(!c){h+=tok;continue}h+=`<span class="word-span" data-word="${escapeHtml(tok)}" style="${wordStyle(c,lang)}">${escapeHtml(tok)}</span>`}h+='</p>'}
```

por:

```js
let _si=0;for(const para of paras){h+='<p style="margin-bottom:18px">';const sents=para.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g)||[para];for(const sent of sents){if(!sent)continue;h+=`<span class="ra-sent" data-si="${_si}">`;const toks=sent.split(/(\s+)/);for(const tok of toks){if(/^\s+$/.test(tok)){h+=tok;continue}const c=tok.replace(/[.,;:!?¿¡"""''()\[\]{}]/g,'');if(!c){h+=tok;continue}h+=`<span class="word-span" data-word="${escapeHtml(tok)}" style="${wordStyle(c,lang)}">${escapeHtml(tok)}</span>`}h+='</span> ';_si++}h+='</p>'}
```

> El `word-span` interno y `handleRI` (tocar palabra → traducir) no cambian; solo se agrupan dentro de `.ra-sent`. La división de frases usa `match` (sin `lookbehind`, compatible con Safari).

- [ ] **Step 4: Verificación**

Recargar, abrir un texto: se ve igual que antes; tocar una palabra sigue abriendo el popup de traducción; el modo selección sigue funcionando.

- [ ] **Step 5: Commit**

```bash
git add js/views.js
git commit -m "feat(fase4): envolver el lector por frases y cortar audio al re-renderizar"
```

---

## Task 5: Controles de audio en la barra del lector (views.js)

**Files:**
- Modify: `js/views.js` (línea 42, dentro de `<div class="font-ctrl">`)

- [ ] **Step 1: Insertar el grupo de controles**

En la línea 42, justo después de `<div class="font-ctrl">` y ANTES del `<button onclick="setState({selectMode...`, insertar (los controles solo aparecen si hay TTS):

```js
${('speechSynthesis' in window)?`<span class="ra-ctrl"><button id="ra-toggle" class="btn-ghost" onclick="toggleReadAloud()" title="Escuchar / pausar">${I.play}</button><button class="btn-ghost" onclick="stopReadAloud()" title="Detener">${I.stop}</button><button id="ra-rate" class="btn-ghost" onclick="cycleReadRate()" title="Velocidad" style="font-family:var(--mono);font-size:12px;min-width:36px">${readRateLabel()}</button></span>`:''}
```

Es decir, el contenedor pasa de:

```js
<div class="font-ctrl"><button onclick="setState({selectMode:!S.selectMode})"
```

a:

```js
<div class="font-ctrl">${('speechSynthesis' in window)?`<span class="ra-ctrl"><button id="ra-toggle" class="btn-ghost" onclick="toggleReadAloud()" title="Escuchar / pausar">${I.play}</button><button class="btn-ghost" onclick="stopReadAloud()" title="Detener">${I.stop}</button><button id="ra-rate" class="btn-ghost" onclick="cycleReadRate()" title="Velocidad" style="font-family:var(--mono);font-size:12px;min-width:36px">${readRateLabel()}</button></span>`:''}<button onclick="setState({selectMode:!S.selectMode})"
```

- [ ] **Step 2: Verificación**

Recargar, abrir un texto: aparecen los botones ▶ / ◼ / "1×" en la barra superior del lector.

- [ ] **Step 3: Commit**

```bash
git add js/views.js
git commit -m "feat(fase4): controles de audio en la barra del lector"
```

---

## Task 6: Exponer acciones en window (app.js)

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: Importar de readaloud.js**

Añadir esta línea a los imports de `js/app.js`:

```js
import {toggleReadAloud, stopReadAloud, cycleReadRate} from './readaloud.js';
```

- [ ] **Step 2: Exponer en window**

En el `Object.assign(window,{...})`, añadir `toggleReadAloud, stopReadAloud, cycleReadRate` a la lista.

- [ ] **Step 3: Verificación estática**

Confirmar que las tres funciones están (a) exportadas en `readaloud.js`, (b) importadas en `app.js`, y (c) presentes en el `Object.assign(window,{...})`. Sin esto, los botones lanzarían `ReferenceError`.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat(fase4): exponer controles de read-along en window"
```

---

## Task 7: Verificación completa (manual, en el navegador)

**Files:** ninguno.

- [ ] **Step 1: Servir y entrar**

`python -m http.server 8000` → `http://localhost:8000`, login, abrir un texto en el lector.

- [ ] **Step 2: Reproducción**

- [ ] Pulsar ▶: empieza a leer en voz alta y **resalta la frase actual**; al terminar una frase avanza sola a la siguiente y desplaza la vista.
- [ ] El icono cambia a ⏸ mientras suena.

- [ ] **Step 3: Controles**

- [ ] Pulsar ⏸ (mismo botón): se pausa; volver a pulsar reanuda desde la frase actual.
- [ ] Pulsar ◼ (detener): para y quita el resaltado.
- [ ] Pulsar "1×" cambia la velocidad (1× → 1.25× → 1.5× → 0.75×) y se nota en la lectura.

- [ ] **Step 4: Convivencia con lo existente**

- [ ] Con el audio sonando, tocar una palabra abre el popup de traducción y el audio se detiene (no quedan resaltados raros).
- [ ] El coloreado de palabras por nivel sigue visible bajo el resaltado de frase.
- [ ] Cambiar tamaño de fuente o cambiar de vista detiene el audio sin errores.

- [ ] **Step 5: Idioma y degradación**

- [ ] La voz corresponde al idioma del texto (en/pt/fr/de).
- [ ] (Si fuera posible probar en un navegador sin TTS, los controles no aparecen — opcional.)

---

## Self-Review (cobertura del spec — Fase 4)

- **"Escuchar mientras se lee, con resaltado frase por frase"** → Task 4 (envoltura `.ra-sent`) + Task 2 (`speakCurrent` resalta `ra-active` y encadena con `onend`). ✓
- **"Usa speechSynthesis (ya en `speak()`)"** → `readaloud.js` usa `SpeechSynthesisUtterance`. ✓
- **"Controles: reproducir/pausar, detener, velocidad (0.75/1/1.25)"** → Task 5 (botones) + Task 2 (`toggleReadAloud`/`stopReadAloud`/`cycleReadRate`); velocidades 1/1.25/1.5/0.75. ✓
- **"Voz por idioma (LANG_VOICE)"** → `speakCurrent` usa `LANG_VOICE[lang]`. ✓
- **"El resaltado de audio no pisa el coloreado por nivel"** → `.ra-active` es fondo en el span de frase (padre); los `word-span` conservan su estilo. Task 7 Step 4 lo verifica. ✓
- **"Degradación si no hay TTS: ocultar controles"** → Task 5 (condicional `'speechSynthesis' in window`). ✓

Sin placeholders: todo el código está completo. Consistencia: `ra-sent`/`ra-active`/`ra-toggle`/`ra-rate` (views↔css↔readaloud), `resetReadAloud`/`readRateLabel` (views import), `toggleReadAloud`/`stopReadAloud`/`cycleReadRate` (readaloud→app window→onclick), `I.play`/`I.pause`/`I.stop` (config→readaloud/views) coinciden entre tareas.
```
