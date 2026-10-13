# Guia W · Les fonts de cada assignatura

**Estat:** feta el 13/10/2026, en dues fases, cada una amb el seu vist-i-plau, la seua prova a `localhost:8300` i el seu commit.

**Mock-up:** [`guies/W-mockup.html`](W-mockup.html), publicat a https://claude.ai/artifact/Y1SRibQb7CyQkBHgC8z9Si (versió 2). Ensenya dues pantalles netes i, davall, set parts explicades. Quan ací es diu «part 3», és la part 3 del mock-up. Les imatges són a `guies/img/`, fora de git.

## Què i per què

**El problema.** El 13/10/2026 vas dir que la web no tenia cap manera de revisar les fonts, i que cada assignatura hauria de tindre la seua secció. Ara les fonts són a la pestanya «Fonts» de la pàgina de l'assignatura, i per arribar-hi has de clicar el nom de l'assignatura i després la pestanya. Allí només hi ha la llista de PDF, que s'obrin en una pestanya nova del navegador, i el formulari per pujar-ne. Quan una font ja està pujada, no se'n pot canviar res.

**La idea.** Una icona al costat del nom de cada assignatura, a la barra lateral, que porta directament a la pestanya «Fonts». Allí tries la font, llegeixes els PDF sense eixir de la web i l'edites: la fitxa, afegir o llevar PDF, o esborrar-la.

És la W del pla del frontend de `web-local.md`.

## Decisions

Totes amb la proposta del mock-up («Les teues propostes en tot», 13/10/2026). Les alternatives són a «Opcions no triades» de `web-local.md`.

| Part | Què es decideix | Triat | No triat |
| --- | --- | --- | --- |
| — | Què vols poder fer amb una font | Llegir el PDF dins de la web i editar-la | Veure l'índex que LEMA en trau; veure on s'ha fet servir |
| 1 | Com s'arriba a les fonts | Una icona al costat del nom de l'assignatura, a la barra lateral | Una secció «Fonts» a la barra amb una línia per font (versió 1 del mock-up) |
| 1 | La icona | Llibres en un prestatge, perquè els quaderns ja porten un llibre | Un llibre obert; el mateix llibre que els quaderns |
| 2 | Com tries la font | Una fila de botons a dalt, i la font triada davall | Primer una llista de targetes i, en clicar-ne una, la font |
| 3 | Com tries el PDF | Una llista a l'esquerra i el visor a la dreta | Pestanyes damunt del visor; un desplegable |
| 4 | Què edites de la fitxa | Els tres camps teus i la fitxa de Claude com a text | Només els tres camps; un camp per a cada cosa de la fitxa de Claude |
| 6 | Quan es pot esborrar una font | Sempre, i va a la paperera | Només si cap sessió pendent la fa servir |

**Dues coses que no eren al mock-up:**

- **Si Claude està passant a net una sessió amb eixa font** (està en marxa o t'espera al punt de control), no pots llevar-ne cap PDF ni esborrar-la fins que acabe. Claude està llegint eixos fitxers.
- **Una font ha de tindre almenys un PDF.** Per llevar l'últim, esborra la font.

## Les fases

| Fase | Què | Per què en este ordre |
| --- | --- | --- |
| 1 | **Llegir.** La icona a la barra, la pestanya «Fonts» nova amb la fila de fonts, la llista de PDF, el visor i «+ Nova font». La fitxa es veu, però encara no s'edita | Només toca la pàgina (`app.js` i `style.css`). Ja et deixa revisar les fonts, que és el que demanaves |
| 2 | **Editar.** La fitxa, afegir i llevar PDF, i esborrar la font | Necessita rutes noves al servidor i una línia nova a les instruccions de Claude |

---

## Fase 1 · Llegir

**Estat:** feta el 13/10/2026. Provada a `localhost:8300`, llegint la pàgina (el panell del navegador no dibuixava i no es van poder fer captures):

- la icona d'Estructures Algebraiques porta a la pestanya «Fonts» amb Wuolah, «4 PDF · 57 pàgines · triada en 5 sessions» i el Tema 1 al visor (el PDF respon amb `application/pdf`). La icona és blava i el nom de l'assignatura no;
- clicar el Tema 2 canvia el visor, la llista i l'adreça en 0,1 s; el botó d'arrere torna al Tema 3, que era el d'abans;
- la fitxa ensenya els tres camps i `fitxa.yaml` amb els accents bé;
- sense font a l'adreça, ix l'última mirada (Wuolah); una font que no existeix diu «No existeix esta font.»;
- Anàlisi II: «Encara no hi ha cap font», sense fila de fonts, i el formulari;
- `…/fonts/nova` a Estructures Algebraiques: la fila amb «Nova font» triada i el formulari; l'enllaç de Materials porta ací;
- el nom de l'assignatura porta a «Quaderns» i la icona deixa de ser blava;
- al mòbil (375 px), la llista va damunt del visor, la fitxa en una columna i la pàgina no es desplaça de costat;
- pujar una font que es diga «Nova» respon «Este nom no es pot fer servir: tria'n un altre» i no crea res.

**Canvis respecte al que deia la guia:**

- **Canviar de PDF no torna a pintar la pàgina.** Només canvia el visor, la llista i l'adreça. Tornar a pintar-la vol dir demanar `/api/assignatures`, que tarda de 2 a 3 segons (ja passava abans, en tota la web: és la carpeta compartida amb Windows). El botó d'arrere sí que la torna a pintar.
- **La llista diu el nom curt de cada PDF** («Tema 1»), com les xips de Materials, en lloc del nom sencer del fitxer. El sencer ix en passar-hi per damunt i a la barra del visor.
- **«Nova» reservat** ja en esta fase, perquè l'adreça `…/fonts/nova` és d'esta fase.
- **«Fonts d'Anàlisi II»**, amb apòstrof, en el títol de la icona (una funció `de` nova a `app.js`).

### Què notaràs

- **A la barra lateral**, a la dreta del nom de cada assignatura, abans de la fletxa de plegar, una icona de llibres en un prestatge. Si la cliques, vas a la pestanya «Fonts» d'eixa assignatura. Quan hi eres, la icona es veu blava. El nom de l'assignatura continua portant a «Quaderns». La barra plegada (la tira d'inicials) es queda igual.
- **La pestanya «Fonts»** (pantalla 1 del mock-up), de dalt a baix:
  - una fila de botons arredonits, un per font, i «+ Nova font» al final. La font triada es veu blava;
  - el nom de la font, què és i d'on surt, i quants PDF i pàgines té i en quantes sessions l'has triada;
  - a l'esquerra, els PDF de la font, cada un amb les seues pàgines i si té text o s'haurà de llegir com a imatge. A la dreta, el que tens triat, en el visor del navegador, com el del quadern: passes pàgines, fas zoom i cerques amb Ctrl+F. Si cliques un altre PDF, el visor canvia sense eixir de la pàgina. Al mòbil, la llista va damunt del visor;
  - davall, la fitxa: els tres camps teus (nom curt, què és, d'on surt) i la fitxa de Claude com a text. Si Claude encara no l'ha feta, ix «Claude la farà la primera vegada que passe a net una sessió amb esta font».
- **Quina font ix primer.** L'última que vas mirar en eixa assignatura; si no, la primera. Ara, a Estructures Algebraiques, sempre Wuolah, perquè només n'hi ha una.
- **«+ Nova font»** canvia la font per al formulari que ja hi ha per pujar-ne una. Quan acaba de pujar, la font nova queda triada. A Anàlisi II, que encara no en té cap, la pestanya ja t'obri el formulari.
- **Des de Materials**, l'enllaç «Puja una font nova a l'assignatura» porta a eixe formulari.
- Els botons «Edita la fitxa» i «Esborra la font» i la ✕ dels PDF encara no hi són: arriben a la fase 2.

### Com funciona per dins

**Les adreces.** La pestanya porta la font triada:

| Adreça | Què ensenya |
| --- | --- |
| `#/assignatura/<a>/fonts` | L'última font que vas mirar en eixa assignatura, o la primera |
| `#/assignatura/<a>/fonts/<font>` | Eixa font |
| `#/assignatura/<a>/fonts/<font>/<pdf>` | Eixa font, amb eixe PDF al visor (si no, el primer) |
| `#/assignatura/<a>/fonts/nova` | El formulari per pujar-ne una |

`ruta()` ja parteix l'adreça en trossos: la font arriba com a `pestanya` i el PDF com a `sub`, així que `pinta()` només ha de passar-los a `pintaAssignatura`. Com que `nova` és una paraula de l'adreça, cap font es podrà dir «Nova» (el servidor ho dirà en pujar-la).

**L'última font mirada** es recorda al navegador, com la barra plegada (`lema-font-<assignatura>`, amb `recorda` i `llegeix`).

**El visor** és un `iframe` amb l'adreça del PDF que el servidor ja serveix (`/api/fitxer/<a>/fonts/<font>/<pdf>`), amb `#navpanes=0&view=FitH` perquè no s'òbriga la columna de miniatures, com al «Costat a costat» del quadern. Canviar de PDF canvia l'adreça (`…/fonts/<font>/<pdf>`), així que el botó d'arrere del navegador funciona.

**En quantes sessions l'has triada.** La llista d'assignatures que la web demana en cada pàgina (`/api/assignatures`) diu, de cada sessió, l'id, el dia, l'estat i el quadern. Ara també dirà les fonts que té triades (`fonts`, amb els PDF marcats). El servidor ja llig `sessio.json` per a la resta, així que no costa res més.

**La fitxa de Claude** és `fitxa.yaml`, dins de la carpeta de la font. La pàgina la demana a la ruta de fitxers que ja hi ha (`/api/fitxer/<a>/fonts/<font>/fitxa.yaml`). Si no existeix, la ruta respon «No existeix» i la pàgina posa l'avís.

### Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/app.py` | `/api/assignatures`: cada sessió porta també `fonts`; el nom «nova» reservat a `puja_font` |
| `web/static/app.js` | La icona `prestatge` a `ICONES`; el botó de la icona a `pintaLateral`; `pinta()` passa la font i el PDF a `pintaAssignatura`; `pintaFonts` nova (fila de fonts, capçalera, llista de PDF, visor, fitxa); l'enllaç de Materials (`seccioFont`) porta a `…/fonts/nova`; el comentari de les rutes, dalt de tot |
| `web/static/style.css` | La icona de la barra (i quan està activa), la fila de fonts, la llista de PDF i el visor costat a costat |
| `web-local.md` | Les rutes noves i la pestanya «Fonts» a «Com funciona» |

### Instruccions de Claude

Cap canvi.

### Dades

Cap canvi. Només es llig el que ja hi ha.

### Passos

1. `web/app.py`: `fonts` a les sessions de `/api/assignatures`.
2. `web/static/app.js` i `style.css`: la icona, les adreces, `pintaFonts` i l'enllaç de Materials.
3. `web-local.md`.
4. Prova (baix).
5. Tancar la fase: estat a la guia i commit.

### Com es prova

A `localhost:8300`:

1. A la barra, clica la icona d'Estructures Algebraiques: ha d'eixir la pestanya «Fonts» amb Wuolah triada, «4 PDF · 57 pàgines · triada en 5 sessions» i el Tema 1 al visor. La icona es veu blava.
2. Clica el Tema 3 de la llista: el visor canvia i la llista el marca. Cerca una paraula amb Ctrl+F dins del visor. Torna arrere amb el botó del navegador: torna el Tema 1.
3. La fitxa ensenya els tres camps i el text de `fitxa.yaml`.
4. Clica el nom de l'assignatura a la barra: vas a «Quaderns», i la icona ja no es veu blava.
5. Clica la icona d'Anàlisi II: «Encara no hi ha cap font» i el formulari obert.
6. A Materials de la sessió del 10/10, «Puja una font nova a l'assignatura» porta al formulari d'Estructures Algebraiques. Clicar Wuolah a la fila de fonts torna a la font.
7. Amb la barra estreta (o el navegador al mòbil), la llista de PDF va damunt del visor.

No es puja cap font de prova en esta fase: el formulari és el mateix d'ara.

---

## Fase 2 · Editar

**Estat:** feta el 13/10/2026. Provada a `localhost:8300` amb fonts de prova a Anàlisi II, sense tocar Wuolah:

- **Per l'API** (un script de prova): desar la fitxa (els accents i «σ∘τ» arriben bé a `fitxa.yaml`), sense nom no; afegir un PDF (l'índex passa de 116 a 163 entrades), un fitxer que no és PDF no; amb la sessió de prova «esperant», llevar, afegir i esborrar responen «Claude està passant a net «Prova W» amb esta font: espera que acabe»; llevar el Tema 2 el mou amb el seu `.txt` a `dades/paperera/analisi-2/font-prova-…/`, el lleva de l'índex i dels PDF marcats de la sessió; l'últim PDF no; la fitxa buida va a la paperera; esborrar la font mou la carpeta i la sessió es queda sense fonts. Una ruta amb `..` la rebutja el servidor abans d'arribar a la funció (405), sense tocar res.
- **A la web:** «Edita la fitxa» de la capçalera obri el formulari i posa el cursor al nom; «Cancel·la» torna a la fitxa; «Desa» la desa i la pàgina ensenya el text nou. La ✕ posa la línia roja («Va a la paperera. Prova W el té marcat a Materials.»), «Cancel·la» la torna com era, i «Lleva'l» el lleva. Arrossegar un PDF a «Afegeix PDF» diu «Pujant i extraient el text…» i l'afegeix. «Esborra la font» diu «L'ha triada 1 sessió: 1 sense acabar (Prova W): es queda sense esta font», i «Esborra-la» la porta a la paperera i ensenya el formulari. Amb la sessió «esperant», la ✕ i «Esborra la font» ja ho diuen sense preguntar.
- **El prompt** d'una sessió d'Estructures Algebraiques, generat sense enviar-lo, té la línia nova de la fitxa.
- `flux.html` v10, republicat. Les dades de prova són a `dades/paperera/analisi-2/`; les de Wuolah i les sessions d'Estructures Algebraiques no han canviat.

**Canvis respecte al que deia la guia:**

- **«Afegeix PDF» tampoc es pot mentre Claude hi treballa**, com la ✕ i «Esborra la font»: `extreu-font.py` torna a escriure el text i l'índex que Claude està llegint.
- **La fitxa de Claude buida va a la paperera**, i Claude en farà una de nova. La guia només deia que no es crea si no n'hi havia.
- **La web ho comprova abans de preguntar**: si Claude hi treballa, o si només queda un PDF, ho diu de seguida, sense la línia roja ni l'avís. El servidor també ho comprova.
- **Dues coses de la mateixa font en el mateix segon** van a carpetes diferents de la paperera (`…-2`).

### Què notaràs

- **«Edita la fitxa»**, a la capçalera de la font i a la targeta de la fitxa, converteix la targeta en un formulari (pantalla 2 del mock-up):
  - dalt, el nom curt, què és i d'on surt;
  - davall, la fitxa de Claude com a text, en lletra de màquina;
  - «Desa» i «Cancel·la».
- **Canviar el nom** només canvia el que veus. La carpeta de la font es queda igual, com amb els quaderns, perquè les sessions que ja la tenen triada no la perden.
- **Si la fitxa de Claude no quadra** amb els tres camps de dalt (dius una cosa a «Què és» i la fitxa en diu una altra), manen els de dalt, i la pròxima vegada que Claude passe a net una sessió amb esta font, corregirà la fitxa. Ho diu una nota davall del text.
- **«Afegeix PDF»**, davall de la llista, o arrossegar-los ací. En pujar-los, LEMA en trau el text i torna a fer l'índex de la font, com quan la vas pujar. Tarda uns segons, i el botó diu «Pujant i extraient el text…».
- **La ✕ de cada PDF.** La línia es posa roja i et pregunta abans: «Va a la paperera», i quines sessions el tenen marcat a Materials. Si dius que sí, el PDF i el seu text van a la paperera, i l'índex es torna a fer.
- **«Esborra la font»**, a la capçalera. Ix un avís roig damunt de la font: quantes sessions l'han triada, quantes d'elles estan acabades i quines no, i els botons «Esborra-la» i «Cancel·la». Si dius que sí, la font va a la paperera i vas a la següent font de l'assignatura, o al formulari si no en queda cap.
- **Les sessions** que tenien la font triada la perden, i les que tenien el PDF marcat el perden. A les acabades no els passa res: els blocs ja escrits continuen citant la font. Les que encara no has passat a net et diran a Materials que falta triar la font, si no en tenen cap altra.
- **Mentre Claude passa a net una sessió amb eixa font**, la ✕ i «Esborra la font» diuen per què no es pot: «Claude està passant a net la sessió del 10/10 amb esta font: espera que acabe».

### Com funciona per dins

**Quatre rutes noves al servidor:**

| Ruta | Què fa |
| --- | --- |
| `PUT /api/assignatures/<a>/fonts/<font>` | Desa la fitxa. Rep el nom, què és, d'on surt i el text de la fitxa de Claude. Escriu els tres camps a `font.json` i el text a `fitxa.yaml`. Si `fitxa.yaml` no existia i el text és buit, no el crea. El nom no pot ser buit. No es comprova que el text siga YAML correcte: Claude el llig com a text |
| `POST /api/assignatures/<a>/fonts/<font>/pdfs` | Afegeix PDF. Els guarda amb un nom lliure (si ja n'hi ha un amb el mateix nom, «(2)»), torna a executar `extreu-font.py` i torna a comptar les pàgines |
| `DELETE /api/assignatures/<a>/fonts/<font>/pdfs/<pdf>` | Lleva un PDF. Mou el PDF i el seu `.txt` a la paperera, torna a executar `extreu-font.py` (que refà `index.txt` amb els que queden), torna a comptar les pàgines i el lleva dels PDF marcats de cada sessió |
| `DELETE /api/assignatures/<a>/fonts/<font>` | Esborra la font. Mou la carpeta sencera a la paperera i la lleva de les fonts triades de cada sessió |

**Tornar a comptar.** Ara `font.json` guarda la llista de PDF i les pàgines la primera vegada que es llig (`info_font`), i no les torna a mirar mai. Després d'afegir o llevar un PDF, el servidor les torna a calcular amb `compta_font`, que ja existeix.

**La paperera** és la mateixa de les sessions esborrades, `dades/paperera/<assignatura>/`:

- un PDF llevat va a `font-<font>-<data i hora>/`, amb el seu `.txt`;
- una font esborrada va a `font-<font>-<data i hora>/`, sencera.

**Quan no es pot.** Llevar un PDF o esborrar la font respon amb un error clar si alguna sessió que té triada eixa font està en marxa o esperant-te al punt de control. Llevar l'últim PDF també: «Una font necessita almenys un PDF: si no la vols, esborra-la».

**Les sessions.** Llevar un PDF o esborrar una font recorre `sessio.json` de totes les sessions de l'assignatura i lleva el PDF dels `temes` de la font, o la font de `fonts`. Així «Passa a net» no troba una font que ja no existeix, i Materials ensenya el que hi ha de veritat.

### Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/app.py` | Les quatre rutes |
| `web/static/app.js` | «Edita la fitxa» i el formulari; «Afegeix PDF»; la ✕ amb la confirmació a la línia; «Esborra la font» amb l'avís |
| `web/static/style.css` | El formulari de la fitxa, la línia roja i l'avís d'esborrar |
| `web/prompt.md` | La línia de la fitxa de la font (baix) |
| `CLAUDE.md` | El pas 0 (baix) |
| `flux.html` | El pas 0 a `PASSOS` i la v10 a `HISTORIAL`; republicar |
| `web-local.md` | La W, feta; les rutes noves a «Com funciona» |

### Instruccions de Claude

Fins ara, Claude feia `fitxa.yaml` la primera vegada i després la reutilitzava tal qual. Amb la fase 2 la pots editar tu, i també pots canviar el nom, què és i d'on surt, i afegir o llevar PDF. Per això, la fitxa pot deixar de quadrar amb el que diu `font.json`.

- **`web/prompt.md`.** La línia de la fitxa passa a dir:

  > La fitxa de cada font, a `fitxa.yaml`, dins de la carpeta de la font. Si ja existeix, reutilitza-la: l'usuari la pot haver editada des de la web. Si no quadra amb el `font.json` (què és, d'on surt o la llista de PDF), mana el `font.json`: corregeix la fitxa.

- **`CLAUDE.md`, pas 0.** «Fer la fitxa de la font a partir de la descripció de l'usuari» passa a dir:

  > Fer la fitxa de la font a partir de la descripció de l'usuari. Des de la web, si la font ja té fitxa, es reutilitza, perquè l'usuari la pot haver editada; si no quadra amb el `font.json` de la font (què és, d'on surt, els PDF), mana el `font.json` i es corregeix la fitxa.

- **`flux.html`.** Al pas 0 de `PASSOS`, la mateixa idea en una línia més. A `HISTORIAL`, la v10 (13/10/2026): «L'usuari pot editar les fonts des de la web: si la fitxa no quadra amb el `font.json`, mana el `font.json`». I republicar-lo a https://claude.ai/artifact/VgnAEHRNnpvhkr4PyRxV6X.

### Dades

- **`font.json`** no canvia de format: `nom`, `que_es`, `origen`, `pdfs` i `entrades`. Ara també el pot escriure la web després de pujar la font.
- **`fitxa.yaml`** tampoc canvia: és el text que escriu Claude, i ara també el que hi deses tu.
- **`sessio.json`** tampoc canvia de format. Només en lleva una font o un PDF quan l'esborres.

### Passos

1. `web/app.py`: les quatre rutes i el nom reservat.
2. `web/static/app.js` i `style.css`: editar la fitxa, afegir i llevar PDF, esborrar la font.
3. `web/prompt.md`, `CLAUDE.md` i `flux.html` (v10), i republicar `flux.html`.
4. `web-local.md`.
5. Prova (baix).
6. Tancar: guia «feta» i commit.

### Com es prova

Amb una font de prova a Anàlisi II, perquè Wuolah no es toque. A `localhost:8300`:

1. A Anàlisi II, puja una font «Prova» amb dos PDF (per exemple, una còpia del Tema 1 i del Tema 2 de Wuolah).
2. Prova de pujar-ne una altra que es diga «Nova»: ha de dir que no.
3. **Fitxa.** Edita-la: canvia «Què és» i escriu unes línies a la fitxa de Claude. Desa. La capçalera i la targeta ensenyen el que has escrit, i `fonts/prova/font.json` i `fitxa.yaml` també. Canvia el nom a «Prova 2»: la carpeta continua sent `fonts/prova/`.
4. **Afegir.** Afegeix un tercer PDF: ix a la llista amb les pàgines, i `index.txt` té les seues entrades.
5. **Llevar.** Crea un quadern i una sessió de prova a Anàlisi II, tria-hi «Prova 2» i marca-hi un PDF. A la font, lleva eixe PDF: l'avís diu que la sessió el té marcat. Després, el PDF i el seu `.txt` són a `dades/paperera/analisi-2/`, i a Materials de la sessió ja no ix.
6. **Quan no es pot.** Posa a mà `"estat": "esperant"` al `sessio.json` de la sessió de prova: la ✕ i «Esborra la font» han de dir que Claude hi treballa. Torna-la a `"nova"`.
7. Prova de llevar l'últim PDF que queda: ha de dir que esborres la font.
8. **Esborrar.** Esborra la font: l'avís diu que l'ha triada 1 sessió, sense començar. Després, la font és a la paperera, la pestanya ensenya el formulari, i Materials de la sessió diu que falta triar la font.
9. **Claude.** Genera el prompt d'una sessió d'Estructures Algebraiques sense enviar-lo, i comprova que diu la línia nova de la fitxa.
10. Esborra la sessió de prova des de la web (va a la paperera). El quadern de prova, a mà, també a la paperera: la web encara no esborra quaderns.
