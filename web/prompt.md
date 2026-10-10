Passa a net la classe de `{carpeta}` seguint el flux de `CLAUDE.md`, del pas 0 al 6.

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

- Tot el que generes, dins de `{carpeta}`: `esquema.yaml`, `blocs/`, `tema.tex` i `tema.pdf`, `informe.md` i `millores.md`.
- La fitxa de cada font, a `fitxa.yaml`, dins de la carpeta de la font. Si ja existeix, reutilitza-la.
- El diccionari de notació, a `{carpeta_assig}/notacio.yaml`. Si ja existeix, consulta'l i amplia'l.
- El perfil de lletra, a `dades/perfil-lletra.md`. Si ja existeix, consulta'l en la lectura i amplia'l amb les respostes.
- La plantilla és `plantilla-base.tex`, a l'arrel del repositori: `tema.tex` la carrega amb `\input{{plantilla}}`. No la modifiques; si cal canviar-la, apunta-ho a `millores.md`.
- Per compilar: `python compila.py {carpeta}`. `tema.tex` ha de ser l'únic `.tex` de l'arrel de la classe.
- Fora de `dades/` no pots escriure: el repositori està muntat només de lectura.

Normes de la web:

- En començar cada pas, escriu una línia sola: `PAS n · nom del pas`.
- No tens l'eina de preguntes. Al punt de control (pas 4), escriu l'esquema de blocs, amb on has trobat cada bloc a la font, i les preguntes obligatòries numerades (P1, P2…), i acaba el torn. L'usuari et respondrà en un missatge nou. Si has de preguntar qualsevol altra cosa, fes igual.
- Acaba cada torn amb una línia sola: `ESTAT: esperant` si esperes una resposta, o `ESTAT: acabat` si ja has fet el PDF i l'informe.
