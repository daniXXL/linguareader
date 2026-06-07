# Diseño: Refactor a módulos + arreglos de seguridad — LinguaReader

**Fecha:** 2026-06-07
**Estado:** Aprobado (pendiente de revisión final del usuario)
**Objetivo del proyecto:** Preparar LinguaReader para lanzarse a usuarios reales.

## Contexto

LinguaReader es una app de aprendizaje de idiomas (estilo LingQ) construida hoy como
un único archivo `index.html` (~369 líneas, JS/CSS minificado en línea). Funciona de
punta a punta: login con Firebase, subir/pegar textos (PDF o texto), tocar palabras
para traducirlas y guardarlas con nivel, y repasarlas con repetición espaciada (SM-2).
Incluye dashboard, rachas, etiquetas, modo oscuro, exportar CSV y text-to-speech.

La app **hoy funciona**. El mayor riesgo de este trabajo es romper algo que ya servía,
así que el refactor debe ser conservador y verificado.

## Decisiones tomadas

- **Meta:** lanzar a usuarios reales.
- **Reglas de Firestore:** ya están correctas y seguras (cada usuario solo accede a sus
  propios datos: `request.auth.uid == userId` con `{document=**}`). No se tocan.
- **Traducción:** mantener gratis por ahora — seguir con MyMemory, añadiendo el email
  gratuito (sube el límite a ~50.000 palabras/día) y manejando bien el error de límite.
- **Estrategia:** refactorizar primero, luego aplicar los arreglos de seguridad sobre la
  base ya limpia.
- **Técnica:** módulos JS nativos del navegador (`<script type="module">`), **sin paso de
  compilación**. La app sigue siendo 100% estática y se despliega igual que hoy.
- **Rediseño visual:** dirección **"Editorial / Revista"** aprobada por el usuario a partir
  de un mockup real (`docs/mockups/editorial-mockup.html`). Se aplica en la Fase 3.

## Fuera de alcance (explícito)

- No cambiar el sistema de render (hoy reconstruye todo el DOM con `innerHTML` en cada
  cambio). Queda para una iteración futura.
- No reemplazar los manejadores `onclick` en línea por `addEventListener`.
- No introducir frameworks ni herramientas de build (Vite, etc.).
- No cambiar de proveedor de traducción a uno de pago.
- No PWA, accesibilidad avanzada ni más idiomas (iteraciones futuras).

## Fase 1 — Refactor (sin cambiar comportamiento)

Separar `index.html` en archivos por responsabilidad:

```
index.html        → HTML base + carga de scripts (Firebase/pdf.js CDN, luego módulos)
css/styles.css    → todos los estilos (hoy en <style>)
js/config.js      → init de Firebase + constantes (LANGS, LANG_VOICE, LEVELS, SM2*, FP) + iconos (I)
js/state.js       → estado global S, setState, showToast
js/db.js          → helpers de Firestore (userDoc, dbSave, saveLib/Voc/Fc/..., loadAll, saveTxt, delTxt)
js/utils.js       → sm2, detectLang, getStreak, todayStr, extractPdf, speak, exportCSV, escapeHtml (Fase 2)
js/translate.js   → translateText, handleTranslate, translateVocabWord
js/views.js       → render() y todas las vistas (auth, library, reader, vocabulary, flashcards, dashboard, modales)
js/app.js         → arranque (onAuthStateChanged), wiring de eventos del reader, y exposición de globals
```

### Punto técnico crítico: manejadores en línea

El código actual usa abundantes manejadores en línea, p. ej.
`onclick="setState({view:'library'})"` y otros que referencian directamente el estado y
helpers, p. ej. `onclick="S.vocabulary['k'].translation=...;saveVoc();render()"`.

Con módulos ES, el ámbito superior **no** es global, así que esas referencias dejarían de
existir y los clics dejarían de funcionar.

**Solución conservadora:** en `js/app.js`, exponer explícitamente al objeto `window` el
estado y las funciones que los manejadores en línea referencian. Lista a exponer (derivada
de los `onclick`/`onchange`/`oninput` del HTML actual):

- Estado y núcleo: `S`, `setState`, `render`, `showToast`
- Auth: `doLogin`, `doRegister`, `doResetPassword`, `doLogout`
- Biblioteca/lector: `handleFile`, `addText`, `deleteText`, `setTextLang`, `handleTranslate`
- Vocabulario: `translateVocabWord`, `saveWord`, `addTag`, `removeTag`, `exportCSV`
- Flashcards: `startFc`, `answerFc`
- Persistencia referida en línea: `saveVoc`, `saveFc`, `saveLib`
- Otros: `speak`

Con esto, el comportamiento queda **idéntico**; solo cambia la organización del código.
(Migrar estos manejadores a `addEventListener` es trabajo futuro, fuera de alcance.)

### Orden de carga

1. Scripts CDN como scripts normales en `<head>`/`<body>` (Firebase compat, pdf.js) —
   siguen exponiendo `firebase` y `pdfjsLib` como globales, que los módulos consumen.
2. `js/app.js` como `type="module"` (se difiere automáticamente y corre tras parsear el DOM),
   importando del resto de módulos.

## Fase 2 — Arreglos de seguridad (sobre la base ya limpia)

1. **XSS (`utils.js` + `views.js`):** añadir `escapeHtml(str)` y aplicarla a **todo dato
   proveniente del usuario** antes de interpolarlo en `innerHTML`: palabras de vocabulario,
   notas, títulos de texto, traducciones, etiquetas, nombre de usuario, contenido del
   reader. Hoy el escapado es inconsistente (a veces solo `&quot;`).
2. **Límite de traducción (`translate.js`):** añadir el email del usuario a las llamadas a
   MyMemory (`&de=<email>`); detectar la respuesta de límite excedido y mostrar un mensaje
   claro al usuario en vez de un genérico "Error al traducir".
3. **Textos grandes (`db.js`):** antes de guardar un texto, comprobar su tamaño; si se
   acerca/supera el límite de 1 MB por documento de Firestore, avisar con un toast claro y
   no dejar la app en un estado inconsistente.

## Fase 3 — Rediseño visual ("Editorial / Revista")

Se aplica sobre `css/styles.css` (ya extraído en Fase 1) y los marcadores de las vistas en
`views.js`, **sin cambiar la lógica ni el flujo**. Referencia visual aprobada:
`docs/mockups/editorial-mockup.html`.

Características de la dirección:

- **Tipografía:** *Fraunces* (serif editorial) para títulos/display; *Crimson Pro* para el
  texto de lectura; *Spline Sans Mono* en minúsculas/espaciado para etiquetas, datos y meta.
- **Color:** papel crema cálido (`--paper #F6EFE2`), tinta casi negra (`--ink #221D17`),
  terracota como acento puntual (`--accent #BC4A2B`); ámbar y verde para niveles de palabra.
- **Composición:** menos cajas con sombra, más líneas finas y aire; biblioteca como "índice
  de revista" con textos numerados (01, 02, 03); separadores hairline entre entradas.
- **Lector:** estilo artículo — letra capital (drop cap) en el primer párrafo, texto
  justificado, palabras guardadas con subrayado de color según nivel.
- **Detalles:** textura de papel sutil (grano SVG), animación de entrada escalonada,
  hover con barra de acento en las entradas.
- **Modo oscuro:** adaptar la paleta editorial a una variante oscura coherente (mantener el
  toggle existente).

Aplicación cuidando no romper comportamiento: se reescriben estilos y clases/markup de
presentación; los `id`/manejadores que usa el JS se conservan o se actualizan en conjunto.

## Verificación (sin tests automáticos)

Lista de verificación manual a ejecutar tras cada fase. Nada se da por terminado hasta que
pase:

- [ ] Cargar la app sin errores en consola (pantalla de login)
- [ ] Registro e inicio de sesión
- [ ] Subir un PDF y un .txt
- [ ] Pegar texto
- [ ] En el lector: tocar palabra → traducir → guardar en cada nivel
- [ ] Modo selección: seleccionar frase → traducir
- [ ] Vocabulario: ver, editar palabra/traducción/nota, etiquetar, filtrar, agrupar, borrar
- [ ] Flashcards: repasar (pendientes y todas), responder, racha
- [ ] Dashboard: stats, gráfico semanal, idiomas, comprensión
- [ ] Modo oscuro, tamaño de fuente, exportar CSV
- [ ] Cerrar sesión

Para Fase 2, además:
- [ ] Una nota/título con `<img src=x onerror=alert(1)>` se muestra como texto, no se ejecuta
- [ ] Mensaje claro al exceder el límite de traducción
- [ ] Aviso al intentar guardar un texto demasiado grande

Para Fase 3, además:
- [ ] Todas las vistas reflejan la dirección editorial (biblioteca, lector, vocabulario,
      flashcards, dashboard, modales, auth)
- [ ] El modo oscuro se ve coherente con la nueva paleta
- [ ] La lectura sigue siendo legible (tamaños, contraste) en móvil y escritorio
- [ ] Ninguna interacción se rompió por el cambio de markup/clases

## Riesgos y mitigación

- **Riesgo:** romper manejadores en línea al modularizar. **Mitigación:** exponer globals en
  `app.js` (lista arriba); verificar con la checklist manual.
- **Riesgo:** orden/timing de carga de Firebase vs módulos. **Mitigación:** mantener los CDN
  como scripts clásicos previos; los módulos se difieren por defecto.
- **Riesgo:** regresiones sutiles. **Mitigación:** refactor mecánico (mover, no reescribir);
  comparar comportamiento contra la versión actual.
