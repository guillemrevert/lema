# Guia S · De qui són els apunts, i textos neutres

**Estat:** aprovada el 14/10/2026, amb totes les propostes. Espera el sistema de llengües de la web (decisió 10 de `CLAUDE.md`): els textos nous de la S s'escriuran directament en les set llengües. Ordre acordat el 14/10/2026: el commit de la Y, la fase 1 de la guia Z (llengües), la S i la fase 2 de la Z. Els textos nous passen per `t("…")` a `app.js` (o `error(…)` a `app.py`), amb les altres sis llengües a `web/static/textos.json`, i `python web/comprova-textos.py` ha d'eixir net (secció «Textos nous, d'ara endavant» de [`guies/Z-llengues.md`](Z-llengues.md)).

**Mock-up:** [`guies/S-mockup.html`](S-mockup.html), publicat a https://claude.ai/artifact/AVhuUCBu61scqxUkMYvCPc. Té dues pantalles i, davall, set parts explicades. Quan ací es diu «part 4», és la part 4 del mock-up. Segueix l'estil nou de la web (guia Y). El mussol és a `guies/img/`, fora de git.

## Què i per què

**El problema.** LEMA dona per fet que els apunts són teus i que tu ets alumne. No sempre és així:

- El 30/09 (2a part) eren fotos de la pissarra.
- El 07/10, els apunts eren d'un altre alumne. Claude ho va saber per la nota de la sessió, i va haver de preguntar on guardava la lletra (la P4 del punt de control).
- El perfil de lletra (`dades/perfil-lletra.md`) ja barreja tres lletres: la teua, la de la pissarra i la de l'alumne del 07/10.
- Qui fa servir LEMA també pot ser un professor. La web i les instruccions parlen de «la font del professor» i d'«apunts d'un altre alumne».

**La idea.**

- **Cada sessió diu de qui són els apunts:** «Propis», o «Altres» amb un text lliure («Pissarra», «Alumne», «Marta»…).
- **Claude porta un perfil de lletra per a cada origen,** perquè no es mesclen i aprenga cada lletra.
- **El document continua amb la teua notació.**
- **La web i les instruccions deixen de dir «alumne» i «font del professor».** La font és el material de referència, siga de qui siga.

És la S del pla del frontend de `web-local.md`. Ve del `millores.md` de la sessió del 07/10, i el 13/10/2026 la vas ampliar: sense «alumne», amb «Propis» o «Altres» i un text lliure.

## Decisions

**Ja decidides** (13/10/2026):

- «Propis» o «Altres» amb text lliure, a Nova sessió i a Materials.
- Un perfil de lletra per a cada origen.
- El document, sempre amb la teua notació (decisió 8).
- Fora «alumne» i «font del professor» de la web i de les instruccions.

**Per decidir**, amb proposta. Si no dius res d'alguna, es queda la proposta. Les opcions no triades van a «Opcions no triades» de `web-local.md`.

| Part | Què es decideix | Proposta | Altres opcions |
| --- | --- | --- | --- |
| 2 | Els suggeriments davall del camp | «Pissarra», «Alumne», «Professor» i els que ja has fet servir | Només els ja usats; cap |
| 3 | On es veu de qui són | Una pastilla al costat del títol de la sessió, només si no són propis | A la línia de dalt, amb l'assignatura i el quadern; també a la barra lateral |
| 4 | El perfil de lletra d'ara | Separar-lo: la secció de la pissarra passa a «Pissarra» i la d'«Altres alumnes», a «Alumne», i les dues sessions queden marcades | Deixar-lo com està |
| 5 | Un concepte que el teu diccionari de notació no té, en uns apunts que no són teus | El símbol dels apunts, sense apuntar-lo al teu diccionari, amb una noteta | El de la font |

## Una sola fase

És un camp nou, una línia al prompt i canvis de text. Va en una sola fase, amb la seua prova i el seu commit.

### Què notaràs

- **A Nova sessió** (pantalla 1 del mock-up), davall dels camps d'ara, «De qui són els apunts?»:
  - dues opcions en pastilla, «Propis» (la que ix d'entrada) i «Altres»;
  - si tries «Altres», un camp de text i, davall, els suggeriments: «Pissarra», «Alumne», «Professor» i, amb la vora puntejada, els noms que ja has fet servir. Si en cliques un, s'escriu al camp;
  - al costat de la pregunta, un botó **«i»** (ho vas demanar el 14/10/2026). En clicar-lo, un globus explica per què importa de qui són:
    - **propis:** Claude aprén la teua lletra; cada sessió la guarda al teu perfil, i cada vegada la llig millor;
    - **d'altres** (la pissarra, un company…): Claude ho té en compte en escriure; llig la lletra amb un perfil a part, no toca el teu i fa el document amb la teua notació.

    Es tanca clicant fora o amb Esc. No hi ha cap línia d'ajuda fixa davall del camp: l'explicació és al botó, per no omplir la fitxa.
- **A Materials** (pantalla 2), el mateix camp a la fitxa de la sessió, amb el seu botó «i». Si el canvies, s'aplica la pròxima vegada que la passes a net. Mentre Claude hi treballa, no es pot canviar, com el quadern.
- **A la capçalera de la sessió,** si no són propis, una pastilla al costat del títol: «Apunts: Pissarra».
- **Els textos** de la part 6 del mock-up: «Com va», el formulari de font nova i l'exemple de la nota per a Claude ja no parlen de professors ni d'alumnes.
- **Quan Claude passa a net uns apunts que no són teus:**
  - llig la lletra amb el perfil d'eixe origen i, en acabar, l'amplia amb les teues respostes;
  - no toca el teu perfil ni el teu diccionari de notació;
  - escriu el document amb la teua notació;
  - ja no cal la pregunta d'on guarda la lletra.

### Com funciona per dins

- **`sessio.json` guarda `"origen"`:** `null` si són propis, o el text tal com l'has escrit («Pissarra»). Les sessions d'abans no el tenen, i compten com a propis. Si el text és buit, també compta com a propis.
- **Els perfils:**

  | Origen | Perfil |
  | --- | --- |
  | Propis | `dades/perfil-lletra.md`, com ara |
  | «Pissarra» | `dades/perfils-lletra/pissarra.md` |
  | «Marta» | `dades/perfils-lletra/marta.md` |

  El nom del fitxer es fa amb el text sense accents ni majúscules, com les carpetes dels quaderns: «Pissarra» i «pissarra» van al mateix perfil. Si no existeix, el crea Claude, amb les mateixes seccions que el teu.
- **Els suggeriments** els trau la web de les sessions de totes les assignatures. Per això, `/api/assignatures` passa a dir també l'origen de cada sessió, que ja llig de `sessio.json`: cap accés al disc de més.
- **El prompt** de la sessió (`web/prompt.md`) diu de qui són els apunts i, segons això, quin perfil de lletra ha de llegir i ampliar. Si no són propis, també diu que no amplie el diccionari de notació i què fa amb un concepte que el diccionari no té (decisió 5).
- **La pastilla** de la capçalera és un text: el que hages escrit, tal qual, sense HTML.
- **El botó «i»** és un botó de veritat: s'obri i es tanca amb el teclat (Intro i Esc), i els lectors de pantalla saben que obri una explicació. Si n'hi ha més a la web, es podrà fer servir igual.

### Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/app.py` | `origen` a `sessio.json` (nova sessió, canviar-lo, i `migra_sessio` per a les d'abans); l'origen a la llista de `/api/assignatures`; el prompt, amb el perfil de lletra de cada origen |
| `web/prompt.md` | De qui són els apunts; el perfil de lletra i el diccionari segons l'origen |
| `web/static/app.js` | El camp a Nova sessió i a Materials, el botó «i» amb el globus, els suggeriments, la pastilla de la capçalera i els textos de la part 6 |
| `web/static/style.css` | El camp (les dues pastilles, els suggeriments), el botó «i» i el globus, i la pastilla de la capçalera |
| `CLAUDE.md` | Els passos 3 i 4, la decisió 8 i els textos de la part 6 (vegeu baix) |
| `flux.html` | Els mateixos canvis, i la versió següent a `HISTORIAL` (ara és la v12; seria la v13). Es republica |
| `web-local.md` | La S, feta; «Com funciona»; «Opcions no triades» |
| `dades/perfil-lletra.md` i `dades/perfils-lletra/` | Si tries separar el perfil (part 4): les dues seccions passen als seus fitxers, a mà |

### Instruccions de Claude

- **`CLAUDE.md`, pas 3:** «Apuntar al diccionari de notació com escriuen els apunts cada concepte» passa a dir «…si els apunts són de l'usuari. Si són d'una altra persona, el diccionari es consulta però no s'amplia».
- **`CLAUDE.md`, pas 4:** «guardar-les al perfil de lletra» passa a dir «guardar-les al perfil de lletra de qui ha escrit els apunts: el de l'usuari si són propis i, des de la web, un per a cada origen («Pissarra», «Marta»…)».
- **`CLAUDE.md`, decisió 8,** una frase més: «Si els apunts no són de l'usuari, el document també es fa amb la notació de l'usuari, i un concepte que el diccionari no té s'escriu amb el símbol dels apunts, amb noteta» (si tries la proposta de la part 5).
- **`CLAUDE.md`, textos** (part 6):
  - «les fonts del professor» i «la font del professor», a «Context» i a «Flux», passen a «les fonts» i «la font»;
  - a «Materials d'entrada», «un material del professor (…) o apunts d'un altre alumne» passa a «un material de referència: uns apunts, unes diapositives o el capítol del llibre que se segueix».

  La decisió 6, que explica que la primera prova es va fer amb apunts de Wuolah d'un alumne, es queda: diu una cosa que va passar.
- **`web/prompt.md`:** una línia «De qui són els apunts» a la llista de materials. La línia del perfil de lletra i la del diccionari passen a dependre de l'origen.
- **`flux.html`, la versió següent** (seria la v13): passos 3 i 4, la decisió 8 i els textos.

### Dades

- `sessio.json`, amb `"origen"`. Les d'abans no en tenen i són propis, fins que el canvies a Materials.
- `dades/perfils-lletra/`, nova, amb un fitxer per origen. La crea Claude quan cal.
- **Si separes el perfil d'ara** (part 4):
  1. es fa una còpia de `dades/perfil-lletra.md` a `dades/paperera/`;
  2. la secció «Afegit el 05/10/2026 (classe 2026-09-30-2, fotos de la pissarra)» passa a `dades/perfils-lletra/pissarra.md`;
  3. la secció «Altres alumnes» passa a `dades/perfils-lletra/alumne.md`;
  4. la sessió del 30/09 (2a part) queda amb l'origen «Pissarra», i la del 07/10, amb «Alumne».

  Les sessions del 05/10 i del 30/09 (la 1a, buida) es queden com a propis.

### Passos

1. Apuntar-se a `hey.md` amb els fitxers de dalt. Ara mateix, `web/app.py`, `web/static/app.js`, `web/static/style.css` i `web-local.md` són de la sessió de la guia Y: cal esperar que els allibere.
2. `web/app.py`: `origen`, la llista i el prompt.
3. `web/prompt.md`.
4. `web/static/app.js` i `style.css`: el camp, els suggeriments, la pastilla i els textos.
5. `CLAUDE.md` i `flux.html` (la versió següent), i republicar `flux.html`.
6. Si separes el perfil: la còpia, els dos fitxers nous i les dues sessions.
7. `web-local.md`, amb les opcions no triades.
8. Prova (baix) i regressió.
9. Tancar: guia «feta» i avisar-te que està a punt. El commit es fa quan tu ho digues, i llavors es lleva l'entrada de `hey.md`.

### Com es prova

A `localhost:8300`, sense gastar tokens:

1. **Nova sessió:**
   - d'entrada, «Propis»;
   - el botó «i» obri el globus, i es tanca clicant fora i amb Esc, també amb el teclat;
   - en triar «Altres», el camp i els suggeriments («Pissarra», «Alumne», «Professor» i els ja usats); en clicar-ne un, s'escriu;
   - es crea una sessió de prova amb «Altres · Marta», i `sessio.json` diu `"origen": "Marta"`.
2. **La sessió de prova:**
   - la pastilla «Apunts: Marta» al costat del títol;
   - a Materials, canviar-lo a «Propis»: la pastilla desapareix i `sessio.json` diu `null`;
   - tornar a «Altres»: ara «Marta» ix entre els suggeriments.
3. **El prompt**, generat sense enviar-lo (amb un script dins del contenidor, com diu `web/CLAUDE.md`):
   - amb «Propis», diu `dades/perfil-lletra.md` i que amplie el diccionari, com ara;
   - amb «Marta», diu `dades/perfils-lletra/marta.md`, que no toque el perfil de l'usuari ni amplie el diccionari, i què fa amb un concepte que no hi és.
4. **Les sessions d'abans** ixen com a propis, sense pastilla, i el seu prompt és com ara.
5. **Si separes el perfil:** els dos fitxers nous amb les seues seccions, el teu sense elles, la còpia a la paperera, i les sessions del 30/09 (2a part) i del 07/10 amb la pastilla.
6. **Els textos:** «Com va», la font nova i la nota per a Claude, com a la part 6.
7. **Regressió:** crear una sessió amb «Propis», «Materials», «Passa a net» (el botó, sense arrancar-lo) i la pàgina del quadern.
8. **Neteja:** la sessió de prova, a la paperera.

**Pendent, per a l'eina de proves amb agents:** que Claude, amb uns apunts d'«Altres», llija i amplie el perfil d'eixe origen, no toque el teu ni el diccionari, i escriga amb la teua notació.

## Riscos

- **El mateix origen amb noms diferents** («Marta», «Marta (alumna)») són dos perfils. Els suggeriments ho eviten si els fas servir; si no, es poden ajuntar a mà.
- **«Alumne» per a alumnes diferents** mescla les seues lletres en un sol perfil. La línia d'ajuda ho recorda.
- **Que Claude toque el teu perfil igualment.** El prompt li ho diu clarament, però només es veurà amb Claude de veritat.

## Opcions no triades

Van a «Opcions no triades» de `web-local.md`, en una secció «De qui són els apunts (guia S)»: les alternatives de les parts 2, 3, 4 i 5 que no tries. També l'opció del 13/10/2026 que no es va triar: **no fer servir cap perfil de lletra** quan els apunts no són propis, en lloc d'un per origen.
