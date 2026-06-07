# Fase 5 — Flashcards Refold: datos y edición — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar las flashcards estilo Refold dándoles datos reales: un modelo limpio (`definitions[]`, `irregularForms[]`), autocompletado de definiciones al traducir, y edición manual en Vocabulario.

**Architecture:** El reverso de la flashcard ya muestra la estructura Refold (hecho en una iteración previa) y ya lee `vi.definitions`/`vi.irregularForms` con respaldo. Esta fase: (1) centraliza la derivación de definiciones en un helper puro `cleanDefs` en `utils.js`; (2) puebla `definitions[]` automáticamente al guardar/retraducir una palabra; (3) añade en la vista de Vocabulario una UI para editar definiciones y formas irregulares, siguiendo el patrón de edición en línea existente (un solo elemento activo, input leído por id).

**Tech Stack:** módulos ES, Firestore (campos nuevos retrocompatibles), APIs MyMemory + dictionaryapi.dev.

**Estrategia de prueba:** sin framework de tests (estático, sin build, Node no disponible). Verificación **manual en el navegador** (`python -m http.server 8000` → `http://localhost:8000`, requiere login Firebase del usuario). El helper `cleanDefs` es puro y trae casos de prueba descritos para revisión.

**Compatibilidad:** los campos `definitions`/`irregularForms` son opcionales; las palabras antiguas (sin ellos) siguen funcionando porque la flashcard cae al respaldo `cleanDefs(translation, note)`.

---

## Mapa de archivos

| Archivo | Cambio |
|---|---|
| `js/utils.js` | Añadir helper puro `cleanDefs(translation, definition)` |
| `js/views.js` | Flashcard usa `cleanDefs` de respaldo; UI de edición de definiciones y formas irregulares en Vocabulario; enfocar inputs nuevos |
| `js/state.js` | Estado nuevo: `addingDefFor`, `addingIrrFor` |
| `js/actions.js` | `saveWord` puebla `definitions[]`; acciones `addDefinition/removeDefinition/addIrregular/removeIrregular` |
| `js/translate.js` | `translateVocabWord` puebla `definitions[]` (no la `note`) |
| `js/app.js` | Exponer las 4 acciones nuevas en `window` |

### Modelo de datos (entrada de `vocabulary`)
Se añaden dos campos opcionales: `definitions: string[]` (lista de acepciones/definiciones, editable y mostrada en la flashcard) e `irregularForms: string[]` (chips, edición manual). El campo `note` deja de usarse para guardar la definición en palabras nuevas y vuelve a ser una nota libre del usuario.

---

## Task 1: Helper `cleanDefs` en utils.js + respaldo de la flashcard

**Files:**
- Modify: `js/utils.js`
- Modify: `js/views.js` (línea 2 import; bloque de la flashcard)

- [ ] **Step 1: Añadir `cleanDefs` al final de `js/utils.js`**

```js
export function cleanDefs(translation,definition){const out=[];const t=(translation==null?'':String(translation)).trim();if(t)out.push(t);if(definition!=null&&String(definition).trim()){let d=String(definition).trim();if(t&&d.toLowerCase().startsWith(t.toLowerCase()))d=d.slice(t.length).replace(/^[\s—–-]+/,'');if(d&&d.toLowerCase()!==t.toLowerCase())out.push(d)}return out}
```

Casos esperados (para la revisión): `cleanDefs('rígido','rígido — Una persona...')` → `['rígido','Una persona...']`; `cleanDefs('real','Una mercancía; ver bienes raíces.')` → `['real','Una mercancía; ver bienes raíces.']`; `cleanDefs('real','')` → `['real']`; `cleanDefs('','')` → `[]`.

- [ ] **Step 2: Importar `cleanDefs` en views.js**

Línea 2, cambiar:

```js
import {getStreak, escapeHtml} from './utils.js';
```

por:

```js
import {getStreak, escapeHtml, cleanDefs} from './utils.js';
```

- [ ] **Step 3: Usar `cleanDefs` como respaldo en la flashcard**

En el reverso de la flashcard, reemplazar el bloque de derivación de `defs`. Buscar:

```js
else{let defs;if(vi.definitions&&vi.definitions.length)defs=vi.definitions;else{defs=[];if(vi.translation)defs.push(vi.translation);if(vi.note){let nx=vi.note;if(vi.translation&&nx.toLowerCase().startsWith(vi.translation.toLowerCase()))nx=nx.slice(vi.translation.length).replace(/^[\s—–-]+/,'');if(nx&&nx.toLowerCase()!==(vi.translation||'').toLowerCase())defs.push(nx)}}
```

y reemplazar por:

```js
else{let defs=(vi.definitions&&vi.definitions.length)?vi.definitions:cleanDefs(vi.translation,vi.note);
```

- [ ] **Step 4: Verificación**

`python -m http.server 8000` → Repasar → voltear tarjetas: las definiciones se ven igual que antes (sin redundancia). Sin errores en consola.

- [ ] **Step 5: Commit**

```bash
git add js/utils.js js/views.js
git commit -m "refactor(fase5): centralizar derivacion de definiciones en cleanDefs"
```

---

## Task 2: Autocompletar `definitions[]` al guardar/retraducir + estado nuevo

**Files:**
- Modify: `js/state.js` (objeto `S`)
- Modify: `js/actions.js` (import + `saveWord`)
- Modify: `js/translate.js` (import + `translateVocabWord`)

- [ ] **Step 1: Añadir estado de edición en `js/state.js`**

En el objeto `S`, cambiar el final `...readingPositions:{},selectMode:false};` por:

```js
...readingPositions:{},selectMode:false,addingDefFor:null,addingIrrFor:null};
```

(Es decir, añadir `,addingDefFor:null,addingIrrFor:null` antes del `};` final de `S`.)

- [ ] **Step 2: Importar `cleanDefs` en actions.js**

Línea 5, cambiar:

```js
import {sm2, detectLang, extractPdf, todayStr} from './utils.js';
```

por:

```js
import {sm2, detectLang, extractPdf, todayStr, cleanDefs} from './utils.js';
```

- [ ] **Step 3: `saveWord` puebla `definitions[]` y deja `note` libre**

Reemplazar el objeto que asigna `S.vocabulary[k]` dentro de `saveWord` (la línea que empieza con `S.vocabulary[k]={...ex,word:text.trim(),...`). Versión nueva:

```js
S.vocabulary[k]={...ex,word:text.trim(),language:lang,level,note:ex.note||'',definitions:(ex.definitions&&ex.definitions.length)?ex.definitions:cleanDefs(tr?.translation,tr?.definition),irregularForms:ex.irregularForms||[],translation:tr?.translation||ex.translation||'',example:tr?.example||ex.example||'',exampleTranslation:tr?.exampleTranslation||ex.exampleTranslation||'',tags:ex.tags||[],sourceTextId:ex.sourceTextId||S.currentTextId,dateAdded:ex.dateAdded||new Date().toISOString(),dateModified:new Date().toISOString()};
```

(Cambios respecto a la actual: `note:ex.note||''` en vez de meterle la definición, y se añaden `definitions:...` e `irregularForms:ex.irregularForms||[]`.)

- [ ] **Step 4: Importar `cleanDefs` en translate.js**

Línea 3 (debajo del import de state), añadir el import de utils. Cambiar:

```js
import {saveCa, saveVoc} from './db.js';
```

por:

```js
import {saveCa, saveVoc} from './db.js';
import {cleanDefs} from './utils.js';
```

- [ ] **Step 5: `translateVocabWord` puebla `definitions[]` en vez de la nota**

En `translateVocabWord`, reemplazar:

```js
if(r.definition&&!v.note)v.note=r.definition;
```

por:

```js
if(!v.definitions||!v.definitions.length)v.definitions=cleanDefs(r.translation||v.translation,r.definition);
```

(El resto de `translateVocabWord` —rellenar `example`/`exampleTranslation`— se mantiene igual; eso es lo que rellena los ejemplos faltantes al pulsar "Re-traducir".)

- [ ] **Step 6: Verificación**

Recargar. En Vocabulario, pulsar el botón 🌐 (Re-traducir) de una palabra en inglés sin ejemplo/traducción → debe rellenar su ejemplo y traducción, y al ir a Repasar la tarjeta muestra las definiciones desde `definitions[]`. Guardar una palabra nueva desde el lector también debe poblar `definitions[]` (verificable en la flashcard).

- [ ] **Step 7: Commit**

```bash
git add js/state.js js/actions.js js/translate.js
git commit -m "feat(fase5): poblar definitions[] al guardar y retraducir; note vuelve a ser nota libre"
```

---

## Task 3: Editar definiciones en Vocabulario

**Files:**
- Modify: `js/actions.js` (acciones nuevas)
- Modify: `js/app.js` (exponer en window)
- Modify: `js/views.js` (UI en la tarjeta de vocabulario + enfoque)

- [ ] **Step 1: Acciones `addDefinition`/`removeDefinition` en actions.js**

Añadir al final de `js/actions.js`:

```js
export function addDefinition(vocKey,text){const v=S.vocabulary[vocKey];if(!v||!text||!text.trim())return;if(!v.definitions)v.definitions=[];v.definitions.push(text.trim());v.dateModified=new Date().toISOString();saveVoc();setState({addingDefFor:null})}
export function removeDefinition(vocKey,idx){const v=S.vocabulary[vocKey];if(!v||!v.definitions)return;v.definitions.splice(idx,1);v.dateModified=new Date().toISOString();saveVoc();render()}
```

- [ ] **Step 2: Exponer en window (app.js)**

En `js/app.js`, en el `import` desde `./actions.js`, añadir `addDefinition, removeDefinition`. Y en el bloque `Object.assign(window,{...})`, añadir `addDefinition, removeDefinition`. Por ejemplo, la línea del import:

```js
import {handleFile, addText, deleteText, setTextLang, saveWord, startFc, answerFc, addTag, removeTag, saveReadPos} from './actions.js';
```

pasa a incluir `addDefinition, removeDefinition`:

```js
import {handleFile, addText, deleteText, setTextLang, saveWord, startFc, answerFc, addTag, removeTag, saveReadPos, addDefinition, removeDefinition} from './actions.js';
```

Y en el `Object.assign(window,{...})` añadir `addDefinition, removeDefinition,` junto a las demás.

- [ ] **Step 3: UI de definiciones en la tarjeta de vocabulario (views.js)**

En la vista de Vocabulario, justo DESPUÉS del bloque de traducción (la línea que termina con `o escribir manual</span></div>`) e ANTES del bloque de nota (`if(ien)h+=...`), insertar:

```js
h+=`<div style="margin-top:6px">`;
if(it.definitions&&it.definitions.length){h+=`<div style="display:flex;flex-direction:column;gap:2px">`;it.definitions.forEach((d,di)=>{h+=`<div style="display:flex;align-items:flex-start;gap:6px;color:var(--text2);font-size:14px"><span style="color:var(--accent);line-height:1.4">•</span><span style="flex:1">${escapeHtml(d)}</span><span onclick="removeDefinition('${key}',${di})" style="cursor:pointer;color:var(--text4);flex-shrink:0" title="Quitar">×</span></div>`});h+=`</div>`}
if(S.addingDefFor===key)h+=`<div style="display:flex;gap:6px;margin-top:4px"><input class="input" id="def-add-input" placeholder="Nueva definición..." style="flex:1;font-size:13px;padding:4px 10px" onkeydown="if(event.key==='Enter')addDefinition('${key}',this.value)"><button class="btn btn-primary btn-sm" onclick="addDefinition('${key}',document.getElementById('def-add-input').value)">${I.check}</button><button class="btn-ghost btn-sm" onclick="setState({addingDefFor:null})">${I.x}</button></div>`;
else h+=`<span class="tag-pill" style="opacity:.5;margin-top:4px" onclick="setState({addingDefFor:'${key}'})">+ definición</span>`;
h+=`</div>`;
```

- [ ] **Step 4: Enfocar el input de definición tras render**

En `js/views.js`, en el bucle de enfoque (`for(const id of['ewi','eti','eni','tag-input'])...`), añadir `'def-add-input'`:

```js
for(const id of['ewi','eti','eni','tag-input','def-add-input']){const el=document.getElementById(id);if(el)el.focus()}
```

- [ ] **Step 5: Verificación**

Recargar → Vocabulario. En una palabra: pulsar "+ definición", escribir y guardar (Enter o ✓) → aparece como viñeta. Quitar una definición con la × → desaparece. Ir a Repasar: la flashcard refleja las definiciones editadas.

- [ ] **Step 6: Commit**

```bash
git add js/actions.js js/app.js js/views.js
git commit -m "feat(fase5): editar definiciones en Vocabulario"
```

---

## Task 4: Editar formas irregulares en Vocabulario

**Files:**
- Modify: `js/actions.js` (acciones nuevas)
- Modify: `js/app.js` (exponer en window)
- Modify: `js/views.js` (UI + enfoque)

- [ ] **Step 1: Acciones `addIrregular`/`removeIrregular` en actions.js**

Añadir al final de `js/actions.js`:

```js
export function addIrregular(vocKey,text){const v=S.vocabulary[vocKey];if(!v||!text||!text.trim())return;if(!v.irregularForms)v.irregularForms=[];const t=text.trim();if(!v.irregularForms.includes(t))v.irregularForms.push(t);v.dateModified=new Date().toISOString();saveVoc();setState({addingIrrFor:null})}
export function removeIrregular(vocKey,val){const v=S.vocabulary[vocKey];if(!v||!v.irregularForms)return;v.irregularForms=v.irregularForms.filter(f=>f!==val);v.dateModified=new Date().toISOString();saveVoc();render()}
```

- [ ] **Step 2: Exponer en window (app.js)**

Añadir `addIrregular, removeIrregular` al import desde `./actions.js` y al `Object.assign(window,{...})` (igual que en la Task 3 Step 2).

- [ ] **Step 3: UI de formas irregulares (views.js)**

Inmediatamente DESPUÉS del bloque de definiciones insertado en la Task 3 (después de su `h+=`</div>`;`), insertar:

```js
h+=`<div style="margin-top:4px;display:flex;flex-wrap:wrap;align-items:center;gap:4px">`;
if(it.irregularForms)for(const f of it.irregularForms)h+=`<span class="pill" style="font-size:11px;padding:2px 10px">${escapeHtml(f)} <span onclick="removeIrregular('${key}','${f.replace(/'/g,"\\'")}')" style="cursor:pointer;margin-left:2px;color:var(--text4)">×</span></span>`;
if(S.addingIrrFor===key)h+=`<input class="input" id="irr-add-input" placeholder="forma..." style="width:120px;font-size:12px;padding:3px 8px" onkeydown="if(event.key==='Enter')addIrregular('${key}',this.value)"><button class="btn btn-primary btn-sm" onclick="addIrregular('${key}',document.getElementById('irr-add-input').value)">${I.check}</button>`;
else h+=`<span class="tag-pill" style="opacity:.5" onclick="setState({addingIrrFor:'${key}'})">+ forma irregular</span>`;
h+=`</div>`;
```

- [ ] **Step 4: Enfocar el input de forma irregular**

En el bucle de enfoque de `views.js`, añadir `'irr-add-input'`:

```js
for(const id of['ewi','eti','eni','tag-input','def-add-input','irr-add-input']){const el=document.getElementById(id);if(el)el.focus()}
```

- [ ] **Step 5: Verificación**

Recargar → Vocabulario. En una palabra (p. ej. un verbo): "+ forma irregular", escribir "has", Enter → aparece como píldora. Añadir "had". Ir a Repasar → la flashcard muestra la sección "formas irregulares" con las píldoras. Quitar una con × → desaparece de ambos sitios.

- [ ] **Step 6: Commit**

```bash
git add js/actions.js js/app.js js/views.js
git commit -m "feat(fase5): editar formas irregulares en Vocabulario"
```

---

## Task 5: Verificación completa (manual)

**Files:** ninguno.

- [ ] **Step 1: Servir y entrar**

`python -m http.server 8000` → `http://localhost:8000`, login.

- [ ] **Step 2: Datos automáticos**

- [ ] Guardar una palabra nueva desde el lector (en inglés) → en Repasar, su flashcard muestra definiciones limpias (sin repetir la traducción).
- [ ] En Vocabulario, "Re-traducir" (🌐) una palabra que salía sin ejemplo/traducción → se rellenan; la flashcard muestra el ejemplo con su traducción.

- [ ] **Step 3: Edición manual**

- [ ] Añadir y quitar definiciones en una palabra; se reflejan en la flashcard.
- [ ] Añadir y quitar formas irregulares; aparecen como píldoras en la flashcard (sección oculta si no hay ninguna).

- [ ] **Step 4: Retrocompatibilidad**

- [ ] Una palabra vieja (guardada antes de esta fase, sin `definitions[]`) sigue mostrando definiciones en la flashcard (vía respaldo `cleanDefs`) y se puede editar (al añadir, se crea el array).

- [ ] **Step 5: Regresión**

- [ ] Traducir+guardar, editar palabra/traducción/nota/etiqueta, niveles, repasar y responder (SM-2), dashboard, modo oscuro, CSV — todo sigue funcionando.

---

## Self-Review (cobertura del spec — Fase 5)

- **"Reverso con estructura Refold (palabra+audio, definiciones, formas irregulares, ejemplo+audio, traducción revelable)"** → la estructura ya estaba; esta fase la alimenta con datos. ✓
- **"Audio con TTS para palabra y frase"** → ya implementado (botones `audiobtn` → `speak`). ✓
- **"`definitions: string[]` autocompletado desde las APIs"** → Task 1 (`cleanDefs`) + Task 2 (`saveWord`, `translateVocabWord`). ✓
- **"`irregularForms: string[]` edición manual"** → Task 4. ✓
- **"UI de edición manual en Vocabulario (en línea, como la edición actual); secciones vacías se ocultan"** → Tasks 3 y 4 (patrón en línea con `addingDefFor`/`addingIrrFor`; las secciones de la flashcard ya se ocultan si están vacías). ✓
- **"Campos opcionales retrocompatibles"** → respaldo `cleanDefs` para palabras sin `definitions[]`; arrays se crean al primer add. Task 5 Step 4 lo verifica. ✓
- **"No se importa el .apkg de Refold"** → fuera de alcance, no incluido. ✓

Sin placeholders: cada paso muestra el código exacto. Consistencia de nombres: `cleanDefs` (utils → views/actions/translate), `definitions`/`irregularForms` (modelo), `addingDefFor`/`addingIrrFor` (state → views), `addDefinition/removeDefinition/addIrregular/removeIrregular` (actions → app window → views onclick) coinciden entre tareas.
