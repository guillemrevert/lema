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

## Com funciona

- **Un contenidor** amb Python, TeX Live i Claude Code. El repositori s'hi munta **només de lectura**; `dades/` (fora de git) és l'únic lloc on s'escriu. Les converses de Claude es guarden en un volum de Docker perquè es puguen continuar.
- **Dades:**
  ```
  dades/perfil-lletra.md
  dades/assignatures/<assignatura>/
    notacio.yaml
    fonts/<font>/          font.json, els PDF, el text extret, index.txt i fitxa.yaml
    classes/<AAAA-MM-DD>/  classe.json, apunts/, adjunts/, registre/ i el que escriu Claude
  ```
- **En pujar una font** s'executa [`extreu-font.py`](extreu-font.py), que en trau el text i l'índex.
- **«Passa a net»** obri una conversa nova de Claude Code per a cada classe (mesura 1 d'[`optimitzacio.md`](optimitzacio.md)), en mode no interactiu i amb el prompt de [`web/prompt.md`](web/prompt.md). Diu on és cada cosa i demana a Claude dues marques: `PAS n` en començar cada pas i `ESTAT: esperant` o `ESTAT: acabat` en acabar cada torn.
- **Registre:** el servidor resumeix el que fa Claude a `registre/events.jsonl` (text, eines, passos, tokens) i la web ho llig en directe. La sortida sencera de Claude queda al costat, a `registre/claude-*.jsonl`.
- **Punt de control:** Claude s'atura al pas 4, escriu l'esquema i les preguntes obligatòries i acaba el torn. La resposta, amb fitxers adjunts si cal, continua la mateixa conversa. Les correccions després del PDF van igual.
- **Compilar:** Claude fa servir [`compila.py`](compila.py) i [`plantilla-base.tex`](plantilla-base.tex), que ara és a l'arrel del repositori.

## Diferències amb el mock-up

- **Panell «Blocs» de la pantalla de progrés:** no està fet. Caldria que Claude escrivira la classificació de cada bloc en un format que la web puga llegir.
- **Botó per girar una foto i reducció a 1.500 px:** no estan fets. Els vas deixar sense confirmar.
- **Resultat:** en lloc de les xifres i les notetes en targetes, ensenya el PDF dins de la pàgina i l'`informe.md` tal com l'escriu Claude.

## Pla del frontend

Canvis que es van apuntant des del 06/10/2026. Es fan per fases, i cada fase té cinc passos: mock-up (si és una pantalla nova), guia d'implementació a `guies/` (skill `guia-implementacio`), vist-i-plau, implementació i prova a `localhost:8300`. Després, commit. Les fases es fixaran quan la llista estiga tancada.

| # | Què | Depèn de |
| --- | --- | --- |
| A | Panell «Blocs» a la pantalla de progrés | Un format fix per a `esquema.yaml` (Claude ja l'escriu, però cada vegada a la seua manera) |
| B | Punt de control propi (vegeu «Pantalles», baix) | Que Claude escriga les preguntes obligatòries en un fitxer que la web puga llegir |
| C | PDF i notetes amb un clic (vegeu «Pantalles», baix) | El mateix, per a les notetes. També la E, perquè el PDF és per tema |
| D | Girar les fotos i reduir-les a 1.500 px en pujar-les | Pillow al `Dockerfile`. També ho demana el `millores.md` de la classe del 05/10 |
| E | Carpeta per tema: cada classe afegeix blocs al tema | Canvi de dades i de la barra lateral (`millores.md` del 05/10) |
| F | Esborrar una classe | Res |
| G | Diverses fonts per classe, amb selecció múltiple (demanat el 06/10). **Feta** | — |
| H | Apunts i PDF costat a costat: al costat de cada bloc net, la foto d'on surt. Amplia la C | Que Claude escriga a `esquema.yaml` la foto i la zona de cada bloc en un format fix (part de la A) |
| I | Obrir a Overleaf amb un clic i baixar un `.tex` que compile sol (ara `tema.tex` necessita `blocs/` i la plantilla) | Res |
| J | Estils de document (clàssic, amb etiquetes, amb caixes) i opcions per assignatura: mida de lletra, marges, índex i numeració | Fer configurable `plantilla-base.tex`. Tanca la decisió oberta de numeració de l'especificació |
| K | Regles per al que està ratllat, els dibuixos (retall de la foto o TikZ) i les notes al marge dels apunts | Que l'usuari ho decidisca. Canvia `CLAUDE.md` i `flux.html` |
| L | Apunts en PDF d'altres apps de notes (GoodNotes, Notability): partir-lo en pàgines en pujar-lo, amb una miniatura per pàgina. La web ja accepta PDF, però com un sol fitxer | Tanca la decisió oberta 1 de l'especificació |
| M | Cercar un resultat entre totes les classes, i marcar-ne de favorits | La E (carpeta per tema) |
| N | Mode fosc | Res |

H–N, apuntades el 09/10/2026, venen de [MathWrite Notes](https://apps.apple.com/us/app/mathwrite-notes/id6807434387), una app d'iPad que passa a LaTeX el que s'escriu a mà. No hi ha font: és un transcriptor. Se'n van deixar fora les eines d'escriure a la pantalla (llapis, formes, gràfiques).

**Mock-up de la H (10/10/2026), estàtic:** https://claude.ai/artifact/2Hy57Zef8jrywVYJN8DURY. Fa servir les fotos i el PDF de la classe del 05/10. Ensenya la pantalla neta i, davall, la explica en 13 parts (què veus, què pots fer, per a què serveix i què cal), amb les alternatives una al costat de l'altra. Hi ha una primera versió interactiva a la pàgina «H · Costat a costat» del canvas del mock-up.

**On es va quedar la H:**

- L'usuari revisarà el mock-up amb calma. Començarà pel nucli: la foto dels apunts al costat del bloc net (la pàgina del PDF o el LaTeX del bloc). Són les parts 5 i 8, amb la pestanya (part 1) i una manera de triar el bloc (part 3 o 2).
- Decisions pendents:
  - Com es veu la foto: zona ressaltada, només el retall, foto sencera o un selector.
  - Com es veu el bloc net: pàgina del PDF, bloc sol, LaTeX o un selector.
  - On va la vista: en una pestanya pròpia o dins de «Resultat».
- La versió més barata és la foto sencera de la pàgina al costat del LaTeX del bloc. El LaTeX ja és a `blocs/`, i Claude només ha d'apuntar en quina foto és cada bloc, sense calcular cap zona.
- Marcar el bloc damunt de la foto vol que Claude apunte la zona de cada bloc al pas 2, i això porta una v6 de `flux.html`. Marcar-lo al PDF vol que la plantilla apunte on és cada bloc i que el contenidor tinga `pdftoppm`.
- Amb les decisions, el pas següent és la guia d'implementació (`guies/H-…`, skill `guia-implementacio`).

**G, feta el 07/10/2026:**

- A la secció «Fonts» de Materials hi ha caselles. Cada font marcada mostra els seus PDF, també amb caselles, per marcar en quins temes és la classe. Si no se'n marca cap, Claude mira l'índex.
- A `classe.json`, `fonts: [{id, temes}]` substitueix `font` i `tema_font`. Les classes d'abans es llegeixen igual i es converteixen la primera vegada que es guarden.
- Si un bloc és a més d'una font i no coincideixen, Claude agafa la que quadra millor amb els apunts i deixa una noteta. Les altres opcions eren l'ordre en què es marquen les fonts o un ordre fix per tipus (professor, llibre, apunts d'alumne). Ho diuen la decisió 7 de `CLAUDE.md` i `flux.html` (v5).
- Cada font de més costa la lectura del seu `index.txt`, que és barata, i la de les pàgines que calguen.

## Opcions no triades, per a més endavant

### Motor

- **API d'Anthropic.** Clau d'API i pagament per token. Dona més control: un model barat per als passos mecànics i prompt caching. És l'etapa 5 de l'especificació.
- **Sense Claude a la web.** La web només puja fitxers i mostra l'esquema i el PDF, i passar a net es fa des de Claude Code a banda. Serveix de pla B si el mode no interactiu dona problemes.

### Stack

- **Python + React (Vite).** Té sentit si la vista de revisió (subratllat i xinxetes) es complica.
- **Tot en TypeScript (Next.js)** amb el Claude Agent SDK. Caldria reescriure `extreu-font.py` o cridar-lo a banda.

### Pantalles

- **Punt de control propi.** L'esquema de blocs, amb on s'ha trobat cada bloc a la font, i una resposta per a cada pregunta obligatòria en lloc d'un sol text. Les respostes es guarden al perfil de lletra.
- **PDF i notetes.** El PDF al costat de la llista de notetes, i cada noteta es resol amb un clic, en lloc de llegir-les a l'informe.
