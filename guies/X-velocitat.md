# Guia X · Que moure's per la web no tarde

**Estat:** feta el 13/10/2026, amb totes les propostes. Provada a `localhost:8300`:

- **Torna el mateix:** `/api/assignatures`, `/api/quaderns/estructures-algebraiques/tema-1-grups`, `/api/versio` i les sessions de la font `wuolah`, idèntiques byte a byte a les d'abans.
- **Dins del contenidor**, la versió vella i la nova alternades en el mateix moment (11 vegades): la llista, de **749 a 119 ms** (mediana; la nova, entre 40 i 162 ms). La pàgina del quadern (`quadern()`), de 626 a **148 ms**, i les seues sessions, de 368 a 81 ms. `versio()`, de 53 a **19 ms**.
- **Al navegador**, tres voltes als set clics: la llista, **65–310 ms** (abans, 420–1.230 ms). Quaderns, Fonts i Nova sessió, en 0,1–0,4 s. Les sessions, en 0,2–0,55 s, i el quadern, en 0,2–0,85 s: el que queda és el que la pàgina llig a banda (vegeu «Fora d'esta guia»), que va més ràpid o més lent segons el moment. Els temps de baix, «Què notaràs», eren l'estimació; al navegador, amb el disc tan variable, han eixit un poc més alts.
- **Connexió:** amb `curl` a `localhost`, de 210 a **2 ms** (ara contesta `::1`).
- **Casos rars:** una carpeta buida i un fitxer solt dins de `sessions/` no ixen a la llista ni la trenquen; una sessió «en marxa» sense Claude ix «Aturada». Es van fer en una carpeta temporal d'Anàlisi II, esborrada després.

Les mesures de baix són les d'abans del canvi; els scripts, fora del repositori, no toquen el codi de la web.

## Què i per què

**Què passa.** Cada clic dins de la web (d'una sessió al quadern, de «Quaderns» a «Fonts»…) tarda de mig segon a tres segons. Es va veure en fer la fase 1 de la W: cada vegada que et mous, la pàgina demana al servidor la llista sencera d'assignatures, sessions, fonts i quaderns (`/api/assignatures`), i esta llista és lenta. A la W només es va evitar per al canvi de PDF.

**Per què és lenta.** La carpeta `dades/` és a Windows i el contenidor la veu a través d'un pont (un «muntatge» de Docker Desktop). Cada vegada que el servidor mira un fitxer d'allí (si existeix, obrir-lo, llegir-lo, la llista d'una carpeta), la petició ha de passar a Windows i tornar: tarda **15–35 ms** (de vegades fins a 110 ms). El mateix al disc propi del contenidor tarda menys de 0,1 ms. Per fer la llista, el servidor en fa unes **34, una darrere l'altra**. A més, cada sessió nova n'hi afegeix 4: la llista creix amb el curs.

**Què es proposa.** Que el servidor faça menys accessos i, sobretot, que els faça **tots alhora** en lloc d'esperar cada un: el pont n'accepta molts a la vegada. I arreglar un retard de 0,3 s en obrir la connexió que no té res a vore amb el disc.

És la X del pla del frontend de `web-local.md`.

## On se'n va el temps

### El que notes, al navegador

Set clics seguits a `localhost:8300` (13/10/2026, vesprada), amb el temps fins que la pàgina té totes les dades:

| Clic | Total | `/api/assignatures` | Després, la de la pàgina |
| --- | --- | --- | --- |
| Sessió del 10/10 | 1,36 s | 1,23 s | sessió: 0,13 s |
| Fonts | 0,43 s | 0,42 s | — |
| Quadern Tema 1 | 1,02 s | 0,57 s | quadern: 0,45 s |
| Quaderns | 0,80 s | 0,80 s | — |
| Nova sessió | 1,04 s | 1,04 s | — |
| Sessió del 07/10 | 0,72 s | 0,55 s | sessió: 0,18 s |
| Quaderns | 0,62 s | 0,62 s | — |

`/api/versio` es demana alhora i acaba abans (0,12–0,51 s), així que el que fa esperar és la llista. La pàgina d'una sessió o d'un quadern demana les seues dades **després** de la llista, i s'hi sumen. Unes hores abans, amb `curl`, la llista tardava 2–3 s: són els mateixos accessos, però el pont no va sempre igual de ràpid.

### Dins de la llista

Mesurat dins del contenidor, amb un rellotge a cada part. Una crida normal (la memòria de les pàgines del PDF ja feta), de 0,67 s:

| Què fa | Accessos al disc | Temps | Part |
| --- | --- | --- | --- |
| Llegir les 5 sessions (`llig_sessio`): mirar si la carpeta existeix (ja se sap, perquè l'acaba de trobar), obrir `sessio.json` i llegir-lo | 15 | 300 ms | 45 % |
| Buscar les carpetes (6 `glob`, 3 per assignatura): la llista de cada carpeta i, per a cada subcarpeta, mirar si hi ha la fitxa | ~13 | ~220 ms | 33 % |
| El quadern (`info_quadern`): `quadern.json` i mirar el PDF dues vegades (si existeix i la data) | 4 | 98 ms | 15 % |
| La font (`info_font`): `font.json` | 2 | 46 ms | 7 % |
| **Total** | **~34** | **667 ms** | **~20 ms per accés** |

En altres tandes, la mateixa llista ha tardat de 0,36 a 0,96 s. La primera vegada després d'arrancar, 1,4 s: compta les pàgines del PDF del quadern (0,1 s) i els primers accessos al pont són més lents.

**Com creix.** Cada sessió afegeix uns 4 accessos (~80 ms). Amb unes 60 sessions a final de curs (dues assignatures, dues per setmana), només llegir els `sessio.json` un darrere l'altre tardaria **1,8 s**; tots alhora, **0,1 s** (mesurat llegint 60 vegades les fitxes que hi ha).

### `/api/versio`

Al servidor tarda **35–180 ms** (mediana 53 ms): mira la data dels 3 fitxers de `web/static/`, un darrere l'altre. Els 0,4–0,6 s que donava `curl` eren sobretot la connexió (vegeu la següent).

### La connexió: 0,2–0,3 s cada vegada que se n'obri una

El contenidor només escolta a `127.0.0.1` (IPv4). Windows, quan escrius `localhost`, prova primer `::1` (IPv6), on no hi ha ningú, i només quan li diuen que no prova `127.0.0.1`. Eixe intent perdut costa **0,2 s** amb `curl` i **0,3 s** al navegador. El navegador reaprofita la connexió mentre està oberta, però el servidor la tanca quan passen 5 s sense fer res, així que molts clics després d'una pausa la tornen a pagar (en una prova, 2 de 4 peticions).

Provat amb un contenidor d'usar i llençar que escoltava també a `[::1]`: la connexió passa de 210 ms a 1,6 ms.

## Decisions

| Què | Proposta | Alternatives, no triades |
| --- | --- | --- |
| Com es fa ràpida la llista | **Llegir-ho tot alhora i amb menys accessos.** La llista es llig sencera cada vegada, com ara, així que sempre està al dia | Les quatre de baix |
| On es fa servir la lectura nova | **A tots els llocs que lligen totes les sessions:** la llista, la pàgina del quadern (que en llig les sessions: 0,37 s dels 0,63 s que tarda) i les sessions que fan servir una font (en editar-la). És el mateix codi tres vegades | Només a la llista |
| La connexió de 0,3 s | **Publicar el port també a `[::1]`** (una línia a `docker-compose.yml`). `localhost` funciona al primer intent i no canvia res més | Obrir sempre la web a `127.0.0.1:8300` (sense tocar res, però canvia l'adreça de sempre i la dels documents); que el servidor no tanque les connexions als 5 s (només es nota mentre fas clics seguits) |

**Les alternatives per a la llista, i per què no:**

- **Una memòria cau amb la data de modificació:** el servidor guardaria la llista i, en cada clic, miraria si les fitxes han canviat. Però en este pont, mirar la data d'un fitxer costa el mateix que llegir-lo (5 fitxes: 134 ms per mirar-ne la data, 111 ms per llegir-les), així que no s'estalvia res.
- **Una memòria cau que esborra la mateixa web quan escriu:** la llista eixiria en 0 ms, però no veuria els canvis fets per fora de la web (copiar una sessió des de Windows, com en les proves de la H i la Q, o Claude Code des de l'aplicació d'escriptori), i després de cada canvi des de la web tornaria a la lectura lenta. Amb la lectura alhora en 0,05 s, no compensa.
- **No demanar la llista en cada clic:** la pàgina es quedaria la que té. Però la barra lateral deixaria d'actualitzar l'estat de les sessions (p. ex. «En marxa · pas 3» d'una sessió que Claude passa a net mentre mires una altra cosa), i cada acció hauria de recordar demanar-la de nou.
- **Moure `dades/` a un disc de Docker** (ràpid): les dades deixarien de vore's des de Windows (els PDF, les còpies, Claude Code des de l'escriptori).

## Què notaràs

- **Quaderns, Fonts i Nova sessió:** de 0,4–1,4 s (2–3 s en els moments lents) a **uns 0,1 s**.
- **Pàgina d'un quadern:** d'1 s a uns 0,3–0,4 s. La resta és el que el quadern llig a banda (vegeu «Fora d'esta guia»).
- **Pàgina d'una sessió:** de 0,7–1,4 s a uns 0,3 s. Igual.
- **No creix amb el curs:** amb 60 sessions, igual que ara.
- Res més: la web ensenya exactament el mateix.

## Com funciona per dins

**Llegir alhora.** El servidor té 16 «lectors» (fils). En lloc de llegir les fitxes una darrere l'altra, en reparteix una a cada lector i espera que acaben tots: el temps és el d'un o dos accessos, no la suma de tots. Al prototip (una còpia de `assignatures()` dins d'un script, amb `ThreadPoolExecutor`), la llista passa de **540 ms a 52 ms** (mediana de 9, alternant les dues per ser justos) i torna **exactament el mateix** (comprovat).

**Menys accessos:**

- Les carpetes, amb una sola llista per carpeta (`os.listdir`) en lloc d'un `glob`, que mira també cada subcarpeta. Si una carpeta no té fitxa (`sessio.json`, `font.json`, `quadern.json`), no ix a la llista, com ara: es nota perquè falla en obrir-la.
- La sessió no torna a mirar si la seua carpeta existeix: ja l'ha trobada a la llista.
- El PDF del quadern es mira una vegada (data i mida) en lloc de dues.

**Una sola funció per a «totes les sessions d'una assignatura»**, que fan servir la llista, la pàgina del quadern i les sessions d'una font. Torna el mateix que ara, també l'estat «aturada» d'una sessió que estava en marxa quan es va reiniciar el servidor.

**`/api/versio`**: les dates dels fitxers de `web/static/`, també alhora (53 → 19 ms al prototip).

**La connexió:** a `docker-compose.yml`, una segona línia a `ports`, `"[::1]:8300:8000"`. Continua sent només des d'este ordinador (`::1` és el mateix ordinador, en IPv6). Cal tornar a crear el contenidor (`docker compose up -d`), sense reconstruir la imatge.

## Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/app.py` | Els 16 lectors; una funció per a totes les sessions d'una assignatura, alhora; `assignatures()` amb les carpetes i les fitxes alhora; `sessions_del_quadern()` i `sessions_amb_font()` fan servir la funció nova; `info_quadern()` mira el PDF una vegada; `versio()` alhora |
| `docker-compose.yml` | El port també a `[::1]` |
| `web-local.md` | La X, feta; a «Com funciona», per què el servidor llig alhora (i la línia de la W que deia que la llista tarda uns segons); «Opcions no triades», les de dalt |

## Instruccions de Claude

Cap canvi.

## Dades

Cap canvi.

## Passos

1. Guardar la resposta de `/api/assignatures` d'ara, per comparar-la després.
2. `web/app.py`: els lectors i la funció de totes les sessions; `assignatures()`, `sessions_del_quadern()` i `sessions_amb_font()` la fan servir.
3. `web/app.py`: `info_quadern()` i `versio()`.
4. `docker-compose.yml` i `docker compose up -d`.
5. `web-local.md`.
6. Prova (baix).
7. Tancar: guia «feta» i commit.

## Com es prova

1. **Torna el mateix.** La resposta de `/api/assignatures` és idèntica a la del pas 1. Les pàgines del Tema 1 i de la font `wuolah` ensenyen les mateixes sessions que abans.
2. **Velocitat, al servidor.** Les mateixes mesures d'esta guia, dins del contenidor: la llista, per davall de 0,15 s; `versio()`, per davall de 0,05 s.
3. **Velocitat, al navegador.** Els set clics de dalt a `localhost:8300`: Quaderns, Fonts i Nova sessió en uns 0,1 s; el quadern i les sessions, per davall de 0,5 s.
4. **Connexió.** `curl -w "%{time_connect}" http://localhost:8300/api/versio` dona uns 0,002 s en lloc de 0,2 s.
5. **Casos rars:** una carpeta buida dins de `sessions/` (sense `sessio.json`) no apareix i no trenca res; es crea per a la prova i s'esborra després. Una sessió en marxa a mitges ix «Aturada» després de reiniciar el servidor, com ara.

## Fora d'esta guia

Després de la X, el que més tarda és el que cada pàgina llig a banda, també un accés darrere l'altre:

- **Pàgina d'una sessió** (`/api/sessions/…`): 0,2–0,3 s, sobretot la llista de tots els fitxers de la carpeta (`os.walk`, 87 ms) i els del quadern.
- **Pàgina d'un quadern** (`/api/quaderns/…`): uns 0,25 s, sense les sessions.

Es podrien llegir alhora de la mateixa manera, en una guia a banda si encara es nota.
