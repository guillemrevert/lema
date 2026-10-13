# Disseny de LEMA

Les instruccions per a tot el que és visual. Parteixen de la guia de marca ([`recursos-visuals/guia-de-marca.png`](recursos-visuals/guia-de-marca.png)). Guia que les va crear: [`guies/disseny-instruccions.md`](../guies/disseny-instruccions.md).

## On s'aplica

- La web local (`localhost:8300`).
- Els mock-ups de les guies.
- Les pàgines que publica Claude, com `flux.html`.

El PDF dels apunts no: manté el seu aspecte de llibre (decisió 2 de `CLAUDE.md`).

**La web.** Des del 13/10/2026 segueix esta guia, amb l'estil B, «Nit d'estudi» ([guia Y](../guies/Y-estil.md), mock-up a [`guies/Y-mockup.html`](../guies/Y-mockup.html)):

- la barra lateral, blau fosc amb un degradat i unes estrelles, i el text en crema;
- el centre, crema amb targetes blanques;
- botons i interruptors en forma de pastilla;
- el taronja, per destacar damunt del blau fosc;
- les etiquetes de l'esquema de blocs, amb els colors de les marques del PDF.

Les pantalles noves i els seus mock-ups es fan igual: les variables de `web/static/style.css` són la referència. El mussol hi arriba a la fase 2 de la guia Y.

## Nom

L'eina es diu **LEMA**, i el mussol n'és la mascota. El text «Apunts de ciència i enginyeria» de la guia de marca no es fa servir.

## Colors

| Color | Codi | Per a què |
| --- | --- | --- |
| Blau fosc | `#1E2A44` | Text, títols, botons principals i enllaços. És el color principal |
| Crema | `#F7EFE6` | Fons de la pàgina |
| Blanc | `#FFFFFF` | Targetes i panells damunt del crema |
| Gris clar | `#E8EBF2` | Vores i fons secundaris |
| Taronja | `#F4A261` | Destacar: el que està triat, una marca, un punt d'atenció |
| Taronja suau | `#A67C52` | Detalls i ombres |
| Marró | `#4A392F` | Detalls, com els cabells de la mascota |

La guia de marca no té colors per al text secundari ni per als errors i avisos. Estos venen de la web d'abans:

| Color | Text | Fons | Per a què |
| --- | --- | --- | --- |
| Gris blavós | `#5A606B` | | Text secundari: dates, ajudes, peus |
| Roig | `#9A1E17` | `#FBE9E7` | Errors |
| Taronja fosc | `#8F4207` | `#FDF1E4` | Avisos |

**Contrast.** El text ha de tindre almenys 4,5:1 amb el seu fons. Per això:

- El taronja (`#F4A261`) i el taronja suau (`#A67C52`) **no** van mai en text damunt de crema, blanc o gris clar: no es llegeixen bé. Sí que van damunt del blau fosc.
- Sobre el blau fosc, el text va en crema o en blanc.

## Lletres

La guia de marca no en fixa cap. De moment:

- **IBM Plex Sans** per al text.
- **IBM Plex Mono** per al codi.
- **Outfit** per al nom LEMA, els títols i les xifres grans (guia Y).

## Formes i espai

- Cantons arredonits, com la icona de la guia de marca.
- Molt d'espai al voltant de les coses; millor poques coses per pantalla.
- Ombres suaus o cap.

## La mascota

**Fitxers.** [`recursos-visuals/mascota.svg`](recursos-visuals/mascota.svg) és el mussol per capes. [`recursos-visuals/mascota-demo.html`](recursos-visuals/mascota-demo.html) mostra com s'anima. Les peces i els seus noms estan explicats al comentari de dalt de l'SVG.

**On va bé:**

- Les pantalles buides (encara no hi ha cap quadern, cap sessió…).
- Mentre s'espera Claude.
- Els errors.
- La benvinguda.

**On no va:**

- Mentre l'usuari llig o revisa apunts, perquè distrau.
- Al PDF.
- En totes les pantalles: si apareix a tot arreu, deixa de dir res.

**Com s'anima:**

- Només movent les peces de l'SVG (`#cap`, `#ala`, `.obert`/`.tancat`, `#nina-*`, `#cos`, `#figura`). Cada peça ja té el seu punt de gir.
- Amb moviments suaus i curts, com els de la demo.
- Quieta si el navegador demana menys moviment (`prefers-reduced-motion`).
- Només es mou mentre s'espera o quan passa alguna cosa, no tota l'estona en una pantalla de treball.
- Les animacions només funcionen si l'SVG va dins de l'HTML. Amb `<img>` es veu quieta.

**Fons.** Va bé damunt del crema, del blanc i del blau fosc, com a les variacions de la guia de marca.

**Mida.** El cos sencer, a partir d'uns 64 px d'alt. Més menut no es veuen els ulls: per a icones caldrà una versió només del cap, que encara no està feta.

**Què no s'ha de fer:**

- Deformar-la (estirar-la o aplanar-la sencera) o canviar-li els colors.
- Posar-ne una PNG a la web en lloc de l'SVG.
- Fer-li dir coses en bafarades llargues.

**Expressions.** Ara n'hi ha quatre: normal, saluda (ala), pensa (cap inclinat i mirada amunt) i contenta (ulls tancats). [`recursos-visuals/mascota-expressions.png`](recursos-visuals/mascota-expressions.png) en té més (concentrada amb una tauleta, amb dubte), però encara no estan fetes en SVG. Si en cal una, es fa a partir de l'SVG, no de la PNG.

Si l'SVG va més d'una vegada a la mateixa pàgina, cal canviar els `id` de dins de `<defs>` (degradats i retalls), perquè no xoquen.

## Recursos visuals

| Fitxer | Què és |
| --- | --- |
| `recursos-visuals/guia-de-marca.png` | La guia de marca: logo, icona, colors i variacions |
| `recursos-visuals/mascota-expressions.png` | La mascota més detallada, amb expressions i vistes de costat i d'esquena |
| `recursos-visuals/mascota.svg` | La mascota en SVG per capes, per a la web |
| `recursos-visuals/mascota-demo.html` | Exemples d'animació de la mascota |
