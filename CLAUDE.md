# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

LinguaReader: app web de aprendizaje de idiomas estilo LingQ. Se leen textos (PDF/pegar),
se tocan palabras para traducirlas y guardarlas por nivel, y se repasan con repetición
espaciada (SM-2). **Sitio estático, sin paso de compilación.** Firebase (Auth + Firestore)
para login y datos. UI en español.

## Comandos

- **Servir localmente:** `python -m http.server 8000` y abrir `http://localhost:8000`.
  Obligatorio usar HTTP — los módulos ES no cargan con `file://`. No abrir `index.html` directo.
- **Build:** no hay. Es estático; los archivos se sirven tal cual.
- **Tests:** no hay framework de tests, y Node no está disponible en este entorno. La
  **verificación es manual en el navegador** e implica iniciar sesión en Firebase (solo lo
  puede hacer el usuario humano). Tras cambios, pídele al usuario que verifique en el navegador.
- **Desplegar:** `git push origin main`. **Netlify republica automáticamente** a
  https://iridescent-gnome-44a0db.netlify.app — es decir, **push a `main` = publicar a usuarios
  reales**. Verificar en local antes de unir a `main`.

## Arquitectura

`index.html` carga los CDN (pdf.js, Firebase compat) como `<script>` clásicos y luego
`js/app.js` como `<script type="module">`. El CSS vive en `css/styles.css`. Toda la lógica
está en módulos ES en `js/`:

- `config.js` — init de Firebase (usa el global `firebase`), constantes (`LANGS`, `LANG_VOICE`,
  `LEVELS`, `SM2*`, `MATURE_DAYS`, `MAX_TEXT_BYTES`, `FP`) e iconos SVG (`I`).
- `state.js` — el objeto de estado global `S`, `setState`, `showToast`.
- `db.js` — Firestore: rutas por usuario `users/{uid}/...`, guardado con debounce, `loadAll`.
- `utils.js` — lógica pura: `sm2` (programación de repaso estilo Anki, ver convención abajo),
  `fmtDays` (formato de intervalo: minutos/días/meses), `detectLang`, `getStreak`, `extractPdf`,
  `speak` (TTS), `exportCSV`, **`escapeHtml`**, `cleanDefs` (limpieza/dedup de definiciones).
- `translate.js` — `translateText` (MyMemory + dictionaryapi.dev, con caché y manejo de límite).
- `auth.js` — login/registro/logout.
- `actions.js` — acciones de dominio y selectores (`addText`, `saveWord`, `startFc`, `answerFc`,
  `fcInterval`, `getStats`, `getComprehension`, etc.).
- `readaloud.js` — lector en voz alta (read-along) frase por frase: resalta la frase actual y
  avanza con TTS. `render()` llama a `resetReadAloud()` porque reconstruye el DOM del lector.
- `views.js` — `render()` y `handleRI()`: construye todo el HTML como string y lo asigna a
  `innerHTML`. Aquí están todas las vistas.
- `app.js` — punto de entrada: importa todo, **expone funciones y `S` en `window`**, registra
  `onAuthStateChanged` y hace el `render()` inicial.

### Convenciones críticas (no obvias)

- **Manejadores en línea + `window`:** las vistas usan `onclick="fn(...)"` en el HTML generado,
  que se ejecuta en ámbito global. Con módulos ES nada es global, así que `app.js` hace
  `Object.assign(window, {...})` con exactamente las funciones y `S` que esos handlers usan.
  **Al añadir una función llamada desde un `on*=""` en línea, hay que exponerla en `window` en
  `app.js`**, o el clic lanzará `ReferenceError`. (`window.S` y la `S` importada son el mismo
  objeto.) Migrar estos handlers a `addEventListener` es trabajo futuro pendiente.
- **`render()` reconstruye todo:** cada `setState` vuelve a generar el `innerHTML` completo (no
  hay DOM virtual). Por eso los inputs en edición usan estado en `S` y se reenfocan al final de
  `render()`.
- **XSS — `escapeHtml`:** todo dato de usuario o de API externa (títulos, palabras, notas,
  traducciones, contenido del lector que viene de PDF/pegar) debe pasar por `escapeHtml` antes
  de interpolarse en el `innerHTML`. Excepción: NO escapar los iconos `I.*` ni texto fijo de la
  app. Los datos embebidos dentro de `onclick="...'${x}'..."` (contexto JS) usan el escape
  antiguo `.replace(/'/g,"\\'")` y quedan fuera de ese tratamiento (se arreglarán al migrar a
  addEventListener).
- **CSS por variables:** la apariencia se controla con variables CSS (`--bg`, `--text`,
  `--accent`, `--display`/`--reading`/`--mono`/`--sans`…) en `:root` y `.dark`. Redefinir
  variables propaga el cambio a casi toda la UI. Dirección visual: "Editorial / Revista"
  (Fraunces display, Crimson Pro lectura, Spline Sans Mono etiquetas; paleta papel + terracota).
- **Modelo de datos:** Firestore aísla por usuario (reglas: `request.auth.uid == userId`). El
  vocabulario se indexa por clave `idioma:palabra` (p. ej. `en:have`). Las flashcards comparten
  esa misma clave. Cada texto se guarda como un documento (límite ~1 MB; hay guarda en `addText`).
- **Repaso estilo Anki (`sm2` en utils.js):** la flashcard guarda `{easeFactor, interval,
  repetitions, nextReview}`; `interval` está en **días pero puede ser fracción** (los pasos de
  aprendizaje son minutos). Cartas en aprendizaje (`repetitions<2`) usan pasos cortos
  (Difícil 5-10 min, Regular 10 min → 1 día, Fácil gradúa a días); al graduarse pasan a la fase
  multiplicativa. Invariante: el intervalo crece en orden **No la sé ≤ Difícil ≤ Regular ≤ Fácil**
  (si tocas esta función, mantenlo). Solo "No la sé" (q=0) reinicia, y `answerFc` la **re-encola
  en la misma sesión**. El nivel `learned` = "madura" se asigna solo cuando `interval >=
  MATURE_DAYS` (21); el mazo (`startFc`/`getStats`) ya **no** excluye las maduras. `fcInterval(q)`
  calcula la etiqueta del próximo intervalo que se muestra bajo cada botón de calificación.

## Flujo de trabajo del proyecto

El trabajo está organizado por fases con specs y planes en `docs/superpowers/`:
- Specs de diseño: `docs/superpowers/specs/`
- Planes de implementación: `docs/superpowers/plans/`
- Mockup visual de referencia: `docs/mockups/editorial-mockup.html`

**Las 6 fases están completas y publicadas:** Fase 1 (refactor a módulos), Fase 2 (seguridad:
XSS, límite de traducción, textos grandes), Fase 3 (rediseño editorial), Fase 4 (lector con audio
read-along — `readaloud.js`), Fase 5 (flashcards Refold: definiciones/formas irregulares + audio),
Fase 6 (repaso estilo Anki — pasos de aprendizaje, orden garantizado, tiempos por botón,
"Aprendida"=madura). Cada fase: rama propia → revisión → verificación en navegador → unir a `main`.

Si hay trabajo nuevo, sigue el mismo flujo (spec en `specs/`, plan en `plans/`, rama, verificación
en navegador por el usuario antes de unir a `main`).
