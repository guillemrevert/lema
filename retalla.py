"""Retalla una zona d'una foto dels apunts per mirar-la de prop, sense compilar res.

Ús: python retalla.py <foto> <esquerra> <dalt> <dreta> <baix> [--gira 90|180|270]

Els quatre números són proporcions de la foto, de 0 a 1, com la «zona» de
punt-control.json: on comença i on acaba la zona, d'esquerra a dreta i de dalt a
baix. Per exemple, «0 0.30 1 0.45» és tota l'amplada, de la ratlla del 30 % a la
del 45 % de l'altura. Amb --gira, la foto es gira primer, en el sentit de les
agulles del rellotge, i les proporcions són de la foto ja girada.

Guarda el retall a /tmp/retalls/ i escriu on és, la mida i, aproximadament, quants
tokens costa llegir-lo (amplada × altura / 750). El retall s'amplia o es redueix
fins a 1.568 píxels pel costat llarg, la mida que Claude veu sense reduir-la, i com
a molt al triple de la mida original: més enllà només es veu més borrós.
"""

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageOps

COSTAT = 1568
AMPLIACIO_MAX = 3
DESTI = Path("/tmp/retalls")
GIRS = {90: Image.Transpose.ROTATE_270, 180: Image.Transpose.ROTATE_180, 270: Image.Transpose.ROTATE_90}


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    # L'ajuda porta «%»: argparse el llegiria com a format en «usage», però no en «description».
    p = argparse.ArgumentParser(usage="python retalla.py <foto> <esquerra> <dalt> <dreta> <baix> [--gira 90|180|270]",
                                description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("foto", type=Path)
    for nom in ("esquerra", "dalt", "dreta", "baix"):
        p.add_argument(nom, type=float)
    p.add_argument("--gira", type=int, choices=sorted(GIRS), default=None)
    a = p.parse_args()

    if not (0 <= a.esquerra < a.dreta <= 1 and 0 <= a.dalt < a.baix <= 1):
        sys.exit("Les proporcions han d'anar de 0 a 1 (com la «zona» de punt-control.json), "
                 "amb esquerra < dreta i dalt < baix.")

    foto = Image.open(a.foto)
    # Les fotos de mòbil poden dur la rotació a banda (EXIF): es gira com la veu qualsevol visor.
    girada_exif = foto.getexif().get(0x0112, 1) not in (1, None)
    foto = ImageOps.exif_transpose(foto)
    if a.gira:
        foto = foto.transpose(GIRS[a.gira])
    w, h = foto.size
    caixa = (round(w * a.esquerra), round(h * a.dalt), round(w * a.dreta), round(h * a.baix))
    retall = foto.crop(caixa).convert("RGB")

    escala = min(COSTAT / max(retall.size), AMPLIACIO_MAX)
    if escala != 1:
        retall = retall.resize((max(1, round(retall.width * escala)), max(1, round(retall.height * escala))),
                               Image.Resampling.LANCZOS)

    DESTI.mkdir(parents=True, exist_ok=True)
    nom = f"{a.foto.stem}-{a.esquerra:g}-{a.dalt:g}-{a.dreta:g}-{a.baix:g}" + (f"-g{a.gira}" if a.gira else "")
    sortida = DESTI / f"{nom.replace(' ', '_')}.jpg"
    retall.save(sortida, quality=90)

    print(f"{sortida} · {retall.width}×{retall.height} px (de {caixa[2] - caixa[0]}×{caixa[3] - caixa[1]} px de la foto, "
          f"{escala:.1f}×) · uns {round(retall.width * retall.height / 750)} tokens")
    if girada_exif:
        print("La foto tenia la rotació a banda (EXIF): les proporcions són de la foto tal com es veu.")


if __name__ == "__main__":
    main()
