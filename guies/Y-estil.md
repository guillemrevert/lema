# Guia Y · La web amb l'estil nou (B, «Nit d'estudi»)

**Estat:** aprovada el 13/10/2026. **Fase 1 feta** el 13/10/2026; falta la fase 2 (el mussol).

**Fase 1, provat** a `localhost:8300`:

- **Pantalles amb dades reals:** Nova sessió, Tema 1 (PDF sencer i Costat a costat), Estructures Algebraiques (Quaderns i Fonts), Materials de la sessió del 30/09 i Progrés de la del 07/10 (acabada).
- **Al LaTeX:** un canvi sense desar ix en taronja fosc, i «Descarta» ho torna com estava. No s'ha desat res.
- **Estats que ara no hi ha a les dades:** Claude en marxa, el punt de control (amb una foto de veritat), error, esperant-te i aturada. Els he pintat amb les mateixes funcions d'`app.js` dins d'una pàgina oberta, sense crear cap còpia a `dades/`. Una sessió «en marxa» sense Claude, el servidor la marca com a aturada, així que una còpia no hauria servit.
- **La barra plegada i desplegada.**
- **El mòbil (375 px):** cap desbordament.
- **El contrast:** 27 parelles de text i fons, totes de 5,16:1 o més.
- **La consola:** cap error.

**Fase 1, canvis respecte de la proposta:**

- **El botó taronja de la barra d'acció** es fa només amb CSS (`.barra-accio .boto`), sense cap classe nova a `app.js`. D'`app.js` només ha canviat el logo.
- **Les pestanyes** «Materials / Progrés» i «Quaderns / Fonts» també són pastilles, com al mock-up.
- **El text d'exemple dels camps** («p. ex. Cicles i transposicions») va en el gris secundari. El del navegador donava 4,0:1 damunt del crema.
- **Les estrelles i el degradat de la barra** van fixos a la finestra. Si no, en una pàgina llarga quedarien al final i no es veurien.
- **A `disseny.md`**, dues coses ja en la fase 1: l'avís «Mentre la web no s'adapte» (deia que els mock-ups nous havien de copiar l'aspecte vell) i la lletra, Outfit. La resta de canvis de `disseny.md` (logo, icona i on ix el mussol) es fan en la fase 2.

**Mock-up:** [`Y-mockup.html`](Y-mockup.html), publicat a https://claude.ai/artifact/6ZWK6MzZ8QFZkvhR77tAYB. La versió 1 té els tres estils per triar. La versió 2 té totes les pantalles amb la B.

## Què i per què

La web encara té l'aspecte d'abans: fons gris clar, blau `#1F4FB8` i títols en Newsreader. [`disseny/disseny.md`](../disseny/disseny.md) diu que s'adaptaria a la guia de marca tota d'un colp, amb una guia pròpia i un mock-up. És esta guia.

El 13/10/2026 vas demanar tres estils per triar i vas triar la B, «Nit d'estudi»:

- la barra lateral, blau fosc amb un degradat i unes estrelles;
- el centre, crema i tranquil per llegir;
- el taronja, per destacar;
- el mussol, només on toca.

**Què no canvia:** el que fa la web. Les pantalles, els botons i el lloc de cada cosa són els mateixos. Només canvia com es veu.

## Decisions

Les has triades tu:

| Què | Triat | No triat |
| --- | --- | --- |
| Estil | **B · Nit d'estudi** | A · Quadern de quadrícula (pla, sense degradats). C · Plomes i albada (degradats préssec, tot molt rodó) |
| Lletra del nom LEMA i dels títols | **Outfit**, rodona i geomètrica, com la del logo de la guia de marca | Fraunces (A), Nunito (C) o Newsreader, la d'ara |
| Logo de la barra | **El cap del mussol** en un quadrat blau, al costat del nom | Només el nom LEMA |
| Barra lateral | **Blau fosc amb un degradat i unes estrelles fluixes al peu** | Només el degradat |
| Barra d'acció («Passa a net», «Envia les respostes») | **Blau fosc amb el botó taronja** | Blanca, amb el botó blau fosc |
| On ix el mussol | **Mentre Claude treballa, als errors, a les pantalles buides i a la benvinguda** (saludant a Nova sessió) | També content quan acaba la sessió |
| Mock-up de totes les pantalles abans d'implementar | **Sí** (versió 2) | Implementar i revisar-ho directament a la web |

Estes són propostes meues. Si no en dius res, es queden:

| Què | Proposta | Alternativa |
| --- | --- | --- |
| Colors de les marques del PDF | Les etiquetes «Correcció», «Noteta» i «Pendent» de l'esquema de blocs **continuen amb els colors del PDF** (roig, blau i taronja de `plantilla-base.tex`). Així lliguen amb el que veus al PDF, que no canvia | Passar-les als colors nous. Deixarien de coincidir amb el PDF |
| Mussol a les correccions del quadern | **No.** La pàgina del quadern és per llegir, així que mentre Claude corregeix hi queda la roda que gira | El mussol pensant, menut |
| Mussol a les pantalles buides | **Quiet**, com una imatge: allí no passa res | Que parpellege |
| Icona de la pestanya del navegador | **El cap del mussol**, el mateix retall que el logo | Cap icona, com ara |
| D'on agafa la web el mussol | **Del fitxer de `disseny/recursos-visuals/`**, a través del servidor. Un sol fitxer per a tot | Una còpia a `web/static/`, que es podria desfasar |
| Fases | **Dues:** primer colors, lletres i formes; després el mussol | Tot d'una vegada |

Les opcions no triades van a «Opcions no triades» de `web-local.md`.

## Com es veurà

### Colors

Els de `disseny.md`. A `style.css`, les variables de dalt (`:root`) canvien així:

| Variable | Ara | Després |
| --- | --- | --- |
| `--fons` (fons de la pàgina) | gris clar `#F7F6F2` | crema `#F7EFE6` |
| `--superficie` (targetes) | blanc | blanc |
| `--tinta` (text) | quasi negre `#1B1E24` | blau fosc `#1E2A44` |
| `--suau` (text secundari) | `#5A606B` | igual |
| `--vora`, `--linia` (vores) | grisos càlids | gris clar `#E8EBF2` i variants |
| `--blau` (botons i enllaços) | `#1F4FB8` | blau fosc `#1E2A44` |
| Destacar (el que està triat, el pas d'ara) | blau clar | taronja `#F4A261`, mai en text damunt de clar |
| Avisos i errors | | els de `disseny.md` (`#8F4207` i `#9A1E17`, amb els seus fons) |

Les marques del PDF (`--marca-corr`, `--marca-nota`, `--marca-pend`) passen a ser variables pròpies amb els colors del PDF. Només les fan servir les etiquetes de l'esquema de blocs.

### Lletres

- **Outfit** per al nom LEMA, els títols de pàgina i de targeta i les xifres grans del resum.
- **IBM Plex Sans** per a la resta del text, com ara.
- **IBM Plex Mono** per al LaTeX, les dates de la llista i els noms de fitxer, com ara.
- **Newsreader** deixa de carregar-se.

### Formes

- **Botons:** pastilles (cantons del tot rodons).
- **Targetes:** cantons de 18 px, sense vora i amb una ombra molt suau.
- **Camps** (text, desplegables): fons crema i cantons de 12 px.
- **Interruptors** («PDF sencer / Costat a costat», «Materials / Progrés», «Quaderns / Fonts», «Apunts / LaTeX»): una pastilla gris clar amb l'opció triada en blau fosc.

### La barra lateral

- **Fons:** blau fosc, amb un degradat cap a un blau un poc més clar a baix i unes sis estrelles quasi transparents al peu.
- **Text:** crema. Les ajudes («Acabada», «Encara no hi ha quaderns») van en un blau grisós clar.
- **Dalt:** el cap del mussol en un quadrat arredonit, el nom LEMA en Outfit i «Lector i Editor de Manuscrits Acadèmics».
- **«Nova sessió»:** un botó taronja amb el text blau fosc.
- **El que està triat** (quadern o sessió): un fons crema quasi transparent. Els enllaços («+ Nou quadern») i la icona de llibres de l'assignatura oberta van en taronja.
- **Plegada:** la tira de 64 px també és blau fosc, amb el cap del mussol dalt.

### La barra d'acció

La de «Passa a net» (Materials) i «Envia les respostes» (punt de control) ja és fosca. Ara serà del blau fosc de la barra lateral, i el botó, taronja amb el text blau fosc. Desactivat, el botó és crema quasi transparent.

### La targeta «Què fa Claude» (Progrés)

Mentre Claude treballa, la targeta de dalt passa a ser un cel de nit:

- un degradat blau fosc;
- unes estrelles;
- una lluna;
- el text en crema i el pas d'ara en taronja.

El que diu no canvia: què fa Claude, el pas, el temps, els tokens, què ve després i «Atura». A la fase 2, el mussol pensant ocupa el lloc de la roda que gira.

### El visor del PDF

No canvia. És el del navegador, gris fosc, i la web no el pot pintar.

### El mussol (fase 2)

| On | Com |
| --- | --- |
| Progrés, mentre Claude treballa | Respira, parpelleja i, de tant en tant, inclina el cap i mira amunt (pensa) |
| L'avís d'error d'una sessió | Quiet, amb el cap inclinat, al costat del missatge |
| Pantalles buides («Encara no hi ha cap quadern», «Encara no hi ha cap font») | Quiet, damunt del missatge |
| Nova sessió | A dalt a la dreta. Mou l'ala una vegada en entrar i es queda quiet |

Si el navegador demana menys moviment, no es mou mai. Mai n'hi ha dos alhora en una pàgina.

## Com funciona per dins

**El logo i la icona (fase 1).** El servidor (`web/app.py`) té una adreça nova, `/icona.svg`. Torna el mateix `mascota.svg` de `disseny/recursos-visuals/`, però amb el requadre (`viewBox`) retallat pel cap. No es deforma res: només es mira un tros del dibuix. La barra el posa com una imatge normal (`<img>`), i `index.html` el fa servir d'icona de la pestanya. El contenidor ja veu tot el repositori a `/lema`, així que no cal copiar res.

**El mussol que es mou (fase 2).** Les animacions només funcionen si l'SVG és dins de la pàgina, no amb `<img>`. Per això:

1. `/mascota.svg` torna el fitxer sencer.
2. Una funció nova d'`app.js`, `mussol(expressio)`, el demana una sola vegada i el guarda.
3. Cada vegada que cal, en fa una còpia i la posa dins de la pàgina amb la classe de l'expressió (`pensa`, `saluda`).
4. A cada còpia li canvia els noms (`id`) dels degradats i dels retalls de dins de `<defs>`, com diu `disseny.md`.
5. Les animacions són a `style.css`, amb els mateixos moviments que `mascota-demo.html`.
6. Amb `prefers-reduced-motion`, cap moviment.

Les pantalles buides fan servir `<img src="/mascota.svg">`, perquè allí ha d'estar quiet.

## Instruccions de Claude

Cap canvi. El Claude que passa a net no veu la web: `CLAUDE.md`, `web/prompt.md` i `flux.html` es queden igual.

## Dades

Cap canvi.

## Fitxers

| Fitxer | Fase | Què hi canvia |
| --- | --- | --- |
| `web/static/style.css` | 1 i 2 | Fase 1: les variables de color, les marques del PDF, Outfit, i cada part (barra lateral, botons, targetes, camps, interruptors, barra d'acció, targeta de Progrés, punt de control, pàgines del quadern, de l'assignatura i de les fonts) amb les formes noves. Fase 2: les animacions del mussol i on es col·loca |
| `web/static/index.html` | 1 | Outfit en lloc de Newsreader a l'enllaç de Google Fonts, i la icona de la pestanya |
| `web/static/app.js` | 1 i 2 | Fase 1: el cap del mussol al logo de la barra (oberta i plegada). Fase 2: la funció `mussol()` i el mussol a Progrés, a l'avís d'error, a les dues pantalles buides i a Nova sessió |
| `web/app.py` | 1 i 2 | `/icona.svg` (fase 1) i `/mascota.svg` (fase 2), abans de la línia que serveix `web/static/` |
| `disseny/disseny.md` | 2 | Sense «Mentre la web no s'adapte». Outfit per al nom i els títols. El cap retallat com a logo i icona. On ix el mussol a la web. L'excepció de les marques del PDF |
| `web/CLAUDE.md` | 2 | Una línia: els colors i les lletres venen de `disseny.md`, i les etiquetes de marques fan servir els colors del PDF |
| `web-local.md` | 1 i 2 | La Y al pla del frontend i les opcions no triades (ja ara), i «Com funciona» en acabar |

## Passos

**Fase 1 · Colors, lletres i formes**

1. Apuntar-me a `hey.md` amb `web/static/*`, `web/app.py` i `web-local.md`.
2. `web/app.py`: `/icona.svg`.
3. `index.html`: Outfit i la icona.
4. `style.css`: primer les variables i les marques del PDF; després, part per part, de dalt a baix del fitxer.
5. `app.js`: el logo.
6. Comprovar el contrast amb un script: cada parella de text i fons que fa servir el CSS, 4,5:1 o més.
7. Provar-ho (baix) i ensenyar-t'ho. Commit.

**Fase 2 · El mussol**

1. `web/app.py`: `/mascota.svg`.
2. `app.js`: `mussol()`, i posar-lo a Progrés (en lloc de la roda), a l'avís d'error, a les pantalles buides i a Nova sessió.
3. `style.css`: les animacions, «menys moviment» i on es col·loca a cada lloc.
4. `disseny.md`, `web/CLAUDE.md` i «Com funciona» de `web-local.md`.
5. Provar-ho, posar l'estat a «feta». Commit.

## Com es prova

A `localhost:8300`, a l'amplada de l'ordinador i a la del mòbil (375 px), comparant cada pantalla amb el mock-up.

**Fase 1**

- **Nova sessió:** camps crema, botó pastilla i «Com va».
- **Estructures Algebraiques, Quaderns i Fonts:** la icona de llibres taronja a la barra.
- **Tema 1:** PDF sencer i Costat a costat. Al LaTeX, canviar una lletra i comprovar que ix «Sense desar», després «Descarta» (no es desa res).
- **Sessió del 30/09** (sense començar): Materials. La barra de «Passa a net», blau fosc i amb el botó desactivat (falta el quadern).
- **Sessió del 07/10** (acabada): Progrés, l'avís blau, el resum i l'esquema, amb les etiquetes en els colors del PDF.
- **Una sessió en marxa i el punt de control:** no n'hi ha cap de veritat. Es fan còpies a `dades/`: una amb l'estat `en_marxa` i una altra amb un `punt-control.json` de prova. Sense Claude i sense gastar tokens. S'esborren en acabar.
- **La barra plegada i desplegada.**
- **El contrast,** amb l'script del pas 6.

**Fase 2**

- **Progrés de la còpia en marxa:** el mussol respira, parpelleja i pensa. Amb Chrome amb `--force-prefers-reduced-motion`, quiet.
- **Una còpia amb l'estat `error`:** el mussol al costat de l'avís.
- **Pantalles buides:** una assignatura de prova sense quaderns ni fonts, en una carpeta temporal de `dades/` que s'esborra en acabar.
- **Nova sessió:** saluda una vegada en entrar, i no torna a saludar fins que tornes a la pàgina.
- **La icona de la pestanya:** el cap del mussol.
