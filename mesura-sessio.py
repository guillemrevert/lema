"""Mesura quant ha gastat Claude en una sessió, a partir del seu registre.

Ús: python mesura-sessio.py <carpeta de la sessió> [<carpeta>…]

Llig registre/claude-*.jsonl (una crida a Claude per fitxer) i, per a cada crida i
per al total, escriu: quantes accions ha fet Claude, quantes abans de mirar la
primera foto dels apunts, amb quants tokens ha començat, quants n'han entrat a la
conversa, quants s'han tornat a llegir i quants n'ha escrit, i el cost a preu de
l'API, separat en eixes tres parts.

Quan una conversa continua (després del punt de control), Claude Code dona el
cost acumulat des del principi: el de cada crida es trau restant l'anterior.
"""

import json
import re
import sys
from pathlib import Path

# Preus per milió de tokens, deduïts dels registres de Claude Opus 5.5 (13/10/2026).
# Els d'entrada sense memòria cau i de memòria cau de 5 minuts són suposats: quasi no n'hi ha.
PREU = {"entrada": 4.0, "cau_1h": 8.0, "cau_5m": 5.0, "relectura": 0.20, "escrit": 20.0}
FOTO = re.compile(r"/apunts/.+\.(jpe?g|png|webp|pdf)$", re.IGNORECASE)


def llig_crida(fitxer):
    """Les xifres d'una crida a Claude (un fitxer del registre)."""
    conversa, final, ids, accions, abans_foto = None, None, [], 0, None
    primer_context = 0
    for linia in open(fitxer, encoding="utf-8"):
        try:
            ev = json.loads(linia)
        except json.JSONDecodeError:
            continue
        if ev.get("type") == "system" and ev.get("subtype") == "init":
            conversa = ev.get("session_id")
        elif ev.get("type") == "assistant":
            missatge = ev["message"]
            if missatge.get("id") not in ids:
                if not ids:
                    us = missatge.get("usage", {})
                    primer_context = sum(us.get(k) or 0 for k in (
                        "input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens"))
                ids.append(missatge.get("id"))
            for c in missatge.get("content", []):
                if c.get("type") != "tool_use":
                    continue
                ruta = str(c.get("input", {}).get("file_path", ""))
                if abans_foto is None and c["name"] == "Read" and FOTO.search(ruta):
                    abans_foto = accions
                accions += 1
        elif ev.get("type") == "result":
            final = ev
    us = (final or {}).get("usage", {})
    cau = us.get("cache_creation", {})
    return {
        "fitxer": fitxer.name, "conversa": conversa, "acabada": final is not None,
        "accions": accions, "abans_foto": abans_foto, "context": primer_context,
        "entrada": us.get("input_tokens") or 0,
        "cau_1h": cau.get("ephemeral_1h_input_tokens", us.get("cache_creation_input_tokens") or 0),
        "cau_5m": cau.get("ephemeral_5m_input_tokens") or 0,
        "relectura": us.get("cache_read_input_tokens") or 0,
        "escrit": us.get("output_tokens") or 0,
        "raonament": (us.get("output_tokens_details") or {}).get("thinking_tokens") or 0,
        "acumulat": (final or {}).get("total_cost_usd"),
    }


def cost(c, part):
    claus = {"entra": ("entrada", "cau_1h", "cau_5m"), "relectura": ("relectura",), "escrit": ("escrit",)}[part]
    return sum(c[k] * PREU[k] for k in claus) / 1e6


def n(x):
    return f"{x:,}".replace(",", ".")


def diners(x):
    return "—" if x is None else f"{x:.2f} $".replace(".", ",")


def mesura(carpeta):
    carpeta = Path(carpeta)
    crides = [llig_crida(f) for f in sorted((carpeta / "registre").glob("claude-*.jsonl"))]
    if not crides:
        print(f"{carpeta.name}: no hi ha cap crida a Claude al registre.\n")
        return
    anterior = None
    for c in crides:
        # El cost de la crida: l'acumulat menys el de la crida anterior de la mateixa conversa.
        if c["acumulat"] is not None and anterior and anterior["conversa"] == c["conversa"] and anterior["acumulat"] is not None:
            c["cost"] = c["acumulat"] - anterior["acumulat"]
        else:
            c["cost"] = c["acumulat"]
        anterior = c

    total = {k: sum(c[k] for c in crides) for k in ("accions", "entrada", "cau_1h", "cau_5m", "relectura", "escrit", "raonament")}
    total["cost"] = None if any(c["cost"] is None for c in crides) else sum(c["cost"] for c in crides)
    columnes = [f"crida {i}" for i in range(1, len(crides) + 1)] + ["total"]
    files = [
        ("accions", [n(c["accions"]) for c in crides] + [n(total["accions"])]),
        ("abans de la 1a foto", ["—" if c["abans_foto"] is None else n(c["abans_foto"]) for c in crides] + [""]),
        ("context en començar", [n(c["context"]) for c in crides] + [""]),
        ("entra a la conversa", [n(c["entrada"] + c["cau_1h"] + c["cau_5m"]) for c in crides]
         + [n(total["entrada"] + total["cau_1h"] + total["cau_5m"])]),
        ("es torna a llegir", [n(c["relectura"]) for c in crides] + [n(total["relectura"])]),
        ("escrit", [n(c["escrit"]) for c in crides] + [n(total["escrit"])]),
        ("  del qual, raonament", [n(c["raonament"]) for c in crides] + [n(total["raonament"])]),
        ("cost", [diners(c["cost"]) for c in crides] + [diners(total["cost"])]),
        ("  entra", [diners(cost(c, "entra")) for c in crides] + [diners(cost(total, "entra"))]),
        ("  es torna a llegir", [diners(cost(c, "relectura")) for c in crides] + [diners(cost(total, "relectura"))]),
        ("  escrit", [diners(cost(c, "escrit")) for c in crides] + [diners(cost(total, "escrit"))]),
    ]
    print(f"Sessió {carpeta.name} ({len(crides)} {'crida' if len(crides) == 1 else 'crides'} a Claude)")
    ample = max(12, *(len(v) for _, valors in files for v in valors)) + 2
    print(" " * 24 + "".join(col.rjust(ample) for col in columnes))
    for nom, valors in files:
        print(f"  {nom:<22}" + "".join(v.rjust(ample) for v in valors))
    for c in crides:
        if not c["acabada"]:
            print(f"  Avís: {c['fitxer']} no va acabar; no té el resum final i les seues xifres falten.")
    # Si els preus de dalt ja no quadren (un altre model), el repartiment no és fiable.
    if total["cost"]:
        calculat = sum(cost(total, p) for p in ("entra", "relectura", "escrit"))
        if abs(calculat - total["cost"]) > 0.05 * total["cost"]:
            print(f"  Avís: el repartiment suma {diners(calculat)} i el cost real és {diners(total['cost'])}: "
                  "els preus de mesura-sessio.py ja no són els del model.")
    print()


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for carpeta in sys.argv[1:]:
        mesura(carpeta)
