# Guia B · «Progrés» nou i punt de control propi

**Estat:** aprovada el 13/10/2026. En dues fases, cada una amb la seua prova a `localhost:8300` i el seu commit. La fase 1 està feta; la 2, per fer.

**Mock-up:** [`guies/B-mockup.html`](B-mockup.html), publicat a https://claude.ai/artifact/BeCvuYUAN3HTii7to52CgB. Té tres pantalles i, davall, vuit parts explicades. Quan ací es diu «part 4», és la part 4 del mock-up. Les fotos són a `guies/img/`, fora de git.

## Què i per què

**El problema.** Ho vas dir el 13/10/2026: a «Progrés» «ara no s'entén res».

- El primer que veus és tot el que fa Claude, línia a línia: cada fitxer que llig, cada ordre que executa…
- Al punt de control, les preguntes vénen dins d'un missatge llarg, enmig d'eixe registre. Les respons totes en un sol quadre de text, escrivint «P1: …, P2: …» a mà.
- Per respondre has de buscar tu la foto i la línia de què parla cada pregunta.
- A la sessió del 07/10 vas respondre «sí a tot» i Claude ho va haver d'interpretar, perquè la P3 no era de sí o no. Ho va apuntar al seu `millores.md`.
- Quan Claude acaba, el seu resum queda al final del registre, i l'informe, a la columna de la dreta.

**La idea.**

- **Dalt, només el que necessites saber:** en quin pas és Claude, què fa en paraules i què ve després. El detall, plegat al final.
- **Al punt de control, cada pregunta en la seua secció:**
  - el tros de la foto a què es refereix;
  - què diuen els apunts i què diu la font;
  - botons per triar la resposta.
- **Quan acaba, el resum dalt.**

És la B del pla del frontend de `web-local.md`, que ja demanava un punt de control propi amb botons. Ara també inclou endreçar tot «Progrés».

**Què no fa esta guia** (són altres files del pla):

- les notetes amb un clic, al PDF o a la web (C);
- el panell de blocs mentre Claude treballa (A);
- girar o retallar les fotos de veritat (D);
- partir els PDF d'apunts en pàgines (L).

## Decisions

Totes amb la proposta del mock-up, menys l'esquema de blocs, que vas voler plegable i plegat d'entrada. Les opcions no triades van a «Opcions no triades» de `web-local.md` (la llista és al final d'esta guia).

| Part | Què es decideix | Triat | No triat |
| --- | --- | --- | --- |
| 1 | El detall del que fa Claude | Plegat al final, amb quantes accions porta | Només l'última acció, en una línia; o amagat del tot |
| 4 | Com s'ensenya a què es refereix cada pregunta | El tros de la foto, i davall què diuen els apunts i la font | La foto sencera amb la zona marcada; o només el text |
| 5 | Quan es poden enviar les respostes | Només quan totes en tenen | També amb alguna en blanc: Claude tria i deixa una noteta |
| 6 | L'esquema de blocs | **Plegable, i plegat d'entrada** (ho vas triar tu) | Obert davall de les preguntes (la proposta del mock-up); o una taula com ara |
| 6 | Comentaris a l'esquema | Un quadre opcional, dins de l'esquema | Res: si cal, ho escrius a «Una altra resposta» d'alguna pregunta |

**Decisions que no eren al mock-up.** Van amb proposta; digues-me si en vols canviar alguna.

1. **El quadre de comentaris va dins de l'esquema plegat.** Si no obris l'esquema, no hi ha res a comentar. La línia plegada diu «Esquema de blocs · 13 blocs · 4 a la font · 1 nota de Claude», perquè sàpies què hi ha.
2. **Quan Claude s'atura per una altra cosa,** el seu últim missatge ix a la vista, dalt de tot, amb el quadre per respondre. Per exemple, una pregunta fora del punt de control, un error o l'«Atura». Ara eixe missatge queda enmig del registre i, amb el registre plegat, no el veuries.
3. **Si el fitxer de les preguntes falta o està mal fet,** la web fa com ara: el missatge de Claude i un sol quadre de text. Així no es perd mai un punt de control.
4. **Si el punt de control no té cap pregunta,** l'esquema ix obert, perquè és l'únic que cal revisar, i el botó diu «Continua». Envia el comentari a l'esquema, si n'hi ha.
5. **Les respostes a mitges no es perden.** Si te'n vas de la pàgina o es recarrega abans d'enviar-les, en tornar hi són. Es guarden al navegador fins que les envies.
6. **Les preguntes fora del punt de control també poden fer servir el fitxer** (proposta), sense esquema. Si Claude ha de preguntar alguna cosa a mitja feina, ix igual, una per secció. Si no ho fa, ix el missatge (decisió 3).

**Les proves que necessiten Claude treballant** es faran amb la nova eina de proves amb agents, que s'implementarà prompte (ho vas dir el 13/10/2026). Fins aleshores, cada fase es tanca amb les proves que no gasten tokens, i les altres queden apuntades com a pendents a l'estat de la fase.

## Com es veu «Progrés» en cada moment

De dalt a baix. «Igual» vol dir com ara.

| Estat de la sessió | Fase 1 | Fase 2 (canvis) |
| --- | --- | --- |
| **Sense començar** | No té «Progrés» (igual) | — |
| **En marxa** | Passos · targeta de l'estat (què fa, pas, temps, tokens, què ve després, «Atura») · detall plegat · fitxers plegats | — |
| **Esperant, al punt de control** | Passos · avís taronja · últim missatge de Claude · quadre per respondre · detall plegat · fitxers plegats | Passos · avís «Claude t'espera: 4 preguntes» · una targeta per pregunta · esquema plegat (amb comentaris) · barra d'enviar · detall plegat · fitxers plegats |
| **Esperant, per una altra cosa** | Com l'anterior | Si Claude ha escrit el fitxer, les preguntes sense esquema; si no, com a la fase 1 |
| **Aturada** | Passos · avís gris · últim missatge, si n'hi ha · quadre per respondre («Continua…») · detall plegat · fitxers plegats | — |
| **Error** | Passos · avís roig amb l'error · quadre per respondre · detall plegat · fitxers plegats | — |
| **Acabada** | Avís «Acabada» i botó al quadern · últim missatge de Claude (el seu resum) · quadre «Escriu-li a Claude» · informe plegat · detall plegat · fitxers plegats | El resum amb xifres i les respostes en lloc de l'últim missatge, si Claude l'ha escrit; esquema plegat |

Quan obris una sessió acabada, entra per «Materials», com ara. «Progrés» és a la pestanya del costat.

## Les fases

| Fase | Què | Per què en este ordre |
| --- | --- | --- |
| 1 | **«Progrés» endreçat.** L'estat d'ara dalt, el detall plegat, l'últim missatge de Claude a la vista quan s'atura i, quan acaba, l'avís, el missatge i l'informe i els fitxers plegats (parts 1, 2 i 7, sense el resum amb xifres) | Claude treballa igual: només canvia la web. Ja arregla el «no s'entén res» |
| 2 | **Punt de control propi.** Claude escriu les preguntes i l'esquema en un fitxer. La web ensenya cada pregunta en la seua secció, amb el tros de foto i les respostes, l'esquema plegat i el resum final (parts 3 a 8) | Canvia el que fa Claude als passos 4 i 6, i necessita la pàgina de la fase 1 |

**Abans de cada fase**, apuntar-se a `hey.md` amb els fitxers de la fase (vegeu «Fitxers»). La W i la X, que tocaven els mateixos fitxers, ja tenen el seu commit. Si quan comence algun fitxer és d'una altra sessió, cal esperar.

---

## Fase 1 · «Progrés» endreçat

**Estat:** feta el 13/10/2026. Provada a `localhost:8300` sense fer treballar Claude:

- **La sessió del 07/10, acabada:**
  - dalt, «Esta sessió ja és al quadern» amb «Mira-la al quadern», i «Què diu Claude» amb el seu resum final;
  - el quadre «Escriu-li a Claude»;
  - l'informe, el detall («29 accions · 2.496.180 tokens · últim torn: 4 min 34 s») i els fitxers (18), plegats;
  - en obrir el detall, el registre de sempre;
  - els passos no ixen, perquè ja ha acabat.
- **Les sessions del 05/10 i del 30/09 (2a part):** igual, amb el seu resum i el seu informe.
- **Tres còpies de la del 07/10**, amb el registre tallat a mà i una conversa falsa, ara a la paperera:
  - **esperant:** l'avís taronja, el missatge del punt de control, «La teua resposta» i «Envia i continua»;
  - **aturada:** l'avís gris, l'últim missatge i «Escriu-li a Claude»;
  - **error:** l'avís roig amb el text de l'error, l'últim missatge i el quadre.
- **La targeta de l'estat**, provada fora de la pàgina, sense Claude: el títol i què ve després en cada pas, de «Claude comença» a «Claude munta el document i compila el PDF», i «Claude et respon» quan és un missatge teu a una sessió acabada.
- **Regressió:** «Materials», la pàgina del quadern i les correccions del quadern (amb una còpia del quadern de prova que tenia una correcció) funcionen igual, sense errors a la consola. A l'amplària d'un mòbil no hi ha res que isca per un costat.

**Pendent, per a l'eina de proves amb agents:** veure la targeta de l'estat amb Claude treballant, amb el pas, el temps i els tokens que pugen i la pàgina que canvia sola en acabar el torn.

**Canvis respecte al que deia la guia:**

- El servidor també dona la durada de l'últim torn, que abans era a la columna de la dreta. Ara va a la línia plegada del detall.
- Al pas 5, «què ve després» diu «Després compilarà el quadern», perquè els blocs ja els està escrivint.
- El canvi del servidor té un commit a part (`1536cb4`), perquè la sessió d'optimització necessitava `web/app.py`.

### Què notaràs

- **Dalt, l'estat d'ara** (part 2), mentre Claude treballa. És una targeta blava amb:
  - què fa Claude en paraules, per exemple «Claude busca cada bloc a la font»;
  - el pas («Pas 3 de 6»), el temps del torn i els tokens, que van pujant;
  - què ve després, per exemple «Després s'aturarà per fer-te, totes juntes, les preguntes que la font no resol»;
  - el botó «Atura».

  Els passos de dalt (les píndoles) es queden com ara.
- **Al final, «Detall del que fa Claude · 47 accions»**, plegat (part 1). Si el cliques, ix el registre d'ara, igual que abans: les eines, els missatges i les teues respostes. El número puja mentre Claude treballa.
- **Quan Claude s'atura**, el seu últim missatge ix dalt, a la vista, amb el quadre per respondre davall. Passa quan t'espera, quan dona un error o quan l'atures. Si en eixe torn no havia escrit res, només ix l'avís.
- **Quan ha acabat** (part 7):
  - dalt hi ha l'avís «Acabada» i el botó per anar al quadern;
  - davall, l'últim missatge de Claude, que és el seu resum;
  - després, el quadre «Escriu-li a Claude», per si vols continuar la conversa de la sessió;
  - l'informe sencer i els fitxers queden plegats.
- **Una sola columna.** La columna de la dreta (temps, tokens, estat, fitxers) desapareix. El temps, els tokens i «Atura» van a la targeta de l'estat, i els fitxers, plegats al final. En una pantalla estreta, com un mòbil, es llig igual.

### Com funciona per dins

- **L'estat d'ara** el pinta la web amb el que ja sap: el pas (Claude escriu «PAS 3 · …»), quan va començar el torn i els tokens. Cada pas té la seua frase:

  | Pas | Què fa Claude | Què ve després |
  | --- | --- | --- |
  | encara cap | comença | Prepararà la carpeta i llegirà els apunts. |
  | 0 | prepara la carpeta i la fitxa de la font | Després s'aturarà per fer-te, totes juntes, les preguntes que la font no resol. |
  | 1 | llig els apunts | ídem |
  | 2 | divideix els apunts en blocs | ídem |
  | 3 | busca cada bloc a la font | ídem |
  | 4 | apunta les teues respostes | Escriurà els blocs i compilarà el quadern. Ja no t'ha de preguntar res, si no troba cap problema. |
  | 5 | escriu els blocs | Després compilarà el quadern. Ja no t'ha de preguntar res, si no troba cap problema. |
  | 6 | munta el document i compila el PDF | Quan acabe, la sessió serà al quadern «…». |

  **Si el torn l'has començat tu amb un missatge** que no és la resposta al punt de control (una correcció des de «Escriu-li a Claude»), posa «Claude et respon» i «Quan acabe, ho tindràs ací».
- **L'últim missatge de Claude, i com va començar el torn, els dona el servidor.** `GET /api/sessions/…` ja llig `registre/events.jsonl` sencer per comptar les línies. En la mateixa lectura en traurà també:
  - l'últim text de Claude del torn d'ara o, si el torn ha acabat en error, el text de l'error;
  - si el torn va començar amb «Passa a net» o amb un missatge teu, i quan.

  Així el missatge ix de seguida, sense esperar el registre, i no es fa cap accés al disc de més. Per la guia X sabem que cada accés costa 15–35 ms.
- **El detall** és el mateix registre d'ara (`registreClaude`), dins d'una secció plegable (`<details>`). El registre es carrega encara que estiga plegat, perquè la targeta de l'estat necessita els passos, els tokens i el final del torn. `registreClaude` compta les eines que s'ensenyen (no la llista de tasques) i actualitza la línia plegada.
- **Accessibilitat.** La targeta de l'estat avisa els lectors de pantalla quan canvia el pas (`aria-live`). Les seccions plegables són les natives del navegador i s'obrin amb el teclat.
- **De pas:** el comentari de `web/static/app.js` que diu que `/api/assignatures` «tarda uns segons» passa a dir ~0,1 s. Ho va avisar la sessió de la X.

### Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/app.py` | `GET /api/sessions/…`: en la lectura del registre que ja fa, l'últim text de Claude del torn i com i quan va començar el torn |
| `web/static/app.js` | `pintaProgres` en una columna: l'estat d'ara, l'últim missatge, el quadre per respondre, i el detall, l'informe i els fitxers plegats. `registreClaude` compta les accions. El comentari de la X |
| `web/static/style.css` | La targeta de l'estat i les seccions plegables. Fora els estils de les dues columnes, si ja no els fa servir ningú |
| `web-local.md` | La B, fase 1 feta; «Com funciona» |

### Instruccions de Claude

Cap canvi.

### Dades

Cap canvi. Funciona igual amb els registres de les sessions d'abans.

### Passos

1. Apuntar-se a `hey.md` amb `web/app.py`, `web/static/app.js`, `web/static/style.css` i `web-local.md`.
2. `web/app.py`: l'últim missatge i el torn.
3. `web/static/app.js` i `style.css`.
4. `web-local.md`.
5. Prova (baix) i regressió.
6. Tancar: fase 1 «feta», commit i llevar l'entrada de `hey.md`.

### Com es prova

A `localhost:8300`:

1. **Una sessió acabada** (la del 07/10):
   - dalt, l'avís i el resum de Claude;
   - el quadre «Escriu-li a Claude»;
   - l'informe, els fitxers i el detall, plegats;
   - en obrir el detall, el registre de sempre, amb el número d'accions correcte.
2. **Les sessions d'abans** (05/10 i 30/09, 2a part): igual, sense errors.
3. **Esperant, aturada i amb error.** Es fa amb una còpia de la del 07/10 amb l'estat canviat a mà, sense fer treballar Claude. En cada cas, l'avís que toca, l'últim missatge a la vista i el quadre per respondre.
4. **En marxa:** la targeta de l'estat amb el pas, el temps i els tokens pujant, el detall comptant accions, «Atura» i, en acabar el torn, la pàgina que canvia sola a l'estat següent. Cal que Claude treballe, així que **es farà amb la nova eina de proves amb agents.** Fins aleshores queda pendent, apuntat a l'estat de la fase.
5. **Regressió:**
   - les correccions del quadern, que també fan servir `registreClaude`;
   - «Materials» i «Passa a net»;
   - la recàrrega quan canvia la web (R);
   - la pàgina a l'amplària d'un mòbil.

---

## Fase 2 · Punt de control propi

### Què notaràs

- **Al punt de control** (pantalla 2 del mock-up):
  - l'avís «Claude t'espera: 4 preguntes»;
  - una targeta per pregunta (part 3);
  - l'esquema de blocs, plegat (part 6);
  - la barra «Envia les respostes», enganxada a baix, com la de «Passa a net» a Materials (part 5).
- **Cada pregunta** té:
  - **dalt:**
    - el número (P1);
    - el bloc («B01 · Exemple»), si és d'un bloc;
    - de quin tipus és el dubte («Sembla un error dels apunts», «Lectura dubtosa», «Acaba a mitja frase»…);
    - si ja té resposta;
  - **a l'esquerra, a què es refereix** (part 4):
    - el tros de la foto, i un enllaç per obrir-la sencera;
    - davall, en dues o tres línies, què diuen els apunts i què diu la font o el quadern, amb les fórmules ben escrites;
  - **a la dreta, la pregunta i les respostes:**
    - **opcions**, una rodona i una lletra (a, b…) per opció, amb una explicació curta si cal;
    - **sí o no**, amb un camp per escriure com és si dius que no;
    - **sempre**, «Una altra resposta…», per escriure el que vulgues.

  Quan respons, la targeta es marca «✓ Resposta» i la barra de baix ho compta («2 de 4 respostes»). En una pantalla estreta, el tros de foto va damunt de la pregunta.
- **L'esquema de blocs**, plegat en una línia: «Esquema de blocs · 13 blocs · 4 a la font · 1 nota de Claude». Si l'obris, veus:
  - la nota de Claude sobre l'esquema, si n'hi ha;
  - cada bloc, amb unes etiquetes:
    - on és a la font («T1 Def. 1.35, p. 13»), «Relacionat: …» o «No és a la font»;
    - «Correcció», «Noteta», «Pendent» o «No vist a classe»;
    - la pregunta que en parla («P1»). Si la cliques, et porta a la pregunta;
  - el quadre opcional «Alguna cosa no quadra a l'esquema?».
- **«Envia les respostes»** s'activa quan totes les preguntes tenen resposta. Envia a Claude un sol missatge amb totes, i el comentari a l'esquema si n'hi ha (vegeu «El missatge que rep Claude»), i Claude continua. Si en eixe moment un altre Claude treballa en el quadern, la barra diu «Espera» i el botó no s'activa, com «Passa a net».
- **Quan ha acabat** (part 7), davall de l'avís hi ha un resum:
  - blocs, quants són a la font, correccions i notetes;
  - a quines pàgines del quadern és la sessió;
  - com ha aplicat cada resposta.

  Si Claude no l'ha escrit, ix el seu últim missatge, com a la fase 1.

### Com funciona per dins

**Un fitxer nou a la sessió, `punt-control.json`.** Claude l'escriu al pas 4, abans d'aturar-se, a més del missatge d'ara. El missatge es queda per al registre i per si el fitxer falla. En acabar el pas 6, hi afegeix el resum.

**El format.** Un exemple sencer, amb dos blocs i dues preguntes de la sessió del 07/10:

```json
{
  "nota": "Les fotos van arribar en ordre invers; les he ordenades pel número de pàgina.",
  "blocs": [
    {"id": "B01", "tipus": "Exemple", "titol": "$H_1H_2$ no és subgrup, $|H_1H_2| = 4$",
     "apunts": "p. 18", "font": null, "relacionat": null,
     "marques": ["correccio"], "preguntes": ["P1"]},
    {"id": "B07", "tipus": "Definició", "titol": "Grup cíclic",
     "apunts": "p. 19", "font": "T1 Def. 1.35, p. 13", "relacionat": null,
     "marques": [], "preguntes": []}
  ],
  "preguntes": [
    {"id": "P1", "bloc": "B01", "tipus": "Sembla un error dels apunts",
     "pregunta": "Els apunts fan el producte en l'ordre contrari al del quadern. Com que no són teus, potser l'altre alumne fa servir l'altre conveni. Què faig?",
     "foto": "WhatsApp Image 2026-10-08 at 09.40.26.jpeg", "zona": [0.07, 0.08, 0.88, 0.23],
     "context": [["Apunts", "$H_1H_2 = \\{1, (1\\,2), (1\\,3), (1\\,2\\,3)\\}$"],
                 ["Quadern", "$(1\\,2)(1\\,3) = (1\\,3\\,2)$, perquè $cd = c \\circ d$"]],
     "forma": "opcions",
     "respostes": [
       {"text": "Corregeix-ho a (1 3 2) i marca la correcció"},
       {"text": "Deixa (1 2 3), com als apunts"}]},
    {"id": "P2", "bloc": "B13", "tipus": "Lectura dubtosa",
     "pregunta": "Pel context, els parèntesis han de ser claus i $a$ és la transposició $(1\\,2)$. Ho he entés bé?",
     "foto": "WhatsApp Image 2026-10-08 at 09.41.39.jpeg", "zona": [0.12, 0.56, 0.72, 0.63],
     "context": [["Llig", "$\\Sigma_2 = (1, a) \\to 1a = a = a1$"],
                 ["Entenc", "$\\Sigma_2 = \\{1, a\\}$, amb $a = (1\\,2)$"]],
     "forma": "sino"}
  ],
  "resum": null
}
```

| Camp | Què és | Obligatori |
| --- | --- | --- |
| `nota` | El que Claude vol dir de l'esquema en general | No |
| `blocs` | L'esquema, en ordre. Pot faltar en les preguntes fora del punt de control | Al punt de control |
| `blocs[].id`, `tipus`, `titol`, `apunts` | El bloc, el tipus en paraules, què és i on és als apunts | Sí |
| `blocs[].font` | On és a la font, o `null` si no hi és | Sí |
| `blocs[].relacionat` | Si no hi és però hi ha un resultat relacionat, quin | No |
| `blocs[].marques` | Algunes de `correccio`, `noteta`, `pendent`, `noclasse` | No |
| `blocs[].preguntes` | Les preguntes que en parlen | No |
| `preguntes[].id`, `pregunta` | P1, P2… i el text de la pregunta | Sí |
| `preguntes[].bloc`, `tipus` | El bloc i el tipus de dubte, en poques paraules | No |
| `preguntes[].foto`, `zona` | El nom de la foto, exactament com a `sessio.json`, i la zona | No: sense, no hi ha tros de foto |
| `preguntes[].context` | Parells «etiqueta, text»: què diuen els apunts, la font, el quadern… | No |
| `preguntes[].forma` | `opcions` o `sino` | Sí |
| `preguntes[].respostes` | Les opcions: `text`, i `detall` si cal una explicació. Amb `sino`, no cal | Amb `opcions` |
| `resum` | `null` fins al pas 6. Després: `pagines`, `blocs`, `a_la_font`, `correccions`, `notetes` i `respostes` (com s'ha aplicat cada una, en una frase) | No |

- **Les fórmules** van entre `$…$`, com als missatges, i la web les escriu amb KaTeX, que ja fa servir. Tot el text es mostra escapat: el fitxer no pot posar HTML a la pàgina.
- **La zona** són quatre proporcions de la foto, de 0 a 1: esquerra, dalt, dreta i baix. La web:
  - li afig un 2 % de marge per cada costat, perquè no talle lletres;
  - si fa menys d'un 6 % d'alt, l'eixampla;
  - no la deixa eixir de la foto.

  No retalla la foto: la posa de fons, ampliada i desplaçada fins a la zona, amb CSS. Per saber la proporció del tros, primer carrega la foto i en mira la mida.
- **Quan no hi ha tros de foto.** Si la zona no té quatre números ben posats, o la foto no és de la sessió, o és un PDF, no hi ha tros. Ix només el context i l'enllaç a la foto, si n'hi ha.
- **Quan l'ensenya la web.** `GET /api/sessions/…` torna el fitxer llegit (`punt_control`) i si és d'este torn (`punt_control_vigent`). És d'este torn si s'ha escrit després que començara el torn. Les dues dates són del mateix rellotge, el del contenidor. Per llegir-lo fa un sol accés al disc: obri el fitxer i en mira la data alhora. La web ensenya les preguntes si la sessió espera, el fitxer és d'este torn i el format és bo. Si no, ensenya el missatge, com a la fase 1.
- **Què és un format bo:** JSON que es pot llegir, amb `preguntes` en una llista. Cada pregunta ha de tindre `id`, `pregunta` i una `forma` coneguda, i les d'`opcions`, almenys una resposta. Si falla una sola pregunta, es fa servir el missatge per a tot el punt de control, perquè les respostes van juntes.
- **Les respostes a mitges** es guarden al navegador (`localStorage`), amb una clau per sessió i per data del fitxer. En enviar, s'esborren. Si el navegador no deixa guardar, la pàgina funciona igual, però en recarregar es perden.
- **En tornar a passar a net una sessió,** el `punt-control.json` d'abans se'n va a `registre/punt-control-<data>.json`, com les edicions.
- **Enviar** fa servir l'adreça d'ara (`…/respon`): la web compon el text i l'envia. Claude guarda les respostes al perfil de lletra, com ara. Si falla (per exemple, perquè un altre Claude treballa en el quadern), ix l'avís i les respostes es queden on eren.

**El missatge que rep Claude.** Per exemple:

```
Respostes del punt de control:
P1: (a) Corregeix-ho a (1 3 2) i marca la correcció
P2: No, és: Σ₂ = {1, a}, amb a = (1 2) i 1·a = a·1 = a
P3: (b) Completa-la amb un contraexemple
P4 (una altra resposta): Guarda-les a part, però només les de símbols
Comentaris a l'esquema: Falta un bloc entre B09 i B10: a la p. 19 hi ha una observació sobre ℤₙ.
```

- **Opcions:** la lletra i el text de l'opció: «(a) Corregeix-ho…». La web posa una lletra a cada opció (a, b, c…), perquè Claude no haja d'endevinar quina és. Al mock-up només en té la P3.
- **Sí o no:** «Sí», o «No, és: » i el que hages escrit.
- **Una altra resposta:** «P4 (una altra resposta): » i el teu text.
- **Comentaris a l'esquema:** només si n'has escrit.

Al registre ix com un missatge teu, igual que ara.

**Costos.** Escriure el fitxer són uns pocs milers de tokens més per sessió, d'eixida. Una sessió en gasta uns 2,5 milions. Llegir-lo no costa res, perquè ho fa la web.

### Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/app.py` | `GET /api/sessions/…` torna `punt_control` i `punt_control_vigent`. `passa_a_net` mou el fitxer d'abans a `registre/` |
| `web/static/app.js` | Les targetes de les preguntes, el tros de foto, les respostes guardades al navegador, la barra d'enviar (amb «Espera»), l'esquema plegat amb el quadre de comentaris, i el resum quan acaba |
| `web/static/style.css` | Les preguntes, les opcions, el tros de foto, les etiquetes de l'esquema, la barra i el resum |
| `web/prompt.md` | La norma del punt de control, amb el format i l'exemple (baix) |
| `CLAUDE.md` | Una línia al pas 4 i una al pas 6 |
| `flux.html` | Els passos 4 i 6, i la versió següent a `HISTORIAL` (ara és la v10; seria la v11). Es republica |
| `web-local.md` | La B, feta; «Com funciona» (el punt de control); «Opcions no triades» |

### Instruccions de Claude

- **`CLAUDE.md`, pas 4,** una línia més: «Des de la web, l'esquema i les preguntes també es guarden a `punt-control.json`, perquè la web ensenye cada pregunta per separat, amb el tros de foto a què es refereix (el format, a `web/prompt.md`).»
- **`CLAUDE.md`, pas 6,** una línia més: «Des de la web, el resum (xifres, pàgines del quadern i com s'ha aplicat cada resposta) també va a `punt-control.json`.»
- **`web/prompt.md`**, la norma del punt de control passa a dir, més o menys:

  > Al punt de control (pas 4), escriu el missatge d'ara (l'esquema i les preguntes P1, P2…) i, a més, `{carpeta}/punt-control.json`, amb el format de baix, abans d'acabar el torn. La web ensenya cada pregunta per separat i et torna les respostes en un sol missatge: «P1: …», «P2: …». En una pregunta d'opcions, cada resposta ha de ser una frase que puga anar tal qual en eixe missatge. En una de sí o no, no cal escriure-les. Per a cada pregunta, digues quina foto és (el nom exacte de `sessio.json`) i la zona on és el dubte, en proporcions de la foto (esquerra, dalt, dreta, baix, de 0 a 1), amb un poc de marge. Les fórmules, entre `$…$`. Si a mitja feina has de preguntar alguna altra cosa, fes igual, sense `blocs`. En acabar el pas 6, posa el resum al mateix fitxer.

  Davall hi va el format, amb l'exemple de la P1 i la P2 del 07/10.
- **`flux.html`, la versió següent** (seria la v11): passos 4 i 6.

### Dades

- `sessions/<sessió>/punt-control.json`, nou. Les sessions d'abans no en tenen, i «Progrés» els ensenya el missatge de Claude, com a la fase 1.
- En tornar a passar a net, el d'abans va a `registre/punt-control-<data>.json`.
- La llista de fitxers de la sessió («Fitxers», plegada) l'ensenya, com l'esquema o l'informe.

### Passos

1. Apuntar-se a `hey.md` amb `web/app.py`, `web/static/app.js`, `web/static/style.css`, `web/prompt.md`, `CLAUDE.md`, `flux.html` i `web-local.md`.
2. `web/app.py`: `punt_control` a la sessió, i moure'l en tornar a passar a net.
3. `web/static/app.js` i `style.css`: les preguntes, l'esquema, la barra d'enviar, les respostes guardades i el resum.
4. Instruccions: `web/prompt.md`, `CLAUDE.md` i `flux.html` (la versió següent), i republicar `flux.html`.
5. `web-local.md`, amb les opcions no triades.
6. Prova (baix) i regressió.
7. Tancar: guia «feta», commit i llevar l'entrada de `hey.md`.

### Com es prova

A `localhost:8300`, primer **sense gastar tokens**, amb una còpia de la sessió del 07/10 esperant i un `punt-control.json` escrit a mà amb les quatre preguntes reals i els 13 blocs:

1. **Les targetes:**
   - les quatre, amb els trossos de foto al lloc;
   - les fórmules ben escrites;
   - la P4, sense foto, només amb el context.
2. **Respondre:**
   - cada forma (opcions, sí o no amb «No, és…», una altra resposta);
   - el comptador de la barra;
   - el botó, desactivat fins que totes tenen resposta.
3. **Les respostes a mitges:** en contestar-ne dues i recarregar la pàgina, hi continuen.
4. **L'esquema:**
   - plegat, amb la línia que diu quants blocs hi ha;
   - en obrir-lo, els 13 blocs amb les etiquetes i el quadre de comentaris;
   - clicar «P1» porta a la pregunta.
5. **Enviar:**
   - el missatge que rep Claude es mira al registre, i ha de ser com el de l'exemple;
   - la còpia té una conversa falsa, i Claude acaba de seguida amb un error, sense gastar res;
   - després, les respostes guardades ja no hi són.
6. **Quan falla el fitxer** (cada cas, el missatge i el quadre de text):
   - el fitxer d'un torn anterior;
   - JSON trencat;
   - una pregunta sense `forma`.
7. **Una zona dolenta** (fora de la foto, al revés, amb una foto que no és de la sessió): la pregunta ix sense tros de foto i la resta funciona.
8. **Un punt de control sense preguntes:** l'esquema obert i «Continua».
9. **Quan acaba:** amb un `resum` escrit a mà, el resum dalt; sense, l'últim missatge.
10. **«Espera»:** mentre un altre Claude corregeix el quadern, la barra diu «Espera». Cal que Claude treballe: **amb la nova eina de proves amb agents.**
11. **Regressió:** la fase 1 sencera, les correccions del quadern i «Passa a net».

**Amb Claude de veritat,** amb la nova eina de proves amb agents o amb la pròxima sessió que passes a net. S'ha de mirar:

- que escriga el fitxer;
- que les zones de les fotos caiguen al lloc;
- que entenga el missatge de les respostes;
- que el resum final isca.

Fer-ho amb una còpia voldria dir passar a net una sessió sencera, uns 2,5 milions de tokens.

## Riscos

- **Les zones de les fotos.** Claude les calcula a ull i poden quedar desplaçades. Hi ha el marge, l'enllaç a la foto sencera i el context escrit, que no depén de la zona. Si en la pràctica falla molt, es pot passar a la foto sencera amb la zona marcada (opció no triada de la part 4), sense tocar Claude.
- **Fotos girades.** Si una foto du la informació de gir del mòbil (EXIF), el navegador i Claude la poden veure girada de manera diferent, i la zona no quadraria. Les de WhatsApp no en duen. Ho arreglaria la D (girar les fotos en pujar-les).
- **Que Claude s'oblide del fitxer o el faça mal.** La web fa com ara (decisió 3), i a `millores.md` es pot apuntar per ajustar el prompt.
- **Velocitat.** Cada sessió fa un accés al disc de més (15–35 ms) per llegir el fitxer.

## Opcions no triades

Van a «Opcions no triades» de `web-local.md`, en una secció «Progrés i punt de control (guia B)»:

- **Part 1 · Només l'última acció de Claude**, en una línia davall de l'estat, sense llista; o **el detall amagat del tot**, només als fitxers del registre.
- **Part 4 · La foto sencera amb la zona marcada**, en lloc del tros (es veu on és dins de la pàgina, però la lletra queda menuda); o **només el text**, sense foto, i sense que Claude haja de calcular cap zona.
- **Part 5 · Enviar amb alguna pregunta en blanc**: Claude tria en les que falten i deixa una noteta.
- **Part 6 · L'esquema obert davall de les preguntes** (era la proposta del mock-up), o **una taula com ara**, amb totes les columnes.
- **Part 6 · Sense quadre de comentaris a l'esquema**: el que no quadre, a «Una altra resposta» d'alguna pregunta.
