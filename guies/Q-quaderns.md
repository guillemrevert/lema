# Guia Q · Quaderns i sessions

**Estat:** feta el 10/10/2026, en tres fases, cada una amb el seu vist-i-plau, la seua prova a `localhost:8300` i el seu commit.

**Mock-up:** [`guies/Q-mockup.html`](Q-mockup.html), publicat a https://claude.ai/artifact/9GubKJNLuRtgVF2frxS72t. Ensenya tres pantalles netes i, davall, nou parts explicades. Quan ací es diu «part 5», és la part 5 del mock-up. Les imatges són a `guies/img/`, fora de git.

## Què i per què

**El problema.** La web està pensada per classes, però el que t'emportes és el document del tema. Per això el Tema 1 està en tres llocs:

- el document del tema (12 pàgines), a la pàgina de l'assignatura;
- el PDF propi de la classe del 30/09 (12 pàgines);
- el PDF propi de la classe del 05/10 (10 pàgines).

Els dos últims són còpies d'abans de fer els temes. A més, «Resultat» i «Costat a costat» són dins de cada classe i t'ensenyen eixes còpies, no el document del tema. Ho vas dir el 10/10/2026: «Justament és lo primer el que em confon».

**La idea.** Donar-li la volta: **el quadern és el document**, i té la seua pàgina, on el mires i el revises. **La sessió només és com hi entren apunts nous:** puges les fotos, Claude les passa a net i el resultat va al quadern.

**Les paraules.** «Tema» passa a dir-se **quadern** i «classe» passa a **sessió**. Les vas triar tu el 10/10/2026, perquè l'eina pot servir per a més coses que els apunts d'un tema: unes pràctiques, un article, uns apunts de lectura.

És la Q del pla del frontend de `web-local.md`.

## Decisions

Totes amb la proposta del mock-up, com vas demanar («Escriu la guia amb les propostes»). Les alternatives van a «Opcions no triades» de `web-local.md` quan aproves la guia.

| Part | Què es decideix | Triat | No triat |
| --- | --- | --- | --- |
| 2 | La barra lateral | Els quaderns, cada un amb un enllaç al document i les seues sessions dins | Com ara: sessions agrupades, amb el quadern només com a títol |
| 3 | On es mira el document | A la pàgina del quadern | A cada sessió, amb el document del quadern |
| 5 | On es demanen les correccions a Claude | Una conversa de Claude per quadern | La conversa de l'última sessió; o un desplegable per triar la sessió |
| 7 | Si cada sessió va sempre al quadern | Sí: el quadern és obligatori i desapareix l'interruptor «Afegeix al document del tema» | Mantenir l'interruptor i el document a banda |
| 8 | Les còpies del 05/10 i del 30/09 | A la paperera | Deixar-les on són, sense ensenyar-les |
| 1 | Quaderns sense assignatura | De moment no: l'assignatura es queda com a nivell de dalt | Ja ara, per a pràctiques o articles que no són de cap assignatura |
| 9 | Els noms de dins (carpetes i fitxers) | També canvien: `quaderns/`, `sessions/`, `quadern.json`, `sessio.json`… | Només els textos de la web |

**Una decisió més, que no era al mock-up:** el document del quadern es diu `quadern.tex` i `quadern.pdf`, i no `tema.tex` i `tema.pdf`. És el que es veu al visor i quan el baixes.

**Un problema que s'arregla de pas.** Cada sessió numera els seus blocs B01, B02… dins de la seua carpeta, i cada bloc porta una etiqueta de LaTeX amb eixe nom (`\label{B01}`). Les referències («vegeu el Lema 1.30») fan servir eixes etiquetes. El document del Tema 1 ja té les etiquetes B01–B51 dels blocs d'abans de la web, així que la primera sessió nova les repetiria, i les referències podrien apuntar al bloc equivocat. Encara no ha passat, perquè no s'ha afegit cap sessió a un tema. **Solució:** les etiquetes dels blocs d'una sessió porten davant el nom de la seua carpeta (`\label{2026-10-10-B01}`). Els blocs d'abans de la web es queden com estan.

## Les fases

| Fase | Què | Per què en este ordre |
| --- | --- | --- |
| 1 | **Els noms, i una sola manera d'afegir.** Quadern i sessió a tota la web, a les dades i a les instruccions de Claude. Fora l'interruptor. Les etiquetes amb el nom de la sessió. Les còpies, a la paperera | És la base: les dades i les instruccions de Claude. Les pantalles no canvien de lloc encara, només de nom. Arregla l'error de les etiquetes abans que passes cap sessió nova |
| 2 | **La pàgina del quadern i la barra lateral.** El document, «Costat a costat» del quadern sencer i la llista de sessions. La sessió perd «Resultat» | És el canvi que es veu. Necessita que tot es diga ja «quadern» |
| 3 | **Correccions al quadern.** Una conversa de Claude per quadern, i veure-la treballar des de la pàgina del quadern | És la part nova per dins (un prompt nou i una conversa que no és d'una sessió). Fins llavors, les correccions es continuen demanant des de «Progrés» de cada sessió, com ara |

---

## Fase 1 · Els noms, i una sola manera d'afegir

**Estat:** feta el 10/10/2026. Què es va fer i com es va provar:

- **Còpies de seguretat:** a mà, `dades/copia-manual-20261010-173713/`; la de la web, `dades/copia-20261010-154522/`.
- **La migració** es va provar primer sobre una còpia de `dades/`, dins del contenidor. La segona vegada no fa res. Sobre les dades de veritat va tardar uns segons, per la còpia en la carpeta compartida amb Windows lenta, i només es va fer una vegada: no hi ha cap més còpia encara que el servidor s'haja reiniciat diverses vegades.
- **El Tema 1** és ara `quaderns/tema-1-grups/` amb `quadern.tex` i `quadern.pdf`, i compila: 12 pàgines.
- **Les còpies del 30/09 i del 05/10.** Abans de moure-les es va comprovar que els 51 blocs del 30/09 són idèntics als de `blocs/inicial/` i en el mateix ordre, i que els 42 del 05/10 també ho són. Els seus `tema.tex`, `tema.pdf`, `tema.aux`, `tema.log` i `blocs/` són ara a `dades/paperera/estructures-algebraiques/<sessió>-document-propi/`.
- **La web:**
  - diu «quadern» i «sessió», amb «Sense quadern» per a la sessió buida del 30/09;
  - «Resultat» de la sessió del 05/10 ensenya el document del Tema 1, de 12 pàgines;
  - «Nova sessió» no té l'interruptor i el quadern és obligatori;
  - les adreces velles (`#/classe/…`, `#/assignatura/…/temes`) porten a les noves.
- **L'API:**
  - sense quadern, no es pot crear una sessió ni llevar-li'l;
  - la sessió buida del 30/09 no es pot passar a net («Tria el quadern a Materials»);
  - una sessió de prova es va crear al Tema 1 i es va esborrar; és a la paperera.
- **El prompt** d'una sessió del Tema 1, generat sense enviar-lo, diu on és el quadern, que la sessió és després d'`inicial` i que les etiquetes són `\label{2026-10-10-B01}`.

**Canvis respecte al que deia la guia:**

- A `sessio.json`, la conversa de Claude passa de `sessio` a `conversa`, perquè no es confonga amb la sessió.
- A «Costat a costat» d'una sessió d'abans de la web, el LaTeX diu que els seus blocs són entre els d'`inicial`, en lloc de dir que no en té.

Queda per provar quan es passe a net la primera sessió nova: que Claude pose bé les etiquetes i afegisca els blocs al quadern.

### Què notaràs

- **Les paraules.** Tota la web diu «quadern» i «sessió»: «Nova sessió», la pestanya «Quaderns» de l'assignatura, «Sessió del 10/10», «Nou quadern»…
- **Nova sessió i Materials.** El quadern és obligatori: tries un dels que hi ha o en crees un amb el «+». Ja no hi ha l'interruptor «Afegeix al document del tema», perquè els blocs van sempre al document del quadern.
- **Les sessions del 05/10 i del 30/09** ja no tenen PDF propi. A «Resultat» veuen el document del Tema 1, de 12 pàgines. (A la fase 2, «Resultat» se'n va de la sessió.)
- **La sessió buida del 30/09**, que no té quadern, ix a «Sense quadern» fins que la poses en un o l'esborres. Sense quadern no es pot passar a net: «Passa a net» diu «Tria el quadern».
- **Les adreces** de la web canvien de `#/classe/…` a `#/sessio/…`. Si tens alguna adreça vella guardada, continua funcionant: la web et porta a la nova.

### Com funciona per dins

**Les dades canvien de nom una sola vegada, sola.** En arrancar, si la web troba les carpetes velles:

1. Fa una còpia de seguretat de `dades/assignatures/` a `dades/copia-<data>/`, per si alguna cosa ix malament.
2. Canvia els noms:

   | Abans | Ara |
   | --- | --- |
   | `temes/<tema>/` | `quaderns/<quadern>/` |
   | `tema.json` | `quadern.json` |
   | `tema.tex`, `tema.pdf` (del tema) | `quadern.tex`, `quadern.pdf` (i lleva `tema.aux` i `tema.log`, que es tornen a fer en compilar) |
   | `classes/<data>/` | `sessions/<data>/` |
   | `classe.json` | `sessio.json` |
   | dins de `sessio.json`, `"tema"` | `"quadern"` |
   | dins de `sessio.json`, `"fusiona"` | fora |

3. Si ja ho troba tot amb els noms nous, no fa res. No es pot fer dues vegades.

Ha de passar quan Claude no està treballant en cap sessió. Ara no n'hi ha cap a mitges: la del 10/10 encara no s'ha començat.

**Les còpies del 05/10 i del 30/09 van a la paperera, a mà**, en implementar-ho:

1. Comprovar que els seus blocs són al document del Tema 1, a `blocs/inicial/`. El document del Tema 1 es va fer amb els 51 blocs de la classe del 30/09 (2a part), que ja portava dins els del 05/10.
2. Moure els seus `tema.tex`, `tema.pdf`, `tema.aux`, `tema.log` i `blocs/` a `dades/paperera/estructures-algebraiques/<sessió>-document-propi/`.
3. Les sessions es queden amb les fotos, l'esquema, l'informe, `millores.md` i la conversa de Claude.

**El document d'una sessió és sempre el del seu quadern.** `document_de` deixa de mirar si la classe té PDF propi i si l'interruptor està encés: si la sessió té quadern i el quadern té PDF, el document és eixe.

**Claude rep sempre el quadern.** El prompt de la web ja no té el cas «document a banda». Diu on és el quadern, que els blocs d'esta sessió van a `blocs/<sessió>/` i que les etiquetes porten el nom de la sessió davant.

**Les adreces de l'API** també canvien de nom: `/api/classes/…` → `/api/sessions/…` i `/api/assignatures/<a>/temes` → `/api/assignatures/<a>/quaderns`. Només les fa servir la pàgina.

### Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/app.py` | La migració en arrancar (amb la còpia de seguretat). Els noms de les carpetes, els fitxers, les claus i les adreces de l'API. `document_de` sempre amb el quadern. «Nova sessió» exigeix quadern. El prompt sense el cas «document a banda» (fora `DOCUMENT_CLASSE`; `DOCUMENT_TEMA` passa a `DOCUMENT_QUADERN`, amb les etiquetes) |
| `web/static/app.js` | Els textos («quadern», «sessió»), les adreces (`#/sessio/…`, i les velles redirigeixen), la fitxa sense l'interruptor i amb el quadern obligatori, el grup «Sense quadern» |
| `web/prompt.md` | «Passa a net la sessió…», i `quadern.tex` en lloc de `tema.tex` |
| `CLAUDE.md` | La decisió 9 i dues línies més (vegeu baix) |
| `flux.html` | Els passos 0 i 6, i la v8 a `HISTORIAL`. Es republica |
| `web-local.md` | «Com funciona» (les carpetes noves) i la Q, fase 1 feta |

### Instruccions de Claude

**`CLAUDE.md`, decisió 9.** Ara es diu «Document per tema» i té el cas «Si no ho marca, la classe té el seu document a banda». Passaria a dir:

> **Document per quadern.** Des de la web, cada sessió pertany a un quadern (un tema, unes pràctiques, un article…), i els seus blocs s'afegeixen sempre al document del quadern, en ordre de data de sessió, sense tocar els de les altres sessions. Cada sessió té la seua carpeta de blocs dins del quadern (`blocs/<sessió>/`, amb B01, B02…), així que no cal renumerar mai. Les etiquetes dels blocs d'una sessió porten davant el nom de la seua carpeta (`\label{2026-10-10-B01}`), perquè no es repetisquen entre sessions. Les notetes continuen la numeració del quadern.

**`CLAUDE.md`, dues línies més:**
- «Materials d'entrada»: «…també si la classe s'afegeix al document d'un tema (decisió 9)» → «…i a quin quadern va la sessió (decisió 9)».
- Pas 6: «Si la classe s'afegeix al document d'un tema…» → «Des de la web, els blocs van a la carpeta del quadern, el document és `quadern.tex` i es compila el quadern; l'informe diu a quines pàgines és la sessió».

La resta de `CLAUDE.md` parla de la Prova 1 (`prova-1/`, una classe d'Anàlisi II o d'EA, `tema.tex`) i es queda com està.

**`flux.html`, v8:**
- Pas 0: «Des de la web, la carpeta de la sessió i la del seu quadern ja existeixen».
- Pas 6: la decisió 9 nova, amb les etiquetes.

### Dades

Canvien els noms, com diu la taula de «Com funciona per dins». El que hi ha dins dels fitxers és igual, tret de les claus `tema` i `fusiona` de `sessio.json`. La còpia de seguretat queda a `dades/copia-<data>/` fins que l'esborres tu.

### Passos

1. **Còpia de seguretat** de `dades/` a mà, abans de començar, a més de la que farà la web.
2. **`web/app.py`:** la migració, i provar-la sobre una còpia de `dades/` abans de deixar-la anar sobre les de veritat.
3. **`web/app.py`:** els noms, les adreces, `document_de`, el quadern obligatori i el prompt.
4. **`web/static/app.js`:** els textos, les adreces, la fitxa i «Sense quadern».
5. **Les còpies del 05/10 i del 30/09**, a la paperera (a mà, després de comprovar `inicial/`).
6. **Instruccions:** `CLAUDE.md`, `web/prompt.md` i `flux.html` (v8), i republicar `flux.html`.
7. **`web-local.md`.**
8. **Prova** (baix).
9. **Tancar:** esta fase passa a «feta» i commit.

### Com es prova

A `localhost:8300`:

1. **La migració:** després d'arrancar, hi ha `quaderns/tema-1-grups/quadern.json`, `quadern.tex` i `quadern.pdf`, i `sessions/` amb les quatre sessions. Ja no hi ha `temes/` ni `classes/`. Hi ha la còpia a `dades/copia-<data>/`. Si es reinicia el contenidor, no torna a fer res.
2. **El Tema 1 compila** amb el nom nou: `python compila.py` sobre la carpeta del quadern dona 12 pàgines.
3. **La web diu «quadern» i «sessió»** a la barra lateral, a «Nova sessió», a la pàgina de l'assignatura i a cada sessió.
4. **Les sessions del 05/10 i del 30/09:** a «Resultat», el document del Tema 1, de 12 pàgines. A la seua carpeta ja no hi ha `tema.pdf` ni `blocs/`: són a la paperera.
5. **Nova sessió:** sense quadern no es pot crear. Amb el «+» es crea un quadern nou. No hi ha l'interruptor. Es crea una sessió de prova al Tema 1, i després s'esborra.
6. **El prompt** d'una sessió del Tema 1 diu on és el quadern i porta la regla de les etiquetes. Es comprova generant-lo, sense enviar-lo a Claude.
7. **Una adreça vella** (`#/classe/estructures-algebraiques/2026-10-05/resultat`) porta a la nova.
8. **La sessió buida del 30/09** ix a «Sense quadern», i «Passa a net» diu que falta el quadern.

---

## Fase 2 · La pàgina del quadern i la barra lateral

**Estat:** feta el 10/10/2026. Provada a `localhost:8300`:

- **Barra lateral:** el Tema 1 amb una icona de llibre, enllaç al document i les seues tres sessions dins. «Nou quadern» a cada assignatura obri la pàgina de l'assignatura amb el formulari ja obert. La sessió buida del 30/09, a «Sense quadern».
- **La pàgina del Tema 1:**
  - 12 pàgines, «Obre el PDF», «Descarrega el .tex» i «Nova sessió en este quadern», que porta a «Nova sessió» amb el Tema 1 ja triat;
  - la llista amb «Abans de la web», 30/09, 05/10 i 10/10.
- **Costat a costat:**
  - 11 fotos en dos grups (30/09 i 05/10), amb la nota que els blocs d'abans de la web no tenen fotos;
  - el LaTeX amb 51 línies, de `%%%% inicial/B01.tex %%%%` a `inicial/B51.tex`.
- **Editar i compilar**, amb una còpia del quadern (`quaderns/prova-q`, ara a la paperera), perquè no es tocara el Tema 1:
  - canviar el B41 i compilar (12 pàgines, «Teorema 1.34» al PDF de la còpia i no al del Tema 1);
  - l'error de LaTeX amb `./blocs/inicial/B41.tex`, línia 3;
  - l'arreglat;
  - la línia `%%%% inicial/B40.tex %%%%` esborrada, que no desa res;
  - «Descarta».
- **`edicions.json`** queda a la carpeta del quadern. Cada sessió només veu els seus blocs editats, en l'avís de «Torna a passar a net». La nota per a Claude porta tots els del quadern. El Tema 1 de veritat no en té cap.
- **La sessió del 05/10:**
  - només «Materials» i «Progrés»; en obrir-la, «Materials», amb l'avís «Esta sessió ja és al quadern» i el botó;
  - «Progrés» té l'informe i els fitxers;
  - les adreces velles de «Resultat» (també `…/resultat/costat`) porten al quadern.

**Canvis respecte al que deia la guia:**

- Una sessió acabada s'obri per «Materials», amb l'avís dalt.
- L'informe i la llista de fitxers, que eren a «Resultat», passen a «Progrés».
- L'ordre del LaTeX del quadern el diuen els `\input` de `quadern.tex`, com deia la guia, i els blocs que no hi són no ixen.

No s'ha pogut provar sense fer treballar Claude:

- que el LaTeX quede bloquejat mentre Claude passa a net una sessió del quadern;
- que, en tornar a passar a net una sessió, els seus blocs editats se'n vagen al registre.

### Què notaràs

- **La barra lateral** (part 2):
  - per a cada assignatura, els seus quaderns, amb una icona de llibre, i cada un és un enllaç al document;
  - davall de cada quadern, les seues sessions, de la més nova a la més vella;
  - «+ Nou quadern» a cada assignatura, i «Sense quadern» per a les que no en tenen.

  La barra plegada es queda com ara.
- **La pàgina del quadern** (part 3, pantalla 1), nova:
  - el nom, amb el llapis per canviar-lo, i quantes pàgines té el document i quan es va actualitzar;
  - «Obre el PDF», «Descarrega el .tex» i «+ Nova sessió en este quadern», que crea la sessió ja dins del quadern;
  - l'interruptor «PDF sencer / Costat a costat»;
  - la llista de sessions, en ordre de data, amb una fila «Abans de la web» per als blocs de `inicial/`.
- **El quadern costat a costat** (part 4, pantalla 2):
  - a l'esquerra, les fotos de totes les sessions, en ordre de data, amb el nom de cada sessió damunt i un enllaç per obrir-la;
  - o tot el LaTeX del quadern en un sol text, amb línies de marca que porten la carpeta (`%%%% 2026-10-05/B41.tex %%%%`, `%%%% inicial/B41.tex %%%%`);
  - a la dreta, el document.

  Editar i compilar funciona igual que ara.
- **La sessió** (part 6, pantalla 3): només «Materials» i «Progrés». Quan està acabada, dalt ix «Esta sessió ja és al quadern» amb un botó per anar-hi.
- **Correccions a Claude:** fins a la fase 3, es continuen demanant des de «Progrés» de cada sessió, amb el quadre «Escriu-li a Claude» que ja hi ha.
- **La pàgina de l'assignatura:** la pestanya «Quaderns» és la llista de quaderns, i cada un enllaça a la seua pàgina. La pestanya «Fonts», igual.

### Com funciona per dins

- **Una pàgina nova a la web**, `#/quadern/<assignatura>/<quadern>`, i `…/costat` per a la vista dividida. La pàgina d'una sessió perd `…/resultat`. Si arribes a una adreça vella de «Resultat», et porta al quadern.
- **Adreces noves a l'API:**
  - `GET /api/quaderns/<a>/<q>`: el nom, el PDF i les sessions;
  - `GET …/latex`: tots els blocs del quadern, carpeta per carpeta, en l'ordre del document. L'ordre el diu `quadern.tex`, que té els `\input` en ordre;
  - `POST …/latex`: desar i compilar.
  
  Les de «Costat a costat» de la sessió se'n van.
- **`edicions.json` passa al quadern.** Quan edites un bloc, s'apunta a la carpeta del quadern.
  - **En una correcció des de «Progrés» d'una sessió**, Claude rep tots els blocs editats del quadern.
  - **En «Torna a passar a net» d'una sessió**, l'avís diu només els blocs d'eixa sessió que has editat, i eixes entrades se'n van al registre de la sessió.
- **No es pot editar el LaTeX del quadern** mentre Claude treballa en qualsevol sessió del quadern.

### Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/app.py` | Les adreces del quadern (informació i LaTeX). `edicions.json` al quadern. El bloqueig mentre treballa Claude en una sessió del quadern |
| `web/static/app.js` | La barra lateral, la pàgina del quadern (`pintaQuadern`), «Costat a costat» del quadern (`pintaCostat` per a tot el quadern), la sessió sense «Resultat» i amb l'avís, la pestanya «Quaderns» de l'assignatura |
| `web/static/style.css` | La barra lateral, la pàgina del quadern i la llista de sessions |
| `web-local.md` | La Q, fase 2 feta; «Com funciona» |

### Instruccions de Claude

Cap canvi.

### Dades

`edicions.json` passa de la carpeta de la sessió a la del quadern. Ara no n'hi ha cap a les sessions, així que no cal moure res.

### Passos

1. **`web/app.py`:** les adreces del quadern i `edicions.json` al quadern.
2. **`web/static/app.js` i `style.css`:** la barra lateral, la pàgina del quadern, el costat a costat del quadern, la sessió sense «Resultat» i la pestanya «Quaderns».
3. **`web-local.md`.**
4. **Prova** (baix).
5. **Tancar:** fase 2 «feta» i commit.

### Com es prova

A `localhost:8300`:

1. **Barra lateral:** el Tema 1 amb les seues tres sessions dins; «+ Nou quadern»; la sessió del 30/09 sense quadern a «Sense quadern».
2. **La pàgina del Tema 1:** 12 pàgines; la llista amb «Abans de la web», 30/09, 05/10 i 10/10; «+ Nova sessió en este quadern» crea una sessió ja dins (de prova, i s'esborra).
3. **Costat a costat:**
   - 11 fotos, en dos grups (30/09 i 05/10), i el document a la dreta;
   - el LaTeX amb 51 línies `%%%% inicial/Bnn.tex %%%%`.
4. **Editar i compilar**, amb una còpia del quadern (`quaderns/prova-q`), perquè la prova no toque el Tema 1: canviar un bloc, compilar, error, «Descarta». Al final s'esborra.
5. **La sessió del 05/10:** només «Materials» i «Progrés», amb l'avís i el botó al quadern. L'adreça vella de «Resultat» porta al quadern.

---

## Fase 3 · Correccions al quadern

**Estat:** feta el 10/10/2026. Provada a `localhost:8300` amb una còpia del Tema 1 (`quaderns/prova-q`, ara a la paperera):

- **Primera correcció:** «A la definició de Tipus (bloc inicial/B38), canvia el títol «Tipus» per «Tipus d'una permutació». Res més.»
  - Es veia Claude treballant a la pàgina del quadern, amb el temps, els tokens i «Atura».
  - Va tardar 45 s i va gastar 82.847 tokens, més del que deia la guia (uns 20.000 de base més el que llig). La majoria són tokens de la memòria cau.
  - En acabar, la pàgina es va tornar a pintar sola amb el PDF nou. Només havia canviat el B38 de la còpia; el Tema 1 no es va tocar.
  - `quadern.json` guarda la conversa, l'estat i els tokens.
- **Segona correcció:** «Desfés el canvi que has fet abans». Va continuar la mateixa conversa (el mateix identificador als dos registres) i Claude sabia quin canvi havia de desfer. 46 s i 61.757 tokens.
- **El bloqueig, mentre Claude corregia:**
  - «Desa i compila» estava desactivat i el LaTeX només es podia llegir, amb l'avís «Claude està corregint el quadern». Desar per l'API també ho rebutjava.
  - Una segona correcció alhora, rebutjada.
  - Es va crear una sessió de prova en el quadern de prova i s'hi va pujar una foto. «Passa a net» deia «Espera · Claude està corregint el quadern: la podràs passar a net quan acabe», amb el botó desactivat. Esborrar-la també es rebutjava.
- **«Atura»:** una tercera correcció es va aturar als pocs segons. Ix «Aturada», el torn diu «Aturat · 32.132 tokens» i torna el quadre per escriure-li. El quadern es va quedar com estava.
- **Neteja:** la sessió de prova i `prova-q` són a la paperera.

**Canvis respecte al que deia la guia:**

- `executa` rep la clau del procés i la carpeta (de la sessió o del quadern). La fitxa on apunta l'estat és `sessio.json` o `quadern.json`, la que hi haja a la carpeta.
- També es bloqueja:
  - esborrar una sessió mentre un Claude treballa en el seu quadern, perquè esborrar-la canvia el document;
  - demanar una correcció mentre es compila el LaTeX que has editat.
- «Passa a net» d'una sessió ja diu «Espera» abans de clicar, i no només quan cliques.
- Si tens canvis al LaTeX sense desar, la web no envia la correcció i et demana que els deses o els descartes, perquè Claude treballarà sobre eixos fitxers.
- Les correccions van davall de «Sessions», com al mock-up. Les anteriors es veuen en un quadre amb la seua barra de desplaçament, i en enviar-ne una la pàgina hi baixa.
- Si un torn no acaba amb `ESTAT: …`, queda com «Esperant-te», igual que a les sessions.

No s'ha provat:

- una correcció amb fitxers adjunts;
- demanar una correcció mentre es passa a net una sessió del quadern (passa pel mateix bloqueig, però caldria passar a net una sessió de veritat).

### Què notaràs

- **A la pàgina del quadern**, «Hi ha alguna cosa malament al quadern?», amb «Adjunta fitxers» i «Envia a Claude».
- **En enviar**, el quadre es converteix en «Claude està corregint el quadern…», amb el que va fent (com a «Progrés»), el temps, els tokens i un botó «Atura». Quan acaba, el document de dalt es torna a carregar i ix el que Claude ha dit.
- **Les correccions següents continuen la mateixa conversa**, perquè Claude recorde el que ja ha fet en este quadern.
- **Mentre Claude corregeix el quadern**, no es pot passar a net cap sessió del quadern ni editar el LaTeX. Al revés, igual: mentre una sessió del quadern es passa a net, no es poden demanar correccions al quadern.

### Per què

Un quadern té moltes sessions, cada una amb la seua conversa, i els blocs d'abans de la web no en tenen cap. Amb una conversa per quadern, tots els canvis al document passen pel mateix lloc. Les sessions es queden amb la seua conversa per passar a net i per al punt de control.

### Com funciona per dins

- **Un prompt nou, `web/prompt-quadern.md`**, curt. Diu a Claude:
  - on és el quadern i com és (`quadern.tex`, `blocs/<sessió>/`, `inicial/`);
  - que faça només el que demanes, seguint `CLAUDE.md` (decisions 2, 7, 8 i 9);
  - que compile amb `compila.py`;
  - que acabe amb un resum curt del que ha canviat.

  Al final de cada missatge s'hi afegeix la llista de blocs editats a mà (`edicions.json`).
- **La conversa es guarda a `quadern.json`**, amb els tokens. El que fa Claude s'apunta a `quaderns/<q>/registre/`, com a les sessions.
- **Una sola funció per parlar amb Claude.** La que ara fa córrer Claude per a una sessió (`executa`) passa a servir també per al quadern: rep on escriure el registre i on guardar la conversa.
- **El bloqueig:** abans d'arrancar Claude, per a una sessió o per al quadern, la web comprova que no hi haja cap altre Claude treballant en el mateix quadern.

### Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/app.py` | `executa` per a sessions i quaderns. Adreces noves: `POST /api/quaderns/<a>/<q>/corregeix`, `…/events`, `…/atura`. El bloqueig d'un Claude per quadern |
| `web/prompt-quadern.md` | Nou |
| `web/static/app.js` | El quadre de correccions i el que fa Claude a la pàgina del quadern (el mateix codi que «Progrés», fet servir des dels dos llocs) |
| `web/static/style.css` | El quadre mentre Claude treballa |
| `web-local.md` | La Q, feta; «Com funciona» (la conversa del quadern) |

### Instruccions de Claude

`CLAUDE.md` no canvia: Claude Code el llig sempre, i el prompt nou diu la resta. Tampoc `flux.html`, perquè no canvia cap pas.

### Dades

- `quadern.json` guarda la conversa de correccions i els tokens.
- `quaderns/<q>/registre/`, nou, amb el que fa Claude.
- Els quaderns d'abans no tenen conversa: la primera correcció la crea.

### Passos

1. **`web/app.py`:** `executa` per als dos casos, les adreces de correcció i el bloqueig.
2. **`web/prompt-quadern.md`.**
3. **`web/static/app.js` i `style.css`:** el quadre i el que fa Claude.
4. **`web-local.md`.**
5. **Prova** (baix).
6. **Tancar:** guia «feta» i commit.

### Com es prova

A `localhost:8300`, amb la còpia del quadern (`quaderns/prova-q`):

1. **Una correcció de veritat**, xicoteta, per exemple «A la Definició 1.31, canvia "tipus" per "estructura de cicles"». Gasta tokens: la primera crida, uns 20.000 de base més el que llija del quadern.
   - Es veu Claude treballant a la pàgina del quadern.
   - En acabar, el PDF té el canvi i `quadern.json` guarda la conversa.
2. **Una segona correcció** continua la mateixa conversa.
3. **El bloqueig:** mentre Claude corregeix, «Desa i compila» està desactivat i «Passa a net» d'una sessió del quadern diu que s'espere.
4. **«Atura»** para Claude i deixa el quadern com estiga.
5. **Esborrar** la còpia del quadern.
