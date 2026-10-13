Passa a net la sessió de `{carpeta}` seguint el flux de `CLAUDE.md`, del pas 0 al 6.

Tot el que necessites és en este missatge: no cal llegir `web-local.md`, l'especificació, `compila.py`, el registre ni altres sessions, ni explorar `dades/`. Les carpetes del pas 0 ja existeixen; del pas 0 només queda la fitxa de la font, si encara no en té. Els materials no són a `prova-1/` sinó ací:

- **Assignatura:** {assignatura}. Carpeta: `{carpeta_assig}`.
- **Apunts**, en este ordre:
{apunts}

  Per mirar de prop una zona d'una foto: `python retalla.py <foto> <esquerra> <dalt> <dreta> <baix> [--gira 90|180|270]`, amb la zona en proporcions de 0 a 1 (com la `zona` de `punt-control.json`). Et diu on ha deixat el retall, ampliat, i el llegeixes amb `Read`. Fes-ho només quan hi haja un dubte real: cada retall costa uns centenars de tokens.
- **Fonts:**
{fonts}

  El text de cada PDF ja està extret, i `busca-font.py` te n'ensenya només el que cal:

  - `python busca-font.py <carpeta de la font> --index <PDF>…`: l'índex (una línia per cada definició, teorema, lema… amb la pàgina), només dels temes de la sessió. Si no se sap el tema, sense cap PDF: l'índex sencer.
  - `python busca-font.py <carpeta de la font> "Teorema 2.19" "Lema 2.17" …`: el passatge de cada resultat, amb la demostració i la pàgina. Demana'ls tots en una sola ordre.
  - `python busca-font.py <carpeta de la font> --pagina <PDF> <pàgina>`: una pàgina sencera, per als exemples i les observacions, que no tenen número.

  No llegeixes els `.txt` sencers ni pàgines senceres per buscar un resultat. Mira la pàgina del PDF com a imatge només si has de copiar una fórmula: al text, els subíndexs i superíndexs ixen aplanats.

  Si hi ha més d'una font, busca cada bloc a totes. Si és a més d'una i no coincideixen, segueix la decisió 7 de `CLAUDE.md`.
- **Nota de l'usuari:** {nota}

On va cada cosa:

{document}
- La fitxa de cada font, a `fitxa.yaml`, dins de la carpeta de la font. Si ja existeix (la tens dalt), reutilitza-la: l'usuari la pot haver editada des de la web. Si no quadra amb el que diu dalt de la font (què és, d'on surt o els PDF), mana això: corregeix la fitxa.
- El diccionari de notació, a `{carpeta_assig}/notacio.yaml`. Si ja existeix, consulta'l i amplia'l.
- El perfil de lletra, a `dades/perfil-lletra.md`. Si ja existeix, consulta'l en la lectura i amplia'l amb les respostes.
- La plantilla és `plantilla-base.tex`, a l'arrel del repositori: `quadern.tex` la carrega amb `\input{{plantilla}}`. No la modifiques; si cal canviar-la, apunta-ho a `millores.md`.
- Fora de `dades/` no pots escriure: el repositori està muntat només de lectura.

Format de `esquema.yaml` (un bloc d'exemple; posa-hi tots els blocs, en ordre):

```yaml
# Esquema de blocs · {assignatura} · sessió {sessio}
estat: escrit
blocs:
  - id: B01
    tipus: teorema        # definicio, teorema, proposicio, lema, corollari, demostracio, exemple, observacio, notacio o exercici
    titol: Descomposició en cicles disjunts
    origen_apunts: {pagina: p18, zona: «Tª»}
    font: {ref: "T2 Teorema 2.6", pagina: 3}   # null si no hi és
    comparacio: equivalent  # equivalent, diferent_valid, apunts_falsos, dubtos o no_a_la_font
    detall: "Què canvia respecte a la font, si cal."
    decisio: font           # font, apunts, o una frase curta
    notetes: [N39]
```

Normes de la web:

- En començar cada pas, escriu una línia sola: `PAS n · nom del pas`.
- No tens l'eina de preguntes. Al punt de control (pas 4), escriu l'esquema de blocs, amb on has trobat cada bloc a la font, i les preguntes obligatòries numerades (P1, P2…), i acaba el torn. L'usuari et respondrà en un missatge nou. Si has de preguntar qualsevol altra cosa, fes igual.
- Abans d'acabar el torn del punt de control, escriu també `{carpeta}/punt-control.json`, amb el format de baix. La web ensenya cada pregunta per separat, amb el tros de foto a què es refereix, i et torna totes les respostes en un sol missatge: «P1: (a) …», «P2: Sí», «P2: No, és: …», «P3 (una altra resposta): …» i, si n'hi ha, «Comentaris a l'esquema: …». Si a mitja feina has de preguntar alguna altra cosa, escriu-lo igual, sense `blocs`. En acabar el pas 6, afig-hi el `resum`.
- Acaba cada torn amb una línia sola: `ESTAT: esperant` si esperes una resposta, o `ESTAT: acabat` si ja has fet el PDF i l'informe.
- L'usuari pot editar el LaTeX dels blocs des de la web (decisió 2). Quan un missatge seu diga quins blocs ha editat a mà, no desfaces eixos canvis; si creus que n'hi ha algun d'erroni, digues-ho amb una noteta.

Format de `punt-control.json` (un exemple amb dues preguntes; posa-hi tots els blocs i totes les preguntes):

```json
{
  "nota": "Les fotos van arribar en ordre invers; les he ordenades pel número de pàgina.",
  "blocs": [
    {"id": "B01", "tipus": "Exemple", "titol": "$H_1H_2$ no és subgrup", "apunts": "p. 18",
     "font": null, "relacionat": null, "marques": ["correccio"], "preguntes": ["P1"]},
    {"id": "B07", "tipus": "Definició", "titol": "Grup cíclic", "apunts": "p. 19",
     "font": "T1 Def. 1.35, p. 13", "relacionat": null, "marques": [], "preguntes": []}
  ],
  "preguntes": [
    {"id": "P1", "bloc": "B01 · Exemple", "tipus": "Sembla un error dels apunts",
     "pregunta": "Els apunts fan el producte en l'ordre contrari al del quadern. Què faig?",
     "foto": "nom exacte de la foto.jpeg", "zona": [0.07, 0.08, 0.88, 0.23],
     "context": [["Apunts", "$H_1H_2 = \\{1, (1\\,2), (1\\,3), (1\\,2\\,3)\\}$"],
                 ["Quadern", "$(1\\,2)(1\\,3) = (1\\,3\\,2)$"]],
     "forma": "opcions",
     "respostes": [{"text": "Corregeix-ho a (1 3 2) i marca la correcció"},
                   {"text": "Deixa (1 2 3), com als apunts", "detall": "Amb una noteta."}]},
    {"id": "P2", "bloc": "B13 · Exercici 11", "tipus": "Lectura dubtosa",
     "pregunta": "Llig $\\Sigma_2 = (1, a)$. Vol dir $\\{1, a\\}$, amb $a = (1\\,2)$?",
     "foto": "nom exacte de la foto.jpeg", "zona": [0.12, 0.57, 0.70, 0.62],
     "context": [["Llig", "$\\Sigma_2 = (1, a)$"]],
     "forma": "sino"}
  ],
  "resum": null
}
```

- Els textos van sense Markdown. Les fórmules, entre `$…$`; en JSON, cada `\` s'escriu `\\`.
- `blocs`: tots, en ordre. `font`: on és a la font, o `null`. `relacionat`: si no hi és però n'hi ha un de relacionat, quin. `marques`: algunes de `correccio`, `noteta`, `pendent` i `noclasse`. `preguntes`: les que en parlen.
- `foto`: el nom exacte, com a la llista d'apunts. `zona`: on és el dubte dins de la foto, en proporcions de 0 a 1 (esquerra, dalt, dreta, baix), amb un poc de marge. Si el dubte no és d'una foto, sense `foto` ni `zona`.
- `forma`: `opcions`, amb les `respostes` (frases que puguen anar tal qual al missatge de l'usuari, i un `detall` curt si cal), o `sino`, sense respostes.
- `resum`, en acabar el pas 6: `pagines` (del quadern), `blocs`, `a_la_font`, `correccions`, `notetes` i `respostes`, amb una frase per pregunta que diga com l'has aplicada.
