"""Extrau el text dels PDF d'una font i en fa un índex de blocs, sense passar per Claude.

Ús: python extreu-font.py <carpeta amb els PDF>

Per a cada PDF escriu <nom>.txt al costat, amb el text pàgina a pàgina, i un
index.txt amb una línia per cada definició, teorema, lema... i la seua pàgina.
Les pàgines es marquen amb el número imprés i el del PDF: "p. 7 [pdf 8]".
El del PDF és el que cal per obrir eixa pàgina com a imatge.

Limitació: els subíndexs i superíndexs surten aplanats (σ^i(α_1) → "σ i(α1)"),
i alguns delimitadors grans surten com a lletres soltes (®, Ç, å). Per copiar
una fórmula al document final, cal mirar la pàgina com a imatge.
"""

import re
import sys
import unicodedata
from pathlib import Path

from pypdf import PdfReader

# LaTeX posa l'accent com un caràcter a banda: "Definici´ o" → "Definició".
ACCENTS = {"´": "́", "`": "̀", "¨": "̈"}
ACCENT_SOLT = re.compile(r"([´`¨]) ?([A-Za-zı])")

# Parèntesis grans (\big, \Big) que pypdf no sap traduir. La resta de caràcters
# de control (p. ex. els de \cancel) es lleven.
PARENTESIS = str.maketrans({"\x00": "(", "\x10": "(", "\x01": ")", "\x11": ")"})
CONTROL = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]")

# Línies que afegeix Wuolah a cada pàgina.
SOROLL = re.compile(r"^(Reservados todos los derechos|[0-9a-f]{40}-\d+\s*$)")
PORTADA = "Accede al documento original"

BLOC = re.compile(
    r"^(Definició|Teorema|Proposició|Lema|Corol·lari|Observació|Exemple"
    r"|\d+\.\d+ [A-ZÀ-Ú])"
)


def arregla_accents(text):
    def uneix(m):
        lletra = "i" if m.group(2) == "ı" else m.group(2)
        return lletra + ACCENTS[m.group(1)]

    text = CONTROL.sub("", text.translate(PARENTESIS))
    return unicodedata.normalize("NFC", ACCENT_SOLT.sub(uneix, text))


def extreu(pdf):
    """Torna una llista de (pàgina impresa, pàgina del PDF, línies)."""
    pagines = []
    for i, pagina in enumerate(PdfReader(pdf).pages, start=1):
        text = pagina.extract_text() or ""
        if PORTADA in text:
            continue
        linies = arregla_accents(text).splitlines()
        # El número imprés és la línia just abans del peu de Wuolah.
        impresa = None
        for j, linia in enumerate(linies):
            if linia.startswith("Reservados todos los derechos"):
                if j > 0 and linies[j - 1].strip().isdigit():
                    impresa = linies[j - 1].strip()
                    linies[j - 1] = ""
                break
        linies = [l for l in linies if l.strip() and not SOROLL.match(l)]
        pagines.append((impresa or "?", i, linies))
    return pagines


def main(carpeta):
    carpeta = Path(carpeta)
    index = []
    for pdf in sorted(carpeta.glob("*.pdf")):
        pagines = extreu(pdf)
        with open(pdf.with_suffix(".txt"), "w", encoding="utf-8") as f:
            for impresa, num_pdf, linies in pagines:
                f.write(f"=== p. {impresa} [pdf {num_pdf}] ===\n")
                f.write("\n".join(linies) + "\n\n")
        index.append(pdf.name)
        for impresa, num_pdf, linies in pagines:
            for linia in linies:
                # Les línies amb ". . ." són l'índex del PDF: ja les trobem al text.
                if BLOC.match(linia) and ". . ." not in linia:
                    index.append(f"  p. {impresa} [pdf {num_pdf}]  {linia.strip()[:70]}")
        print(f"{pdf.name}: {len(pagines)} pàgines")
    (carpeta / "index.txt").write_text("\n".join(index) + "\n", encoding="utf-8")
    print(f"index.txt: {len(index)} línies")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
