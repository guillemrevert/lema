"""Compila el tema i només diu si ha anat bé, sense passar per Claude el soroll de LaTeX.

Ús: python compila.py <carpeta del tema>

Executa pdflatex dues vegades (la segona, per a les referències) i torna una
línia: "OK, N pàgines", o l'error amb el fitxer i la línia. També avisa de les
referències sense definir i del text que ix del marge.
"""

import re
import subprocess
import sys
from pathlib import Path

ORDRE = ["pdflatex", "-interaction=nonstopmode", "-halt-on-error", "-file-line-error"]
ESPERA = 120  # segons; si MiKTeX demana instal·lar un paquet, es queda esperant

# Amb -file-line-error, els errors comencen per "fitxer.tex:línia: missatge".
ERROR = re.compile(r"^(.+?\.tex):(\d+): (.+)$")
PAGINES = re.compile(r"Output written on .+? \((\d+) pages?")
REFERENCIA = re.compile(r"LaTeX Warning: (Reference|Citation) `(.+?)' .*undefined")


def compila(tex):
    try:
        subprocess.run(
            ORDRE + [tex.name], cwd=tex.parent, capture_output=True, timeout=ESPERA
        )
    except subprocess.TimeoutExpired:
        sys.exit(
            f"pdflatex no ha acabat en {ESPERA} s. "
            "Potser MiKTeX demana instal·lar un paquet: compila a mà per vore-ho."
        )
    return tex.with_suffix(".log").read_text(encoding="utf-8", errors="replace")


def main(carpeta):
    carpeta = Path(carpeta)
    texs = list(carpeta.glob("*.tex"))
    if len(texs) != 1:
        sys.exit(f"Esperava un sol .tex a {carpeta} i n'hi ha {len(texs)}.")
    tex = texs[0]

    for _ in range(2):
        log = compila(tex)
        linies = log.splitlines()
        for i, linia in enumerate(linies):
            m = ERROR.match(linia)
            if m:
                fitxer, num, missatge = m.groups()
                # La línia "l.NN ..." mostra on s'ha parat LaTeX.
                context = next((l for l in linies[i + 1 : i + 8] if l.startswith("l.")), "")
                print(f"Error a {fitxer}, línia {num}: {missatge}")
                if context:
                    print(f"  {context}")
                sys.exit(1)

    m = PAGINES.search(log)
    if not m:
        sys.exit("No s'ha generat el PDF i el .log no diu per què.")
    n = int(m.group(1))
    print(f"OK, {n} {'pàgina' if n == 1 else 'pàgines'}: {tex.with_suffix('.pdf')}")

    referencies = sorted({r for _, r in REFERENCIA.findall(log)})
    if referencies:
        print(f"Referències sense definir: {', '.join(referencies)}")
    fora_marge = log.count("Overfull \\hbox")
    if fora_marge == 1:
        print("1 línia ix del marge (Overfull \\hbox): mira el .log.")
    elif fora_marge:
        print(f"{fora_marge} línies ixen del marge (Overfull \\hbox): mira el .log.")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
