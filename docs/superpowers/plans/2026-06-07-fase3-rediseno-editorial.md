# Fase 3 — Rediseño visual "Editorial / Revista" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar la dirección visual "Editorial / Revista" (aprobada en `docs/mockups/editorial-mockup.html`) a toda la app real, sin cambiar la lógica ni los manejadores.

**Architecture:** La app usa variables CSS (`--bg`, `--text`, `--accent`…) y clases (`.card`, `.btn`, `.input`, `.tag`, `.nav-btn`, `header`, `.bottom-nav`…) en todas las vistas, con muchos estilos en línea que referencian esas variables. Por eso el grueso del rediseño se logra **reescribiendo `css/styles.css`** (paleta + tipografía + componentes base + modo oscuro), lo que se propaga a casi toda la UI. Luego se añaden los toques distintivos: letra capital en el lector (solo CSS), numeración tipo índice en la biblioteca y etiquetas mono en el lector (markup en `js/views.js`). Los títulos `h1/h2` pasan a *Fraunces* editando sus estilos en línea.

**Tech Stack:** CSS, fuentes Google (Fraunces, Crimson Pro, Spline Sans Mono), módulos ES existentes.

**Estrategia de prueba:** El diseño es trabajo creativo y se valida **visualmente** (servir con `python -m http.server 8000`, abrir `http://localhost:8000`, recorrer todas las vistas en claro y oscuro). Referencia: `docs/mockups/editorial-mockup.html`. Tras implementar la base, se **itera visualmente con el usuario** para afinar detalles (así se hace el diseño bien). Ninguna funcionalidad debe romperse: todos los `id`/clases/handlers se conservan.

**Riesgo:** medio. Mitigación: no se toca JS de lógica; los cambios son CSS y markup de presentación. Rama propia y verificación visión a vista antes de integrar.

---

## Mapa de archivos

| Archivo | Cambio |
|---|---|
| `index.html` | Cargar fuentes Fraunces + Spline Sans Mono; ajustar `theme-color` |
| `css/styles.css` | Reescritura: variables editoriales (claro+oscuro), tipografía, componentes, letra capital, helpers |
| `js/views.js` | Títulos a Fraunces; numeración editorial en biblioteca; meta mono en el lector |

---

## Task 1: Cargar fuentes editoriales en index.html

**Files:**
- Modify: `index.html` (líneas 7, 11)

- [ ] **Step 1: Añadir Fraunces y Spline Sans Mono**

En `index.html` línea 11, reemplazar el `<link>` de fuentes por:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&family=DM+Sans:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Ajustar el color de tema al terracota editorial**

En `index.html` línea 7, cambiar `content="#C4563A"` por `content="#BC4A2B"`.

- [ ] **Step 3: Verificación**

Run: `python -m http.server 8000`, abrir `http://localhost:8000`, F12 → Network, recargar: confirmar que `fonts.gstatic.com` carga Fraunces y Spline Sans Mono (status 200). La app aún se ve como antes (todavía no aplicamos los estilos).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(diseno): cargar fuentes Fraunces y Spline Sans Mono"
```

---

## Task 2: Reescribir css/styles.css con el sistema editorial

**Files:**
- Modify: `css/styles.css` (reemplazo completo)

- [ ] **Step 1: Reemplazar TODO el contenido de `css/styles.css` por:**

```css
:root{
  --bg:#F4EDDF;--bg2:#FBF7EE;--bg3:#EFE5D4;
  --text:#211C16;--text2:#564B3F;--text3:#8A7C6B;--text4:#B6A78F;
  --border:#E4D9C5;
  --card-shadow:0 1px 2px rgba(74,52,28,.05),0 10px 26px -18px rgba(74,52,28,.22);
  --accent:#BC4A2B;--accent-hover:#98381E;
  --green:#5B7A4F;--gold:#A8822E;
  --display:'Fraunces',Georgia,'Times New Roman',serif;
  --reading:'Crimson Pro',Georgia,serif;
  --mono:'Spline Sans Mono',ui-monospace,SFMono-Regular,monospace;
  --sans:'DM Sans',system-ui,sans-serif;
}
.dark{
  --bg:#19150F;--bg2:#221C15;--bg3:#2B241B;
  --text:#EFE6D5;--text2:#BCAF9B;--text3:#8E826E;--text4:#655B4B;
  --border:#3A3128;
  --card-shadow:0 1px 2px rgba(0,0,0,.4),0 12px 28px -18px rgba(0,0,0,.6);
  --accent:#D9694A;--accent-hover:#E9846A;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--sans);background:var(--bg);min-height:100vh;overflow-x:hidden;color:var(--text);transition:background .3s,color .3s;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.025'/%3E%3C/svg%3E")}
::selection{background:rgba(188,74,43,.22)}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes flipIn{from{transform:rotateX(-10deg);opacity:0}to{transform:rotateX(0);opacity:1}}
@keyframes toastIn{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}

/* Display headings (Fraunces) — los h1/h2 ponen su font-family en linea (Task 3) */
.kicker{font-family:var(--mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent)}

.card{background:var(--bg2);border-radius:10px;border:1px solid var(--border);box-shadow:var(--card-shadow);padding:20px;transition:background .3s,border-color .3s}
.btn{border:none;cursor:pointer;font-family:var(--sans);font-weight:600;border-radius:8px;transition:all .2s;display:inline-flex;align-items:center;gap:8px;font-size:14px}
.btn:hover{transform:translateY(-1px)}.btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
.btn-primary{background:var(--accent);color:#fff;padding:10px 20px}
.btn-primary:hover{background:var(--accent-hover)}
.btn-sm{padding:6px 14px;font-size:13px}
.btn-ghost{background:transparent;color:var(--text2);padding:8px 14px;font-size:13px;border:none;cursor:pointer;font-family:var(--sans);border-radius:8px;transition:all .2s;display:inline-flex;align-items:center;gap:6px}
.btn-ghost:hover{background:rgba(140,120,90,.12)}
.input{border:1.5px solid var(--border);border-radius:8px;padding:10px 14px;font-family:var(--sans);font-size:14px;background:var(--bg2);color:var(--text);outline:none;transition:border-color .2s,background .3s;width:100%}
.input:focus{border-color:var(--accent)}
select.input{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%238A7C6B' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:36px}
textarea.input{resize:vertical;min-height:120px;line-height:1.6;font-family:var(--reading);font-size:16px}
.tag{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:4px;font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:.02em}
.word-span{cursor:pointer;transition:all .15s;border-radius:2px;padding:0 1px}
.word-span:hover{background:rgba(188,74,43,.16)!important}
.nav-btn{border:none;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 14px;border-radius:8px;transition:all .2s;color:var(--text3);font-size:9px;font-family:var(--mono);font-weight:500;letter-spacing:.08em;text-transform:uppercase}
.nav-btn.active{color:var(--accent);background:rgba(188,74,43,.1)}
.nav-btn:hover{color:var(--accent)}
header{background:var(--bg2);border-bottom:1px solid var(--border);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40;transition:background .3s}
main{flex:1;padding:20px 16px;max-width:820px;margin:0 auto;width:100%;padding-bottom:90px}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;background:var(--bg2);border-top:1px solid var(--border);display:flex;justify-content:space-around;padding:6px 0 env(safe-area-inset-bottom,6px);z-index:40;transition:background .3s}
.overlay{position:fixed;inset:0;background:rgba(33,28,22,.45);z-index:50;display:flex;align-items:flex-end;justify-content:center}
@media(min-width:768px){.overlay{align-items:center}}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;box-shadow:0 10px 30px -8px rgba(0,0,0,.3);z-index:70;animation:toastIn .3s ease;max-width:90%;text-align:center;color:#fff}
.bar-chart{display:flex;align-items:flex-end;gap:4px;height:120px;padding-top:10px}
.bar-col{display:flex;flex-direction:column;align-items:center;flex:1;gap:4px}
.bar-fill{width:100%;border-radius:3px 3px 0 0;transition:height .5s ease;min-width:20px;max-width:40px}
.bar-label{font-family:var(--mono);font-size:10px;color:var(--text4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40px}
.bar-value{font-family:var(--mono);font-size:11px;font-weight:500;color:var(--text2)}
.streak-fire{font-size:32px;animation:pulse 2s infinite}
.pct-ring{transform:rotate(-90deg)}
.tag-pill{display:inline-flex;align-items:center;gap:4px;padding:2px 9px;border-radius:999px;font-family:var(--mono);font-size:11px;font-weight:500;background:rgba(188,74,43,.1);color:var(--accent);cursor:pointer;margin:2px}
.tag-pill:hover{background:rgba(188,74,43,.2)}
.auth-container{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--bg)}
.auth-card{max-width:400px;width:100%;animation:fadeIn .4s ease}
.auth-input{margin-bottom:12px}
.auth-error{color:var(--accent);font-size:13px;margin-bottom:12px;text-align:center}
.font-ctrl{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.font-ctrl button{width:32px;height:32px;border-radius:6px;border:1.5px solid var(--border);background:var(--bg2);color:var(--text);font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center}
.font-ctrl button:hover{border-color:var(--accent);color:var(--accent)}

/* Letra capital (drop cap) en el lector — solo CSS, sin tocar markup */
#reader-area p:first-of-type::first-letter{font-family:var(--display);font-weight:500;float:left;font-size:3.6em;line-height:.72;padding:.06em .12em 0 0;color:var(--accent)}

/* Numero de entrada tipo indice (biblioteca) */
.lr-num{font-family:var(--mono);font-size:13px;color:var(--text4);flex-shrink:0;min-width:30px}
```

- [ ] **Step 2: Verificación visual**

Recargar `http://localhost:8000` (Ctrl+Shift+R). La app debe tomar el aspecto editorial: fondo papel crema, tarjetas con borde fino y sombra suave, etiquetas en tipografía mono, navegación inferior en mayúsculas mono. Probar el **modo oscuro** (botón luna): debe verse cálido y coherente, no azulado. El lector debe mostrar **letra capital** en el primer párrafo.

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat(diseno): sistema visual editorial (paleta, tipografia, componentes, modo oscuro, drop cap)"
```

---

## Task 3: Títulos a Fraunces (estilos en línea de views.js)

**Files:**
- Modify: `js/views.js` (líneas 10, 34, 54, 81, 95, 42)

Cada título de página usa hoy `font-family:'Crimson Pro',serif`. Cambiarlo a `font-family:'Fraunces',serif` y, donde indique, peso 400.

- [ ] **Step 1: Auth (línea 10)**

En el `<h1>` "LinguaReader" de la pantalla de login, cambiar `font-family:'Crimson Pro',serif` por `font-family:'Fraunces',serif`.

- [ ] **Step 2: Biblioteca (línea 34)**

En `<h1 ...>Mi Biblioteca</h1>`, cambiar `font-weight:700;font-family:'Crimson Pro',serif` por `font-weight:400;font-family:'Fraunces',serif`.

- [ ] **Step 3: Vocabulario (línea 54)**

En `<h1 ...>Mi Vocabulario</h1>`, cambiar `font-weight:700;font-family:'Crimson Pro',serif` por `font-weight:400;font-family:'Fraunces',serif`.

- [ ] **Step 4: Flashcards (línea 81)**

En `<h1 ...>Repasar</h1>`, cambiar `font-weight:700;font-family:'Crimson Pro',serif` por `font-weight:400;font-family:'Fraunces',serif`.

- [ ] **Step 5: Dashboard (línea 95)**

En `<h1 ...>Mi Progreso</h1>`, cambiar `font-weight:700;font-family:'Crimson Pro',serif` por `font-weight:400;font-family:'Fraunces',serif`.

- [ ] **Step 6: Lector (línea 42)**

El título del lector `<h2 style="font-size:20px;font-weight:600;overflow:hidden;...">` no tiene fuente display. Cambiar `font-size:20px;font-weight:600;` por `font-size:24px;font-weight:400;font-family:'Fraunces',serif;`.

- [ ] **Step 7: Verificación**

Recargar. Los títulos de cada sección deben verse en Fraunces (serif editorial, elegante), más grandes y de trazo fino.

- [ ] **Step 8: Commit**

```bash
git add js/views.js
git commit -m "feat(diseno): titulos de seccion en Fraunces"
```

---

## Task 4: Biblioteca como índice editorial (numeración + hairline)

**Files:**
- Modify: `js/views.js` (línea 37–38)

- [ ] **Step 1: Añadir el número de orden a cada entrada**

En el bucle de la biblioteca (línea 37), cambiar la apertura del bucle para tener el índice. Reemplazar:

```js
else{h+=`<div style="display:flex;flex-direction:column;gap:12px">`;for(const it of S.library){const comp=getComprehension(it.id);
```

por:

```js
else{h+=`<div style="display:flex;flex-direction:column;gap:0">`;let _n=0;for(const it of S.library){const comp=getComprehension(it.id);_n++;
```

- [ ] **Step 2: Mostrar el número dentro de la tarjeta**

En la línea 38, justo después de `onclick="setState({currentTextId:'${it.id}',view:'reader'})">`, insertar el número como una columna mono. Cambiar el fragmento:

```js
<div style="flex:1;min-width:0" onclick="setState({currentTextId:'${it.id}',view:'reader'})"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
```

por:

```js
<div style="flex:1;min-width:0;display:flex;gap:14px" onclick="setState({currentTextId:'${it.id}',view:'reader'})"><span class="lr-num">${String(_n).padStart(2,'0')}</span><div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
```

Y cerrar el `<div>` extra que abrimos: al final de ese bloque de contenido, antes de `<div style="display:flex;gap:4px;flex-shrink:0">` (los botones de idioma/borrar), añadir un `</div>` de cierre. Es decir, cambiar:

```js
...${new Date(it.dateAdded).toLocaleDateString('es')}</div></div><div style="display:flex;gap:4px;flex-shrink:0">
```

por:

```js
...${new Date(it.dateAdded).toLocaleDateString('es')}</div></div></div><div style="display:flex;gap:4px;flex-shrink:0">
```

- [ ] **Step 3: Dar a la tarjeta de biblioteca aspecto de entrada con línea fina**

En la línea 38, en la `<div class="card" ...>` de cada texto, cambiar `class="card"` por `class="card lr-entry"` y añadir al final de styles.css (en Task 2 ya está el sistema; aquí añadimos la regla específica):

En `css/styles.css`, añadir:

```css
.lr-entry{border-radius:0;border:none;border-bottom:1px solid var(--border);box-shadow:none;background:none;padding:22px 4px;transition:background .25s,padding .25s}
.lr-entry:hover{background:linear-gradient(90deg,rgba(188,74,43,.05),transparent 70%);padding-left:12px}
```

- [ ] **Step 4: Verificación**

Recargar. La biblioteca debe verse como un **índice de revista**: entradas numeradas (01, 02…), separadas por líneas finas en lugar de tarjetas con sombra, con un sutil resaltado al pasar el cursor. Confirmar que al hacer clic en una entrada abre el lector, y que el selector de idioma y el botón de borrar siguen funcionando (no se rompió el cierre de `<div>`s).

- [ ] **Step 5: Commit**

```bash
git add js/views.js css/styles.css
git commit -m "feat(diseno): biblioteca como indice editorial numerado"
```

---

## Task 5: Lector — línea de meta en mono

**Files:**
- Modify: `js/views.js` (línea 42)

- [ ] **Step 1: Estilizar la meta del lector en mono**

En la línea 42, el `<span>` con la meta del lector usa el estilo por defecto. Cambiar:

```js
<span style="color:var(--text3);font-size:13px">${LANGS[lang]} • ${comp.pct}% comprensión (${comp.known}/${comp.total} palabras)</span>
```

por:

```js
<span style="color:var(--text3);font-size:11px;font-family:var(--mono);letter-spacing:.04em;text-transform:uppercase">${LANGS[lang]} · ${comp.pct}% comprensión · ${comp.known}/${comp.total} palabras</span>
```

- [ ] **Step 2: Verificación**

Recargar, abrir un texto en el lector. La línea bajo el título debe verse en tipografía mono, en mayúsculas pequeñas (estilo créditos de revista). La letra capital del primer párrafo ya debe estar presente (de la Task 2).

- [ ] **Step 3: Commit**

```bash
git add js/views.js
git commit -m "feat(diseno): meta del lector en estilo editorial mono"
```

---

## Task 6: Verificación visual completa + iteración

**Files:** ninguno (revisión).

- [ ] **Step 1: Servir y recorrer todas las vistas**

Run: `python -m http.server 8000` → `http://localhost:8000`, iniciar sesión y revisar en **modo claro y oscuro**:

- [ ] Pantalla de login (Fraunces en el título, paleta papel)
- [ ] Biblioteca (índice numerado, hairlines, hover)
- [ ] Lector (letra capital, meta mono, texto legible)
- [ ] Vocabulario (tarjetas, etiquetas mono, edición)
- [ ] Flashcards (tarjeta legible — la estructura Refold llega en la Fase 5)
- [ ] Dashboard (stats, gráfico, barras con números mono)
- [ ] Modales (pegar, etiqueta), popup de traducción, toast, confirmación
- [ ] Header y navegación inferior (mono en mayúsculas)

- [ ] **Step 2: Confirmar que nada de la funcionalidad se rompió**

Traducir+guardar, editar palabra/traducción/nota/etiqueta, repasar y responder flashcards, subir/pegar texto, exportar CSV, modo oscuro, tamaño de fuente.

- [ ] **Step 3: Iteración visual con el usuario**

Mostrar el resultado al usuario (abrir la app) y comparar con `docs/mockups/editorial-mockup.html`. Ajustar detalles que pida (tamaños, intensidad del acento, espaciado). Cada ajuste: editar `css/styles.css`/`js/views.js`, recargar, confirmar, commit.

- [ ] **Step 4: Commit final (si hubo ajustes)**

```bash
git add -A
git commit -m "style(diseno): ajustes finales de la iteracion visual editorial"
```

---

## Self-Review (cobertura del spec — Fase 3)

- **"Tipografía: Fraunces (display) + Crimson Pro (lectura) + Spline Sans Mono (meta/etiquetas)"** → Task 1 carga las fuentes; Task 2 las cablea en variables y componentes (mono en tags, nav, barras); Task 3 pone los títulos en Fraunces; el lector sigue en Crimson Pro. ✓
- **"Color: papel crema, tinta casi negra, terracota de acento; verde/ámbar para niveles"** → Task 2 variables claro/oscuro; los colores de nivel (LEVELS) se conservan en JS. ✓
- **"Composición: menos cajas con sombra, más líneas finas y aire; biblioteca como índice numerado; hairlines"** → Task 2 (.card con borde fino) + Task 4 (.lr-entry numerado con hairline). ✓
- **"Lector: letra capital, texto justificado conservado, palabras con subrayado por nivel"** → Task 2 (drop cap por CSS); el coloreado por nivel ya existe (`wordStyle`). ✓
- **"Detalles: textura de papel sutil, animaciones de entrada (fadeIn existentes), hover con acento en entradas"** → Task 2 (grano SVG en body) + Task 4 (hover de entrada). ✓
- **"Modo oscuro coherente con la nueva paleta (mantener toggle)"** → Task 2 (.dark editorial); el toggle no se toca. ✓
- **"No romper interacciones por el cambio de markup/clases"** → Tasks 4/5 conservan todos los `id`/handlers; Task 6 lo verifica. ✓

Sin placeholders. Consistencia: las clases nuevas (`.kicker`, `.lr-num`, `.lr-entry`) se definen en Task 2/4 y se usan en Task 4; las variables (`--display`, `--mono`, `--reading`, `--sans`) se definen en Task 2 y se referencian después.
```
