"""Ensenya només el tros de la font que cal, a partir del text que ja ha tret extreu-font.py.

Ús:
  python busca-font.py <carpeta de la font> --index <PDF> [<PDF>…]
  python busca-font.py <carpeta de la font> "Teorema 2.19" "Lema 2.17" …
  python busca-font.py <carpeta de la font> --pagina <PDF> <pàgina>

--index: les línies de l'índex només d'eixos PDF. N'hi ha prou amb un tros del nom
(«Tema-2»).

Amb referències («Teorema 2.19», «Def. 1.34», «secció 2.4»): per a cada una, el
passatge de la font des de la seua línia fins a la següent definició, teorema,
lema… o secció. Inclou la demostració, que va darrere sense títol propi, i la
pàgina, «p. 7 [pdf 8]». El tipus pot anar abreujat; si només hi ha el número,
val qualsevol bloc amb eixe número (no les seccions).

--pagina: el text d'una pàgina sencera, per als exemples i observacions de la
font, que no tenen número. La pàgina és la impresa; «pdf 8» és la del PDF.
"""

import re
import sys
import unicodedata
from pathlib import Path

# Les mateixes capçaleres que l'índex d'extreu-font.py.
BLOC = re.compile(r"^(Definició|Teorema|Proposició|Lema|Corol·lari|Observació|Exemple|\d+\.\d+ [A-ZÀ-Ú])")
PAGINA = re.compile(r"^=== p\. (\S+) \[pdf (\d+)\] ===$")
NUMERAT = re.compile(r"^([^\d\s]\S*?)\.?\s*(\d+\.\d+)")  # «Teorema 2.8(…», «Definició 2.11.(…»
SECCIO = re.compile(r"^(\d+\.\d+) [A-ZÀ-Ú]")  # «2.4 Permutacions conjugades»
REFERENCIA = re.compile(r"^(.*?)\s*(\d+\.\d+)\.?$")


def pla(text):
    """Sense accents ni majúscules, per comparar «Definicio» amb «Definició»."""
    return "".join(c for c in unicodedata.normalize("NFD", text.lower()) if unicodedata.category(c) != "Mn")


def textos(carpeta):
    """Per a cada PDF de la font amb text extret: el nom i les seues línies, amb les marques de pàgina."""
    return [(pdf.name, pdf.with_suffix(".txt").read_text(encoding="utf-8").splitlines())
            for pdf in sorted(carpeta.glob("*.pdf")) if pdf.with_suffix(".txt").exists()]


def tria(noms, que):
    triats = [nom for nom in noms if que in nom]
    if not triats:
        sys.exit(f"Cap PDF de la font no es diu «{que}». N'hi ha: {', '.join(noms)}")
    return triats


def index(carpeta, pdfs):
    noms = [nom for nom, _ in textos(carpeta)]
    volguts = {nom for que in pdfs for nom in tria(noms, que)}
    dins = False
    for linia in (carpeta / "index.txt").read_text(encoding="utf-8").splitlines():
        if linia and not linia.startswith(" "):  # la línia del nom del PDF
            dins = linia.strip() in volguts
        if dins:
            print(linia)


def passatges(carpeta, refs):
    llibres = textos(carpeta)
    falten = 0
    for ref in refs:
        m = REFERENCIA.match(ref.strip())
        if not m:
            print(f"«{ref}»: no entenc la referència; ha d'acabar en un número com 2.19.\n")
            falten += 1
            continue
        # Del tipus només compta l'última paraula: «T1 Def. 1.34» és una definició.
        tipus, numero = (pla(m.group(1)).split() or [""])[-1].rstrip("."), m.group(2)
        seccio = tipus.startswith("secc") or tipus == "§"
        trobats = []
        for nom, linies in llibres:
            pagina = "?"
            for i, linia in enumerate(linies):
                p = PAGINA.match(linia)
                if p:
                    pagina = f"p. {p.group(1)} [pdf {p.group(2)}]"
                    continue
                if not BLOC.match(linia) or ". . ." in linia:
                    continue
                if seccio:
                    s = SECCIO.match(linia)
                    if not s or s.group(1) != numero:
                        continue
                else:
                    n = NUMERAT.match(linia)
                    if not n or n.group(2) != numero:
                        continue
                    if tipus and not pla(n.group(1)).startswith(tipus[:3]):
                        continue
                trobats.append((nom, pagina, tros(linies, i)))
        if not trobats:
            print(f"«{ref}»: no és a la font.\n")
            falten += 1
        for nom, pagina, text in trobats:
            print(f"--- «{ref}» · {nom} · {pagina} ---")
            print(text + "\n")
    return falten


def tros(linies, inici):
    """De la línia de la capçalera fins a la següent capçalera, amb les marques de pàgina del mig."""
    final = len(linies)
    for j in range(inici + 1, len(linies)):
        if BLOC.match(linies[j]) and ". . ." not in linies[j]:
            final = j
            break
    # Si el tros acaba just en canviar de pàgina, la marca de la pàgina nova no hi pinta res.
    while final > inici + 1 and PAGINA.match(linies[final - 1]):
        final -= 1
    return "\n".join(l for l in linies[inici:final] if l.strip())


def pagina(carpeta, pdf, que):
    llibres = dict(textos(carpeta))
    nom = tria(list(llibres), pdf)
    if len(nom) > 1:
        sys.exit(f"«{pdf}» val per a més d'un PDF: {', '.join(nom)}")
    que = que.replace(" ", "").lower()
    dins, eixida = False, []
    for linia in llibres[nom[0]]:
        p = PAGINA.match(linia)
        if p:
            dins = que in (p.group(1), f"pdf{p.group(2)}")
            if dins:
                eixida.append(linia)
            continue
        if dins:
            eixida.append(linia)
    if not eixida:
        sys.exit(f"{nom[0]} no té la pàgina «{que}».")
    print("\n".join(eixida))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    if len(args) < 2:
        sys.exit(__doc__)
    carpeta = Path(args[0])
    if args[1] == "--index":
        index(carpeta, args[2:] or [""])
    elif args[1] == "--pagina":
        if len(args) != 4:
            sys.exit("Ús: python busca-font.py <carpeta de la font> --pagina <PDF> <pàgina>")
        pagina(carpeta, args[2], args[3])
    else:
        sys.exit(1 if passatges(carpeta, args[1:]) else 0)


if __name__ == "__main__":
    main()
