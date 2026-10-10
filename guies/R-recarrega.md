# Guia R · La pàgina es recarrega sola quan hi ha una versió nova

**Estat:** feta el 10/10/2026. Provada a `localhost:8300`:

- sense canvis de versió, moure's per la web no recarrega res;
- després de canviar la data de `style.css`, el clic següent recarrega la pàgina i obri directament on anaves (el «Costat a costat» del quadern);
- amb canvis al LaTeX sense desar: si a la pregunta d'eixir dius que no, et quedes a l'editor amb els canvis i no es recarrega; si dius que sí, es recarrega i vas on havies clicat. El canvi de prova no es va desar.

## Què i per què

**Què va passar.** El 10/10/2026, després de la fase 2 de la guia Q, el LaTeX no eixia. La pestanya de la web estava oberta des d'abans del canvi, i el navegador continuava fent servir la versió vella de la pàgina (`app.js`). Eixa versió demanava el LaTeX a una adreça del servidor que ja no existeix, i el servidor responia «no existeix». Amb Ctrl+F5 es va arreglar.

**Per què passa.** Quan et mous per la web (d'una sessió al quadern, de «Materials» a «Progrés»…), la pàgina no es torna a carregar: només en canvia el contingut. Així va més ràpida, però una pestanya oberta continua amb el codi que tenia quan la vas obrir. Cada vegada que fem un canvi a la web pot tornar a passar.

**Què es proposa.** Cada vegada que et mous per la web, la pàgina pregunta al servidor quina versió hi ha. Si és més nova que la que té, es recarrega sola.

És la R del pla del frontend de `web-local.md`.

## Decisions

| Què | Proposta | Alternativa |
| --- | --- | --- |
| Quan es comprova | Cada vegada que et mous per la web | Cada pocs minuts, encara que no et mogues. Es recarregaria mentre llegeixes o escrius, sense que hages fet res |
| Què es fa si hi ha una versió nova | Recarregar sola, sense preguntar | Un avís «Hi ha una versió nova: recarrega» i que cliques tu |

**Els canvis al LaTeX sense desar no es perden.** La recàrrega només passa quan et mous, i abans de moure't la web ja et pregunta si vols eixir sense desar. Si dius que no, et quedes on eres i no es recarrega res.

## Què notaràs

- Normalment, res. Després d'un canvi a la web, el primer clic que faces dins de la web tarda un poc més, perquè la pàgina es recarrega, i ja tens la versió nova.

## Com funciona per dins

- **Al servidor**, una adreça nova, `GET /api/versio`. Torna un número que canvia cada vegada que canvia un fitxer de la pàgina (`web/static/`: `index.html`, `app.js` i `style.css`): la data de l'últim canvi.
- **A la pàgina:**
  1. En carregar-se, apunta la versió que té.
  2. Cada vegada que et mous, demana la versió alhora que la resta de dades, així que no tarda més.
  3. Si la versió és diferent, es recarrega (`location.reload()`) i obri directament la pàgina on anaves.
- **El navegador ja agafa sempre la versió nova en recarregar**, perquè el servidor li diu que no la guarde (`Cache-Control: no-cache`, ja hi és).

## Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `web/app.py` | L'adreça `/api/versio` |
| `web/static/app.js` | `pinta()` demana la versió i, si ha canviat, recarrega |
| `web-local.md` | La R, feta; una línia a «Com funciona» |

## Instruccions de Claude

Cap canvi.

## Dades

Cap canvi.

## Passos

1. `web/app.py`: `/api/versio`.
2. `web/static/app.js`: la comprovació a `pinta()`.
3. `web-local.md`.
4. Prova (baix).
5. Tancar: guia «feta» i commit.

## Com es prova

A `localhost:8300`:

1. Obri la web en una pestanya i deixa-la oberta.
2. Canvia una cosa xicoteta a `web/static/style.css` (o simplement desa'l de nou).
3. A la pestanya oberta, clica un altre quadern o sessió: la pàgina s'ha de recarregar sola i ensenyar el que has clicat.
4. Amb canvis al LaTeX sense desar, torna a fer el pas 2 i clica un altre lloc. La web primer pregunta si vols eixir sense desar, com ara. Si dius que no, et quedes a l'editor amb els canvis; si dius que sí, es recarrega i vas on havies clicat.
5. Sense canvis de versió, moure's per la web va igual de ràpid que ara.
