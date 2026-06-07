# Fase 2 — Seguridad (XSS + límite de traducción + textos grandes) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar los huecos de seguridad bloqueantes para lanzar: escapar todo dato de usuario/API antes de inyectarlo como HTML (XSS), manejar el límite de la API de traducción con un mensaje claro, y avisar cuando un texto supera el límite de Firestore.

**Architecture:** App estática modularizada (de la Fase 1). Se añade `escapeHtml()` en `js/utils.js` y se aplica en todas las interpolaciones de datos no confiables dentro de `js/views.js`. La detección de límite de traducción vive en `js/translate.js`. La guarda de tamaño de texto vive en `js/actions.js` con una constante en `js/config.js`. No se cambia el sistema de render ni los manejadores `onclick` (eso es trabajo futuro).

**Tech Stack:** HTML/CSS/JS vanilla, módulos ES, Firebase compat, APIs MyMemory + dictionaryapi.dev.

**Estrategia de prueba:** No hay framework de tests (app estática, sin build) y Node no está disponible en este entorno. La verificación es **manual en el navegador** (servir con `python -m http.server 8000` y abrir `http://localhost:8000`), con payloads de prueba concretos descritos en la Task 8. Cada cambio preserva el comportamiento normal; solo añade escape/guards.

**Contexto de amenaza (por qué importa):** Aunque las reglas de Firestore aíslan los datos por usuario (no hay self-XSS hacia otros), DOS fuentes son externas y no confiables: (1) el **texto pegado/PDF** que el usuario importa de la web se renderiza token a token en el lector, y (2) las **traducciones/definiciones/ejemplos** vienen de APIs de terceros (MyMemory, dictionaryapi.dev). Ambas se inyectan hoy como HTML crudo. Ese es el riesgo principal que esta fase cierra.

**Alcance explícito fuera:** NO se escapan/reescriben los datos embebidos dentro de atributos `onclick="...fn('${...}')"` (inyección en contexto JS de string). Hoy usan `.replace(/'/g,"\\'")`/`&quot;` y su corrección definitiva es migrar a `addEventListener`, que pertenece al trabajo de render diferido. Esta fase cierra el vector HTML (cuerpos de elementos y atributos `value`/`title`), que es el realmente explotable desde fuentes externas.

---

## Mapa de archivos

| Archivo | Cambio |
|---|---|
| `js/utils.js` | Añadir `escapeHtml()` exportada |
| `js/views.js` | Importar `escapeHtml` y envolver cada interpolación de dato no confiable |
| `js/translate.js` | Añadir email a llamadas MyMemory + detectar límite + avisar |
| `js/config.js` | Añadir constante `MAX_TEXT_BYTES` |
| `js/actions.js` | Guarda de tamaño en `addText` |

---

## Task 1: `escapeHtml()` en utils.js + import en views.js

**Files:**
- Modify: `js/utils.js`
- Modify: `js/views.js:4`

- [ ] **Step 1: Añadir `escapeHtml` a utils.js**

Añadir al final de `js/utils.js`:

```js
export function escapeHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])}
```

- [ ] **Step 2: Importar `escapeHtml` en views.js**

En `js/views.js` línea 4, cambiar:

```js
import {getStreak} from './utils.js';
```

por:

```js
import {getStreak, escapeHtml} from './utils.js';
```

- [ ] **Step 3: Verificación rápida en el navegador**

Run: `python -m http.server 8000`, abrir `http://localhost:8000`, abrir consola (F12) y ejecutar:

```js
const {escapeHtml} = await import('/js/utils.js');
console.log(escapeHtml('<img src=x onerror=alert(1)> "a" \'b\' & c'));
```

Expected: imprime `&lt;img src=x onerror=alert(1)&gt; &quot;a&quot; &#39;b&#39; &amp; c` (sin ejecutar nada).

- [ ] **Step 4: Commit**

```bash
git add js/utils.js js/views.js
git commit -m "feat(seguridad): anadir escapeHtml y exponerla a views"
```

---

## Task 2: Escapar Biblioteca + Lector + Header

**Files:**
- Modify: `js/views.js` (líneas 23, 34, 38, 42, 46, 59)

- [ ] **Step 1: Header — nombre de usuario en `title`**

Línea 23, cambiar `title="${userName}"` por `title="${escapeHtml(userName)}"`. Fragmento exacto a reemplazar:

```js
<button class="btn-ghost" onclick="doLogout()" style="padding:6px;color:var(--text4)" title="${userName}">${I.out}</button>
```

por:

```js
<button class="btn-ghost" onclick="doLogout()" style="padding:6px;color:var(--text4)" title="${escapeHtml(userName)}">${I.out}</button>
```

- [ ] **Step 2: Biblioteca — nombre de usuario en el subtítulo**

Línea 34, dentro del `<p>`, cambiar `:userName}` por `:escapeHtml(userName)}`. El fragmento es `de racha':userName}</p>` → `de racha':escapeHtml(userName)}</p>`.

- [ ] **Step 3: Biblioteca — título y preview de cada texto**

Línea 38, cambiar `${it.title}` por `${escapeHtml(it.title)}` y `${it.preview}` por `${escapeHtml(it.preview)}`. Fragmentos exactos:

`<h3 style="font-size:16px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${it.title}</h3>` → usar `${escapeHtml(it.title)}`.

`...-webkit-box-orient:vertical">${it.preview}</p>` → usar `${escapeHtml(it.preview)}`.

> No tocar `${it.id}` en los `onclick`/`onchange`: el id se genera internamente (`Date.now()+random`), no es entrada de usuario.

- [ ] **Step 4: Lector — título del texto**

Línea 42, cambiar `${meta?.title||''}` por `${escapeHtml(meta?.title||'')}`. Fragmento: `white-space:nowrap">${meta?.title||''}</h2>`.

- [ ] **Step 5: Lector — tokens del texto (vector externo principal)**

Línea 46, escapar tanto el contenido visible como el atributo `data-word`. Cambiar:

```js
h+=`<span class="word-span" data-word="${tok.replace(/"/g,'&quot;')}" style="${wordStyle(c,lang)}">${tok}</span>`
```

por:

```js
h+=`<span class="word-span" data-word="${escapeHtml(tok)}" style="${wordStyle(c,lang)}">${escapeHtml(tok)}</span>`
```

> `handleRI` lee `w.dataset.word`; el navegador decodifica las entidades al leer el atributo, así que el comportamiento es idéntico (la limpieza de puntuación posterior recibe el texto original).

- [ ] **Step 6: Vocabulario — nombre de grupo**

Línea 59, cambiar `${group}` por `${escapeHtml(group)}`. Fragmento: `letter-spacing:.5px">${group} (${items.length})</h3>` (el grupo puede ser un título de texto o una etiqueta = dato de usuario).

- [ ] **Step 7: Verificación**

Recargar `http://localhost:8000`. Confirmar que biblioteca, lector y cabecera se ven igual que antes (títulos, previews y texto normales se muestran correctamente, sin entidades visibles en texto sin caracteres especiales).

- [ ] **Step 8: Commit**

```bash
git add js/views.js
git commit -m "fix(seguridad): escapar XSS en biblioteca, lector y header"
```

---

## Task 3: Escapar Vocabulario

**Files:**
- Modify: `js/views.js` (líneas 56, 65, 68, 71, 74)

- [ ] **Step 1: Buscador — valor del input**

Línea 56, cambiar `value="${S.searchTerm}"` por `value="${escapeHtml(S.searchTerm)}"`.

- [ ] **Step 2: Palabra (display)**

Línea 65, cambiar el texto visible `>${it.word}</span>` por `>${escapeHtml(it.word)}</span>`. Fragmento exacto (el `<span>` clicable que muestra la palabra):

```js
...wordText:'${it.word.replace(/'/g,"\\'").replace(/"/g,'&quot;')}'})">${it.word}</span>
```

→ cambiar SOLO el `${it.word}` final del cierre por `${escapeHtml(it.word)}` (dejar el de dentro del `onclick` igual; está fuera de alcance).

- [ ] **Step 3: Traducción (display)**

Línea 68, cambiar `flex:1" onclick="setState({editingTranslation:'${key}',translationText:'...'})">${it.translation}</div>` — el `${it.translation}` del cuerpo del `<div>` → `${escapeHtml(it.translation)}` (dejar el de dentro del `onclick` igual).

- [ ] **Step 4: Nota (display)**

Línea 71, cambiar `font-style:italic">${it.note}</div>` por `font-style:italic">${escapeHtml(it.note)}</div>`.

- [ ] **Step 5: Etiquetas (display)**

Línea 74, cambiar `${I.tag} ${t} <span ...>` por `${I.tag} ${escapeHtml(t)} <span ...>`. Fragmento:

```js
if(it.tags)for(const t of it.tags)h+=`<span class="tag-pill">${I.tag} ${t} <span onclick="event.stopPropagation();removeTag('${key}','${t}')" style="cursor:pointer;margin-left:2px">×</span></span>`;
```

→ cambiar SOLO el `${t}` visible (después de `${I.tag} `) por `${escapeHtml(t)}` (dejar el `'${t}'` del `onclick` igual).

- [ ] **Step 6: Verificación**

Recargar. Ir a Vocabulario. Confirmar que palabras, traducciones, notas, etiquetas y el buscador funcionan igual.

- [ ] **Step 7: Commit**

```bash
git add js/views.js
git commit -m "fix(seguridad): escapar XSS en la vista de vocabulario"
```

---

## Task 4: Escapar Flashcards + Popup de traducción

**Files:**
- Modify: `js/views.js` (líneas 87, 89, 122, 124)

- [ ] **Step 1: Flashcard — palabra**

Línea 87, cambiar el display `>${vi.word}</div>` por `>${escapeHtml(vi.word)}</div>`. Fragmento: `font-family:'Crimson Pro',serif;margin-bottom:8px">${vi.word}</div>` (dejar el `${vi.word.replace(...)}` del `onclick speak(...)` igual).

- [ ] **Step 2: Flashcard — traducción, nota, ejemplo**

Línea 89, hacer estos tres cambios:
- `${vi.translation||'Sin traducción'}` → `${vi.translation?escapeHtml(vi.translation):'Sin traducción'}`
- `${vi.note}` (dentro de `vi.note?\`...${vi.note}...\`:''`) → `${escapeHtml(vi.note)}`
- `${vi.example}` → `${escapeHtml(vi.example)}` y `'<br><span style="color:var(--text4)">'+vi.exampleTranslation+'</span>'` → `'<br><span style="color:var(--text4)">'+escapeHtml(vi.exampleTranslation)+'</span>'`

- [ ] **Step 3: Popup — texto seleccionado (vector externo)**

Línea 122, cambiar el display `>${S.popup.text}</div>` por `>${escapeHtml(S.popup.text)}</div>`. Fragmento: `font-family:'Crimson Pro',serif;margin-bottom:16px">${S.popup.text}</div>` (dejar los `${S.popup.text.replace(...)}` de los `onclick` igual).

- [ ] **Step 4: Popup — traducción/definición/ejemplo de la API (vector externo)**

Línea 124, escapar los cuatro campos que vienen de la API:
- `${S.popup.translation.translation}` → `${escapeHtml(S.popup.translation.translation)}`
- `${S.popup.translation.definition}` → `${escapeHtml(S.popup.translation.definition)}`
- `${S.popup.translation.example}` → `${escapeHtml(S.popup.translation.example)}`
- `'...'+S.popup.translation.exampleTranslation+'...'` → `'...'+escapeHtml(S.popup.translation.exampleTranslation)+'...'`

- [ ] **Step 5: Verificación**

Recargar. En el lector, traducir una palabra (ver popup correcto) y guardarla; ir a Repasar y voltear una tarjeta. Todo debe verse igual.

- [ ] **Step 6: Commit**

```bash
git add js/views.js
git commit -m "fix(seguridad): escapar XSS en flashcards y popup de traduccion"
```

---

## Task 5: Escapar Dashboard + Modal de pegar + Toast

**Files:**
- Modify: `js/views.js` (líneas 95, 115, 128, 134)

- [ ] **Step 1: Dashboard — nombre de usuario**

Línea 95, cambiar `${userName}` por `${escapeHtml(userName)}`. Fragmento: `margin-bottom:24px">${userName} • ${streak>0?...`.

- [ ] **Step 2: Dashboard — títulos en comprensión por texto**

Línea 115, cambiar `max-width:70%">${it.title}</span>` por `max-width:70%">${escapeHtml(it.title)}</span>`.

- [ ] **Step 3: Modal de pegar — título y textarea**

Línea 128, dos cambios:
- `value="${S.pasteTitle}"` → `value="${escapeHtml(S.pasteTitle)}"`
- `rows="8">${S.pasteText}</textarea>` → `rows="8">${escapeHtml(S.pasteText)}</textarea>`

- [ ] **Step 4: Toast — mensaje (puede contener título de usuario)**

Línea 134, cambiar `${S.toast.message}` por `${escapeHtml(S.toast.message)}`. Fragmento:

```js
if(S.toast)h+=`<div class="toast" style="background:${S.toast.type==='error'?'#D4563A':'#4D8B52'}">${S.toast.type==='error'?'⚠ ':'✓ '}${S.toast.message}</div>`;
```

→ usar `${escapeHtml(S.toast.message)}`.

> El mensaje del modal de confirmación (línea 137, `S.confirmAction.msg`) NO necesita escape: siempre es texto fijo de la app.

- [ ] **Step 5: Verificación**

Recargar. Ver Progreso (dashboard) y abrir el modal "Pegar texto". Todo igual.

- [ ] **Step 6: Commit**

```bash
git add js/views.js
git commit -m "fix(seguridad): escapar XSS en dashboard, modal de pegar y toast"
```

---

## Task 6: Límite de traducción (email + detección + aviso)

**Files:**
- Modify: `js/translate.js`

- [ ] **Step 1: Importar `showToast` en translate.js**

Línea 2, cambiar:

```js
import {S, setState} from './state.js';
```

por:

```js
import {S, setState, showToast} from './state.js';
```

- [ ] **Step 2: Añadir email a MyMemory y detectar el límite en `translateText`**

Reemplazar la función `translateText` completa (líneas 5–7) por esta versión. Cambios: (a) `de=` con el email del usuario en las 3 llamadas MyMemory; (b) detectar la respuesta de cuota agotada y marcar `r.limit=true`; (c) no cachear cuando hubo límite.

```js
export async function translateText(text,srcL,cache){const key=srcL+':'+text.toLowerCase().trim();if(cache[key])return{...cache[key],fromCache:true};const r={translation:"",definition:"",example:"",exampleTranslation:"",fromCache:false,limit:false};const email=S.user?.email||'';const de=email?`&de=${encodeURIComponent(email)}`:'';const isLimit=d=>String(d?.responseStatus)==='403'||/MYMEMORY WARNING|USED ALL AVAILABLE/i.test(d?.responseData?.translatedText||'');try{const res=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcL}|es${de}`);const d=await res.json();if(isLimit(d)){r.limit=true;return r}if(d.responseData?.translatedText)r.translation=d.responseData.translatedText;if(d.matches?.length>1){const a=d.matches.find(m=>m.translation!==r.translation&&m.quality&&parseInt(m.quality)>50);if(a)r.definition='También: '+a.translation}}catch{r.translation="Error al traducir"}
if(srcL==="en"){try{const c=text.trim().toLowerCase().replace(/[^a-z'-]/g,"");if(c&&!c.includes(" ")){const dr=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(c)}`);if(dr.ok){const dd=await dr.json(),m=dd?.[0]?.meanings?.[0],d=m?.definitions?.[0];if(d?.definition){try{const tr=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(d.definition)}&langpair=en|es${de}`);r.definition=(await tr.json()).responseData?.translatedText||d.definition}catch{r.definition=d.definition}}if(d?.example){r.example=d.example;try{const er=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(d.example)}&langpair=en|es${de}`);r.exampleTranslation=(await er.json()).responseData?.translatedText||""}catch{}}}}}catch{}}
if(!r.limit)cache[key]={translation:r.translation,definition:r.definition,example:r.example,exampleTranslation:r.exampleTranslation};return r}
```

- [ ] **Step 3: Avisar en `handleTranslate`**

Reemplazar `handleTranslate` (línea 9) por:

```js
export async function handleTranslate(t){const m=S.library.find(x=>x.id===S.currentTextId);setState({translating:true});const r=await translateText(t,m?.language||'en',S.cache);if(r.limit){setState({translating:false});showToast('Límite de traducción gratuito alcanzado por hoy. Intenta de nuevo mañana.','error');return}saveCa();S.popup={...S.popup,translation:r,fromCache:r.fromCache};setState({translating:false})}
```

- [ ] **Step 4: Avisar en `translateVocabWord`**

Reemplazar `translateVocabWord` (línea 11) por:

```js
export async function translateVocabWord(vocKey){const v=S.vocabulary[vocKey];if(!v)return;setState({translating:vocKey});const r=await translateText(v.word,v.language,S.cache);if(r.limit){setState({translating:false});showToast('Límite de traducción gratuito alcanzado por hoy. Intenta de nuevo mañana.','error');return}saveCa();v.translation=r.translation||v.translation;if(r.definition&&!v.note)v.note=r.definition;if(r.example&&!v.example)v.example=r.example;if(r.exampleTranslation&&!v.exampleTranslation)v.exampleTranslation=r.exampleTranslation;v.dateModified=new Date().toISOString();saveVoc();setState({translating:false})}
```

- [ ] **Step 5: Verificación (camino normal + email en la petición)**

Recargar. Traducir una palabra nueva (no cacheada) en inglés. Debe traducir igual que antes. En DevTools → Network, la llamada a `api.mymemory.translated.net` debe incluir `&de=<tu-email>` en la URL. (El camino de límite se valida por revisión de código; forzarlo requeriría agotar la cuota real.)

- [ ] **Step 6: Commit**

```bash
git add js/translate.js
git commit -m "feat(seguridad): email en MyMemory y aviso al agotar el limite de traduccion"
```

---

## Task 7: Guarda de tamaño para textos grandes

**Files:**
- Modify: `js/config.js`
- Modify: `js/actions.js`

- [ ] **Step 1: Añadir la constante de límite en config.js**

Añadir al final de `js/config.js`:

```js
export const MAX_TEXT_BYTES=1000000; // ~1 MB; bajo el tope de 1.048.576 B por documento de Firestore
```

- [ ] **Step 2: Importar la constante en actions.js**

Línea 2 de `js/actions.js`, cambiar:

```js
import {LANGS, LEVELS} from './config.js';
```

por:

```js
import {LANGS, LEVELS, MAX_TEXT_BYTES} from './config.js';
```

- [ ] **Step 3: Añadir la guarda al inicio de `addText`**

Reemplazar la primera línea del cuerpo de `addText` (línea 11). Cambiar:

```js
export function addText(title,text){const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
```

por:

```js
export function addText(title,text){if(new TextEncoder().encode(text).length>MAX_TEXT_BYTES){setState({loading:false});showToast('Este texto es demasiado grande para guardarse (máx. ~1 MB). Divídelo en partes más pequeñas.','error');return}const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
```

> La comprobación va ANTES de modificar `S.library`/`S.texts`, así no queda estado inconsistente. `setState({loading:false})` resetea el spinner que `handleFile` pudo haber activado.

- [ ] **Step 4: Verificación**

Recargar. Abrir el modal "Pegar texto". En la consola, generar un texto enorme y enviarlo:

```js
document.getElementById('paste-text').value='palabra '.repeat(160000); // ~1.28 MB
document.getElementById('paste-title').value='Prueba grande';
```

Luego pulsar "Agregar a mi biblioteca". Expected: aparece el toast rojo de "demasiado grande" y el texto NO se añade a la biblioteca. Después, pegar un texto normal corto y confirmar que SÍ se agrega como siempre.

- [ ] **Step 5: Commit**

```bash
git add js/config.js js/actions.js
git commit -m "feat(seguridad): avisar y bloquear textos que superan el limite de Firestore"
```

---

## Task 8: Verificación de seguridad completa (manual)

**Files:** ninguno (solo pruebas).

- [ ] **Step 1: Servir y abrir**

Run: `python -m http.server 8000` → `http://localhost:8000`, iniciar sesión.

- [ ] **Step 2: XSS en nota de vocabulario**

Guardar una palabra cualquiera, editar su **nota** y poner: `<img src=x onerror="alert('xss')">`. Guardar.
Expected: la nota se muestra como **texto literal**; NO aparece ningún `alert`.

- [ ] **Step 3: XSS en título de texto**

Pegar un texto con título `<b>hola</b>`.
Expected: en la biblioteca el título se ve como texto `<b>hola</b>`, no en negrita.

- [ ] **Step 4: XSS en el cuerpo del lector (vector externo)**

Pegar un texto cuyo contenido incluya `<img src=x onerror="alert('reader')">` y abrirlo en el lector.
Expected: se muestra como texto; NO se ejecuta ningún `alert`.

- [ ] **Step 5: Límite de traducción y email**

DevTools → Network: traducir una palabra nueva y confirmar `&de=<email>` en la URL de MyMemory; la traducción funciona normal.

- [ ] **Step 6: Texto grande**

Repetir la prueba de la Task 7 Step 4: el texto >1 MB es rechazado con toast; uno normal se agrega.

- [ ] **Step 7: Regresión rápida**

Verificar que sigue funcionando: traducir+guardar, editar palabra/traducción/etiqueta, repasar flashcards, dashboard, modo oscuro, exportar CSV.

- [ ] **Step 8: Commit (si hubo ajustes) o continuar**

Si todo pasó sin cambios, no hay nada que commitear; la fase queda lista para integrar.

---

## Self-Review (cobertura del spec — Fase 2)

- **"escapeHtml() y aplicarla a todo dato del usuario"** → Task 1 crea la función; Tasks 2–5 la aplican en: títulos, previews, palabras, traducciones, notas, etiquetas, nombre de usuario, contenido del lector, texto del popup, traducciones de la API, modal de pegar y toasts. ✓
- **"hoy el escapado es inconsistente (a veces solo &quot;)"** → se mantiene el escape de atributos existente y se cubren los cuerpos/atributos faltantes. Los embebidos en `onclick` (contexto JS) se documentan como fuera de alcance (Alcance explícito fuera). ✓
- **"añadir el email del usuario a las llamadas (&de=)"** → Task 6 Step 2. ✓
- **"detectar la respuesta de límite excedido y mostrar un mensaje claro"** → Task 6 Steps 2–4 (`r.limit` + `showToast` en ambos flujos). ✓
- **"comprobar tamaño antes de guardar; avisar si se acerca/supera 1 MB sin dejar estado inconsistente"** → Task 7 (guarda en `addText` antes de mutar estado, con `MAX_TEXT_BYTES`). ✓
- **Verificación de la Fase 2 del spec** (payload XSS no se ejecuta, aviso de límite, aviso de texto grande) → Task 8. ✓

Sin placeholders: cada paso muestra el fragmento exacto a cambiar y su reemplazo completo. Consistencia de nombres: `escapeHtml` (utils.js → views.js), `MAX_TEXT_BYTES` (config.js → actions.js), `r.limit`/`showToast` (translate.js) son coherentes entre tareas.
