# Guia E · Temes, nova classe en una pàgina i pàgina d'assignatura

**Estat:** fase 1 aprovada i implementada el 10/10/2026; falta la prova amb Claude (passos 2 a 6 de «Com es prova»). Fase 2 feta el 10/10/2026. Fase 3: proposta. Cada fase té el seu vist-i-plau, la seua prova a `localhost:8300` i el seu commit.

**Mock-up:** [`guies/E-mockup.html`](E-mockup.html), publicat a https://claude.ai/artifact/WiexpoKYYX9KEYjDHxzhum. Ensenya quatre pantalles netes i, davall, setze parts explicades amb les alternatives una al costat de l'altra. Quan ací es diu «part 7», és la part 7 del mock-up.

## Què i per què

Petició teua del 10/10/2026, amb la captura de la web marcada en roig:

1. **Les classes, per temes.** A Nova classe, un desplegable per triar a quin tema pertany la classe, un «+» per crear-ne un de nou i un interruptor per triar si la classe es fusiona al PDF unificat del tema. Una vegada tries, la pàgina s'estén per baix amb el que ara és la segona pantalla (les fotos, les fonts, el text per a Claude): tot en una sola pàgina, i comprimit, perquè ara és molt llarga i cal fer molt de desplaçament.
2. **La barra lateral es plega**, cap al costat i per assignatures. En clicar una assignatura s'obri una pàgina que ara no existeix, amb una pestanya dividida per temes: els PDF generats, amb el seu títol, que es pot canviar.

També ho demanen els `millores.md` de les classes del 05/10 i del 30/09 («fa falta la carpeta per tema»: ara hi ha tres còpies del tema 1) i `prova-1/millores.md` (identificadors de bloc que no depenguen de l'ordre). Al pla del frontend de `web-local.md` és la fila E (carpeta per tema) i dues files noves, O i P. Si la creu de la captura vol dir «esborrar esta classe», també la F.

## Les fases

| Fase | Fila del pla | Què | Depèn de |
| --- | --- | --- | --- |
| 1 | E | Temes: a les dades, a la web (desplegable, «+», interruptor, barra lateral per temes) i a Claude (els blocs van al document del tema) | Res |
| 2 | O i F | Nova classe i Materials en una sola pàgina, comprimida. Esborrar una classe | Fase 1 |
| 3 | P | Barra lateral plegable, i pàgina d'assignatura amb els temes, els PDF i les fonts | Fase 1. La pestanya «Fonts» trau el formulari de pujar fonts de Materials (part 8) |

Per què este ordre: la fase 1 és la base (les dades i les instruccions de Claude); sense temes no hi ha res a agrupar ni a ensenyar. La fase 2 és la pantalla que més fas servir. La fase 3 és la pantalla nova, que només té sentit quan ja hi ha temes amb PDF.

## Decisions

Cada fila és una part del mock-up on hi ha dues maneres de fer-ho. La proposta és la que va marcada al mock-up. Quan dónes el vist-i-plau, les alternatives no triades passen a «Opcions no triades» de `web-local.md`.

| Part | Què es decideix | Proposta | Alternativa |
| --- | --- | --- | --- |
| 2 | Com es crea un tema des del formulari | **A.** Desplegable i botó «+»: el desplegable es converteix en un camp de text amb «Crea» | B. Una opció «Nou tema…» dins del desplegable |
| 3 | Com es tria si la classe va al document del tema | **A.** Un interruptor «Afegeix al document del tema», encés per defecte | B. Dues targetes a triar («Al document del tema» / «Document a banda») |
| 4 | Quan s'estén la pàgina amb els materials | **A.** En clicar «Crea la classe»: la fitxa es queda dalt i davall apareixen els materials | B. S'estén sola en triar el tema i la carpeta es crea amb la primera foto |
| 6 | Com es comprimeixen els apunts | **A.** Miniatures de 104 px en graella, a la columna esquerra | B. Una sola fila que es desplaça de costat |
| 7 | Com es comprimeixen les fonts | **A.** Una línia per font i fitxes xicotetes per als PDF | B. Com ara (targetes grans i una línia per PDF) |
| 8 | On es puja una font nova | **A.** A la pestanya «Fonts» de la pàgina d'assignatura (fase 3); a Materials només queda un enllaç | B. Plegat dins de Materials |
| 9 | Com s'esborra una classe | **A.** Enllaç «Esborra la classe» a la fitxa, amb confirmació. La carpeta va a `dades/paperera/` | B. Una creu a la barra lateral |
| 10 | On queda el botó «Passa a net» | **A.** Barra enganxada a la vora de baix de la finestra | B. Botó a la capçalera |
| 11 | Com es veuen les classes a la barra lateral | **A.** Com ara, amb el tema com a subtítol (dues línies per classe) | B. Una línia per classe, només el nom i el puntet |
| 12 | Com es plega la barra lateral | **A.** Tira de 60 px amb el logo, el «+» i una inicial per assignatura | B. Amagada del tot, amb un botó flotant |
| 13 | Com es veuen els temes a la pàgina d'assignatura | **A.** Una targeta per tema: document del tema i llista de classes | B. Una taula |
| 14 | Com es canvia el nom d'un tema | **A.** Llapis al costat del nom; es converteix en un camp de text | B. Clicar el nom directament |
| 15 | On viuen els blocs d'una classe que va al tema | **A.** Al tema, en una carpeta per classe (`temes/<tema>/blocs/<classe>/`) | B. A la classe, i el `tema.tex` del tema els apunta amb rutes relatives |

### Pendents: necessite resposta abans de començar la fase 1

1. **Part 9.** A la captura hi ha una creu roja al costat de la classe del 30/09 que està «Sense començar». He entés que vols poder esborrar classes. És això?
2. **Part 16.** El Tema 1 d'Estructures Algebraiques, comença amb el document que ja tens (els 51 blocs de la classe del 30/09, 2a part) o comença buit i es va fent amb les classes noves? Si comença amb el que ja tens, ho faig jo a mà en implementar la fase 1 (pas 9 de la fase 1). **Resposta (10/10/2026):** sí, amb els 51 blocs.
3. **Part 8.** D'acord que el formulari de pujar fonts se'n vaja a la pàgina d'assignatura (fase 3)? Fins llavors es queda a Materials, plegat davall d'un enllaç.
4. **Part 11.** Barra lateral amb dues línies per classe (A, com ara) o una (B)?

Les altres files de la taula, si no dius res, van amb la proposta.

---

## Fase 1 · E · Temes

**Estat:** implementada el 10/10/2026, amb les propostes de les parts 2, 3, 11 i 15. Provat a `localhost:8300` amb dades de prova, després esborrades: l'API (crear temes, ordre natural, classes amb tema i interruptor, canvis des de Materials, errors), el prompt dels tres casos (al tema, PDF a banda, sense tema), la compilació d'un tema amb blocs simulats des de la seua carpeta, i la interfície (formulari, «+» amb Intro, interruptor, barra lateral per temes, targeta «Tema» de Materials, barra de «Passa a net» i Resultat amb el PDF del tema i amb el PDF propi de les classes d'abans). Falta passar a net una classe de veritat amb tema. El pas 9 es va fer el 10/10/2026: el Tema 1 («Tema 1. Grups. Subgrups. Homomorfismes de grups», carpeta `tema-1-grups`) comença amb els 51 blocs de la classe del 30/09 (2a part), copiats a `blocs/inicial/`, i compila amb 12 pàgines, com el PDF d'aquella classe. Les classes del 05/10 i del 30/09 (2a part) són al Tema 1 amb l'interruptor apagat, perquè els seus blocs ja són a `inicial`. La del 10/10 hi és amb l'interruptor encés. La classe buida del 30/09 es queda a «Sense tema».

**Desviació:** en crear un tema amb el «+», la llista de temes es torna a demanar al servidor, perquè tinga el mateix ordre que a la barra lateral.

### Què notaràs

- A **Nova classe**, davall de l'assignatura, el desplegable «Tema» amb els temes d'eixa assignatura i «Sense tema», el botó «+» per crear-ne un sense eixir del formulari, i l'interruptor «Afegeix al document del tema» (parts 2 i 3). L'interruptor només es veu quan hi ha tema triat.
- A la **barra lateral**, les classes de cada assignatura agrupades pel tema, amb «Sense tema» al final (part 11).
- A **Materials**, dalt de tot, una targeta xicoteta amb el tema i l'interruptor, per canviar-los mentre Claude no treballe. Serveix per posar en un tema les classes que ja tens (part 16). A la fase 2 esta targeta es converteix en la fitxa sencera de la classe.
- A **Resultat**, si la classe s'afegeix al tema, es veu el PDF del tema sencer i l'informe diu a quines pàgines és la classe (part 15).
- **Claude** escriu els blocs de la classe dins de la carpeta del tema i compila el document del tema, en lloc de copiar-se el tema a la carpeta de la classe.

### Per què

Perquè el tema siga un sol document que creix classe a classe, en lloc d'una còpia a cada classe. I perquè el tema siga el que s'ensenya i s'exporta (fase I, Overleaf).

### Com funciona per dins

**El tema és una carpeta** dins de l'assignatura, amb el document i els blocs de totes les classes que s'hi han afegit:

```
dades/assignatures/estructures-algebraiques/
  temes/tema-1-grups/
    tema.json                 {"nom": "Tema 1 · Grups", "creat": "2026-10-10T…"}
    tema.tex  tema.pdf        el document del tema (i els .aux i .log de compilar)
    blocs/2026-10-10/B01.tex  els blocs de cada classe, en una carpeta per classe
    blocs/2026-10-17/B01.tex
  classes/2026-10-10/
    classe.json               …, "tema": "tema-1-grups", "fusiona": true
    apunts/  adjunts/  registre/
    esquema.yaml  informe.md  millores.md
```

L'identificador del tema (`tema-1-grups`) ix del nom la primera vegada i ja no canvia encara que es canvie el nom: així no es trenca cap ruta. Els blocs es numeren B01, B02… dins de cada classe; la carpeta de la classe els fa únics dins del tema, que és el que demanava `prova-1/millores.md` (que no calga renumerar quan una classe va abans d'una altra).

**Qui fa què.** La web crea la carpeta del tema (amb «+») i la de la classe. Claude, en passar a net una classe amb l'interruptor encés:

1. Escriu els blocs a `temes/<tema>/blocs/<classe>/`. Si la carpeta ja té blocs d'una passada anterior de la mateixa classe («Torna a passar a net»), els esborra i lleva els seus `\input` de `tema.tex` abans d'escriure'n de nous.
2. Si `tema.tex` no existeix, el crea (com el d'ara, amb `\input{plantilla}` i el nom del tema com a títol). Si existeix, no toca els blocs d'altres classes: només hi afegeix els `\input{blocs/<classe>/Bnn}` de la classe, en ordre de data de classe (el prompt li diu quines classes ja hi són i de quin dia).
3. Les notetes continuen la numeració del tema (busca l'última als blocs que ja hi ha), com ja fa ara a mà.
4. Compila la carpeta del tema amb `compila.py`.
5. Deixa `esquema.yaml`, `informe.md` i `millores.md` a la carpeta de la classe, i a l'informe diu a quines pàgines del PDF del tema és la classe.

Amb l'interruptor apagat, tot va com ara: `blocs/`, `tema.tex` i `tema.pdf` a la carpeta de la classe.

**Les correccions després del PDF** van igual que ara: el missatge continua la mateixa conversa i Claude toca els blocs de la classe dins del tema i recompila el tema.

### Fitxers

- `web/app.py`
  - `carpeta_tema(a, t)` i `info_tema(carpeta)`: llig `tema.json` i hi afegeix `id`, si hi ha `tema.pdf`, quantes pàgines té (amb `pypdf`, que ja és a `requirements.txt`) i quan es va fer.
  - `GET /api/assignatures`: cada assignatura torna `temes` (ordenats pel nom, amb ordre natural: Tema 2 abans que Tema 10) i cada classe porta `tema` i `fusiona`.
  - `POST /api/assignatures/{a}/temes` amb `{nom}`: crea la carpeta i `tema.json`. 400 sense nom, 409 si ja existeix.
  - `NovaClasse`: camps `tema` (opcional) i `fusiona` (per defecte cert si hi ha tema). `crea_classe` comprova que el tema existeix.
  - `CanvisClasse`: `tema` i `fusiona`. `modifica_classe` els rebutja amb 409 si Claude està treballant.
  - `migra`: a les classes d'abans, `tema: null` i `fusiona: false`.
  - `GET /api/classes/{a}/{c}`: `pdf` i `fitxers` passen a ser rutes relatives a la carpeta de l'assignatura (`classes/<c>/…` o `temes/<t>/…`). Si la classe s'afegeix al tema, `pdf` és `temes/<t>/tema.pdf` i `fitxers` inclou el `tema.tex` i el `tema.pdf` del tema.
  - `passa_a_net`: 400 si l'interruptor està encés i el tema ja no existeix.
  - `prompt_classe`: omple un bloc `{document}` nou segons l'interruptor (vegeu «Instruccions de Claude»), amb el nom del tema, la seua carpeta i les classes que ja hi tenen blocs, amb la data.
- `web/static/app.js`
  - `pintaNova`: el desplegable de temes de l'assignatura triada, el «+» (en clicar-lo, el desplegable es converteix en un camp de text amb «Crea» i «Cancel·la»; en crear, torna el desplegable amb el tema nou triat) i l'interruptor. En crear la classe s'envien `tema` i `fusiona`. Recorda l'últim tema de cada assignatura al navegador, com ja fa amb l'assignatura.
  - `pintaLateral`: agrupa les classes per tema (els temes en ordre i «Sense tema» al final), amb el tema com a subtítol `.tema-nav`.
  - `pintaMaterials`: la targeta «Tema» de dalt (desplegable, «+» i interruptor), que desa amb `PUT`.
  - `capcalera`: la línia de dalt del títol diu l'assignatura i el tema.
  - `pintaResultat`: fa servir les rutes noves (`urlFitxer(a, ruta)`); si la classe va al tema, el títol de la targeta del PDF diu «Document del tema «…»» i una línia recorda que l'informe diu a quines pàgines és la classe.
  - `barraPassa`: el resum diu «S'afegirà al document del Tema 1» o «PDF a banda».
- `web/static/style.css`: `.amb-boto`, `.interruptor` i `.tema-nav` (els estils són al mock-up, a l'apartat «Fase 1»).
- `web/prompt.md`: el bloc «On va cada cosa» passa a tindre `{document}`.
- `CLAUDE.md`, `flux.html` i `web-local.md`: vegeu els dos apartats següents.

### Instruccions de Claude

- **`web/prompt.md`.** A «On va cada cosa», la primera línia («Tot el que generes, dins de `{carpeta}`…») passa a ser `{document}`, que el servidor omple així:
  - Interruptor encés:
    > **Document del tema «{tema_nom}»**, a `{carpeta_tema}`. Esta classe s'hi afegeix:
    > - Els blocs de la classe, a `{carpeta_tema}/blocs/{classe}/` (B01, B02…). Si la carpeta ja té blocs d'una passada anterior d'esta classe, esborra'ls i lleva'n els `\input` de `tema.tex` abans d'escriure'n de nous.
    > - `tema.tex` és a `{carpeta_tema}` i carrega la plantilla amb `\input{{plantilla}}`. Si no existeix, crea'l amb el nom del tema com a títol. Si existeix, no toques els blocs de les altres classes: afegeix-hi només els `\input{blocs/{classe}/Bnn}` d'esta classe, en l'ordre de data de les classes. Classes que ja hi són: {classes_tema}.
    > - Les notetes continuen la numeració del tema: busca l'última als blocs que ja hi ha.
    > - Compila amb `python compila.py {carpeta_tema}`.
    > - `esquema.yaml`, `informe.md` i `millores.md`, a la carpeta de la classe, `{carpeta}`. A l'informe, digues a quines pàgines del PDF del tema és esta classe.
  - Interruptor apagat o sense tema: la línia d'ara, sense canvis.
  - La ruta de la plantilla és la mateixa des de la carpeta del tema que des de la de la classe (cinc nivells fins a l'arrel).
- **`CLAUDE.md`.**
  - Decisió nova, la 9: *Document per tema.* Des de la web, cada classe pertany a un tema i, si l'usuari ho marca, els seus blocs s'afegeixen al document del tema, en ordre de data de classe. Els blocs es numeren B01… dins de cada classe i la carpeta de la classe dins del tema els fa únics; les notetes continuen la numeració del tema. Si l'usuari no ho marca, la classe té el seu document a banda.
  - Pas 6: s'afegeix «Si la classe s'afegeix a un tema, els blocs van a la carpeta del tema i es compila el document del tema (decisió 9)».
  - «Fora d'abast»: es lleva «Document incremental entre sessions», que és justament això.
  - «Materials d'entrada»: s'apunta que des de la web el tema és a `temes/`.
- **`flux.html`**, versió 6, al mateix commit: a `PASSOS`, el pas 0 diu que des de la web la carpeta de la classe i la del tema ja existeixen, i el pas 6 diu el de la decisió 9 (blocs a la carpeta del tema, `\input` en ordre de data, notetes que continuen, compilar el tema). Entrada nova al principi d'`HISTORIAL` (v6, la data del commit, què canvia als passos 0 i 6) i republicar a https://claude.ai/artifact/VgnAEHRNnpvhkr4PyRxV6X.
- **`web-local.md`**: l'arbre de «Dades» amb `temes/`, la fila E del pla marcada com a feta, i una fila a «Decisions preses» (document per tema).

### Dades

- **`tema.json`** (nou): `nom` i `creat`. La resta (si hi ha PDF, pàgines, data) es calcula en llegir.
- **`classe.json`**: dos camps nous, `tema` (identificador del tema o `null`) i `fusiona` (cert o fals). Les classes d'abans es lligen igual: `migra` els posa `null` i `false`, i es guarden la primera vegada que es desa la classe, com es va fer amb `fonts` el 07/10.
- **Resposta de `GET /api/classes/{a}/{c}`**: `pdf` i `fitxers` canvien de base (abans relatives a la classe, ara a l'assignatura). Només ho llig `app.js`, que es canvia alhora.
- **Les classes que ja existeixen** (part 16): es queden a «Sense tema» i amb l'interruptor apagat; els seus PDF no es toquen. Les pots posar al Tema 1 des de Materials. Si vols que el tema comence amb el document que ja tens (pendent 2), el pas 9 ho fa una vegada a mà, amb els blocs en una carpeta `blocs/inicial/` que no és de cap classe: així, tornar a passar a net una classe d'abans no els toca.

### Passos

1. `app.py`: carpeta i informació del tema; `GET /api/assignatures` amb `temes`; `POST …/temes`.
2. `app.py`: `tema` i `fusiona` a `NovaClasse`, `CanvisClasse` i `migra`; rutes de `pdf` i `fitxers` relatives a l'assignatura.
3. `app.py` i `prompt.md`: el bloc `{document}`.
4. `app.js`: Nova classe (desplegable, «+», interruptor) i `style.css`.
5. `app.js`: barra lateral per temes, targeta «Tema» a Materials, capçalera, Resultat i barra de «Passa a net» amb les rutes noves.
6. `CLAUDE.md` (decisió 9, pas 6, fora d'abast) i `flux.html` v6, republicat.
7. `web-local.md`: dades, decisions i pla.
8. Prova (apartat següent).
9. Si dius que sí al pendent 2: crear el Tema 1, copiar els 51 blocs de `classes/2026-09-30-2/blocs/` a `temes/tema-1-grups/blocs/inicial/`, fer-ne el `tema.tex` (els mateixos `\input`, amb la carpeta nova), compilar, i posar les tres classes d'Estructures Algebraiques al Tema 1.
10. Estat de la fase a «feta» i commit, amb esta guia.

### Com es prova

A `localhost:8300`, amb Estructures Algebraiques:

1. Nova classe: crear el tema «Tema 1 · Grups» amb el «+» sense eixir del formulari. Ha de quedar triat al desplegable i l'interruptor encés.
2. Crear la classe del dia (o fer servir la del 10/10, que està sense començar), pujar les fotos, triar Wuolah i passar a net. Comprovar que al final hi ha `temes/tema-1-grups/blocs/2026-10-10/`, `tema.tex` i `tema.pdf`, i que a la carpeta de la classe hi ha `esquema.yaml`, `informe.md` i `millores.md` però no `blocs/`.
3. Resultat: es veu el PDF del tema, i l'informe diu a quines pàgines és la classe.
4. Una correcció des de Resultat: Claude toca el bloc dins del tema i el PDF del tema canvia.
5. Una segona classe al mateix tema: els seus blocs s'afegeixen darrere i les notetes continuen el número.
6. Una classe amb l'interruptor apagat: el PDF queda a la carpeta de la classe, com fins ara, i el tema no canvia.
7. Barra lateral: les classes apareixen davall del seu tema; les d'abans, a «Sense tema». Des de Materials, posar-ne una al Tema 1 i vore que canvia de grup.
8. Una classe en marxa: el desplegable i l'interruptor estan desactivats.

---

## Fase 2 · O i F · Nova classe i Materials en una sola pàgina

**Estat:** feta el 10/10/2026, amb les propostes de les parts 4, 6, 7, 9 i 10, i el formulari de fonts plegat davall d'un enllaç (part 8 B, fins a la fase 3). Provada a `localhost:8300`: Nova classe en una fila de quatre camps; Materials de la classe del 30/09 (2a part), amb nou fotos, en poc més d'una pantalla i la barra enganxada a baix; les fitxes dels PDF («Tema 1 · 23 p.»); obrir i tancar el formulari de font nova. Esborrar, amb dades de prova després netejades: una classe amb blocs al tema (va a la paperera amb els seus blocs, `tema.tex` perd les seues línies i el PDF del tema passa de 5 a 3 pàgines), el cas en què el tema no compila (avisa i es queda el PDF d'abans) i una classe sense tema. No s'ha provat amb Claude en marxa (esborrar i canviar la fitxa han de quedar bloquejats).

**Desviacions:**

- Els blocs que la classe tenia al tema no s'esborren: van a la paperera amb la classe, en una carpeta `blocs-del-<tema>/`. Es busquen a tots els temes, no només al de la classe, per si n'ha canviat.
- Els comentaris de `tema.tex` que parlen de la classe («% Classe del …») es queden; només es lleven les línies `\input` dels seus blocs.
- La pàgina de Nova classe passa a tindre la mateixa amplària que la de la classe, perquè en crear-la la fitxa no canvie de mida.
- Regla nova a `style.css`: `[hidden]` amaga sempre. Sense ella, el quadre de confirmació d'esborrar es veia sempre.
- El resum de la barra fa servir els noms curts dels PDF: «Wuolah (Tema 1, Tema 2)».

### Què notaràs

- **Nova classe i Materials són la mateixa pàgina** (pantalles 1 i 2 del mock-up). Dalt, la fitxa de la classe: assignatura, tema amb «+», dia, títol i l'interruptor. Abans de crear-la, el botó «Crea la classe» i, davall, «Com va». En clicar-lo, no canvies de pantalla: la fitxa es queda dalt (l'assignatura i el dia queden fixats, perquè són el nom de la carpeta; el tema, el títol i l'interruptor es poden canviar) i davall apareixen els materials (part 4 i part 5).
- **Els materials, comprimits** en dues columnes: a l'esquerra els apunts amb miniatures de 104 px, sis per fila (part 6); a la dreta les fonts en una línia per font, amb els PDF com a fitxes xicotetes que es marquen amb un clic (part 7), i davall la nota «Per a Claude» de dues línies. El formulari de pujar una font nova queda plegat davall d'un enllaç fins a la fase 3 (part 8).
- **La barra «Passa a net»**, més baixa i enganxada a la vora de baix de la finestra mentre la pàgina siga més llarga que la pantalla (part 10).
- **«Esborra la classe»**, un enllaç discret a la fitxa, amb confirmació (part 9).

Amb una classe de nou fotos i una font, la pàgina ha de cabre en una pantalla de portàtil amb, com a molt, una pantalla de desplaçament.

### Per què

És el que demanaves: la segona pantalla i la primera en una, i menys desplaçament. Esborrar és la fila F del pla, que no té manera de fer-se des de la web.

### Com funciona per dins

- **Una sola funció de pàgina.** `pintaNova` i `pintaMaterials` es fonen: la mateixa funció pinta la fitxa de la classe amb una classe (`#/classe/…/materials`) o sense (`#/`). Sense classe, els camps són editables i hi ha «Crea la classe»; en crear-la, es navega a `#/classe/<a>/<c>/materials`, que és la mateixa pàgina amb els materials davall. Les pestanyes «Materials · Progrés · Resultat» de la capçalera es queden com ara.
- **Esborrar** mou la carpeta de la classe a `dades/paperera/<assignatura>/<classe>-<data i hora>/`, no l'esborra del disc. Si la classe tenia blocs al document del tema, el servidor lleva `temes/<t>/blocs/<classe>/`, lleva de `tema.tex` les línies que apunten a eixa carpeta i torna a compilar el tema amb `compila.py` (com ja fa amb `extreu-font.py`). Si la compilació falla, el PDF anterior es queda i la web ho diu. No es pot esborrar una classe mentre Claude hi treballa.
- **Comprimir** són estils i una plantilla nova per a la llista de fonts: el que es guarda no canvia.

### Fitxers

- `web/static/app.js`
  - `pintaNova` + `pintaMaterials` → una funció amb `fitxaClasse(classe)` (la targeta de dalt), `seccioApunts` amb la graella `xicoteta`, `seccioFont` compacta (`.font-fila` i `.xips`; el formulari `cosNova` plegat davall d'un enllaç), `seccioNota` de dues files i `barraPassa` compacta.
  - El «+» i l'interruptor de la fase 1 passen a la fitxa; la targeta «Tema» de la fase 1 desapareix.
  - «Esborra la classe»: confirmació i `DELETE`; després, navega a `#/`.
- `web/app.py`: `DELETE /api/classes/{a}/{c}` (paperera, neteja del tema i recompilació). 409 si està en marxa.
- `web/static/style.css`: `.fitxa-classe`, `.fix`, `.enllac-suau`, `.materials`, `.graella-fotos.xicoteta`, `.font-fila`, `.xips`, `.xip`, `.barra-accio.compacta` amb `position: sticky; bottom: 0` (els estils són al mock-up, apartat «Fase 2»).
- `web-local.md`: files O i F del pla marcades com a fetes.

### Instruccions de Claude

No canvien. El prompt és el mateix de la fase 1.

### Dades

No canvia cap format. La paperera és una carpeta nova dins de `dades/` (fora de git, com tot `dades/`).

### Passos

1. `style.css`: els estils nous.
2. `app.js`: la fitxa de la classe (abans i després de crear-la) i «Com va» només abans de crear-la.
3. `app.js`: apunts, fonts i nota comprimits; barra enganxada.
4. `app.py` i `app.js`: esborrar.
5. Prova.
6. Estat a «feta» i commit.

### Com es prova

1. `#/`: crear una classe. Sense canviar de pàgina (la pestanya «Materials» activa, la mateixa fitxa dalt), pujar fotos, marcar Wuolah i dos dels seus PDF, escriure una nota. Recarregar: tot s'ha guardat.
2. Amb nou fotos (la classe del 30/09, 2a part, en té nou): a 1366 × 768 i a la teua pantalla, mirar quant de desplaçament cal. La barra de «Passa a net» s'ha de vore sempre.
3. Canviar el tema i el títol des de la fitxa; l'assignatura i el dia no es poden tocar.
4. Esborrar la classe buida del 30/09: demana confirmació, desapareix de la barra lateral i la carpeta és a `dades/paperera/`.
5. Esborrar una classe que tenia blocs al tema (una de prova): els seus blocs ja no són al PDF del tema.
6. Amb Claude en marxa: no es pot esborrar ni canviar la fitxa.

---

## Fase 3 · P · Barra lateral plegable i pàgina d'assignatura

### Què notaràs

- **Plegar la barra lateral cap al costat** amb la fletxa del costat del logo (la que vas dibuixar): queda una tira de 60 px amb el logo, el «+» de nova classe i una inicial per assignatura (pantalla 4, part 12). Clicar una inicial obri la pàgina de l'assignatura. La web recorda si la tenies plegada.
- **Plegar cada assignatura** amb la fletxeta del seu nom (part 11); també ho recorda.
- **El nom de l'assignatura és un enllaç** a la pàgina nova.
- **La pàgina d'assignatura** (pantalla 3), amb dues pestanyes:
  - **Temes:** una targeta per tema amb el nom, el llapis per canviar-lo (part 14), el document del tema (pàgines, data, «Obre el PDF», «Descarrega el .tex») o «Encara no hi ha document», i la llista de classes del tema amb l'estat; les classes que tenen PDF propi (les d'abans, o amb l'interruptor apagat) el mostren a la seua línia. Al final, «Sense tema» amb un enllaç a cada classe per posar-la en un tema. Dalt a la dreta, «Nou tema» (part 13).
  - **Fonts:** les fonts de l'assignatura amb els seus PDF, i el formulari de pujar-ne una, que se'n va de Materials (part 8).

### Per què

Ho demanaves: una pestanya que ara no existeix, dividida per temes, amb els PDF generats i el seu títol, que es puga canviar. I la barra lateral ocupa 236 px que al PDF fan falta (també per a la fase H, costat a costat).

### Com funciona per dins

- **Ruta nova** `#/assignatura/<id>/<temes|fonts>`. Tot el que ensenya la pestanya «Temes» ja ho torna `GET /api/assignatures` (temes amb PDF, pàgines i data; classes amb estat), més un camp per classe que diga si té PDF propi.
- **Canviar el nom** només toca `nom` a `tema.json`. La carpeta no canvia de nom. El nom nou es veu de seguida a la barra lateral i a la fitxa de la classe, i al títol del PDF la pròxima vegada que Claude compile el tema.
- **Plegat** és una classe `plegada` a la barra i una marca al navegador (`localStorage`); el servidor no hi intervé.

### Fitxers

- `web/static/app.js`
  - `pintaLateral`: capçalera amb la fletxa de plegar; en estat plegat pinta la tira (logo, «+», inicials); cada assignatura amb el nom enllaçat i la fletxeta de plegar el grup.
  - `pintaAssignatura(a, pestanya)`: capçalera amb «Nou tema», pestanyes «Temes» i «Fonts»; la targeta de tema (`.tema-cap`, `.fila-doc`, `.llista-classes`), el canvi de nom (`.edita-nom`: Intro desa, Esc cancel·la) i «Sense tema». La pestanya «Fonts» reutilitza `cosNova` i la llista de PDF (`.pdfs`) de Materials.
  - `seccioFont` de Materials: l'enllaç «Puja una font nova a l'assignatura» en lloc del formulari.
  - `ruta()` i `pinta()`: la vista `assignatura`.
- `web/app.py`: `PUT /api/assignatures/{a}/temes/{t}` amb `{nom}`; a `GET /api/assignatures`, per a cada classe, si té `tema.pdf` propi.
- `web/static/style.css`: `.cap-lateral`, `.plega`, `.cap-grup`, `.lateral.plegada`, `.logo-mini`, `.inicial`, `.tema-cap`, `.fila-doc`, `.llista-classes`, `.edita-nom` (al mock-up, apartat «Fase 3»).
- `web-local.md`: fila P feta; «Pantalles» de les opcions no triades.

### Instruccions de Claude

No canvien.

### Dades

`tema.json`: `nom` es pot canviar. Res més.

### Passos

1. `style.css`: els estils nous.
2. `app.js`: barra lateral plegable i grups plegables.
3. `app.py` i `app.js`: pàgina d'assignatura, pestanya «Temes», amb «Nou tema» i el canvi de nom.
4. `app.js`: pestanya «Fonts» i l'enllaç des de Materials.
5. Prova.
6. Estat a «feta» i commit.

### Com es prova

1. Plegar la barra: queda la tira; recarregar la pàgina i continua plegada; clicar «EA» obri Estructures Algebraiques; desplegar-la.
2. Plegar Anàlisi II (que no té classes); recarregar i continua plegada.
3. Clicar «Estructures Algebraiques»: la pàgina d'assignatura amb el Tema 1 (document, pàgines, data, les classes) i «Sense tema».
4. Canviar el nom del Tema 1 a «Tema 1. Grups, subgrups i homomorfismes»: canvia a la barra lateral i a la fitxa de la classe; la carpeta `temes/tema-1-grups/` no canvia.
5. «Nou tema» des de la pàgina: apareix buit, amb «Encara no hi ha document».
6. Pestanya «Fonts»: Wuolah amb els quatre PDF; pujar una font de prova i, a Materials d'una classe, vore que ja es pot marcar.
7. A Materials ja no hi ha el formulari de pujar fonts, només l'enllaç.
