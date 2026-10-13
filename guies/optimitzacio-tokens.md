# Guia · Gastar menys tokens en passar una sessió a net

**Estat:** aprovada el 13/10/2026. Fase 1 feta el 13/10/2026, amb les proves sense tokens: `ordre_claude()` dona l'ordre nova per a una sessió i per a una conversa que continua; `claude` accepta les opcions noves (amb el missatge buit es queixa del missatge i para abans de cridar el model; amb una opció inventada, de l'opció); `mesura-sessio.py` dona per a les sessions del 30/09, 05/10 i 07/10 les xifres d'esta guia (1,83 $, 2,74 $ i 2,32 $). Quant baixa el context inicial es veurà en la pròxima sessió o amb l'eina de proves amb agents.
Fase 2 feta el 13/10/2026: Pillow 12.3 al contenidor i `retalla.py`, provat amb una foto de la sessió del 07/10 (una franja del 30 al 45 %: 1.568 × 419 px, uns 876 tokens, i és la zona bona; la foto girada; una zona menuda, ampliada al triple), amb una imatge de prova per al sentit del gir i amb percentatges i girs que no valen. En reconstruir la imatge, Claude Code s'ha actualitzat de la 2.1.288 a la 2.1.296: les opcions de la fase 1 continuen acceptades i la sessió de Claude continua iniciada. Falten les fases 3 i 4.

## Què i per què

Passar una sessió a net des de la web costa ara entre 1,83 i 2,74 $ (preu de l'API; amb la subscripció Max no es paga, però és el que gasta del límit). Les dades són a [`optimitzacio.md`](../optimitzacio.md). El 13/10 vas triar fer les mesures 10–13 i apuntar la 14 i la 15. L'objectiu és gastar menys amb la mateixa qualitat: Claude ha de llegir el mateix i comparar igual, però sense voltes.

**On se'n van els tokens ara**, en la primera crida de cada sessió (la que llig els materials):

| Què | Quant | Mesura que ho ataca |
| --- | --- | --- |
| Instruccions i eines en començar | 26.000–27.000 tokens, a cada crida | 13 |
| Orientar-se: llegir `web-local.md`, buscar carpetes, `sessio.json`, el registre, `compila.py`, mirar si hi ha eines d'imatge, llegir 6–8 blocs del quadern i un esquema vell per copiar el format | Uns 8.000–10.000 tokens i 4–6 accions | 10 |
| Font: l'índex sencer o la meitat, i pàgines senceres de text per trobar 4–6 resultats | Uns 8.000–10.000 tokens | 11 |
| Ampliacions de les fotos: com que no hi ha cap eina d'imatge, Claude compila un PDF amb LaTeX per retallar una zona | Uns 8.000 tokens cada una | 12 |

## La mesura 11 canvia: el prototip de la cerca per semblança ha eixit malament

La idea era que un programa comparara cada bloc dels apunts amb la font i en tornara els 3 candidats més semblants amb un percentatge. Abans d'escriure la guia en vaig fer un prototip, fora del repositori: compara trossos de 3 lletres (la manera més senzilla, que aguanta bé els espais perduts del text de Wuolah), amb més pes per al títol del bloc de la font i per al tipus (definició, teorema…). L'he provat amb els esquemes de les sessions passades, on ja sabem a quin bloc de la font correspon cada un:

- **Blocs que sí que són a la font (9):** el bo ix el primer en 3 casos i entre els 3 primers en 5. En 4 no ix.
- **Blocs que no són a la font (19):** el primer candidat trau entre un 5 i un 48 %. Els que sí que hi són trauen entre un 17 i un 60 %. Els dos grups es solapen, així que **cap percentatge no separa** "és a la font" de "no hi és".

Amb això, Claude hauria de comprovar igualment l'índex en la meitat dels casos, i no s'estalviaria res. Trobar el resultat bo necessita entendre de què parla el bloc, i amb paraules soltes no n'hi ha prou.

**Proposta en lloc d'això:** que el programa faça la part que **no** necessita entendre res. Claude continua triant amb l'índex quins resultats busca, però:

1. Llig només l'índex dels temes de la font on és la sessió. La web ja els sap: és el que tries a «Fonts» de la sessió. Ara llig l'índex sencer o la meitat.
2. Demana el passatge exacte de cada resultat ("Teorema 2.19", "Lema 2.17") i rep només eixe tros, amb la demostració, en lloc de pàgines senceres.

S'estalvia menys del que pensàvem (uns 5.000 tokens per sessió en lloc de 10.000), però sense cap risc per a la qualitat: el que llig Claude és el mateix text de la font, sense que ningú l'haja triat per ell.

## Decisions

| Què | Proposta | Alternatives, no triades |
| --- | --- | --- |
| Com es treballa | **Una guia amb quatre fases, una per mesura, d'una en una.** Cada fase es prova abans de passar a la següent. La mesura de veritat es fa al final, amb la pròxima sessió real | Tot alhora i provar al final: si alguna cosa empitjora, no se sabria quina |
| Mesura 11 | **`busca-font.py`: l'índex dels temes de la sessió i el passatge exacte de cada resultat** | Cerca per semblança amb percentatge (el prototip de dalt). Cerca per significat amb un model d'embeddings: probablement funcionaria, però cal instal·lar un model i és més complicat; per a més endavant |
| Mesura 12, com es diu la zona | **En percentatges de la foto** (de l'esquerra, de dalt, de la dreta, de baix), perquè és com Claude veu la foto | En píxels: Claude hauria de saber la mida exacta de cada foto i calcular-ho |
| Mesura 13, què es lleva | **Les eines que no es fan servir** (es queden `Bash`, `Read`, `Write` i `Edit`) **i les ordres i skills** (`--disable-slash-commands`) | `--bare`: no carrega `CLAUDE.md` i no funciona amb la subscripció. Unes instruccions de sistema pròpies (`--system-prompt`): estalviarien més, però Claude perdria les instruccions de Claude Code sobre com usar les eines; caldria una prova a banda |
| Mesura 10, on va el dossier | **Dins del mateix missatge** que la web ja envia a Claude | Un fitxer `dossier.md` a la sessió: seria una lectura més |
| Com es mesura | **Un script menut, `mesura-sessio.py`,** que diu per a una sessió quantes crides ha fet, amb quants tokens ha començat i quant ha costat, separat en el que entra, el que es torna a llegir i el que s'escriu. És el que he usat a mà per a les dades de dalt; així cada mesura futura es pot comparar | Fer-ho a mà cada vegada amb un script temporal |

Quan `web-local.md` quede lliure (ara l'està fent servir la sessió de la guia B), les alternatives no triades s'apunten també a «Opcions no triades».

## Què notaràs

- **A la web, res de nou.** Les pantalles són les mateixes.
- **Les sessions acaben un poc abans**, perquè Claude fa menys accions per orientar-se i per buscar a la font.
- **Gasten menys.** Estimació: entre un 15 i un 25 % menys per sessió. La xifra de veritat la donarà la pròxima sessió, comparada amb les tres d'ara.
- **La qualitat ha de ser la mateixa.** Claude llig les mateixes fotos i el mateix text de la font, i compara igual. Si la sessió de prova ix pitjor, es desfà la fase que ho haja causat.

## Com funciona per dins

### Fase 1 · Mesura 13: carregar menys coses

Cada crida a Claude Code comença amb unes instruccions de sistema, la descripció de 25 eines (per a buscar a internet, fer subagents, notebooks…) i la llista de 69 ordres i skills, entre elles `guia-implementacio`, que no té res a vore amb passar una sessió a net. Tot això són 26.000–27.000 tokens, i es tornen a llegir a cada pas.

A `ordre_claude()` (`web/app.py`) s'afegeixen dues opcions: `--tools "Bash,Read,Write,Edit"` i `--disable-slash-commands`. Són les quatre eines que Claude ha fet servir en totes les sessions (al registre només apareixen `Bash`, `Read` i `Write`; `Edit` es queda per a les correccions del quadern). `--disallowedTools AskUserQuestion` ja no cal, perquè l'eina de preguntes no hi és.

Val per a les dues coses que fa la web amb Claude: passar a net una sessió i les correccions del quadern.

### Fase 2 · Mesura 12: retallar fotos

Script nou a l'arrel, `retalla.py`:

```
python retalla.py <foto> <esquerra> <dalt> <dreta> <baix> [--gira 90|180|270]
```

Els quatre números són percentatges de la foto. Per exemple, `0 30 100 45` és tota l'amplada, de la ratlla del 30 % a la del 45 % de l'altura. `--gira` gira la foto abans de retallar-la, per a les que arriben de costat. Guarda el retall a `/tmp/retalls/` (fora de `dades/`, perquè no s'acumule res) i escriu una línia: on és, la mida i quants tokens costarà llegir-lo, aproximadament (amplada × altura / 750). El retall s'amplia o es redueix fins a 1.568 píxels pel costat llarg, la mida que tots els models de Claude veuen sense reduir-la, i com a molt al triple de la mida original: més enllà només es veu més borrós. Ampliar-lo és el que feia el PDF de LaTeX, i ajuda a llegir la lletra menuda. Si la foto du la rotació a banda (EXIF), es gira com la veu qualsevol visor i ho diu.

Claude llig el retall amb `Read`, com una foto. Una franja de tota l'amplada i un 15 % de l'altura costa uns 900 tokens; l'ampliació amb LaTeX en costava uns 8.000.

Cal Pillow, la biblioteca d'imatges de Python, al contenidor: una línia a `web/requirements.txt` i reconstruir la imatge (`docker compose build` i `docker compose up -d`).

**Limitació:** les fotos de WhatsApp ja arriben reduïdes a uns 1.600 píxels. Un retall no hi pot traure més detall del que hi ha, només ensenyar-lo sense reduir-lo més. Amb les fotos originals de l'app d'escanejar (mesura 4), els retalls es llegirien millor.

### Fase 3 · Mesura 11: `busca-font.py`

Script nou a l'arrel. Llig el text i l'índex que ja trau `extreu-font.py`, sense tocar-los:

```
python busca-font.py <carpeta de la font> --index <PDF> [<PDF>…]
python busca-font.py <carpeta de la font> "Teorema 2.19" "Lema 2.17" …
python busca-font.py <carpeta de la font> --pagina <PDF> <pàgina>
```

- **`--index`:** les línies de l'índex només d'eixos PDF.
- **Amb referències:** per a cada una, el passatge de la font, des de la seua línia fins a la següent definició, teorema, lema… o secció. Inclou la demostració, que va darrere sense títol propi. Cada passatge porta la pàgina, `p. 7 [pdf 8]`. Si una referència no hi és, ho diu. Si n'hi ha dues amb el mateix número (dos PDF), les ensenya totes dues amb el PDF de cada una.
- **`--pagina`:** el text d'una pàgina sencera, per als exemples i observacions de la font, que no tenen número.

### Fase 4 · Mesura 10: el dossier dins del missatge

`prompt_sessio()` (`web/app.py`) ja escriu el missatge amb les rutes de tot. Ara hi afegeix el que Claude anava a buscar:

- **Fotos:** la mida de cada una en píxels, al costat de la ruta. Claude no ha de mirar si hi ha eines d'imatge.
- **Fonts:** què és i d'on surt, del `font.json`, en lloc de dir-li que el llija. Si la fitxa (`fitxa.yaml`) ja existeix, el seu contingut, que és curt. Si no, "encara no en té".
- **Quadern:** l'última noteta que hi ha (la web la busca als blocs; ara Claude la buscava amb `grep`) i la ruta d'un bloc recent, com a model de format, en lloc de llegir-ne 6–8.
- **Passada anterior:** si la sessió ja té blocs d'una passada d'abans, ho diu.

I a `web/prompt.md`:

- **Fora la referència a `web-local.md`.** Ara és la primera cosa que Claude obri, i no li cal.
- **Una frase:** "Tot el que necessites és en este missatge: no cal llegir `web-local.md`, `compila.py` ni el registre, ni explorar `dades/`."
- **El format de l'esquema**, en unes 12 línies (el de la sessió del 07/10), perquè no haja de llegir l'esquema d'una sessió vella.
- **Com usar `retalla.py` i `busca-font.py`**, en lloc de "mira primer l'índex, després el text de les pàgines".

### `mesura-sessio.py`

Script nou a l'arrel, per a comparar abans i després:

```
python mesura-sessio.py <carpeta de la sessió>
```

Llig `registre/claude-*.jsonl` i, per a cada crida a Claude i per al total, escriu: quantes accions, amb quants tokens ha començat, quants n'ha llegit, quants n'ha escrit i el cost, separat en el que entra a la conversa, el que es torna a llegir i el que s'escriu. El cost de cada crida es trau restant del total acumulat de l'anterior, perquè quan una conversa continua, Claude Code dona el total des del principi.

## Fitxers

| Fitxer | Fase | Què hi canvia |
| --- | --- | --- |
| `web/app.py` | 1, 4 | `ordre_claude()`: les dues opcions noves. `prompt_sessio()` i `document_sessio()`: les mides de les fotos, la fitxa i el `font.json`, l'última noteta i el bloc model |
| `web/requirements.txt` | 2 | `pillow` |
| `retalla.py` (nou) | 2 | Retalla una zona d'una foto |
| `busca-font.py` (nou) | 3 | L'índex dels temes i els passatges de la font |
| `web/prompt.md` | 3, 4 | Fora `web-local.md`; la frase de no explorar; el format de l'esquema; `retalla.py` i `busca-font.py` |
| `mesura-sessio.py` (nou) | 1 | Mesura una sessió a partir del seu registre |
| `optimitzacio.md` | 4 | L'estat de les mesures 10–13 i el resultat de la sessió de prova |
| `web-local.md` | final | «Opcions no triades», quan estiga lliure; i a «Com funciona», que la web crida Claude amb menys eines |

## Instruccions de Claude

- **`CLAUDE.md`: cap canvi.** Els passos són els mateixos; només canvia com els fa Claude des de la web, i això és a `web/prompt.md`. Per això tampoc canvia `flux.html`.
- **`web/prompt.md`:** el que diu la fase 4, i a la fase 3 el paràgraf de les fonts.
- **`web/prompt-quadern.md`** (correccions del quadern): cap canvi. Només li afecta la fase 1, perquè tindrà menys eines.

## Dades

Cap format canvia. Les sessions d'abans no es toquen: el missatge nou només el reben les sessions que es passen a net a partir d'ara. Una conversa que continua (després del punt de control) manté el missatge amb què va començar.

## Passos

1. `mesura-sessio.py`, i comprovar que dona les xifres de dalt per a les sessions del 05/10 i del 07/10.
2. **Fase 1:** `ordre_claude()`. Prova 1.
3. **Fase 2:** `pillow`, reconstruir la imatge, `retalla.py`. Prova 2.
4. **Fase 3:** `busca-font.py` i el paràgraf de fonts de `prompt.md`. Prova 3.
5. **Fase 4:** `prompt_sessio()` i `prompt.md`. Prova 4.
6. Prova 5, amb una sessió de veritat, i `optimitzacio.md` amb el resultat.
7. Tancar: guia «feta», `web-local.md` (quan estiga lliure), commit i llevar l'entrada de `hey.md`.

## Com es prova

1. **Fase 1, sense tokens.** `ordre_claude()` torna l'ordre amb les dues opcions noves, per a una sessió i per a una conversa que continua. Dins del contenidor, `claude` accepta les opcions: amb un missatge buit, ha de queixar-se que falta el missatge (no d'una opció desconeguda) i parar abans de cridar Claude. `mesura-sessio.py` dona per a les sessions del 05/10 i del 07/10 les xifres de dalt.
   **Amb tokens, pendent per a l'eina de proves amb agents:** una crida curta ("Respon només OK") amb l'ordre d'abans i la nova, per saber quant baixa el context inicial (uns 55.000 tokens en total), i una correcció de prova en un quadern, per comprovar que Claude encara pot llegir i editar. Si no, ho dirà la pròxima sessió de veritat (prova 5).
2. **Fase 2.** `retalla.py` amb una foto de la sessió del 07/10: una franja i una foto girada. El retall s'obri bé, és la zona demanada i la línia de tokens quadra amb la mida.
3. **Fase 3.** Per a cada bloc de l'esquema del 07/10 que diu on és a la font, `busca-font.py` torna el passatge bo i complet, amb la demostració. Una referència que no existeix diu que no hi és. `--index` amb els temes 1 i 2 només ensenya eixos dos temes.
4. **Fase 4.** Es genera el missatge de la sessió del 07/10 sense cridar Claude, i es comprova que hi ha les mides de les fotos, la fitxa, l'última noteta del quadern (N28 o la que hi haja) i el bloc model.
5. **Sessió de veritat.** La pròxima sessió que passes a net. `mesura-sessio.py` ha de donar menys tokens en començar, menys accions abans de llegir les fotos i un cost més baix que les sessions del 05/10 i del 07/10, i tu revises el PDF com sempre. Si la qualitat baixa, es mira quina fase ho ha causat i es desfà.

## Fora d'esta guia

Apuntades a `optimitzacio.md`:

- **Mesura 14 · Respondre el punt de control abans d'una hora.** Quan passa més d'una hora, Claude Code ja no té la conversa desada a la memòria cau i, en continuar, torna a pagar entrar-la sencera: uns 0,85 $ per sessió. La web podria ensenyar, al punt de control, "Respon abans de les 17:42 perquè siga més barat". És una pantalla, així que aniria al pla del frontend de `web-local.md`, amb el seu mock-up.
- **Mesura 15 · Pensar menys en escriure els blocs.** Entre la meitat i dos terços del que escriu Claude és raonament intern. Claude Code té `--effort` (de `low` a `max`). Es podria usar un nivell més baix només en la crida de després del punt de control, que escriu els blocs ja decidits. Només amb una prova: repetir l'escriptura d'una sessió passada amb els dos nivells i comparar els blocs.
