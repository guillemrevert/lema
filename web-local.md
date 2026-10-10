# Web local (Docker)

Una web en `localhost`, dins de Docker, per treballar amb LEMA de manera més còmoda: crear una classe, passar-li a Claude els fitxers i seguir el procés.

**Estat (05/10/2026):** primera versió muntada i Claude Code amb la sessió iniciada (subscripció Max). Falta fer una classe de veritat des de la web. Mock-up: https://claude.ai/artifact/EFEgfWXH4hn37sPusjDtce

## Com s'arranca

La primera vegada:

1. `docker compose up -d --build`: fa la imatge (Python, TeX Live i Claude Code, uns 1,5 GB) i l'arranca.
2. Iniciar la sessió de Claude, en una finestra **normal** de PowerShell (el terminal de l'app de Claude no passa el que escrius als programes de dins de Docker):
   1. `cd "C:\Users\Guillem\Desktop\PROJECTES VIBE-GUILLEM\LEMA"`
   2. `docker compose exec -T lema claude auth login`
   3. Obrir l'enllaç al navegador, autoritzar i enganxar el codi a PowerShell.

   La sessió es guarda al volum de Docker `claude` i es renova sola. No cal posar res a `.env`.

Després, la web (http://localhost:8300) arranca sola cada vegada que s'obri Docker Desktop. Si Docker Desktop no està obert, `docker` respon «failed to connect to the docker API»: cal obrir-lo.

Els canvis a `web/` s'apliquen sense reconstruir la imatge; els del `Dockerfile`, amb `docker compose build`.

## Decisions preses

| Què | Tria |
| --- | --- |
| Motor | Claude Code dins del Docker, amb la subscripció de l'usuari (sessió de `claude auth login`). Fa servir el mateix `CLAUDE.md` i el mateix flux |
| Stack | Python (FastAPI) i HTML/JS pla, sense pas de build. KaTeX per a les fórmules |
| Primera versió | Pujar fitxers i botó «Passa a net», que mostra el progrés pas a pas |
| Fonts | Per assignatura: es pugen una vegada i es trien en cada classe (03/10/2026). Se'n poden marcar diverses, i diversos temes de cada una (07/10/2026) |
| Port | 8300, només des d'este ordinador (el 8000 i el 8100 els fa servir CritKeep) |
| Temes | Cada classe pot pertànyer a un tema i afegir-se al document del tema, que viu a `temes/<tema>/` i creix classe a classe (10/10/2026, fase 1 de [`guies/E-temes.md`](guies/E-temes.md)) |

## Com funciona

- **Un contenidor** amb Python, TeX Live i Claude Code. El repositori s'hi munta **només de lectura**; `dades/` (fora de git) és l'únic lloc on s'escriu. Les converses de Claude es guarden en un volum de Docker perquè es puguen continuar.
- **Dades:**
  ```
  dades/perfil-lletra.md
  dades/assignatures/<assignatura>/
    notacio.yaml
    fonts/<font>/          font.json, els PDF, el text extret, index.txt i fitxa.yaml
    quaderns/<quadern>/     quadern.json, quadern.tex, quadern.pdf, blocs/<sessió>/ de cada sessió
                            (blocs/inicial/: el document d'abans de la web) i edicions.json
    sessions/<AAAA-MM-DD>/  sessio.json, apunts/, adjunts/, registre/ i el que escriu Claude
  dades/paperera/<assignatura>/<sessió>-<data i hora>/   les sessions esborrades, amb els blocs que tenien al quadern
  dades/copia-<data i hora>/   la còpia que va fer la web abans de passar de temes i classes a quaderns i sessions
  ```

  Fins al 10/10/2026 es deien `temes/` (`tema.json`, `tema.tex`, `tema.pdf`) i `classes/` (`classe.json`). En `sessio.json`, la conversa de Claude es diu `conversa` (abans `sessio`). La web ho va canviar sola en arrancar (`migra_dades` a `web/app.py`; guia Q, fase 1).
- **En pujar una font** s'executa [`extreu-font.py`](extreu-font.py), que en trau el text i l'índex.
- **«Passa a net»** obri una conversa nova de Claude Code per a cada sessió (mesura 1 d'[`optimitzacio.md`](optimitzacio.md)), en mode no interactiu i amb el prompt de [`web/prompt.md`](web/prompt.md). Diu on és cada cosa i demana a Claude dues marques: `PAS n` en començar cada pas i `ESTAT: esperant` o `ESTAT: acabat` en acabar cada torn.
- **Registre:** el servidor resumeix el que fa Claude a `registre/events.jsonl` (text, eines, passos, tokens) i la web ho llig en directe. La sortida sencera de Claude queda al costat, a `registre/claude-*.jsonl`.
- **Punt de control:** Claude s'atura al pas 4, escriu l'esquema i les preguntes obligatòries i acaba el torn. La resposta, amb fitxers adjunts si cal, continua la mateixa conversa. Les correccions després del PDF van igual.
- **Quaderns i sessions** (decisió 9 de `CLAUDE.md`): un quadern és un document que creix sessió a sessió (un tema, unes pràctiques, un article…), i una sessió és cada vegada que s'hi afegeixen apunts. Cada sessió té quadern, obligatori (desplegable i «+» a Nova sessió i a Materials). Claude escriu els blocs a `quaderns/<quadern>/blocs/<sessió>/`, amb etiquetes `\label{<sessió>-Bnn}`, n'afegeix els `\input` al `quadern.tex` en ordre de data i compila el quadern. L'esquema, l'informe i `millores.md` es queden a la carpeta de la sessió, i Resultat ensenya el PDF del quadern. Les sessions sense quadern (d'abans) ixen a «Sense quadern» i no es poden passar a net fins que en tenen un.
- **Versió de la pàgina** (guia R): cada vegada que et mous per la web, la pàgina demana `/api/versio` (la data de l'últim canvi a `web/static/`). Si ha canviat des que es va obrir la pestanya, es recarrega sola.
- **Compilar:** Claude fa servir [`compila.py`](compila.py) i [`plantilla-base.tex`](plantilla-base.tex), que ara és a l'arrel del repositori.
- **La pàgina del quadern** (guia Q, fase 2; `#/quadern/<assignatura>/<quadern>`): el document, «PDF sencer» o «Costat a costat», i la llista de sessions. La barra lateral té els quaderns, cada un amb un enllaç al document i les seues sessions dins. La sessió només té «Materials» i «Progrés» (l'informe i els fitxers són a «Progrés»), i quan està acabada un avís porta al quadern.
- **Correccions del quadern** (guia Q, fase 3): a la pàgina del quadern, davall de «Sessions», «Hi ha alguna cosa malament al quadern?». Cada quadern té la seua conversa de Claude per a les correccions: la primera la crea amb `web/prompt-quadern.md` i les següents la continuen. La conversa, l'estat i els tokens van a `quadern.json`; el que fa Claude, a `quaderns/<quadern>/registre/`, i els fitxers adjunts, a `adjunts/`. Només hi pot haver un Claude alhora en cada quadern: mentre el corregeix, no es pot passar a net ni esborrar cap sessió del quadern ni editar el LaTeX, i al revés. Les sessions es queden amb la seua conversa per passar a net i per al punt de control.
- **Costat a costat** (guies H i Q): a l'esquerra, les fotos de totes les sessions del quadern, agrupades per sessió, o tot el LaTeX del quadern en un sol text, amb una línia `%%%% <carpeta>/Bnn.tex %%%%` on comença cada bloc (`inicial/B01.tex`, `2026-10-10/B01.tex`), en l'ordre dels `\input` de `quadern.tex`; a la dreta, el PDF. El LaTeX es pot editar (decisió 2): «Desa i compila» parteix el text per eixes línies, desa només els blocs canviats i compila el quadern amb `compila.py`. Si falla, es torna a posar el PDF d'abans. No es pot editar mentre Claude treballa en el quadern (el corregeix o passa a net una de les seues sessions). Els blocs editats s'apunten a `edicions.json` del quadern; la web ho diu a Claude al final de cada correcció que li envies, i en «Torna a passar a net» d'una sessió els seus blocs editats se'n van al `registre/` de la sessió (les edicions es perden, i la web avisa abans).

## Diferències amb el mock-up

- **Panell «Blocs» de la pantalla de progrés:** no està fet. Caldria que Claude escrivira la classificació de cada bloc en un format que la web puga llegir.
- **Botó per girar una foto i reducció a 1.500 px:** no estan fets. Els vas deixar sense confirmar.
- **Resultat:** en lloc de les xifres i les notetes en targetes, ensenya el PDF dins de la pàgina i l'`informe.md` tal com l'escriu Claude.

## Pla del frontend

Canvis que es van apuntant des del 06/10/2026. Es fan per fases, i cada fase té cinc passos: mock-up (si és una pantalla nova), guia d'implementació a `guies/` (skill `guia-implementacio`), vist-i-plau, implementació i prova a `localhost:8300`. Després, commit. Les fases es fixaran quan la llista estiga tancada.

| # | Què | Depèn de |
| --- | --- | --- |
| A | Panell «Blocs» a la pantalla de progrés | Un format fix per a `esquema.yaml` (Claude ja l'escriu, però cada vegada a la seua manera) |
| B | Punt de control propi (vegeu «Pantalles», baix), amb botons per a les preguntes de triar. Ho demana el `millores.md` de la sessió del 07/10: «sí a tot» no respon una pregunta (a)/(b) | Que Claude escriga les preguntes obligatòries en un fitxer que la web puga llegir |
| C | PDF i notetes amb un clic (vegeu «Pantalles», baix) | El mateix, per a les notetes. També la E, perquè el PDF és per tema |
| D | Girar les fotos i reduir-les a 1.500 px en pujar-les. Amb Pillow, Claude també podria ampliar-les per llegir els subíndexs (`millores.md` del 07/10) | Pillow al `Dockerfile`. També ho demana el `millores.md` de la classe del 05/10 |
| E | Carpeta per tema: cada classe afegeix blocs al tema. **Implementada** el 10/10/2026 (fase 1 de [`guies/E-temes.md`](guies/E-temes.md)); falta provar-la passant a net una classe de veritat. El Tema 1 d'Estructures Algebraiques comença amb els 51 blocs de la classe del 30/09 (2a part) | Canvi de dades i de la barra lateral (`millores.md` del 05/10) |
| F | Esborrar una classe. **Feta** el 10/10/2026 (fase 2 de `guies/E-temes.md`): va a `dades/paperera/` | Res |
| G | Diverses fonts per classe, amb selecció múltiple (demanat el 06/10). **Feta** | — |
| H | Pantalla dividida a «Resultat»: a l'esquerra, les fotos dels apunts o el LaTeX; a la dreta, el PDF definitiu. **Feta** el 10/10/2026 en dues fases ([`guies/H-costat-a-costat.md`](guies/H-costat-a-costat.md)): l'interruptor, les fotos i el PDF; i el LaTeX en un sol text, que es pot editar i compilar | — |
| I | Obrir a Overleaf amb un clic i baixar un `.tex` que compile sol (ara `tema.tex` necessita `blocs/` i la plantilla) | Res |
| J | Estils de document (clàssic, amb etiquetes, amb caixes) i opcions per assignatura: mida de lletra, marges, índex i numeració | Fer configurable `plantilla-base.tex`. Tanca la decisió oberta de numeració de l'especificació |
| K | Regles per al que està ratllat, els dibuixos (retall de la foto o TikZ) i les notes al marge dels apunts | Que l'usuari ho decidisca. Canvia `CLAUDE.md` i `flux.html` |
| L | Apunts en PDF d'altres apps de notes (GoodNotes, Notability): partir-lo en pàgines en pujar-lo, amb una miniatura per pàgina. La web ja accepta PDF, però com un sol fitxer | Tanca la decisió oberta 1 de l'especificació |
| M | Cercar un resultat entre totes les classes, i marcar-ne de favorits | La E (carpeta per tema) |
| N | Mode fosc | Res |
| O | Nova classe i Materials en una sola pàgina (tema, «+», interruptor i, davall, els materials comprimits). Demanat el 10/10/2026. **Feta** el 10/10/2026 (fase 2 de `guies/E-temes.md`) | La E |
| P | Barra lateral plegable (cap al costat i per assignatures) i pàgina d'assignatura: temes amb els PDF generats i el seu títol (es pot canviar), i les fonts. Demanat el 10/10/2026. **Feta** el 10/10/2026 (fase 3 de `guies/E-temes.md`) | La E |
| Q | Reorganitzar la web al voltant del document. «Tema» passa a dir-se **quadern** i «classe», **sessió** (10/10/2026): un quadern pot ser un tema, unes pràctiques o un article, i la sessió és cada vegada que s'hi afegeixen apunts. El quadern té la seua pàgina amb el document (PDF sencer i costat a costat), i la sessió es queda per pujar apunts i passar-los a net. Ve de la confusió de tindre tres còpies del Tema 1. Mock-up: [`guies/Q-mockup.html`](guies/Q-mockup.html), publicat a https://claude.ai/artifact/9GubKJNLuRtgVF2frxS72t, amb set decisions al final. Guia [`guies/Q-quaderns.md`](guies/Q-quaderns.md), amb totes les propostes del mock-up, en tres fases. **Fase 1 feta** el 10/10/2026: els noms (a la web, a les dades i a les instruccions de Claude), el quadern obligatori, les etiquetes amb el nom de la sessió i les còpies del 05/10 i del 30/09 a la paperera. **Fase 2 feta** el 10/10/2026: la pàgina del quadern, la barra lateral amb els quaderns i les sessions dins, el «Costat a costat» de tot el quadern i `edicions.json` al quadern. **Fase 3 feta** el 10/10/2026: les correccions es demanen des de la pàgina del quadern, en una conversa de Claude per quadern, i només hi pot haver un Claude alhora en cada quadern | — |
| R | La pàgina es recarrega sola quan hi ha una versió nova de la web. Si una pestanya es va obrir abans d'un canvi, continuava amb la versió vella i demanava adreces que ja no existeixen (el LaTeX no eixia, 10/10/2026). Guia: [`guies/R-recarrega.md`](guies/R-recarrega.md). **Feta** el 10/10/2026 | — |
| S | Una marca a la sessió, «apunts d'un altre alumne», perquè Claude no faça servir el perfil de lletra de l'usuari ni hi afija res, i no prenga la seua notació com la de l'usuari (decisió 8). Ara es fa a mà amb una pregunta. Ho demana el `millores.md` de la sessió del 07/10 | Canvia `CLAUDE.md`, el prompt i `flux.html` |
| T | Ordenar les fotos en pujar-les. Les de WhatsApp arriben en ordre invers (30/09 i 07/10): la web les podria ordenar per l'hora del nom del fitxer. Ara es reordenen arrossegant-les a Materials. `millores.md` del 07/10 | Res |
| U | Avisar de pàgines a mitges: si una foto acaba a mitja frase, que la web (o Claude, a la lectura general) pregunte si falta alguna pàgina. `millores.md` del 07/10 | Decidir qui ho detecta: la web no llig les fotos |
| V | `pdftoppm` (poppler-utils) al `Dockerfile`, perquè Claude puga mirar el PDF compilat com a imatge per revisar-lo. `millores.md` del 07/10 | `docker compose build` |

**Mock-up de la E, la O i la P (10/10/2026), estàtic:** https://claude.ai/artifact/WiexpoKYYX9KEYjDHxzhum (el fitxer és `guies/E-mockup.html`). Quatre pantalles netes (nova classe; la classe creada amb els materials; pàgina d'assignatura; barra lateral plegada) i setze parts explicades amb les alternatives una al costat de l'altra. La guia `guies/E-temes.md` té la taula de decisions i quatre preguntes pendents (si la creu de la captura és esborrar la classe, si el Tema 1 comença amb el document que ja hi ha, si el formulari de pujar fonts se'n va a l'assignatura, i barra lateral amb una o dues línies per classe).

H–N, apuntades el 09/10/2026, venen de [MathWrite Notes](https://apps.apple.com/us/app/mathwrite-notes/id6807434387), una app d'iPad que passa a LaTeX el que s'escriu a mà. No hi ha font: és un transcriptor. Se'n van deixar fora les eines d'escriure a la pantalla (llapis, formes, gràfiques).

**H (10/10/2026):** guia [`guies/H-costat-a-costat.md`](guies/H-costat-a-costat.md), en proposta, i mock-up [`guies/H-mockup.html`](guies/H-mockup.html), publicat a https://claude.ai/artifact/2Hy57Zef8jrywVYJN8DURY (versió 2). L'usuari va triar:

- l'interruptor «PDF sencer / Costat a costat» dins de «Resultat»;
- a l'esquerra, les fotos senceres o el LaTeX dels blocs, que pot editar i compilar ell mateix (canvia la decisió 2);
- a la dreta, el PDF definitiu;
- cada costat es mou sol.

La primera versió del mock-up, bloc a bloc i amb 13 parts, també era interactiva a la pàgina «H · Costat a costat» del canvas del mock-up. Les seues peces passen a «Opcions no triades» quan s'aprove la guia.

**G, feta el 07/10/2026:**

- A la secció «Fonts» de Materials hi ha caselles. Cada font marcada mostra els seus PDF, també amb caselles, per marcar en quins temes és la classe. Si no se'n marca cap, Claude mira l'índex.
- A `classe.json`, `fonts: [{id, temes}]` substitueix `font` i `tema_font`. Les classes d'abans es llegeixen igual i es converteixen la primera vegada que es guarden.
- Si un bloc és a més d'una font i no coincideixen, Claude agafa la que quadra millor amb els apunts i deixa una noteta. Les altres opcions eren l'ordre en què es marquen les fonts o un ordre fix per tipus (professor, llibre, apunts d'alumne). Ho diuen la decisió 7 de `CLAUDE.md` i `flux.html` (v5).
- Cada font de més costa la lectura del seu `index.txt`, que és barata, i la de les pàgines que calguen.

## Opcions no triades, per a més endavant

### Temes, pàgina de la classe i pàgina d'assignatura (guia E)

Les lletres són les de les parts del mock-up (`guies/E-mockup.html`).

- **Part 2 B · «Nou tema…» dins del desplegable**, en lloc del botó «+». Un pas menys visible, però amaga l'opció de crear dins de la llista.
- **Part 3 B · Dues targetes a triar** («Al document del tema» / «Document a banda») en lloc de l'interruptor. Més clar la primera vegada, però ocupa el doble.
- **Part 11 B · Una línia per classe a la barra lateral**, només el nom i el puntet de l'estat. De moment es queda com ara (dues línies), a l'espera que l'usuari ho trie.
- **Part 4 B · Els materials apareixen sols en triar el tema**, sense botó «Crea la classe», i la carpeta es crea amb la primera foto. Es poden crear classes buides sense voler, i canviar el dia després de pujar fotos obliga a moure la carpeta.
- **Part 6 B · Les fotos en una sola fila** que es desplaça de costat. Ocupa menys alçària, però amb més de sis fotos n'hi ha d'amagades i ordenar-les és incòmode.
- **Part 7 B · Les fonts com abans**, en targetes grans amb una línia per PDF.
- **Part 9 B · Una creu a la barra lateral** per esborrar una classe. Més ràpid, però fàcil de clicar sense voler.
- **Part 8 B · El formulari de pujar fonts, plegat dins de Materials.** Tot en una pàgina, però l'allarga. Ara es puja a la pestanya «Fonts» de l'assignatura.
- **Part 10 B · El botó «Passa a net» a la capçalera**, al costat del títol, en lloc de la barra enganxada a baix.
- **Part 12 B · La barra lateral amagada del tot**, amb un botó flotant per tornar-la a traure. Guanya 64 px més, però per canviar d'assignatura cal desplegar-la.
- **Part 13 B · Els temes en una taula** a la pàgina d'assignatura. Més curta, però no es veuen les classes de cada tema.
- **Part 14 B · Canviar el nom d'un tema clicant-lo directament**, sense llapis. No se sap que es pot editar fins que s'hi clica.
- **Part 15 B · Els blocs es queden a la carpeta de cada classe** i el `tema.tex` del tema els apunta amb rutes relatives. No es mou res, però el tema depén de totes les classes i no es pot exportar sol.

### Resultat costat a costat (guia H)

Del primer mock-up de la H, que treballava bloc a bloc. Per a quasi totes cal que Claude escriga `esquema.yaml` amb un format fix (la A).

- **Una pestanya pròpia, «Revisió»,** en lloc de l'interruptor dins de «Resultat».
- **Moure's per blocs:** una tira amb un botó per bloc, amb el color de la comparació amb la font, i fletxes d'anterior i següent. Cliques un bloc i els dos costats hi salten. Cal que Claude apunte, al pas 2, on és cada bloc dins de cada foto.
- **El bloc marcat damunt de la foto** (zona ressaltada) o retallat, en lloc de la foto sencera.
- **Només la pàgina del PDF on és el bloc**, amb el bloc marcat, o el bloc sol retallat del PDF. Cal `pdftoppm` al contenidor i que la plantilla apunte on és cada bloc.
- **Zoom de la foto** dins del panell. Ara la foto s'obri en gran en una pestanya nova.
- **Pestanya «Font»:** la pàgina de la font on és el resultat, al costat dels apunts.
- **Fitxa del bloc** (on és als apunts i a la font, la versió triada i la correcció), **notetes amb un clic**, **comentari per bloc**, **marcar revisat** i una **safata** que envia tot a Claude d'una vegada.
- **El LaTeX en un requadre per bloc**, en lloc d'un sol text.
- **El LaTeX només per llegir**, sense poder editar-lo.
- **Un editor amb colors** (CodeMirror, carregat d'internet): les ordres de LaTeX en colors, números de línia i parèntesis aparellats. Ara és un quadre de text senzill.
- **Una còpia dels blocs editats a `dades/paperera/`** en tornar a passar a net una classe. Ara només hi ha l'avís, i `edicions.json` se'n va a `registre/` (diu quins blocs eren, però no el text).

### Quaderns i sessions (guia Q)

Les lletres són les parts del mock-up (`guies/Q-mockup.html`). Es va triar la proposta de cada una.

- **Part 2 · La barra lateral com abans:** sessions agrupades per quadern, amb el nom del quadern només com a títol.
- **Part 3 · El document a cada sessió**, a «Resultat», en lloc d'una pàgina per quadern.
- **Part 5 · Correccions a Claude** des de la conversa de l'última sessió del quadern, o amb un desplegable per triar la sessió, en lloc d'una conversa per quadern (fase 3).
- **Part 7 · Mantenir l'interruptor** «Afegeix al document del tema», amb document a banda per sessió.
- **Part 8 · Deixar les còpies del 05/10 i del 30/09** a la carpeta de cada sessió, sense ensenyar-les.
- **Part 1 · Quaderns sense assignatura**, per a pràctiques o articles que no són de cap assignatura.
- **Part 9 · Només els textos de la web**, sense canviar els noms de les carpetes i dels fitxers.

### Motor

- **API d'Anthropic.** Clau d'API i pagament per token. Dona més control: un model barat per als passos mecànics i prompt caching. És l'etapa 5 de l'especificació.
- **Sense Claude a la web.** La web només puja fitxers i mostra l'esquema i el PDF, i passar a net es fa des de Claude Code a banda. Serveix de pla B si el mode no interactiu dona problemes.

### Stack

- **Python + React (Vite).** Té sentit si la vista de revisió (subratllat i xinxetes) es complica.
- **Tot en TypeScript (Next.js)** amb el Claude Agent SDK. Caldria reescriure `extreu-font.py` o cridar-lo a banda.

### Pantalles

- **Punt de control propi.** L'esquema de blocs, amb on s'ha trobat cada bloc a la font, i una resposta per a cada pregunta obligatòria en lloc d'un sol text. Les respostes es guarden al perfil de lletra.
- **PDF i notetes.** El PDF al costat de la llista de notetes, i cada noteta es resol amb un clic, en lloc de llegir-les a l'informe.
