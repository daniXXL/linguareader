# Fase 6 — Repaso estilo Anki — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afinar el algoritmo de repaso de LinguaReader para que se comporte como Anki: "Difícil" no reinicia, "Fácil" no saca la palabra del mazo, y "Aprendida" pasa a significar "madura" (intervalo ≥ 21 días) sin dejar de ser repasable.

**Architecture:** El cambio vive en tres archivos que ya colaboran en el repaso: `js/utils.js` (la función pura `sm2`), `js/config.js` (una constante nueva `MATURE_DAYS`) y `js/actions.js` (`answerFc`, `startFc`, `getStats`). No se toca la UI ni el modelo de datos en Firestore: las flashcards siguen guardando `{easeFactor, interval, repetitions, nextReview}` y el vocabulario sigue usando los niveles `unknown/recognized/learned`. Cambia solo *cómo* se calculan los intervalos y *qué* tarjetas entran al mazo.

**Tech Stack:** JS módulos ES estáticos (sin build, sin framework de tests). **Node no está disponible**, así que la verificación de cada tarea es manual en el navegador / consola DevTools, no con un runner. Cada paso de "test" abajo es una comprobación concreta en la consola del navegador o una verificación visual.

**Compatibilidad:** Retrocompatible. Las flashcards existentes tienen los mismos campos; solo cambia el cálculo a partir del próximo repaso. Ninguna migración de datos.

---

### Task 1: Constante de madurez en config.js

**Files:**
- Modify: `js/config.js` (junto a las constantes `SM2Q`/`SM2L`/`SM2C`, línea ~18)

- [ ] **Step 1: Añadir la constante `MATURE_DAYS`**

En `js/config.js`, justo después de la línea que define `SM2Q`/`SM2L`/`SM2C`, añadir:

```js
// Umbral de "madurez" estilo Anki: una tarjeta con intervalo >= MATURE_DAYS días se marca "Aprendida".
export const MATURE_DAYS=21;
```

- [ ] **Step 2: Verificar en consola**

Servir con `python -m http.server 8000`, abrir `http://localhost:8000`, y en la consola DevTools:

```js
import('./js/config.js').then(m=>console.log(m.MATURE_DAYS))
```

Expected: imprime `21`. Sin errores de import.

- [ ] **Step 3: Commit**

```bash
git add js/config.js
git commit -m "feat(fase6): constante MATURE_DAYS (umbral de madurez estilo Anki)"
```

---

### Task 2: Reescribir `sm2` con la lógica Anki

**Files:**
- Modify: `js/utils.js` (la función `sm2`, línea 5)

**Contexto del comportamiento deseado (4 calificaciones, q = 0/2/3/5):**
- **q=0 "No la sé" (again):** única que reinicia. `repetitions=0`, `interval=1`, facilidad baja fuerte (`-0.20`, mínimo 1.3).
- **q=2 "Difícil" (hard):** NO reinicia. Avanza con intervalo corto `max(interval+1, round(interval*1.2))` (en tarjeta nueva → 1 día); `repetitions++`; facilidad baja un poco (`-0.15`, mínimo 1.3).
- **q=3 "Regular" (good):** avance SM-2 clásico (`r=0→1`, `r=1→6`, si no `round(interval*ease)`); `repetitions++`; facilidad sin cambio.
- **q=5 "Fácil" (easy):** avance con bonus `×1.3` (tarjeta nueva → 4 días); `repetitions++`; facilidad sube (`+0.15`). La palabra **permanece** en el mazo (eso se gestiona en Task 3/4, no aquí).

- [ ] **Step 1: Reemplazar la función `sm2`**

Reemplazar la línea 5 de `js/utils.js` (la actual `export function sm2(...){...}`) por:

```js
export function sm2(c,q){
  let{easeFactor:e=2.5,interval:i=0,repetitions:r=0}=c;
  if(q===0){            // No la sé — reinicia (relearning)
    r=0;i=1;e=Math.max(1.3,e-0.2);
  }else if(q===2){      // Difícil — no reinicia, intervalo corto
    i=i<1?1:Math.max(i+1,Math.round(i*1.2));r++;e=Math.max(1.3,e-0.15);
  }else if(q===5){      // Fácil — bonus, permanece en el mazo
    i=r===0?4:Math.round((r===1?6:i*e)*1.3);r++;e=e+0.15;
  }else{                // Regular — avance SM-2 clásico
    i=r===0?1:r===1?6:Math.round(i*e);r++;
  }
  const n=new Date;n.setDate(n.getDate()+i);
  return{easeFactor:e,interval:i,repetitions:r,nextReview:n.toISOString()};
}
```

- [ ] **Step 2: Verificar la lógica en consola**

En la consola DevTools de `http://localhost:8000`:

```js
import('./js/utils.js').then(({sm2})=>{
  const base={easeFactor:2.5,interval:10,repetitions:3};
  console.log('again',sm2(base,0)); // interval=1, repetitions=0, ease=2.3
  console.log('hard ',sm2(base,2)); // interval=12 (round(10*1.2)), repetitions=4, ease=2.35
  console.log('good ',sm2(base,3)); // interval=25 (round(10*2.5)), repetitions=4, ease=2.5
  console.log('easy ',sm2(base,5)); // interval=33 (round(25*1.3)), repetitions=4, ease=2.65
  console.log('hard nueva',sm2({},2)); // interval=1
  console.log('easy nueva',sm2({},5)); // interval=4
});
```

Expected:
- `again` → `interval:1, repetitions:0, easeFactor:2.3`
- `hard` → `interval:12, repetitions:4, easeFactor:2.35`
- `good` → `interval:25, repetitions:4, easeFactor:2.5`
- `easy` → `interval:33, repetitions:4, easeFactor:2.65`
- `hard nueva` → `interval:1`
- `easy nueva` → `interval:4`

(Comprobar especialmente que **`hard` ya NO da `interval:1`** sobre una tarjeta madura — esa era la regresión a corregir.)

- [ ] **Step 3: Commit**

```bash
git add js/utils.js
git commit -m "feat(fase6): sm2 estilo Anki — Difícil no reinicia, Fácil con bonus, solo No-la-sé relearning"
```

---

### Task 3: `answerFc` — niveles por madurez, no por exclusión

**Files:**
- Modify: `js/actions.js` (`answerFc`, líneas 25-26; import de `MATURE_DAYS`)

**Contexto:** Hoy `answerFc` hace `level = q===5 ? 'learned' : 'recognized'` solo si `q>=3`. Eso marcaba "Fácil" como learned → la sacaba del mazo (porque `startFc` excluía learned). Nuevo mapeo, determinista a partir del resultado del cálculo:
- intervalo resultante `>= MATURE_DAYS` → `level='learned'` (madura)
- `q===0` (falló) → `level='unknown'` (lapse: baja la comprensión)
- en otro caso → `level='recognized'`

Además, fijar `dateModified` para que la gráfica semanal del dashboard (que cuenta "Aprendidas" por `dateModified`) siga funcionando.

- [ ] **Step 1: Asegurar el import de `MATURE_DAYS`**

Mirar la primera línea de imports de `js/actions.js`. Si importa de `./config.js`, añadir `MATURE_DAYS` a ese import. Si no hay import de config, añadir al principio del archivo:

```js
import {MATURE_DAYS} from './config.js';
```

(Verificar primero qué se importa ya de `./config.js` para no duplicar la línea — fusionar en el import existente: `import {LEVELS, MATURE_DAYS} from './config.js';` o lo que corresponda.)

- [ ] **Step 2: Reemplazar `answerFc`**

Reemplazar la función `answerFc` (líneas 25-26) por:

```js
export function answerFc(q){const k=S.flashcardDeck[S.fcIndex];const fc=sm2(S.flashcards[k]||{},q);S.flashcards[k]=fc;saveFc();
if(S.vocabulary[k]){const v=S.vocabulary[k];v.level=fc.interval>=MATURE_DAYS?'learned':(q===0?'unknown':'recognized');v.dateModified=new Date().toISOString();saveVoc()}
recordStudy();
if(S.fcIndex+1<S.flashcardDeck.length)setState({fcIndex:S.fcIndex+1,fcFlipped:false});else setState({flashcardDeck:[],fcFlipped:false})}
```

- [ ] **Step 3: Verificar en el navegador**

Recargar (Ctrl+Shift+R), iniciar sesión, ir a **Repasar** y calificar una tarjeta con cada botón. En consola, inspeccionar tras cada respuesta:

```js
console.log(S.vocabulary[Object.keys(S.flashcards)[0]].level, S.flashcards[Object.keys(S.flashcards)[0]].interval)
```

Expected:
- Tras "Fácil" varias veces sobre la misma palabra, el intervalo crece y **la palabra no desaparece** del mazo "Todas".
- Cuando el intervalo llega a ≥ 21, el nivel pasa a `learned` pero la tarjeta sigue existiendo.
- Tras "No la sé", el nivel pasa a `unknown` y el intervalo vuelve a 1.

- [ ] **Step 4: Commit**

```bash
git add js/actions.js
git commit -m "feat(fase6): answerFc marca nivel por madurez (>=MATURE_DAYS) y lapse en No-la-sé"
```

---

### Task 4: `startFc` y `getStats` — el mazo deja de excluir "Aprendida"

**Files:**
- Modify: `js/actions.js` (`startFc` línea 23; `getStats` línea 35)

**Contexto:** Hoy `startFc` y `getStats` excluyen `v.level==='learned'`. Como ahora "learned" = madura (repasable), deben dejar de excluirlas: el mazo "Pendientes" muestra **todas las vencidas** (`nextReview <= now`), y "Todas" muestra todas las que tengan flashcard. Los contadores `dueToday`/`allCards` se ajustan igual.

- [ ] **Step 1: Reemplazar `startFc`**

Reemplazar `startFc` (línea 23) por:

```js
export function startFc(mode){const m=mode||S.fcMode;const now=new Date();const deck=Object.keys(S.flashcards).filter(k=>{const v=S.vocabulary[k];if(!v)return false;if(S.fcLangFilter!=='all'&&v.language!==S.fcLangFilter)return false;if(m==='due'){const fc=S.flashcards[k];return!fc.nextReview||new Date(fc.nextReview)<=now}return true});deck.sort(()=>Math.random()-.5);setState({flashcardDeck:deck,fcIndex:0,fcFlipped:false,fcMode:m})}
```

(Único cambio respecto al original: se quita `||v.level==='learned'` de la condición de exclusión.)

- [ ] **Step 2: Reemplazar el cálculo de `dueToday` y `allCards` en `getStats`**

En `getStats` (línea 35), localizar las dos expresiones y quitarles la exclusión de learned:

`dueToday` pasa de:
```js
dueToday:Object.keys(S.flashcards).filter(k=>{const v=S.vocabulary[k];if(!v||v.level==='learned')return false;const f=S.flashcards[k];return!f.nextReview||new Date(f.nextReview)<=now}).length,
```
a:
```js
dueToday:Object.keys(S.flashcards).filter(k=>{const v=S.vocabulary[k];if(!v)return false;const f=S.flashcards[k];return!f.nextReview||new Date(f.nextReview)<=now}).length,
```

`allCards` pasa de:
```js
allCards:Object.keys(S.flashcards).filter(k=>{const v=S.vocabulary[k];return v&&v.level!=='learned'}).length
```
a:
```js
allCards:Object.keys(S.flashcards).filter(k=>{const v=S.vocabulary[k];return !!v}).length
```

(`total/unknown/recognized/learned` se quedan igual.)

- [ ] **Step 3: Verificar en el navegador**

Recargar, iniciar sesión. En consola:

```js
import('./js/actions.js').then(({getStats})=>console.log(getStats()))
```

Expected: `allCards` ahora incluye también las palabras "Aprendidas" que tengan flashcard; `dueToday` cuenta cualquier tarjeta vencida sin importar el nivel. Visualmente, los botones "Pendientes (n)" y "Todas (n)" de la vista Repasar reflejan los nuevos conteos, y una palabra madura vencida aparece de nuevo para repasar.

- [ ] **Step 4: Commit**

```bash
git add js/actions.js
git commit -m "feat(fase6): startFc/getStats dejan de excluir las maduras; mazo = todas las vencidas"
```

---

## Self-Review (checklist del autor del plan)

**Cobertura del spec (Fase 6):**
- ✅ "Difícil no reinicia" → Task 2 (rama `q===2`).
- ✅ "Fácil no saca del mazo" → Task 2 (bonus sin marcar learned-excluyente) + Task 4 (startFc no excluye).
- ✅ "Solo No-la-sé reinicia/relearning" → Task 2 (rama `q===0`).
- ✅ "Aprendida = madura (≥21d), sigue repasable" → Task 1 (constante) + Task 3 (mapeo por intervalo) + Task 4 (no exclusión).
- ✅ "Conteo de pendientes se ajusta" → Task 4 (`getStats`).
- ✅ "Retrocompatible, mismos campos" → ningún cambio de esquema.

**Consistencia de tipos/firmas:** `sm2(c,q)` mantiene firma y forma de retorno `{easeFactor, interval, repetitions, nextReview}`. `MATURE_DAYS` se define en config.js (Task 1) y se usa en actions.js (Task 3). `startFc`/`getStats`/`answerFc` conservan sus firmas.

**Sin placeholders:** todos los pasos muestran el código exacto.

**Nota de criterios de aceptación del spec (sección Verificación):**
- [ ] "Difícil" da intervalo corto pero NO reinicia → Task 2.
- [ ] "Fácil" agranda el intervalo pero sigue en el mazo → Task 2 + Task 4.
- [ ] Intervalo ≥ 21 días → "Aprendida" pero vuelve al vencer → Task 3 + Task 4.
