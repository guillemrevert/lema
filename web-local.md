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
| Fonts | Per assignatura: es pugen una vegada i es trien en cada classe (03/10/2026) |
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
