# Guia H · Resultat costat a costat, amb el LaTeX editable

**Estat:** feta el 10/10/2026, en dues fases. Cada una va tindre el seu vist-i-plau, la seua prova a `localhost:8300` i el seu commit.

**Mock-up:** [`guies/H-mockup.html`](H-mockup.html), publicat a https://claude.ai/artifact/2Hy57Zef8jrywVYJN8DURY (versió 2). Ensenya dues pantalles netes i, davall, vuit parts explicades. Quan ací es diu «part 6», és la part 6 del mock-up. Les imatges del mock-up són a `guies/img/`, fora de git, perquè són fotos dels teus apunts.

## Què i per què

**Què.** A «Resultat», un interruptor nou, «Costat a costat», que divideix la pantalla en dos:

- **A l'esquerra**, les fotos dels apunts de la classe, senceres i una davall de l'altra. Amb un botó, l'esquerra canvia al codi LaTeX dels blocs, que pots editar. «Desa i compila» torna a fer el PDF.
- **A la dreta**, el PDF definitiu.

**Per què.** Ara, per comprovar el PDF amb els apunts has d'obrir les fotos en una altra pestanya i anar d'una a l'altra. I si veus una cosa malament, l'única manera d'arreglar-la és demanar-la a Claude, encara que siga canviar una paraula.

**D'on ve.** És la H del pla del frontend de `web-local.md`, que va eixir de l'app MathWrite Notes (09/10/2026). El primer mock-up la feia bloc a bloc, amb moltes peces. El 10/10/2026 vas triar una versió més simple: la pantalla dividida, cada costat lliure, i el LaTeX editable per tu, en un sol text.

## Les fases

| Fase | Què | Per què en este ordre |
| --- | --- | --- |
| 1 | **Costat a costat, només per mirar.** L'interruptor, les fotos o el LaTeX a l'esquerra, i el PDF a la dreta. El LaTeX es veu en un sol text però encara no es pot editar | No canvia cap regla ni cap fitxer de la classe: només ensenya el que ja hi ha. Ja la pots usar per revisar |
| 2 | **Editar el LaTeX.** «Desa i compila», «Descarta», els avisos, `edicions.json`, el canvi de la decisió 2 i les instruccions de Claude | És la part que escriu fitxers, canvia les regles de Claude i té més coses que poden fallar. Es fa sobre la fase 1 ja provada |

## Decisions

| Què | Triat | No triat (va a «Opcions no triades» de `web-local.md`) |
| --- | --- | --- |
| On va | Dins de «Resultat», amb l'interruptor «PDF sencer / Costat a costat» | Una pestanya pròpia, «Revisió» |
| Esquerra | Les fotos senceres, o el LaTeX dels blocs (botó «Apunts / LaTeX») | La foto amb el bloc ressaltat o retallat (mock-up 1, part 5) |
| Dreta | El PDF definitiu sencer, amb el visor del navegador | Només la pàgina del bloc, el bloc retallat (mock-up 1, part 8) |
| Com et mous | Cada costat amb la seua barra | Per blocs: tries un bloc i els dos costats hi salten (mock-up 1, parts 2, 3 i 9) |
| El LaTeX | L'edites tu i el compiles («Desa i compila»), a la fase 2 | Només per llegir |
| Com es veu el LaTeX | Un sol text continu, com un `.tex` normal. Una línia `%%%% B41.tex %%%%` marca on comença cada bloc | Un requadre per bloc (la primera versió d'esta guia) |

Les altres peces del primer mock-up (notetes amb un clic, comentaris per bloc, safata, marcar revisats) també van a «Opcions no triades».

**Per a la fase 2** hi havia dues decisions més. Com que no vas dir res, van anar les propostes (10/10/2026):

1. **Com és l'editor.** **Proposta:** un quadre de text senzill, amb lletra de màquina d'escriure, com el de «Per a Claude». No cal res de fora. **Alternativa:** un editor amb colors (CodeMirror, carregat d'internet), amb números de línia i parèntesis aparellats.
2. **Què passa amb els teus canvis si tornes a passar a net la classe.** **Proposta:** un avís abans de començar, que diu quins blocs has editat i que es perdran. **Alternativa:** l'avís i, a més, una còpia dels blocs editats a `dades/paperera/`.

## Per què així

- **Cada costat lliure** perquè és el més simple, i Claude no ha de fer res de nou. Que els dos costats saltaren sols al mateix bloc demanava que Claude apuntara, per a cada bloc, on és dins de cada foto. És una estimació a ull, i canviava les instruccions del pas 2.
- **El visor del navegador per al PDF**, i no imatges de cada pàgina, perquè ja el fa servir «Resultat»: no cal instal·lar res al contenidor (el primer mock-up demanava `pdftoppm`).
- **Un sol text, encara que per dins siguen fitxers.** Cada bloc és un fitxer (`B01.tex`, `B02.tex`…) perquè cada classe pot afegir els seus blocs al document del tema sense tocar els de les altres (decisió 9), i perquè Claude, quan corregeix una cosa, només toca el fitxer d'eixe bloc. Tu, en canvi, vols llegir i editar el document seguit. La web fa de pont: ajunta els fitxers en un text quan l'obris i, a la fase 2, el torna a partir quan deses. Les línies `%%%% … %%%%` són el que li permet saber on va cada tros.
- **Només els blocs d'esta classe**, i no `tema.tex` ni la plantilla: `tema.tex` només és la llista dels blocs en ordre, i la plantilla és comuna per a tots els temes. Si la classe és dins del document d'un tema, tampoc veus els blocs de les altres classes, perquè no són d'esta pàgina.

## On són els blocs i el PDF

Depèn d'on va la classe (decisió 9):

- **Dins del document d'un tema** (interruptor encés a Materials): els blocs són a `temes/<tema>/blocs/<classe>/`, i el PDF és `temes/<tema>/tema.pdf`. Compilar vol dir compilar el tema sencer.
- **Amb el seu document a banda** (com la del 05/10): els blocs són a `classes/<classe>/blocs/`, i el PDF és `classes/<classe>/tema.pdf`.

La web ja tria quin PDF ensenya. La fase 1 posa eixa decisió en una funció, `document_de`, perquè el PDF de la dreta, els blocs de l'esquerra i, a la fase 2, la compilació siguen sempre del mateix document.

---

## Fase 1 · Costat a costat, només per mirar

**Estat:** feta el 10/10/2026. Provada a `localhost:8300` amb les classes de veritat:

- **05/10:** «PDF sencer» igual que abans, ara amb l'interruptor damunt. A «Costat a costat», 2 fotos i el PDF de 10 pàgines, cada un amb la seua barra; en recarregar, s'hi queda. El LaTeX dona 42 línies `%%%%`, de `B01.tex` a `B42.tex`; el B41 comença per `\begin{corollari}` i no s'hi pot escriure.
- **30/09 (2a part):** 9 fotos, el seu PDF i 51 blocs.
- **10/10, sense PDF:** «Resultat» no està actiu, com abans.
- **A l'amplada d'un mòbil**, els dos panells es posen un davall de l'altre, sense desplaçament de costat.

Un canvi respecte al que deia la guia: el visor del PDF obria una columna de miniatures que es menjava mig panell. Ara s'obri sense miniatures i amb la pàgina a l'amplada del panell.

Una cosa a saber: en una classe amb molts blocs, el LaTeX tarda un parell de segons a eixir, perquè la carpeta compartida amb Windows és lenta. Mentrestant diu «Carregant el LaTeX…».

### Què notaràs

- A «Resultat», damunt de tot, l'interruptor «PDF sencer / Costat a costat». «PDF sencer» és la pantalla d'ara, sense cap canvi.
- Amb «Costat a costat», la pàgina s'eixampla i es divideix en dos panells de la mateixa alçària, cada un amb la seua barra. L'adreça acaba en `/resultat/costat`, així que si recarregues t'hi quedes.
- **Esquerra, «Apunts»:** les fotos de «Materials», en el mateix ordre, amb el número davall. Si cliques una foto, s'obri en gran en una pestanya nova. Si un apunt és un PDF, es veu dins del panell.
- **Esquerra, «LaTeX»:** tot el LaTeX de la classe en un sol text, de dalt a baix, amb les línies `%%%% Bnn.tex %%%%` on comença cada bloc. En esta fase només es pot llegir (i seleccionar i copiar). Dalt diu quants blocs hi ha i que editar-lo arriba amb la fase 2.
- **Dreta:** el mateix PDF que «PDF sencer», amb el visor del navegador: pots baixar, ampliar i buscar amb Ctrl+F.
- **Davall dels dos panells**, el quadre «Hi ha alguna cosa malament?» de sempre, per demanar correccions a Claude.

### Com funciona per dins

- **`document_de`** diu, per a una classe, on és el seu PDF i la carpeta dels seus blocs. `classe()`, que és el que llig la pàgina de la classe, passa a fer-la servir.
- **Una adreça nova**, `GET /api/classes/<assignatura>/<classe>/latex`, torna els blocs de la classe ordenats pel nom (B01, B02…, que és l'ordre del document), amb el text de cada un.
- **La pàgina** els ajunta en un sol text, amb la línia `%%%% Bnn.tex %%%%` davant de cada un, i el posa en un quadre de només lectura.
- **Les fotos** són les que ja ensenya «Materials», i **el PDF** és el mateix que ja ensenya «Resultat».

### Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/app.py` | `document_de`, que també fa servir `classe()`. L'adreça per llegir el LaTeX |
| `web/static/app.js` | L'adreça admet `/resultat/costat`. A `pintaResultat`, l'interruptor i la vista nova (`pintaCostat`): fotos, LaTeX de només lectura i PDF |
| `web/static/style.css` | Pàgina ampla, els dos panells i el quadre del LaTeX |
| `web-local.md` | La H: fase 1 feta. A «Opcions no triades», les de la taula de decisions |
| `.gitignore` | `guies/img/` (ja fet: són les imatges del mock-up) |

### Instruccions de Claude

Cap canvi.

### Dades

Cap canvi: només es llig el que ja hi ha.

### Passos

1. **`web/app.py`:** `document_de`, `classe()` fent-la servir, i l'adreça del LaTeX. Comprovar que «Resultat» ensenya el mateix PDF que abans.
2. **`web/static/app.js` i `style.css`:** l'interruptor i la vista «Costat a costat».
3. **`web-local.md`:** la H i «Opcions no triades».
4. **Prova** (baix).
5. **Tancar:** esta fase passa a «feta», i es fa el commit amb la guia i el mock-up (sense `guies/img/`).

### Com es prova

A `localhost:8300`. Com que esta fase només llig, es prova amb les classes de veritat:

1. **Classe del 05/10, «PDF sencer».** És igual que ara.
2. **«Costat a costat»:**
   - a l'esquerra, les 2 fotos; a la dreta, el PDF de 10 pàgines;
   - cada costat baixa sol;
   - si recarregues, la pàgina es queda en «Costat a costat»;
   - si cliques una foto, s'obri en una pestanya nova.
3. **«LaTeX»:**
   - ix un sol text amb 42 línies `%%%% … %%%%`, de `B01.tex` a `B42.tex`;
   - el B41 comença per `\begin{corollari}`;
   - no s'hi pot escriure.
4. **Classe del 30/09 (2a part):** el mateix, amb les seues fotos, el seu PDF i els seus blocs.
5. **Una classe sense PDF** (la del 10/10): «Resultat» no està actiu, com ara.

---

## Fase 2 · Editar el LaTeX

**Estat:** feta el 10/10/2026, amb les propostes de les dues decisions: l'editor senzill, i només l'avís en tornar a passar a net. Provada a `localhost:8300` amb una còpia de la classe del 05/10 (`2026-10-05-prova`), que al final es va esborrar des de la web i és a `dades/paperera/`:

1. **Canviar el B41 a `teorema`:** dalt deia «Sense desar: B41.tex». «Desa i compila» va posar «Compilant…» i després «Compilat: 10 pàgines», i el PDF de la còpia diu «Teorema 1.34». També ix l'avís de `compila.py` de sempre: «2 línies ixen del marge». El document del 05/10 no s'ha tocat.
2. **Error** (un `$` de menys): ix l'avís roig amb `./blocs/B41.tex`, la línia 3 i el missatge de LaTeX, i el PDF de la dreta no es recarrega. Al disc, el PDF es queda sencer (10 pàgines, l'última versió bona) i el bloc amb l'error queda desat. Torna a compilar bé quan s'arregla.
3. **Línia `%%%% B40.tex %%%%` esborrada:** dalt diu «Sense desar: s'ha tocat una línia %%%%». En desar, ix l'avís taronja «Falta la línia…» i no s'envia res al servidor.
4. **«Descarta»:** torna exactament al text dels fitxers.
5. **Eixir sense desar:** en clicar «Materials», la web pregunta. Si dius que no, et quedes a l'editor amb el canvi; si dius que sí, te'n vas.
6. **`edicions.json`** diu `B41.tex`. La nota per a Claude porta la ruta del bloc. La classe de veritat no en té cap, així que no porta nota.
7. **«Torna a passar a net»:** l'avís diu «Has editat a mà 1 bloc d'esta classe (B41.tex)…».

Hi ha tres coses que no s'han pogut provar sense fer treballar Claude:

- el LaTeX només per llegir mentre Claude treballa, i que el servidor no deixe desar;
- que `edicions.json` se'n vaja a `registre/` en començar «Torna a passar a net»;
- una classe dins del document d'un tema.

Es comprovaran amb la pròxima classe real.

### Què notaràs

- **El LaTeX es pot editar.** Pots escriure, seleccionar i buscar per tot el text. Dalt diu quins fitxers tens sense desar («Sense desar: B41.tex»).
- **«Desa i compila»:** desa els blocs canviats i torna a fer el PDF. Tarda uns segons («Compilant…») i el PDF de la dreta es torna a carregar.
  - Si LaTeX dona error, ix un avís roig amb el fitxer, la línia i el missatge. El PDF de la dreta es queda com estava, i el teu canvi queda desat perquè el pugues arreglar.
- **Si esborres o canvies una línia `%%%% … %%%%`**, la web no sap on va cada tros i no desa res. Ix un avís taronja que diu quina falta, perquè la tornes a posar o cliques «Descarta».
- **«Descarta»:** desfà els canvis que encara no has desat.
- **Si te'n vas amb canvis sense desar** (una altra pestanya de la classe, una altra classe, tancar la finestra), la web t'ho pregunta abans.
- **Si Claude està treballant** en la classe, el LaTeX es pot llegir però no editar, i «Desa i compila» està desactivat.
- **«Torna a passar a net»** (a Materials): si has editat blocs a mà, l'avís de sempre diu també quins són i que es perdran.

### Per què

**Claude ha de saber què has editat**, perquè quan li demanes una correcció no et desfaça un canvi teu pensant que és un error. Per això la web apunta quins blocs has tocat i li ho diu.

### Com funciona per dins

**Desar i compilar:**

1. La pàgina parteix el text per les línies `%%%% … %%%%`. Si no hi són totes, o en el mateix ordre, no envia res i ensenya l'avís taronja.
2. Envia només els trossos que han canviat, a una adreça nova (`POST …/latex`).
3. La web comprova que cada fitxer és un `.tex` d'esta classe (no deixa escriure fora), els desa i compila amb `compila.py`.
   - Abans de compilar es guarda el PDF d'ara. Si la compilació falla, es torna a posar, perquè no et quedes sense PDF.
   - Ja ho fa així quan esborres una classe d'un tema. Les dues coses passen a fer servir la mateixa funció, `compila_document`.
   - Si Claude està treballant en la classe, respon que no i no toca res.

**Els teus canvis, apuntats.** Cada vegada que deses, la web apunta a `edicions.json`, a la carpeta de la classe, quins blocs has editat i quan.

- **Quan envies una correcció a Claude** («Hi ha alguna cosa malament?»), la web afegeix al final del missatge:
  > He editat a mà estos blocs des de la web: `blocs/B41.tex`. No desfaces els meus canvis; si creus que n'hi ha algun d'erroni, digues-m'ho amb una noteta.
- **Quan tornes a passar a net la classe**, Claude torna a escriure tots els blocs. La web mou `edicions.json` a `registre/`, perquè la llista torne a començar buida i quede constància.

### Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/app.py` | `compila_document` (compila i, si falla, torna a posar el PDF d'abans), que també fa servir `treu_del_tema`. L'adreça per desar el LaTeX. `edicions.json`: s'escriu en desar, s'afegeix al missatge de `respon` i es mou a `registre/` en `passa_a_net`. `classe()` diu quins blocs s'han editat |
| `web/static/app.js` | L'editor (el text es parteix per les línies `%%%% … %%%%`), «Desa i compila», «Descarta» i els avisos. Pregunta abans d'eixir amb canvis sense desar. A «Torna a passar a net», l'avís diu quins blocs s'han editat |
| `web/static/style.css` | L'editor i els avisos |
| `CLAUDE.md` | Decisió 2 nova (vegeu baix) |
| `web/prompt.md` | Una norma més a «Normes de la web» (vegeu baix) |
| `flux.html` | Una línia més al pas 6, i la v7 a `HISTORIAL`. Es republica a la mateixa adreça |
| `web-local.md` | La H, «feta». A «Com funciona», `edicions.json` |

No cal tocar el `Dockerfile`, ni `compila.py`, ni la plantilla.

### Instruccions de Claude

**`CLAUDE.md`, decisió 2.** Ara diu: «PDF compilat amb LaTeX, amb aspecte de llibre. L'usuari no l'edita a mà: marca el que està malament i Claude ho corregeix». Passaria a dir:

> PDF compilat amb LaTeX, amb aspecte de llibre. L'usuari marca el que està malament perquè Claude ho corregisca, o edita ell mateix el LaTeX dels blocs des de la web («Resultat → Costat a costat»). Claude no desfà mai una edició de l'usuari: si li sembla un error, ho diu amb una noteta. Si la classe es torna a passar a net, els blocs s'escriuen de nou i les edicions es perden (la web avisa abans).

**`web/prompt.md`**, a «Normes de la web», una línia més:

> L'usuari pot editar el LaTeX dels blocs des de la web (decisió 2). Quan un missatge seu diga quins blocs ha editat a mà, no desfaces eixos canvis; si creus que n'hi ha algun d'erroni, digues-ho amb una noteta.

**`flux.html`:**

- Al pas 6, una instrucció més: «Si l'usuari edita el LaTeX des de la web (decisió 2), les correccions no desfan els seus canvis; si n'hi ha un d'erroni, es diu amb una noteta».
- A `HISTORIAL`, la v7 (data del dia que es faça): «Des de la web, l'usuari pot editar el LaTeX dels blocs i tornar a compilar. Claude no desfà eixos canvis.»
- Es republica a https://claude.ai/artifact/VgnAEHRNnpvhkr4PyRxV6X.

### Dades

- **Fitxer nou:** `classes/<classe>/edicions.json`, amb els blocs editats a mà i la data de l'última edició de cada un. Exemple:
  ```json
  { "blocs": { "classes/2026-10-05/blocs/B41.tex": "2026-10-11T10:20:00+02:00" } }
  ```
  Les rutes són relatives a la carpeta de l'assignatura, com les altres que fa servir la web.
- **Les classes d'abans** no tenen este fitxer: vol dir que no s'hi ha editat res. No canvia cap format que ja hi haja (`classe.json`, `tema.json`, `esquema.yaml`).

### Passos

1. **`web/app.py`:** `compila_document`, i fer-la servir a `treu_del_tema`. Comprovar que «Esborra la classe» funciona igual que abans.
2. **`web/app.py`:** l'adreça per desar el LaTeX, i `edicions.json` (desar, `respon` i `passa_a_net`). `classe()` diu quins blocs s'han editat.
3. **`web/static/app.js` i `style.css`:**
   1. L'editor, «Desa i compila», «Descarta» i els avisos.
   2. L'avís en eixir amb canvis sense desar, el LaTeX només per llegir mentre Claude treballa, i l'avís de «Torna a passar a net».
4. **Instruccions:** la decisió 2 de `CLAUDE.md`, `web/prompt.md` i `flux.html` (v7), i republicar `flux.html`.
5. **`web-local.md`:** la H, «Com funciona».
6. **Prova** (baix).
7. **Tancar:** esta guia passa a «feta», i es fa el commit.

### Com es prova

A `localhost:8300`, amb una **còpia** de la classe del 05/10, perquè la prova no toque el teu document: `classes/2026-10-05-prova`, sense conversa de Claude i sense tema. Al final s'esborra des de la web.

1. **«LaTeX»:** al B41, canvia `corollari` per `teorema` (dues vegades).
   - Dalt ha de dir «Sense desar: B41.tex».
   - «Desa i compila»: ha d'eixir «Compilat: 10 pàgines», i a la dreta, «Teorema 1.34».
2. **Error:** lleva un `$` del B41 i compila.
   - Ha d'eixir l'avís roig amb `B41.tex` i la línia.
   - El PDF de la dreta no ha de canviar.
   - Torna a posar el `$` i compila: ha d'anar bé.
3. **Una línia `%%%%` esborrada:** esborra la línia `%%%% B40.tex %%%%` i clica «Desa i compila». Ha d'eixir l'avís taronja, i cap fitxer ha de canviar.
4. **«Descarta»:** ha de tornar al text que hi ha als fitxers, amb la línia del B40.
5. **Eixir sense desar:** canvia un bloc i clica «Materials». La web ha de preguntar abans d'eixir.
6. **Claude:**
   - `edicions.json` ha de dir `B41.tex`.
   - El missatge que rebria Claude ha de portar la línia dels blocs editats. Es comprova cridant la funció que fa el missatge, sense enviar-lo, perquè la còpia no té conversa i no cal gastar tokens.
7. **«Torna a passar a net»** (Materials): l'avís ha de dir que el B41 està editat a mà. Es cancel·la.
8. **Esborrar** la classe de prova des de la web.

Hi ha dues coses que no es poden provar amb la còpia, perquè no hi ha cap Claude treballant ni cap classe passada a net dins d'un tema:

- **El LaTeX només per llegir mentre Claude treballa.** Es comprova la pròxima vegada que passes una classe a net.
- **Una classe dins del document d'un tema.** Els blocs han d'eixir de `temes/<tema>/blocs/<classe>/`, i compilar ha de refer el PDF del tema. Es comprova amb la primera classe real amb tema, que és també la prova que falta de la E.
