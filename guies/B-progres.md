# Guia B · «Progrés» nou i punt de control propi

**Estat:** proposta, 13/10/2026. Espera el teu vist-i-plau. En dues fases, cada una amb la seua prova a `localhost:8300` i el seu commit.

**Mock-up:** [`guies/B-mockup.html`](B-mockup.html), publicat a https://claude.ai/artifact/BeCvuYUAN3HTii7to52CgB. Té tres pantalles i, davall, vuit parts explicades. Quan ací es diu «part 4», és la part 4 del mock-up. Les fotos són a `guies/img/`, fora de git.

## Què i per què

**El problema.** Ho vas dir el 13/10/2026: a «Progrés» «ara no s'entén res».
- El primer que veus és tot el que fa Claude, línia a línia: cada fitxer que llig, cada ordre que executa…
- Al punt de control, les preguntes vénen dins d'un missatge llarg, enmig d'eixe registre. Les respons totes en un sol quadre de text, escrivint «P1: …, P2: …» a mà.
- A la sessió del 07/10 vas respondre «sí a tot» i Claude ho va haver d'interpretar, perquè la P3 no era de sí o no. Ho va apuntar al seu `millores.md`.

**La idea.**
- **Dalt, només el que necessites saber:** en quin pas és Claude, què fa en paraules i què ve després. El detall, plegat al final.
- **Al punt de control, cada pregunta en la seua secció:**
  - el tros de la foto a què es refereix;
  - què diuen els apunts i què diu la font;
  - botons per triar la resposta.

És la B del pla del frontend de `web-local.md`, que ja demanava un punt de control propi amb botons. Ara també inclou endreçar tot «Progrés».

## Decisions

Totes amb la proposta del mock-up, menys l'esquema de blocs, que vas voler plegable i plegat d'entrada. Les opcions no triades van a «Opcions no triades» de `web-local.md`.

| Part | Què es decideix | Triat | No triat |
| --- | --- | --- | --- |
| 1 | El detall del que fa Claude | Plegat al final, amb quantes accions porta | Només l'última acció, en una línia; o amagat del tot |
| 4 | Com s'ensenya a què es refereix cada pregunta | El tros de la foto, i davall què diuen els apunts i la font | La foto sencera amb la zona marcada; o només el text |
| 5 | Quan es poden enviar les respostes | Només quan totes en tenen | També amb alguna en blanc: Claude tria i deixa una noteta |
| 6 | L'esquema de blocs | **Plegable, i plegat d'entrada** (ho vas triar tu) | Obert davall de les preguntes (la proposta del mock-up); o una taula com ara |
| 6 | Comentaris a l'esquema | Un quadre opcional, dins de l'esquema | Res: si cal, ho escrius a «Una altra resposta» d'alguna pregunta |

**Tres decisions més, que no eren al mock-up.** Van amb proposta; digues-me si en vols canviar alguna.

1. **El quadre de comentaris va dins de l'esquema plegat.** Si no obris l'esquema, no hi ha res a comentar. La línia plegada diu «Esquema de blocs · 13 blocs · 4 a la font», perquè sàpies que hi és.
2. **Quan Claude s'atura per una altra cosa,** el seu últim missatge ix a la vista, dalt de tot, amb el quadre per respondre. Per exemple, una pregunta fora del punt de control, un error o l'«Atura». Ara eixe missatge queda enmig del registre i, amb el registre plegat, no el veuries.
3. **Si el fitxer de les preguntes falta o està mal fet,** la web fa com ara: el missatge de Claude i un sol quadre de text. Així no es perd mai un punt de control.

## Les fases

| Fase | Què | Per què en este ordre |
| --- | --- | --- |
| 1 | **«Progrés» endreçat.** L'estat d'ara dalt, el detall plegat, l'últim missatge de Claude a la vista quan s'atura i, quan acaba, l'avís i l'informe i els fitxers plegats (parts 1, 2 i 7, sense el resum) | Només canvia la web: Claude treballa igual. Ja arregla el «no s'entén res» |
| 2 | **Punt de control propi.** Claude escriu les preguntes i l'esquema en un fitxer. La web ensenya cada pregunta en la seua secció, amb el tros de foto i les respostes, l'esquema plegat i el resum final (parts 3 a 8) | Canvia el que fa Claude al pas 4 i al 6, i necessita la pàgina de la fase 1 |

**Abans de començar:** una altra sessió està fent la fase 2 de la guia W (fonts), i ara té canvis sense desar a `web/app.py`, `web/static/app.js` i `web-local.md`. La B toca els mateixos fitxers, així que no es pot començar fins que la W tinga el seu commit.

---

## Fase 1 · «Progrés» endreçat

### Què notaràs

- **Dalt, l'estat d'ara** (part 2). És una targeta blava amb:
  - què fa Claude en paraules, per exemple «Claude busca cada bloc a la font»;
  - el pas («Pas 3 de 6»), el temps i els tokens;
  - què ve després, per exemple «Després s'aturarà per fer-te, totes juntes, les preguntes que la font no resol»;
  - el botó «Atura».

  Els passos de dalt (les píndoles) es queden com ara.
- **Al final, «Detall del que fa Claude · 47 accions»**, plegat (part 1). Si el cliques, ix el registre d'ara, igual que abans.
- **Quan Claude s'atura**, el seu últim missatge ix dalt, a la vista, amb el quadre per respondre davall. Passa quan t'espera, quan dona un error o quan l'atures.
- **Quan ha acabat** (part 7), dalt hi ha l'avís «Acabada» i el botó per anar al quadern. Davall, l'últim missatge de Claude, que és el seu resum. L'informe sencer i els fitxers queden plegats.
- La columna de la dreta (temps, tokens, estat, fitxers) desapareix: el temps i els tokens van a la targeta de l'estat, i els fitxers, plegats al final. Tot queda en una columna.

### Com funciona per dins

- **L'estat d'ara** el pinta la web amb el que ja sap: el pas (Claude escriu «PAS 3 · …»), el temps del torn i els tokens. Cada pas té la seua frase:

  | Pas | Què fa Claude |
  | --- | --- |
  | 0 | prepara la carpeta i la fitxa de la font |
  | 1 | llig els apunts |
  | 2 | divideix els apunts en blocs |
  | 3 | busca cada bloc a la font |
  | 4 | apunta les teues respostes |
  | 5 | escriu els blocs |
  | 6 | munta el document i compila el PDF |

  Si encara no ha dit cap pas, posa «Claude comença». Si és un missatge teu fora del flux, posa «Claude et respon».
- **El detall** és el mateix registre d'ara (`registreClaude`), dins d'una secció plegable. La línia de dalt compta les accions a mesura que arriben.
- **L'últim missatge de Claude** es trau del mateix registre: és l'últim text que ha escrit, sense les línies «PAS» ni «ESTAT».

### Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/static/app.js` | `pintaProgres` en una columna: l'estat d'ara, l'últim missatge, el quadre per respondre, i el detall, l'informe i els fitxers plegats. `registreClaude` compta les accions i guarda l'últim text de Claude |
| `web/static/style.css` | La targeta de l'estat i les seccions plegables |
| `web-local.md` | La B, fase 1 feta; «Com funciona» |

### Instruccions de Claude

Cap canvi.

### Dades

Cap canvi.

### Passos

1. Esperar que la W tinga el seu commit.
2. `web/static/app.js` i `style.css`.
3. `web-local.md`.
4. Prova (baix).
5. Tancar: fase 1 «feta» i commit.

### Com es prova

A `localhost:8300`:

1. **Una sessió acabada** (la del 07/10): dalt, l'avís i el resum de Claude. L'informe, els fitxers i el detall estan plegats, i en obrir el detall ix el registre de sempre.
2. **Una sessió que espera i una aturada:** el seu últim missatge, a la vista, i el quadre per respondre. Es fa amb una còpia de la del 07/10 amb l'estat canviat a mà, sense fer treballar Claude.
3. **Una sessió en marxa:** la targeta de l'estat amb el pas, el temps i els tokens, i el detall comptant accions. Cal fer treballar Claude, així que es fa amb una còpia de la del 07/10 que s'atura al cap de mig minut. Costa uns 150.000 tokens, com a la prova de la H i la Q. Si ho prefereixes, es mira amb la pròxima sessió de veritat i no es gasta res.

---

## Fase 2 · Punt de control propi

### Què notaràs

- **Al punt de control** (pantalla 2 del mock-up):
  - l'avís «Claude t'espera: 4 preguntes»;
  - una targeta per pregunta (part 3);
  - l'esquema de blocs, plegat (part 6);
  - la barra «Envia les respostes», enganxada a baix (part 5).
- **Cada pregunta** té:
  - dalt, el número (P1), el bloc (B01 · Exemple) i de quin tipus és el dubte («Sembla un error dels apunts», «Lectura dubtosa», «Acaba a mitja frase»…);
  - a l'esquerra, a què es refereix (part 4): el tros de la foto, un enllaç per obrir-la sencera i, davall, què diuen els apunts i què diu la font o el quadern, amb les fórmules ben escrites;
  - a la dreta, la pregunta i les respostes:
    - **opcions**, una rodona per opció;
    - **sí o no**, amb un camp per escriure com és si dius que no;
    - **sempre**, «Una altra resposta…».

  Quan respons, la targeta es marca «✓ Resposta».
- **L'esquema de blocs**, plegat en una línia: «Esquema de blocs · 13 blocs · 4 a la font». Si l'obris, veus:
  - cada bloc, amb unes etiquetes: on és a la font, «Correcció», «Noteta», o la pregunta que en parla;
  - la nota de Claude sobre l'esquema, si n'hi ha;
  - el quadre opcional «Alguna cosa no quadra a l'esquema?».
- **«Envia les respostes»** s'activa quan totes les preguntes tenen resposta. Envia a Claude un sol missatge amb totes, com el que escrius ara («P1: Corregeix-ho a (1 3 2) i marca la correcció. P2: Sí…»), i el comentari a l'esquema, si n'hi ha. Claude continua.
- **Quan ha acabat** (part 7), davall de l'avís hi ha un resum: blocs, quants són a la font, correccions i notetes, a quines pàgines del quadern és la sessió, i com ha aplicat cada resposta.

### Com funciona per dins

- **Un fitxer nou a la sessió, `punt-control.json`.** Claude l'escriu al pas 4, abans d'aturar-se, a més del missatge d'ara. Hi ha:
  - **l'esquema:** cada bloc amb el tipus, què és, la pàgina dels apunts, on és a la font (o res), les marques (correcció, noteta) i les preguntes que en parlen;
  - **les preguntes:** per a cada una, el bloc, el tipus de dubte, la pregunta, la foto i la zona, el context («Apunts: …», «Font: …»), la forma (opcions o sí/no) i les respostes possibles.

  El format està al mock-up (part 8). Les fórmules van entre `$…$`, com als missatges, i la web les escriu amb KaTeX, que ja fa servir.
- **La zona** són quatre proporcions de la foto: esquerra, dalt, dreta, baix, de 0 a 1. La web no retalla la foto: la posa de fons, ampliada i desplaçada fins a la zona, amb CSS. **Risc:** Claude calcula la zona a ull i pot quedar desplaçada; per això hi ha «Obre la foto sencera».
- **Quan ha acabat el pas 6**, Claude hi afegeix el resum: les xifres, les pàgines del quadern i com ha aplicat cada resposta.
- **Quan l'ensenya la web.** La web demana la sessió i, si està esperant i `punt-control.json` és d'este torn (més nou que l'últim missatge teu), ensenya les preguntes. Si el fitxer és d'abans, falta o està mal fet, ensenya l'últim missatge i el quadre de text, com a la fase 1.
- **En tornar a passar a net una sessió,** el `punt-control.json` d'abans se'n va a `registre/`, com les edicions.
- **Enviar** fa servir l'adreça d'ara (`…/respon`): la web compon el text i l'envia. Claude rep les respostes com ara, i les guarda al perfil de lletra com ara.

### Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/app.py` | `GET /api/sessions/…` torna `punt_control` (el fitxer llegit, o res) i si és d'este torn. `passa_a_net` mou el d'abans a `registre/` |
| `web/static/app.js` | Les targetes de les preguntes, el tros de foto, les respostes, la barra d'enviar, l'esquema plegat amb el quadre de comentaris, i el resum quan acaba |
| `web/static/style.css` | Les preguntes, les opcions, el tros de foto, les etiquetes de l'esquema i el resum |
| `web/prompt.md` | Al pas 4, escriure `punt-control.json`, amb el format i un exemple; al pas 6, afegir-hi el resum |
| `CLAUDE.md` | Una línia al pas 4 i una al pas 6 |
| `flux.html` | Els passos 4 i 6, i la versió següent a `HISTORIAL` (ara és la v10; seria la v11). Es republica |
| `web-local.md` | La B, feta; «Com funciona» (el punt de control); «Opcions no triades» |

### Instruccions de Claude

- **`CLAUDE.md`, pas 4,** una línia més: «Des de la web, l'esquema i les preguntes també es guarden a `punt-control.json`, perquè la web ensenye cada pregunta per separat (el format, a `web/prompt.md`). Cada pregunta diu a quina foto i a quina zona es refereix.»
- **`CLAUDE.md`, pas 6,** una línia més: «Des de la web, el resum (xifres, pàgines del quadern i com s'ha aplicat cada resposta) també va a `punt-control.json`.»
- **`web/prompt.md`:** la norma del punt de control passa a dir que, a més del missatge, escriga `punt-control.json` abans d'aturar-se, amb el format i l'exemple de la P1 del 07/10. Les respostes de cada pregunta han de ser frases que es puguen enviar tal qual («Corregeix-ho a (1 3 2) i marca la correcció»). La de sí o no no cal escriure-la.
- **`flux.html`, la versió següent** (seria la v11): passos 4 i 6.

### Dades

- `sessions/<sessió>/punt-control.json`, nou. Les sessions d'abans no en tenen, i «Progrés» els ensenya el missatge de Claude, com a la fase 1.
- En tornar a passar a net, el d'abans va a `registre/punt-control-<data>.json`.

### Passos

1. `web/app.py`: `punt_control` a la sessió, i moure'l en tornar a passar a net.
2. `web/static/app.js` i `style.css`: les preguntes, l'esquema, la barra d'enviar i el resum.
3. Instruccions: `web/prompt.md`, `CLAUDE.md` i `flux.html` (la versió següent), i republicar `flux.html`.
4. `web-local.md`.
5. Prova (baix).
6. Tancar: guia «feta» i commit.

### Com es prova

A `localhost:8300`:

1. **Sense gastar tokens.** Primer es fa una còpia de la sessió del 07/10, esperant, amb un `punt-control.json` escrit a mà amb les quatre preguntes reals:
   - les quatre targetes, amb els trossos de foto al lloc i les fórmules ben escrites;
   - el botó d'enviar, desactivat fins que totes tenen resposta;
   - l'esquema, plegat, i en obrir-lo els 13 blocs i el quadre de comentaris;
   - en enviar, el missatge que rep Claude es mira al registre. La còpia té una conversa falsa, i Claude acaba de seguida amb un error, sense gastar res.
2. **Un fitxer mal fet o d'un torn anterior:** ix el missatge i el quadre de text.
3. **Amb Claude de veritat:** la pròxima sessió que passes a net. S'ha de mirar que escriga el fitxer, que les zones de les fotos caiguen al lloc i que el resum final isca. Fer-ho amb una còpia voldria dir passar a net una sessió sencera, uns 2,5 milions de tokens.
