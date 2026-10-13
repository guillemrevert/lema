# Guia · Instruccions per a les sessions que toquen la web (`web/CLAUDE.md`)

**Estat:** feta el 13/10/2026. Provada:

1. **Es carrega sol:** la sessió de la guia B, que treballava amb `web/` alhora, va rebre el contingut de `web/CLAUDE.md` sense obrir-lo, en editar `web/static/app.js`. No cal llegir el fitxer: també es carrega en editar-ne un de `web/`. En la sessió que l'escriu no es veu, perquè Claude Code no torna a afegir un fitxer que ja té.
2. **Els enllaços** obrin `web-local.md` i la guia X.
3. **L'arrel no canvia:** `CLAUDE.md`, sense canvis.
4. **Les ordres** funcionen: `docker compose exec lema ps -eo args` llista els processos, i un script que importa `web/app.py` s'executa amb `docker compose exec -T lema python - < script.py`.

## Què i per què

**Què passa.** En fer la guia X (velocitat) es va descobrir una cosa que tota sessió que toque `web/` hauria de saber abans de programar: el disc de `dades/` és lent, i un bucle que llig fitxer a fitxer fa que la web tarde segons. Ara està explicat a «Com funciona» de `web-local.md` i en un comentari de `web/app.py`. Però una sessió nova no llig `web-local.md` si no decideix que li cal, així que el pròxim bucle sobre `dades/` es pot tornar a escriure lent. Passa igual amb altres coses que no es veuen al codi: com es recarrega el servidor, que les dades són les teues…

**Què es proposa.** Un fitxer nou, `web/CLAUDE.md`, curt, amb només eixes coses. Claude Code el carrega sol quan una sessió treballa amb fitxers de `web/`, igual que carrega `CLAUDE.md` de l'arrel en començar. Ve de la conversa del 13/10/2026, després de la X.

No té lletra perquè no és del pla del frontend de `web-local.md`.

## Decisions

| Què | Proposta | Alternatives |
| --- | --- | --- |
| On van | **`web/CLAUDE.md`**: el veuen les sessions que toquen la web, i només elles | A `CLAUDE.md` de l'arrel: el llig també el Claude que passa a net, en cada sessió (la web el llança des de l'arrel del repositori), i a ell no li serveix de res. Només un enllaç des de l'arrel: Claude no obri un fitxer enllaçat si no decideix que li cal, que és el que passa ara amb `web-local.md` |
| Què hi va | **Només el que no es veu al codi i fa mal si no se sap:** el disc lent, com es recarrega el servidor, que les dades són les teues i com es prova dins del contenidor. Cada línia, la regla i el perquè, amb un enllaç al detall | Copiar «Com funciona» sencer: seria el mateix escrit en dos llocs, i un dels dos envelliria |
| «Com treballar amb l'usuari» | **Es queda a `CLAUDE.md` de l'arrel:** valencià, guia abans de programar, `hey.md`. Val també per a les sessions que no toquen `web/` (`flux.html`, la plantilla, les guies) | Moure-ho a `web/CLAUDE.md`: estes sessions no ho veurien |
| Com es manté al dia | **Una línia a la skill `guia-implementacio`:** en tancar una guia, si has après alguna cosa així, va a `web/CLAUDE.md` en el mateix commit | Que cada sessió ho guarde a la seua memòria: la memòria és de l'usuari i de cada màquina, i no viatja amb el repositori |

**El Claude que passa a net no el veurà**, perquè no treballa dins de `web/`. Als registres de les sessions i quaderns d'ara, de 97 eines que ha fet servir, només una vegada va mirar un fitxer de `web/` (`cat web/prompt.md`). Si algun dia el carregara, són unes 15 línies.

**No xoca amb la guia de disseny** (`guies/disseny-instruccions.md`, en proposta), que afegeix una línia a `CLAUDE.md` de l'arrel. Allí té sentit, perquè el disseny val també per als mock-ups de `guies/` i per a `flux.html`, que no són a `web/`.

## El fitxer nou

`web/CLAUDE.md`, sencer:

```markdown
# web/ · el que cal saber abans de tocar la web

Claude Code carrega este fitxer quan una sessió treballa amb fitxers de `web/`. Com funciona la web, en detall: «Com funciona» de [`web-local.md`](../web-local.md).

- **El disc de `dades/` és lent.** És a Windows i el contenidor el veu a través del muntatge de Docker Desktop: cada accés (mirar si existeix, obrir, llegir, llistar una carpeta) tarda 15–35 ms, i en una pàgina se'n sumen molts. Per llegir moltes fitxes, `alhora()` i `resultats()` (o `totes_les_sessions()`), no un bucle. No mires si un fitxer existeix si després l'has d'obrir igualment: obri'l i, si no hi és, ja fallarà ([guia X](../guies/X-velocitat.md)).
- **El servidor es recarrega sol.** Els canvis a `web/*.py` s'apliquen en desar (uvicorn `--reload`), i la pàgina oberta es recarrega sola quan canvia `web/static/` (guia R). Un canvi a `docker-compose.yml` necessita `docker compose up -d`; al `Dockerfile`, `docker compose build` i després `up -d`. Tots dos tornen a crear el contenidor i aturen el Claude que estiga passant a net: abans, mira que no n'hi haja cap (`docker compose exec lema ps -eo args`).
- **Les dades són les de l'usuari.** Les proves es fan amb còpies o carpetes temporals dins de `dades/`, i s'esborren en acabar. Si la prova crea una carpeta que no existia (p. ex. `dades/assignatures/analisi-2/`), també.
- **Per mesurar o provar dins del contenidor**, sense tocar el codi: un script que importa `web/app.py` (`sys.path.insert(0, "/lema/web")`) i crida les funcions, amb `docker compose exec -T lema python - < script.py` (des de Git Bash, amb `MSYS_NO_PATHCONV=1`).
```

## Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/CLAUDE.md` | Nou, amb el contingut de dalt |
| `.claude/skills/guia-implementacio/SKILL.md` | A «Ordre», el pas 4: si la feina ha deixat alguna cosa que una sessió nova ha de saber abans de tocar `web/` i que no es veu al codi, s'afig a `web/CLAUDE.md` en el mateix commit |
| `web-local.md` | Una línia a «Com funciona» que diu que existeix `web/CLAUDE.md`, i les alternatives a «Opcions no triades». Ara és de la guia B (vegeu `hey.md`): ho faré quan estiga lliure |

## Instruccions de Claude

- **`CLAUDE.md` de l'arrel:** cap canvi.
- **`web/CLAUDE.md`:** nou (dalt). Són instruccions per a les sessions que programen la web, no per al Claude que passa a net.
- **`web/prompt.md` i `flux.html`:** cap canvi. No canvia cap pas del flux.

## Dades

Cap canvi.

## Passos

1. Afegir a la meua entrada de `hey.md` els fitxers de dalt.
2. Escriure `web/CLAUDE.md`.
3. La línia de la skill.
4. `web-local.md`, quan la guia B l'allibere.
5. Provar.
6. Posar l'estat a «feta», fer el commit amb esta guia i llevar la meua entrada de `hey.md`.

## Com es prova

1. **Es carrega sol.** En una sessió de Claude Code a LEMA, llegir un fitxer de `web/` (p. ex. `web/app.py`) sense obrir `web/CLAUDE.md`: Claude Code l'ha d'afegir sol a la conversa, com fa amb `CLAUDE.md`.
2. **Els enllaços** de `web/CLAUDE.md` obrin `web-local.md` i la guia X.
3. **L'arrel no canvia:** `CLAUDE.md` queda igual.
4. **Les ordres que diu funcionen:** `docker compose exec lema ps -eo args` llista els processos del contenidor, i un script de prova que importa `web/app.py` s'executa amb l'ordre de l'última línia.
