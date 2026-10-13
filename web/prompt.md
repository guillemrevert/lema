Passa a net la sessió de `{carpeta}` seguint el flux de `CLAUDE.md`, del pas 0 al 6.

Treballes des de la web local (`web-local.md`), així que els materials no són a `prova-1/` sinó ací:

- **Assignatura:** {assignatura}. Carpeta: `{carpeta_assig}`.
- **Apunts**, en este ordre:
{apunts}
- **Fonts:**
{fonts}

  Què és i d'on surt cada una, al `font.json` de la seua carpeta. El text de cada PDF ja està extret en un `.txt` al costat, i `index.txt` té una línia per cada definició, teorema, lema… amb la pàgina. Mira primer l'índex, després el text de les pàgines que calguen, i la pàgina com a imatge només si has de copiar una fórmula: al text, els subíndexs i superíndexs ixen aplanats.

  Si hi ha més d'una font, busca cada bloc a totes. Si és a més d'una i no coincideixen, segueix la decisió 7 de `CLAUDE.md`.
- **Nota de l'usuari:** {nota}

On va cada cosa:

{document}
- La fitxa de cada font, a `fitxa.yaml`, dins de la carpeta de la font. Si ja existeix, reutilitza-la: l'usuari la pot haver editada des de la web. Si no quadra amb el `font.json` (què és, d'on surt o la llista de PDF), mana el `font.json`: corregeix la fitxa.
- El diccionari de notació, a `{carpeta_assig}/notacio.yaml`. Si ja existeix, consulta'l i amplia'l.
- El perfil de lletra, a `dades/perfil-lletra.md`. Si ja existeix, consulta'l en la lectura i amplia'l amb les respostes.
- La plantilla és `plantilla-base.tex`, a l'arrel del repositori: `quadern.tex` la carrega amb `\input{{plantilla}}`. No la modifiques; si cal canviar-la, apunta-ho a `millores.md`.
- Fora de `dades/` no pots escriure: el repositori està muntat només de lectura.

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
