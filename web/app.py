"""Web local de LEMA.

Crea sessions, hi guarda els fitxers i llança Claude Code («Passa a net») en una
conversa nova per a cada sessió. Les correccions del document d'un quadern van en una
conversa pròpia del quadern. El que fa Claude es resumeix, línia a línia, a
registre/events.jsonl de la sessió o del quadern, i la web ho llig en directe.

Dades (fora de git):
  dades/perfil-lletra.md
  dades/assignatures/<assignatura>/
    notacio.yaml
    fonts/<font>/           font.json, els PDF, el text extret i index.txt
    quaderns/<quadern>/     quadern.json (amb la conversa de les correccions), quadern.tex, quadern.pdf,
                            blocs/<sessió>/ de cada sessió (blocs/inicial/: el document d'abans de la web),
                            edicions.json si l'usuari edita el LaTeX des de la web, i adjunts/ i registre/
                            de les correccions
    sessions/<AAAA-MM-DD>/  sessio.json, apunts/, adjunts/, registre/ i el que escriu Claude

Fins al 10/10/2026, els quaderns es deien temes (temes/, tema.json) i les sessions,
classes (classes/, classe.json): migra_dades() ho canvia una vegada, en arrancar.
"""

import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
import textwrap
import unicodedata
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path, PurePosixPath

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel
from pypdf import PdfReader

ARREL = Path(__file__).resolve().parent.parent
DADES = ARREL / "dades"
ASSIGNATURES = {
    "analisi-2": "Anàlisi II",
    "estructures-algebraiques": "Estructures Algebraiques",
}
APUNTS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
# Fitxers de LaTeX que no cal ensenyar a la llista de resultats.
SOROLL = {".aux", ".log", ".out", ".toc", ".gz"}
# Línies que Claude escriu per a la web (vegeu prompt.md).
MARCA_PAS = re.compile(r"^\W*PAS\s+(\d)\b", re.M)
MARCA_ESTAT = re.compile(r"^\W*ESTAT:\s*(esperant|acabat)", re.M | re.I)

app = FastAPI()
processos = {}  # (assignatura, sessió), o clau_quadern() per a les correccions -> procés de Claude en marxa
aturats = set()  # claus de processos que l'usuari ha aturat
tasques = set()  # perquè asyncio no perda les tasques en segon pla
# dades/ és a Windows: cada accés al disc tarda 15–35 ms, però se'n poden fer molts alhora (guia X).
lectors = ThreadPoolExecutor(16)


# ---------- Utilitats ----------

def ara():
    return datetime.now().astimezone().isoformat(timespec="seconds")


def slug(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def nom_lliure(carpeta, nom):
    """Un nom de fitxer segur que encara no existeix a la carpeta."""
    nom = re.sub(r"[^\w.\-() ]", "_", Path(nom or "fitxer").name).strip() or "fitxer"
    ruta, n = carpeta / nom, 2
    while ruta.exists():
        ruta = carpeta / f"{Path(nom).stem} ({n}){Path(nom).suffix}"
        n += 1
    return ruta.name


def dins(base, ruta):
    """La ruta dins de base; 404 si no existeix o si n'ix.

    Sense resolve(): a la carpeta muntada des de Windows cada accés al disc és lent.
    """
    parts = PurePosixPath(ruta).parts
    if not parts or parts[0] == "/" or ".." in parts or "\\" in ruta:
        raise HTTPException(404, "No existeix")
    final = base.joinpath(*parts)
    if not final.exists():
        raise HTTPException(404, "No existeix")
    return final


def llig(ruta):
    return json.loads(ruta.read_text(encoding="utf-8"))


def subcarpetes(carpeta):
    """Els noms de dins de la carpeta, ordenats, o [] si no existeix. Un sol accés al disc."""
    try:
        return sorted(os.listdir(carpeta))
    except FileNotFoundError:
        return []


def alhora(funcio, elements):
    """Comença funcio(element) per a cada element, tots alhora (guia X). resultats() els espera."""
    return [lectors.submit(funcio, e) for e in elements]


def resultats(futurs):
    """Els resultats d'alhora(), en ordre, sense els elements que no tenen fitxa (una carpeta sense
    sessio.json, font.json o quadern.json)."""
    res = []
    for futur in futurs:
        try:
            res.append(futur.result())
        except (FileNotFoundError, NotADirectoryError):
            pass
    return res


def escriu(ruta, dades):
    ruta.write_text(json.dumps(dades, ensure_ascii=False, indent=2), encoding="utf-8")


def actualitza(ruta, **canvis):
    """Canvia unes claus d'una fitxa (sessio.json o quadern.json) i la torna."""
    dades = llig(ruta)
    dades.update(canvis)
    escriu(ruta, dades)
    return dades


def carpeta_assig(a):
    if a not in ASSIGNATURES:
        raise HTTPException(404, "Assignatura desconeguda")
    return DADES / "assignatures" / a


def carpeta_sessio(a, s):
    return dins(carpeta_assig(a) / "sessions", s)


def carpeta_quadern(a, q):
    return dins(carpeta_assig(a) / "quaderns", q)


def migra_sessio(dades):
    """Les fitxes d'abans: fins al 07/10/2026, una sola font (`font` i `tema_font`); fins al 10/10/2026,
    `tema`, `fusiona` i `sessio` (la conversa de Claude) en lloc de `quadern` i `conversa`."""
    if "font" in dades:
        font, tema = dades.pop("font"), dades.pop("tema_font", None)
        dades["fonts"] = [{"id": font, "temes": [tema] if tema else []}] if font else []
    if "tema" in dades:
        dades["quadern"] = dades.pop("tema")
    if "sessio" in dades:
        dades["conversa"] = dades.pop("sessio")
    dades.pop("fusiona", None)
    dades.setdefault("quadern", None)
    dades.setdefault("conversa", None)
    return dades


def migra_dades():
    """Una sola vegada (10/10/2026, guia Q): els temes passen a quaderns i les classes, a sessions.

    Abans de canviar res, copia dades/assignatures/ a dades/copia-<data>/. Si ja està fet, no fa res."""
    base = DADES / "assignatures"
    if not any(base.glob("*/temes")) and not any(base.glob("*/classes")):
        return
    copia = DADES / f"copia-{datetime.now():%Y%m%d-%H%M%S}"
    shutil.copytree(base, copia / "assignatures")
    for assig in sorted(p for p in base.iterdir() if p.is_dir()):
        if (assig / "temes").is_dir():
            (assig / "temes").rename(assig / "quaderns")
            for quadern in (assig / "quaderns").iterdir():
                for vell, nou in (("tema.json", "quadern.json"), ("tema.tex", "quadern.tex"), ("tema.pdf", "quadern.pdf")):
                    if (quadern / vell).exists():
                        (quadern / vell).rename(quadern / nou)
                for ext in ("aux", "log", "out", "toc"):  # es tornen a fer en compilar
                    (quadern / f"tema.{ext}").unlink(missing_ok=True)
        if (assig / "classes").is_dir():
            (assig / "classes").rename(assig / "sessions")
            for sessio in (assig / "sessions").iterdir():
                if (sessio / "classe.json").exists():
                    escriu(sessio / "sessio.json", migra_sessio(llig(sessio / "classe.json")))
                    (sessio / "classe.json").unlink()
    print(f"LEMA: temes i classes passen a quaderns i sessions. Còpia d'abans a {copia}", flush=True)


def fitxa_sessio(a, carpeta):
    dades = migra_sessio(llig(carpeta / "sessio.json"))
    if dades["estat"] == "en_marxa" and (a, carpeta.name) not in processos:
        dades["estat"] = "aturada"  # el servidor s'ha reiniciat a mitges
    return dades


def llig_sessio(a, s):
    return fitxa_sessio(a, carpeta_sessio(a, s))


def totes_les_sessions(a):
    """[(carpeta, dades de sessio.json)] de les sessions de l'assignatura, per ordre de carpeta, llegides alhora."""
    base = carpeta_assig(a) / "sessions"
    return resultats(alhora(lambda s: (s, fitxa_sessio(a, base / s)), subcarpetes(base)))


def desa_sessio(a, s, **canvis):
    ruta = carpeta_sessio(a, s) / "sessio.json"
    dades = migra_sessio(llig(ruta))
    dades.update(canvis)
    escriu(ruta, dades)
    return dades


def info_font(carpeta):
    """El que diu font.json; les pàgines i l'índex es calculen una vegada i s'hi guarden."""
    dades = llig(carpeta / "font.json")
    if "pdfs" not in dades:
        dades.update(compta_font(carpeta))
        escriu(carpeta / "font.json", dades)
    return {"id": carpeta.name, **dades}


def compta_font(carpeta):
    pdfs = []
    for pdf in sorted(carpeta.glob("*.pdf")):
        txt = pdf.with_suffix(".txt")
        text = txt.read_text(encoding="utf-8") if txt.exists() else ""
        pagines = text.count("=== p.")
        # Un escaneig no té text: el PDF s'haurà de llegir com a imatge.
        pdfs.append({"nom": pdf.name, "pagines": pagines,
                     "amb_text": pagines > 0 and len(text) / pagines > 200})
    index = carpeta / "index.txt"
    entrades = 0
    if index.exists():
        entrades = sum(l.startswith("  p.") for l in index.read_text(encoding="utf-8").splitlines())
    return {"pdfs": pdfs, "entrades": entrades}


def ordre_natural(text):
    """Per ordenar «Tema 2» abans que «Tema 10»."""
    return [int(p) if p.isdigit() else p for p in re.split(r"(\d+)", text.lower())]


pagines_vistes = {}  # ruta d'un PDF -> (data de modificació, pàgines)


def pagines_pdf(pdf, modificat):
    if pagines_vistes.get(pdf, (None,))[0] != modificat:
        try:
            pagines_vistes[pdf] = (modificat, len(PdfReader(pdf).pages))
        except Exception:  # p. ex. a mig escriure mentre Claude compila
            return None
    return pagines_vistes[pdf][1]


def info_quadern(carpeta):
    """El que diu quadern.json i, si el quadern ja s'ha compilat, les pàgines i la data del PDF."""
    dades = llig(carpeta / "quadern.json")
    info = {"id": carpeta.name, "nom": dades["nom"], "creat": dades.get("creat"), "pdf": None}
    pdf = carpeta / "quadern.pdf"
    try:
        st = pdf.stat()  # un sol accés al disc, en lloc de exists() i stat()
    except FileNotFoundError:
        return info
    info["pdf"] = {"pagines": pagines_pdf(pdf, st.st_mtime_ns),
                   "data": datetime.fromtimestamp(st.st_mtime).astimezone().isoformat(timespec="seconds")}
    return info


def document_de(a, dades):
    """El document de la sessió, que és sempre el del seu quadern (decisió 9): la carpeta del quadern,
    el PDF (ruta relativa a l'assignatura) i la carpeta dels blocs de la sessió. None si encara no hi ha PDF."""
    if not dades.get("quadern"):
        return None
    quadern = carpeta_assig(a) / "quaderns" / dades["quadern"]
    if not (quadern / "quadern.pdf").exists():
        return None
    return {"carpeta": quadern, "pdf": f"quaderns/{quadern.name}/quadern.pdf", "blocs": quadern / "blocs" / dades["id"]}


compilant = set()  # carpetes de documents que la web està compilant


async def compila_document(carpeta, pdf):
    """Compila el document de la carpeta amb compila.py. Si falla, torna a posar el PDF d'abans.

    Torna si ha anat bé i el que diu compila.py, sense la ruta del PDF."""
    abans = pdf.read_bytes() if pdf.exists() else None
    proc = await asyncio.to_thread(
        subprocess.run, [sys.executable, str(ARREL / "compila.py"), str(carpeta)],
        capture_output=True, text=True, encoding="utf-8")
    if proc.returncode and abans is not None:
        pdf.write_bytes(abans)
    return not proc.returncode, re.sub(r"(pàgin(?:a|es)): \S+\.pdf", r"\1", (proc.stdout + proc.stderr).strip())


def edicions(carpeta):
    """Els blocs del quadern que l'usuari ha editat a mà des de la web ({fitxer: data}), apuntats a
    edicions.json del quadern. Els quaderns on no s'ha editat res no en tenen."""
    ruta = carpeta / "edicions.json"
    return llig(ruta)["blocs"] if ruta.exists() else {}


def desa_edicions(carpeta, blocs):
    ruta = carpeta / "edicions.json"
    if blocs:
        escriu(ruta, {"blocs": dict(sorted(blocs.items(), key=lambda e: ordre_natural(e[0])))})
    else:
        ruta.unlink(missing_ok=True)


def editats_de_sessio(a, dades):
    """Els blocs d'esta sessió (blocs/<sessió>/ del seu quadern) que l'usuari ha editat a mà."""
    if not dades.get("quadern"):
        return []
    prefix = f"quaderns/{dades['quadern']}/blocs/{dades['id']}/"
    return [f for f in edicions(carpeta_assig(a) / "quaderns" / dades["quadern"]) if f.startswith(prefix)]


def nota_edicions(a, q):
    """El que la web afegeix als missatges per a Claude si l'usuari ha editat blocs del quadern a mà (decisió 2)."""
    blocs = edicions(carpeta_assig(a) / "quaderns" / q) if q else {}
    if not blocs:
        return ""
    rutes = ", ".join(f"`dades/assignatures/{a}/{f}`" for f in blocs)
    return (f"\n\nHe editat a mà estos blocs des de la web: {rutes}. No desfaces els meus canvis; "
            "si creus que n'hi ha algun d'erroni, digues-m'ho amb una noteta.")


def afegeix_event(carpeta, **event):
    (carpeta / "registre").mkdir(exist_ok=True)
    event["ts"] = ara()
    with open(carpeta / "registre" / "events.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")


def nombre_events(carpeta):
    ruta = carpeta / "registre" / "events.jsonl"
    return ruta.read_text(encoding="utf-8").count("\n") if ruta.exists() else 0


def text_net(text):
    """El text d'un missatge de Claude sense les línies «PAS n · …» i «ESTAT: …», que són per a la web."""
    return re.sub(r"^\W*ESTAT:.*$", "", re.sub(r"^\W*PAS\s+\d\b.*$", "", text, flags=re.M), flags=re.M | re.I).strip()


def resum_registre(carpeta):
    """El registre de Claude de la sessió, en una sola lectura (cada accés al disc costa, guia X): quantes línies
    té, com i quan va començar l'últim torn («inici», en passar a net, o «usuari», amb un missatge teu), l'últim
    text o error de Claude en eixe torn i quant va durar. «Progrés» ho ensenya sense esperar el registre (guia B)."""
    try:
        linies = (carpeta / "registre" / "events.jsonl").read_text(encoding="utf-8").split("\n")[:-1]
    except FileNotFoundError:
        return {"events": 0, "torn": None, "ultim_missatge": None, "ultim_error": None, "durada_torn": None}
    torn = missatge = error = durada = None
    for linia in linies:
        try:
            ev = json.loads(linia)
        except ValueError:
            continue
        if ev.get("t") in ("inici", "usuari"):
            torn, missatge, error, durada = {"tipus": ev["t"], "ts": ev.get("ts")}, None, None, None
        elif ev.get("t") == "text" and text_net(ev.get("text", "")):
            missatge = ev["text"]
        elif ev.get("t") == "error":
            error = ev.get("text")
        elif ev.get("t") == "fi":
            durada = ev.get("durada")
    return {"events": len(linies), "torn": torn, "ultim_missatge": missatge, "ultim_error": error,
            "durada_torn": durada}


def punt_control(carpeta, torn):
    """punt-control.json de la sessió (guia B, fase 2): el que Claude hi ha escrit, quan, i si és d'este torn
    (escrit després que començara l'últim torn). La pàgina ensenya les preguntes només si és d'este torn; el
    resum del final, sempre. Obri el fitxer i en mira la data amb el fitxer obert: un sol accés al disc."""
    try:
        with open(carpeta / "punt-control.json", encoding="utf-8") as f:
            modificat = os.fstat(f.fileno()).st_mtime
            dades = json.load(f)
    except (FileNotFoundError, ValueError):  # no n'hi ha, o no és JSON: la pàgina fa com abans
        return {"punt_control": None, "punt_control_data": None, "punt_control_vigent": False}
    try:
        vigent = modificat >= datetime.fromisoformat(torn["ts"]).timestamp()
    except (TypeError, KeyError, ValueError):
        vigent = False
    return {"punt_control": dades, "punt_control_data": modificat, "punt_control_vigent": vigent}


# ---------- Assignatures, fonts i quaderns ----------

@app.get("/api/assignatures")
def assignatures():
    """La pàgina la demana cada vegada que et mous per la web. Primer les carpetes de totes les assignatures i
    després totes les fitxes, cada tanda alhora: una darrere l'altra tardaven de 0,5 a 3 s (guia X)."""
    carpetes = {(a, tipus): carpeta_assig(a) / tipus for a in ASSIGNATURES for tipus in ("sessions", "fonts", "quaderns")}
    noms = dict(zip(carpetes, lectors.map(subcarpetes, carpetes.values())))
    fitxes = {}
    for (a, tipus), carpeta in carpetes.items():
        llegeix = {"sessions": lambda c, a=a: fitxa_sessio(a, c), "fonts": info_font, "quaderns": info_quadern}[tipus]
        fitxes[a, tipus] = alhora(llegeix, [carpeta / n for n in noms[a, tipus]])
    resultat = []
    for a, nom in ASSIGNATURES.items():
        # fonts: la pestanya «Fonts» diu en quantes sessions s'ha triat cada una (guia W).
        sessions = [{k: d.get(k) for k in ("id", "data", "titol", "estat", "pas", "quadern", "fonts")}
                    for d in reversed(resultats(fitxes[a, "sessions"]))]
        quaderns = sorted(resultats(fitxes[a, "quaderns"]), key=lambda q: ordre_natural(q["nom"]))
        resultat.append({"id": a, "nom": nom, "sessions": sessions, "fonts": resultats(fitxes[a, "fonts"]),
                         "quaderns": quaderns})
    return resultat


class NouQuadern(BaseModel):
    nom: str


@app.post("/api/assignatures/{a}/quaderns")
def crea_quadern(a: str, nou: NouQuadern):
    nom = nou.nom.strip()
    id_quadern = slug(nom)
    if not id_quadern:
        raise HTTPException(400, "El quadern necessita un nom")
    carpeta = carpeta_assig(a) / "quaderns" / id_quadern
    if carpeta.exists():
        raise HTTPException(409, f"Ja hi ha un quadern que es diu «{nom}»")
    carpeta.mkdir(parents=True)
    escriu(carpeta / "quadern.json", {"nom": nom, "creat": ara()})
    return info_quadern(carpeta)


@app.put("/api/assignatures/{a}/quaderns/{q}")
def reanomena_quadern(a: str, q: str, canvi: NouQuadern):
    """Només canvia el nom: la carpeta es queda igual perquè no es trenque cap ruta."""
    carpeta = carpeta_quadern(a, q)
    nom = canvi.nom.strip()
    if not nom:
        raise HTTPException(400, "El quadern necessita un nom")
    dades = llig(carpeta / "quadern.json")
    dades["nom"] = nom
    escriu(carpeta / "quadern.json", dades)
    return info_quadern(carpeta)


@app.post("/api/assignatures/{a}/fonts")
async def puja_font(a: str, nom: str = Form(...), que_es: str = Form(...),
                    origen: str = Form(""), fitxers: list[UploadFile] = File(...)):
    id_font = slug(nom)
    if not id_font:
        raise HTTPException(400, "La font necessita un nom")
    if id_font == "nova":  # #/assignatura/<a>/fonts/nova és el formulari per pujar-ne una
        raise HTTPException(400, "Este nom no es pot fer servir: tria'n un altre")
    carpeta = carpeta_assig(a) / "fonts" / id_font
    if carpeta.exists():
        raise HTTPException(409, f"Ja hi ha una font que es diu «{nom}»")
    if not fitxers or any(Path(f.filename or "").suffix.lower() != ".pdf" for f in fitxers):
        raise HTTPException(400, "La font han de ser fitxers PDF")
    carpeta.mkdir(parents=True)
    for f in fitxers:
        (carpeta / nom_lliure(carpeta, f.filename)).write_bytes(await f.read())
    escriu(carpeta / "font.json", {"nom": nom.strip(), "que_es": que_es.strip(), "origen": origen.strip()})
    return await extreu_text(carpeta)


async def extreu_text(carpeta):
    """Text i índex de cada PDF, sense passar per Claude (mesures 2 i 5 d'optimitzacio.md), i els PDF i les
    pàgines tornats a comptar a font.json."""
    proc = await asyncio.to_thread(
        subprocess.run, [sys.executable, str(ARREL / "extreu-font.py"), str(carpeta)],
        capture_output=True, text=True, encoding="utf-8")
    if proc.returncode:
        raise HTTPException(500, f"No s'ha pogut extraure el text: {proc.stderr[-400:]}")
    dades = llig(carpeta / "font.json")
    dades.update(compta_font(carpeta))
    escriu(carpeta / "font.json", dades)
    return info_font(carpeta)


# ---------- Editar una font (guia W, fase 2) ----------

def carpeta_font(a, f):
    return dins(carpeta_assig(a) / "fonts", f)


def sessions_amb_font(a, f):
    """Les sessions de l'assignatura que tenen triada la font: [(sessió, dades de sessio.json)]."""
    return [(s, dades) for s, dades in totes_les_sessions(a) if any(t["id"] == f for t in dades["fonts"])]


def claude_amb_font(a, sessions):
    """Si Claude passa a net alguna d'estes sessions (en marxa o esperant al punt de control), per què no es
    pot tocar la font: està llegint els seus fitxers."""
    for s, d in sessions:
        if (a, s) in processos or d["estat"] in ("en_marxa", "esperant"):
            qui = f"«{d['titol']}»" if d["titol"] else f"la sessió del {d['data'][8:10]}/{d['data'][5:7]}"
            return f"Claude està passant a net {qui} amb esta font: espera que acabe"
    return None


def lleva_de_les_sessions(a, f, sessions, pdf=None):
    """Lleva la font de les fonts triades de cada sessió o, amb pdf, eixe PDF dels marcats de la font."""
    for s, d in sessions:
        if pdf is None:
            fonts = [t for t in d["fonts"] if t["id"] != f]
        else:
            fonts = [{**t, "temes": [n for n in t["temes"] if n != pdf]} if t["id"] == f else t for t in d["fonts"]]
        desa_sessio(a, s, fonts=fonts)


def paperera_font(a, f):
    """Una carpeta nova (encara no existeix) a dades/paperera/<assignatura>/ per al que es lleva d'una font."""
    base = DADES / "paperera" / a / f"font-{f}-{datetime.now():%Y%m%d-%H%M%S}"
    desti, n = base, 2
    while desti.exists():  # dues coses de la mateixa font en el mateix segon
        desti, n = base.with_name(f"{base.name}-{n}"), n + 1
    desti.parent.mkdir(parents=True, exist_ok=True)
    return desti


class CanvisFont(BaseModel):
    nom: str
    que_es: str
    origen: str = ""
    fitxa: str | None = None  # el text de fitxa.yaml; buit: la fitxa va a la paperera i Claude en farà una de nova


@app.put("/api/assignatures/{a}/fonts/{f}")
def desa_fitxa_font(a: str, f: str, canvis: CanvisFont):
    """Els tres camps de l'usuari, a font.json, i la fitxa de Claude, a fitxa.yaml. La carpeta es queda
    igual encara que canvie el nom, perquè les sessions que la tenen triada no la perden."""
    carpeta = carpeta_font(a, f)
    if not canvis.nom.strip() or not canvis.que_es.strip():
        raise HTTPException(400, "La font necessita un nom curt i què és")
    dades = llig(carpeta / "font.json")
    dades.update(nom=canvis.nom.strip(), que_es=canvis.que_es.strip(), origen=canvis.origen.strip())
    escriu(carpeta / "font.json", dades)
    fitxa = carpeta / "fitxa.yaml"
    if canvis.fitxa is not None and canvis.fitxa.strip():
        fitxa.write_text(canvis.fitxa.rstrip() + "\n", encoding="utf-8")
    elif canvis.fitxa is not None and fitxa.exists():
        desti = paperera_font(a, f)
        desti.mkdir()
        shutil.move(fitxa, desti / fitxa.name)
    return info_font(carpeta)


@app.post("/api/assignatures/{a}/fonts/{f}/pdfs")
async def afegeix_pdfs(a: str, f: str, fitxers: list[UploadFile] = File(...)):
    carpeta = carpeta_font(a, f)
    if not fitxers or any(Path(x.filename or "").suffix.lower() != ".pdf" for x in fitxers):
        raise HTTPException(400, "Han de ser fitxers PDF")
    qui = claude_amb_font(a, sessions_amb_font(a, f))  # extreu-font.py torna a escriure el text i l'índex
    if qui:
        raise HTTPException(409, qui)
    for x in fitxers:
        (carpeta / nom_lliure(carpeta, x.filename)).write_bytes(await x.read())
    return await extreu_text(carpeta)


@app.delete("/api/assignatures/{a}/fonts/{f}/pdfs/{nom}")
async def lleva_pdf(a: str, f: str, nom: str):
    """El PDF i el seu text, a la paperera; l'índex es torna a fer amb els que queden."""
    carpeta = carpeta_font(a, f)
    pdf = dins(carpeta, nom)
    if pdf.suffix.lower() != ".pdf":
        raise HTTPException(404, "No existeix")
    if len(list(carpeta.glob("*.pdf"))) < 2:
        raise HTTPException(400, "Una font necessita almenys un PDF: si no la vols, esborra-la")
    sessions = sessions_amb_font(a, f)
    qui = claude_amb_font(a, sessions)
    if qui:
        raise HTTPException(409, qui)
    desti = paperera_font(a, f)
    desti.mkdir()
    for fitxer in (pdf, pdf.with_suffix(".txt")):
        if fitxer.exists():
            shutil.move(fitxer, desti / fitxer.name)
    lleva_de_les_sessions(a, f, sessions, pdf=nom)
    return await extreu_text(carpeta)


@app.delete("/api/assignatures/{a}/fonts/{f}")
def esborra_font(a: str, f: str):
    """La carpeta de la font, sencera, a dades/paperera/; les sessions que la tenien triada la perden. Els
    blocs ja escrits no canvien: continuen citant la font."""
    carpeta = carpeta_font(a, f)
    sessions = sessions_amb_font(a, f)
    qui = claude_amb_font(a, sessions)
    if qui:
        raise HTTPException(409, qui)
    desti = paperera_font(a, f)
    shutil.move(carpeta, desti)
    lleva_de_les_sessions(a, f, sessions)
    return {"paperera": desti.relative_to(ARREL).as_posix()}


# ---------- Sessions ----------

class NovaSessio(BaseModel):
    assignatura: str
    data: str
    titol: str = ""
    quadern: str = ""  # cada sessió va al document d'un quadern (decisió 9); buit: error clar, baix


class FontSessio(BaseModel):
    id: str
    temes: list[str] = []  # els PDF de la font on és la sessió; buit: Claude mira l'índex


class CanvisSessio(BaseModel):
    titol: str | None = None
    quadern: str | None = None
    fonts: list[FontSessio] | None = None
    nota: str | None = None
    apunts: list[str] | None = None


@app.post("/api/sessions")
def crea_sessio(nova: NovaSessio):
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", nova.data):
        raise HTTPException(400, "Data no vàlida")
    base = carpeta_assig(nova.assignatura) / "sessions"
    if not nova.quadern:
        raise HTTPException(400, "Tria el quadern, o crea'n un amb el «+»")
    carpeta_quadern(nova.assignatura, nova.quadern)  # 404 si no existeix
    id_sessio, n = nova.data, 2
    while (base / id_sessio).exists():
        id_sessio, n = f"{nova.data}-{n}", n + 1
    (base / id_sessio / "apunts").mkdir(parents=True)
    fonts = sorted((carpeta_assig(nova.assignatura) / "fonts").glob("*/font.json"))
    dades = {
        "id": id_sessio, "assignatura": nova.assignatura, "data": nova.data,
        "titol": nova.titol.strip(), "apunts": [], "quadern": nova.quadern,
        # Si l'assignatura només en té una, ja va triada.
        "fonts": [{"id": fonts[0].parent.name, "temes": []}] if len(fonts) == 1 else [],
        "nota": "", "estat": "nova", "pas": None,
        "conversa": None, "tokens": 0, "creada": ara(),
    }
    escriu(base / id_sessio / "sessio.json", dades)
    return dades


@app.get("/api/sessions/{a}/{s}")
def sessio(a: str, s: str):
    """La sessió, amb els fitxers i el PDF en rutes relatives a la carpeta de l'assignatura."""
    dades = llig_sessio(a, s)
    carpeta = carpeta_sessio(a, s)
    fitxers = []
    for arrel, carpetes, noms in os.walk(carpeta):
        if arrel == str(carpeta):  # el que puja l'usuari i el registre no són resultats
            carpetes[:] = [d for d in carpetes if d not in ("apunts", "adjunts", "registre")]
        rel = Path(arrel).relative_to(carpeta)
        fitxers += [(rel / n).as_posix() for n in noms
                    if Path(n).suffix not in SOROLL and n != "sessio.json"]
    fitxers.sort()
    fitxers = [f"sessions/{s}/{f}" for f in fitxers]
    document = document_de(a, dades)
    if document:
        quadern = document["carpeta"]
        fitxers += [f"quaderns/{quadern.name}/{n}" for n in ("quadern.tex", "quadern.pdf") if (quadern / n).exists()]
        if document["blocs"].is_dir():
            fitxers += sorted(f"quaderns/{quadern.name}/blocs/{s}/{b.name}" for b in document["blocs"].iterdir())
    # Si un altre Claude treballa en el quadern, esta sessió no es pot passar a net fins que acabe.
    ocupat = claude_al_quadern(a, dades["quadern"]) if dades["quadern"] and (a, s) not in processos else None
    registre = resum_registre(carpeta)
    return {**dades, "fitxers": fitxers, "pdf": document["pdf"] if document else None,
            "editats": editats_de_sessio(a, dades), **registre, **punt_control(carpeta, registre["torn"]),
            "ocupat": ocupat}


# ---------- Quaderns ----------

# \input{blocs/<carpeta>/Bnn} de quadern.tex: els blocs del document, en ordre.
INPUT_BLOC = re.compile(r"\\input\{(blocs/[^}]+?)(?:\.tex)?\}")


def blocs_del_quadern(carpeta):
    """Els fitxers dels blocs del quadern en l'ordre del document, que és el dels \\input de quadern.tex."""
    tex = carpeta / "quadern.tex"
    if not tex.exists():
        return []
    rutes = []
    for linia in tex.read_text(encoding="utf-8").splitlines():
        if linia.lstrip().startswith("%"):
            continue
        for m in INPUT_BLOC.finditer(linia):
            if ".." in m.group(1):
                continue
            ruta = carpeta / f"{m.group(1)}.tex"
            if ruta.exists() and ruta not in rutes:
                rutes.append(ruta)
    return rutes


def sessions_del_quadern(a, q):
    """Les sessions del quadern, en ordre de data."""
    sessions = [d for _, d in totes_les_sessions(a) if d["quadern"] == q]
    return sorted(sessions, key=lambda d: (d["data"], ordre_natural(d["id"])))


def clau_quadern(a, q):
    """La clau de processos de les correccions del quadern. Les sessions es diuen per la data, sense «/»,
    així que no es pot confondre amb la d'una sessió."""
    return (a, f"quaderns/{q}")


def claude_al_quadern(a, q):
    """Què fa Claude en el quadern, per als avisos, o None si no hi treballa. Només n'hi pot haver un per
    quadern (guia Q, fase 3): o corregeix el quadern, o passa a net una de les seues sessions."""
    if clau_quadern(a, q) in processos:
        return "Claude està corregint el quadern"
    for clau in list(processos):
        if clau[0] == a and "/" not in clau[1]:
            d = llig_sessio(a, clau[1])
            if d["quadern"] == q:
                return f"Claude està passant a net la sessió del {data_llarga(d['data'])}"
    return None


@app.get("/api/quaderns/{a}/{q}")
def quadern(a: str, q: str):
    """El quadern: el nom, el PDF, si té blocs d'abans de la web, les seues sessions, els blocs editats a mà
    i com van les correccions."""
    carpeta = carpeta_quadern(a, q)
    sessions = [{k: d.get(k) for k in ("id", "data", "titol", "estat", "pas", "apunts")}
                for d in sessions_del_quadern(a, q)]
    fitxa = llig(carpeta / "quadern.json")
    estat = fitxa.get("estat", "nova")
    if estat == "en_marxa" and clau_quadern(a, q) not in processos:
        estat = "aturada"  # el servidor s'ha reiniciat a mitges
    return {**info_quadern(carpeta), "assignatura": a,
            "inicial": (carpeta / "blocs" / "inicial").is_dir(),
            "tex": (carpeta / "quadern.tex").exists(),
            "sessions": sessions, "en_marxa": claude_al_quadern(a, q),
            "editats": list(edicions(carpeta)),
            "correccio": {"estat": estat, "conversa": bool(fitxa.get("conversa")),
                          "tokens": fitxa.get("tokens", 0), "events": nombre_events(carpeta)}}


@app.get("/api/quaderns/{a}/{q}/latex")
def latex_quadern(a: str, q: str):
    """Tots els blocs del quadern, en l'ordre del document, amb el text de cada un. El nom porta la
    carpeta (`inicial/B01.tex`, `2026-10-10/B01.tex`): és el que va a les línies %%%% de la web."""
    carpeta = carpeta_quadern(a, q)
    base = carpeta_assig(a)
    return {"blocs": [{"fitxer": b.relative_to(base).as_posix(), "nom": b.relative_to(carpeta / "blocs").as_posix(),
                       "text": b.read_text(encoding="utf-8")} for b in blocs_del_quadern(carpeta)]}


class BlocLatex(BaseModel):
    fitxer: str  # relatiu a la carpeta de l'assignatura, com el torna GET …/latex
    text: str


class CanvisLatex(BaseModel):
    canvis: list[BlocLatex]


@app.post("/api/quaderns/{a}/{q}/latex")
async def desa_latex_quadern(a: str, q: str, canvis: CanvisLatex):
    """Desa els blocs que l'usuari ha editat, ho apunta a edicions.json del quadern i torna a compilar-lo.

    Si la compilació falla, els blocs es queden desats (per arreglar-los) i el PDF és el d'abans."""
    qui = claude_al_quadern(a, q)
    if qui:
        raise HTTPException(409, f"{qui}: el LaTeX el podràs editar quan acabe")
    carpeta = carpeta_quadern(a, q)
    if not canvis.canvis:
        raise HTTPException(400, "No hi ha cap canvi")
    base = carpeta_assig(a)
    blocs = {b.relative_to(base).as_posix() for b in blocs_del_quadern(carpeta)}
    for bloc in canvis.canvis:
        if bloc.fitxer not in blocs:  # només els blocs del document del quadern: res fora
            raise HTTPException(400, f"{bloc.fitxer} no és un bloc d'este quadern")
    if carpeta in compilant:
        raise HTTPException(409, "Ja s'està compilant: espera que acabe")
    compilant.add(carpeta)
    try:
        for bloc in canvis.canvis:
            (base / bloc.fitxer).write_text(bloc.text, encoding="utf-8", newline="")
        desa_edicions(carpeta, edicions(carpeta) | {bloc.fitxer: ara() for bloc in canvis.canvis})
        ok, sortida = await compila_document(carpeta, carpeta / "quadern.pdf")
    finally:
        compilant.discard(carpeta)
    # «OK, 10 pàgines» i, davall, els avisos de compila.py (referències, text fora del marge).
    linies = sortida.splitlines()
    m = re.match(r"OK, (\d+) pàgin", linies[0]) if ok and linies else None
    return {"ok": ok, "pagines": int(m.group(1)) if m else None,
            "missatge": "\n".join(linies[1:]) if m else sortida}


@app.put("/api/sessions/{a}/{s}")
def modifica_sessio(a: str, s: str, canvis: CanvisSessio):
    actual = llig_sessio(a, s)
    nous = canvis.model_dump(exclude_unset=True)
    if "apunts" in nous and sorted(nous["apunts"]) != sorted(actual["apunts"]):
        raise HTTPException(400, "L'ordre ha de tindre les mateixes fotos")
    if "quadern" in nous:
        if (a, s) in processos:
            raise HTTPException(409, "Claude està treballant: canvia el quadern quan pare")
        if not nous["quadern"]:
            raise HTTPException(400, "Cada sessió ha de tindre quadern")
        carpeta_quadern(a, nous["quadern"])  # 404 si no existeix
    if "fonts" in nous:
        ids = [f["id"] for f in nous["fonts"]]
        if len(set(ids)) != len(ids):
            raise HTTPException(400, "Hi ha una font repetida")
        for f in nous["fonts"]:
            carpeta = dins(carpeta_assig(a) / "fonts", f["id"])
            for pdf in f["temes"]:
                dins(carpeta, pdf)
    return desa_sessio(a, s, **nous)


async def treu_del_quadern(quadern, s):
    """Lleva de quadern.tex les línies dels blocs de la sessió i torna a compilar el quadern.

    Torna un avís si el PDF no s'ha pogut refer; en eixe cas es queda el PDF d'abans."""
    tex = quadern / "quadern.tex"
    if not tex.exists():
        return None
    linies = tex.read_text(encoding="utf-8").splitlines(keepends=True)
    tex.write_text("".join(l for l in linies if f"blocs/{s}/" not in l), encoding="utf-8", newline="")
    ok, sortida = await compila_document(quadern, quadern / "quadern.pdf")
    if not ok:
        return (f"Els blocs de la sessió ja no són a «{llig(quadern / 'quadern.json')['nom']}», però el PDF del quadern "
                f"no s'ha pogut refer i encara és el d'abans. {sortida[-300:]}")
    return None


@app.delete("/api/sessions/{a}/{s}")
async def esborra_sessio(a: str, s: str):
    """La sessió va a dades/paperera/; si tenia blocs al document d'un quadern, també, i el quadern es refà."""
    if (a, s) in processos:
        raise HTTPException(409, "Claude està treballant en esta sessió: atura'l abans d'esborrar-la")
    q = llig_sessio(a, s)["quadern"]
    qui = claude_al_quadern(a, q) if q else None
    if qui:  # esborrar-la canvia el document del quadern
        raise HTTPException(409, f"{qui}: podràs esborrar la sessió quan acabe")
    carpeta = carpeta_sessio(a, s)
    desti = DADES / "paperera" / a / f"{s}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    desti.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(carpeta, desti)
    avisos = []
    for blocs in sorted((carpeta_assig(a) / "quaderns").glob(f"*/blocs/{s}")):
        quadern = blocs.parent.parent
        shutil.move(blocs, desti / f"blocs-del-{quadern.name}")
        prefix = f"quaderns/{quadern.name}/blocs/{s}/"
        desa_edicions(quadern, {f: d for f, d in edicions(quadern).items() if not f.startswith(prefix)})
        avis = await treu_del_quadern(quadern, s)
        if avis:
            avisos.append(avis)
    return {"paperera": desti.relative_to(ARREL).as_posix(), "avis": " ".join(avisos) or None}


@app.post("/api/sessions/{a}/{s}/apunts")
async def puja_apunts(a: str, s: str, fitxers: list[UploadFile] = File(...)):
    carpeta = carpeta_sessio(a, s) / "apunts"
    if any(Path(f.filename or "").suffix.lower() not in APUNTS for f in fitxers):
        raise HTTPException(400, "Els apunts han de ser JPG, PNG, WebP o PDF")
    apunts = llig_sessio(a, s)["apunts"]
    for f in fitxers:
        nom = nom_lliure(carpeta, f.filename)
        (carpeta / nom).write_bytes(await f.read())
        apunts.append(nom)
    return desa_sessio(a, s, apunts=apunts)


@app.delete("/api/sessions/{a}/{s}/apunts/{nom}")
def lleva_apunt(a: str, s: str, nom: str):
    dins(carpeta_sessio(a, s) / "apunts", nom).unlink()
    apunts = [n for n in llig_sessio(a, s)["apunts"] if n != nom]
    return desa_sessio(a, s, apunts=apunts)


@app.get("/api/fitxer/{a}/{ruta:path}")
def fitxer(a: str, ruta: str):
    return FileResponse(dins(carpeta_assig(a), ruta))


# ---------- Claude ----------

def ordre_claude(missatge, conversa=None):
    ordre = ["claude", "-p", missatge, "--output-format", "stream-json", "--verbose",
             "--permission-mode", "bypassPermissions"]
    if conversa:
        ordre += ["--resume", conversa]
    if os.environ.get("LEMA_MODEL"):
        ordre += ["--model", os.environ["LEMA_MODEL"]]
    # Només les eines que fa servir i cap ordre ni skill: cada crida comença amb menys tokens
    # (guies/optimitzacio-tokens.md, fase 1). Sense l'eina de preguntes: escriu les preguntes i acaba el torn.
    return ordre + ["--tools", "Bash,Read,Write,Edit", "--disable-slash-commands"]


# Bloc {document} de prompt.md: on va el document de la sessió (decisió 9).
DOCUMENT_QUADERN = """\
- **Quadern «{quadern_nom}»**, a `{carpeta_quadern}`. Esta sessió, del {data}, s'afegeix al seu document (decisió 9 de `CLAUDE.md`):
  - Els blocs d'esta sessió van a `{carpeta_quadern}/blocs/{sessio}/`, numerats B01, B02… {passada}
  - Les etiquetes dels blocs d'esta sessió porten davant el nom de la seua carpeta, perquè no es repetisquen amb les d'altres sessions: `\\label{{sessio}-B01}`, `\\label{{sessio}-B02}`… Per citar blocs d'altres sessions, fes servir l'etiqueta que ja tenen (les de `inicial` són `B01`, `B02`…).
  - `quadern.tex` és a l'arrel de `{carpeta_quadern}`. Si no existeix, crea'l amb el nom del quadern com a títol. Si existeix, no toques els blocs de les altres sessions: afegeix-hi només els `\\input{blocs/{sessio}/Bnn}` d'esta sessió, en ordre de data de sessió. {sessions_quadern}
  - Les notetes continuen la numeració del quadern: {notetes}
  - {model}
  - Per compilar: `python compila.py {carpeta_quadern}`. `quadern.tex` ha de ser l'únic `.tex` de l'arrel del quadern.
  - A la carpeta de la sessió, `{carpeta}`, van `esquema.yaml`, `informe.md` i `millores.md`. A l'informe, digues a quines pàgines del PDF del quadern és esta sessió."""


def omple(plantilla, valors):
    return re.sub(r"\{(\w+)\}", lambda m: str(valors.get(m.group(1), m.group(0))), plantilla)


def data_llarga(iso):
    return "/".join(reversed(iso.split("-")))


# El que Claude anava a buscar en començar, ara dins del missatge (guies/optimitzacio-tokens.md, fase 4).
NOTETA = re.compile(r"\\noteta\{N(\d+)\}")


def mida_foto(ruta):
    """« (899×1599 px)», com la veu un visor (amb la rotació EXIF), o "" si no és una imatge (un PDF)."""
    try:
        with Image.open(ruta) as im:
            w, h = im.size
            if im.getexif().get(0x0112) in (5, 6, 7, 8):  # la rotació a banda la gira 90°
                w, h = h, w
    except (OSError, ValueError):
        return ""
    return f" ({w}×{h} px)"


def marques_plantilla():
    """Els entorns i les marques de plantilla-base.tex, perquè Claude no l'haja d'obrir."""
    tex = (ARREL / "plantilla-base.tex").read_text(encoding="utf-8")
    entorns = [f"`{e}`" for e in re.findall(r"\\newtheorem\{(\w+)\}", tex)] + ["`proof`"]
    marques = [f"`\\{nom}" + "{…}" * int(n or 0) + "`"
               for nom, n in re.findall(r"\\newcommand\{\\(\w+)\}(?:\[(\d)\])?", tex)]
    return f"els entorns {', '.join(entorns)} i les marques {', '.join(marques)}"


def blocs_del_quadern_per_a_claude(carpeta_q, sessio):
    """Quants blocs té ja esta sessió al quadern (d'una passada anterior), l'última noteta dels altres i un bloc
    de model: de la sessió més recent, el més curt amb \\noteta i \\origen. Llig els blocs alhora (guia X)."""
    fitxers = [Path(arrel) / nom for arrel, _, noms in os.walk(carpeta_q / "blocs") for nom in noms if nom.endswith(".tex")]
    textos = dict(resultats(alhora(lambda r: (r, r.read_text(encoding="utf-8")), fitxers)))
    propis = sum(1 for r in textos if r.parent.name == sessio)
    altres = {r: t for r, t in textos.items() if r.parent.name != sessio}
    ultima = max((int(n) for t in altres.values() for n in NOTETA.findall(t)), default=0)
    if not altres:
        return propis, ultima, None
    recent = max({r.parent.name for r in altres}, key=lambda c: (c != "inicial", c))
    model = min((r for r in altres if r.parent.name == recent),
                key=lambda r: ("\\noteta" not in altres[r], "\\origen" not in altres[r], len(altres[r])))
    return propis, ultima, model.relative_to(ARREL).as_posix()


def document_sessio(a, dades, valors):
    """El bloc {document} del prompt: el quadern de la sessió, les sessions que ja hi són, si esta ja hi té blocs,
    l'última noteta i un bloc de model."""
    q = dades["quadern"]
    fitxa = carpeta_assig(a) / "quaderns" / q / "quadern.json"
    propis, ultima, model = blocs_del_quadern_per_a_claude(fitxa.parent, dades["id"])
    passada = (f"Ja n'hi ha {propis} d'una passada anterior d'esta sessió: esborra'ls i lleva'n els `\\input` de "
               "`quadern.tex` abans d'escriure'n de nous." if propis else "Encara no n'hi ha cap.")
    notetes = (f"l'última dels blocs que ja hi ha és la N{ultima}, així que la primera d'esta sessió és la N{ultima + 1}."
               if ultima else "encara no n'hi ha cap, així que la primera d'esta sessió és la N1.")
    marques = marques_plantilla()
    model = (f"Escriu els blocs com els que ja hi ha; de model, `{model}`. La plantilla té {marques}." if model
             else f"El quadern encara no té cap bloc. La plantilla té {marques}.")
    altres = []
    for carpeta in sorted(p for p in (fitxa.parent / "blocs").glob("*") if p.is_dir()):
        if carpeta.name == dades["id"]:
            continue
        if carpeta.name == "inicial":
            altres.append("`inicial` (el document que ja hi havia abans de la web: va primer i no el toques)")
            continue
        fitxa_sessio = carpeta_assig(a) / "sessions" / carpeta.name / "sessio.json"
        data = llig(fitxa_sessio)["data"] if fitxa_sessio.exists() else None
        altres.append(f"`{carpeta.name}`" + (f" ({data_llarga(data)})" if data else ""))
    sessions = ("Sessions que ja hi són, amb la carpeta dels seus blocs: " + ", ".join(altres) + "."
                if altres else "Encara no n'hi ha cap altra: el quadern comença amb esta sessió.")
    return omple(DOCUMENT_QUADERN, {**valors, "quadern_nom": llig(fitxa)["nom"],
                                    "carpeta_quadern": f"dades/assignatures/{a}/quaderns/{q}",
                                    "data": data_llarga(dades["data"]), "sessions_quadern": sessions,
                                    "passada": passada, "notetes": notetes, "model": model})


def font_per_a_claude(a, f, base):
    """La línia d'una font al prompt: què és i d'on surt, els PDF, els temes de la sessió i la fitxa, si ja en té."""
    carpeta = carpeta_assig(a) / "fonts" / f["id"]
    info = llig(carpeta / "font.json")
    que = "; ".join(x for x in (info.get("que_es"), info.get("origen")) if x)
    pdfs = ", ".join(f"`{p['nom']}`" for p in info.get("pdfs", []))
    temes = ", ".join(f"`{t}`" for t in f["temes"]) or "no ho sap; mira l'índex"
    linia = (f"  - {info['nom']}" + (f" ({que})" if que else "") + f": `{base}/fonts/{f['id']}`. PDF: {pdfs}. "
             f"{'Temes' if len(f['temes']) > 1 else 'Tema'} de la font on és la sessió: {temes}.")
    try:
        fitxa = (carpeta / "fitxa.yaml").read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return linia + " Encara no té fitxa."
    return linia + "\n    Ja té fitxa (`fitxa.yaml`):\n\n    ```yaml\n" + textwrap.indent(fitxa, "    ") + "\n    ```\n"


def prompt_sessio(a, dades):
    base = f"dades/assignatures/{a}"
    carpeta = f"{base}/sessions/{dades['id']}"
    fonts = [font_per_a_claude(a, f, base) for f in dades["fonts"]]
    # La mida de cada foto, alhora (guia X): Claude ja no ha de mirar si hi ha eines d'imatge.
    mides = [m.result() for m in alhora(mida_foto, [carpeta_sessio(a, dades["id"]) / "apunts" / n
                                                    for n in dades["apunts"]])]
    valors = {
        "assignatura": ASSIGNATURES[a],
        "carpeta": carpeta,
        "carpeta_assig": base,
        "fonts": "\n".join(fonts),
        "apunts": "\n".join(f"  {i}. `{carpeta}/apunts/{n}`{mida}"
                            for i, (n, mida) in enumerate(zip(dades["apunts"], mides), 1)),
        "nota": dades["nota"].strip() or "cap",
        # De la carpeta del quadern a l'arrel del repositori hi ha cinc nivells.
        "plantilla": "../../../../../plantilla-base",
        "sessio": dades["id"],
    }
    valors["document"] = document_sessio(a, dades, valors)
    return omple((ARREL / "web" / "prompt.md").read_text(encoding="utf-8"), valors)


def prompt_quadern(a, q, missatge):
    """El primer missatge de la conversa de correccions del quadern: prompt-quadern.md i la primera correcció."""
    quadern = carpeta_assig(a) / "quaderns" / q
    carpetes = []
    for carpeta in sorted((p for p in (quadern / "blocs").glob("*") if p.is_dir()), key=lambda p: (p.name != "inicial", p.name)):
        if carpeta.name == "inicial":
            carpetes.append("`inicial` (el document que ja hi havia abans de la web, que va primer)")
            continue
        fitxa_sessio = carpeta_assig(a) / "sessions" / carpeta.name / "sessio.json"
        data = llig(fitxa_sessio)["data"] if fitxa_sessio.exists() else None
        carpetes.append(f"`{carpeta.name}`" + (f" (sessió del {data_llarga(data)})" if data else ""))
    return omple((ARREL / "web" / "prompt-quadern.md").read_text(encoding="utf-8"), {
        "assignatura": ASSIGNATURES[a],
        "carpeta_assig": f"dades/assignatures/{a}",
        "carpeta_quadern": f"dades/assignatures/{a}/quaderns/{q}",
        "quadern_nom": llig(quadern / "quadern.json")["nom"],
        "carpetes": "Ara hi ha " + ", ".join(carpetes) + "." if carpetes else "Encara no n'hi ha cap.",
        "missatge": missatge,
    })


def detall_eina(nom, entrada):
    """Una línia que diu sobre què treballa l'eina, amb les rutes relatives al repositori."""
    if "file_path" in entrada:
        text = entrada["file_path"].removeprefix(f"{ARREL.as_posix()}/")
        return text + (f" · pàg. {entrada['pages']}" if entrada.get("pages") else "")
    for clau in ("description", "pattern", "command", "url", "prompt"):
        if entrada.get(clau):
            return str(entrada[clau])[:160]
    return ""


def text_resultat(contingut):
    if isinstance(contingut, list):
        return " ".join(b.get("text", "") for b in contingut if isinstance(b, dict))
    return str(contingut or "")


def suma_tokens(us):
    return sum(us.get(k) or 0 for k in ("input_tokens", "cache_creation_input_tokens",
                                        "cache_read_input_tokens", "output_tokens"))


async def executa(clau, carpeta, missatge, conversa=None):
    """Una crida a Claude Code, per a una sessió o per a les correccions d'un quadern (guia Q, fase 3): llig
    el que fa i ho resumeix a registre/events.jsonl de la carpeta. L'estat, el pas, la conversa i els tokens
    van a la fitxa de la carpeta (sessio.json o quadern.json)."""
    fitxa = carpeta / ("quadern.json" if (carpeta / "quadern.json").exists() else "sessio.json")
    registre = carpeta / "registre"
    registre.mkdir(exist_ok=True)
    nom = datetime.now().strftime("%Y%m%d-%H%M%S")
    estat, vistos, tokens, final = "esperant", set(), 0, None
    try:
        with open(registre / f"claude-{nom}.jsonl", "w", encoding="utf-8") as cru, \
             open(registre / f"claude-{nom}.err", "w", encoding="utf-8") as err:
            proc = await asyncio.create_subprocess_exec(
                *ordre_claude(missatge, conversa), cwd=ARREL,
                stdout=asyncio.subprocess.PIPE, stderr=err, limit=64 * 2**20)
            processos[clau] = proc
            async for linia in proc.stdout:
                cru.write(linia.decode("utf-8", "replace"))
                try:
                    m = json.loads(linia)
                except ValueError:
                    continue
                tipus = m.get("type")
                if m.get("session_id"):
                    conversa = m["session_id"]
                if tipus == "assistant":
                    msg = m.get("message", {})
                    if msg.get("id") not in vistos:  # un missatge pot arribar en diverses línies
                        vistos.add(msg.get("id"))
                        tokens += suma_tokens(msg.get("usage", {}))
                        afegeix_event(carpeta, t="tokens", n=tokens)
                    for bloc in msg.get("content", []):
                        if bloc.get("type") == "text" and bloc["text"].strip():
                            for n in MARCA_PAS.findall(bloc["text"]):
                                actualitza(fitxa, pas=int(n))
                                afegeix_event(carpeta, t="pas", n=int(n))
                            for e in MARCA_ESTAT.findall(bloc["text"]):
                                estat = "acabada" if e.lower() == "acabat" else "esperant"
                            # Un error de Claude arriba també com a text: ja l'ensenya l'avís d'error.
                            if not m.get("error"):
                                afegeix_event(carpeta, t="text", text=bloc["text"])
                        elif bloc.get("type") == "tool_use":
                            afegeix_event(carpeta, t="eina", nom=bloc["name"],
                                          detall=detall_eina(bloc["name"], bloc.get("input", {})))
                elif tipus == "user":
                    for bloc in m.get("message", {}).get("content", []):
                        if isinstance(bloc, dict) and bloc.get("is_error"):
                            afegeix_event(carpeta, t="error_eina",
                                          text=text_resultat(bloc.get("content"))[:400])
                elif tipus == "result":
                    final = m
            await proc.wait()
        if clau in aturats:
            estat = "aturada"
        elif final is None or final.get("is_error") or proc.returncode:
            estat = "error"
            motiu = (final or {}).get("result") or (registre / f"claude-{nom}.err").read_text(
                encoding="utf-8", errors="replace")[-600:] or f"Claude ha acabat amb el codi {proc.returncode}"
            if "/login" in motiu:
                motiu += "\n\nFalta el token de Claude Code a `.env` (vegeu `.env.example`)."
            afegeix_event(carpeta, t="error", text=motiu)
    except Exception as e:  # p. ex. no troba claude
        estat = "error"
        afegeix_event(carpeta, t="error", text=f"{type(e).__name__}: {e}")
    total = llig(fitxa).get("tokens", 0) + tokens
    afegeix_event(carpeta, t="fi", estat=estat, tokens=tokens,
                  durada=(final or {}).get("duration_ms"))
    actualitza(fitxa, estat=estat, conversa=conversa, tokens=total)
    processos.pop(clau, None)
    aturats.discard(clau)


def en_segon_pla(corrutina):
    tasca = asyncio.create_task(corrutina)
    tasques.add(tasca)
    tasca.add_done_callback(tasques.discard)


@app.post("/api/sessions/{a}/{s}/passa")
async def passa_a_net(a: str, s: str):
    dades = llig_sessio(a, s)
    if (a, s) in processos:
        raise HTTPException(409, "Ja està en marxa")
    if not dades["quadern"] or not (carpeta_assig(a) / "quaderns" / dades["quadern"] / "quadern.json").exists():
        raise HTTPException(400, "Tria el quadern a Materials")
    if not dades["apunts"]:
        raise HTTPException(400, "Falten les fotos dels apunts")
    if not dades["fonts"] or not all((carpeta_assig(a) / "fonts" / f["id"] / "font.json").exists()
                                     for f in dades["fonts"]):
        raise HTTPException(400, "Falta triar la font")
    qui = claude_al_quadern(a, dades["quadern"])
    if qui:
        raise HTTPException(409, f"{qui}: espera que acabe")
    carpeta = carpeta_sessio(a, s)
    propis = editats_de_sessio(a, dades)
    if propis:
        # Claude tornarà a escriure els blocs d'esta sessió: les seues edicions a mà es perden (la web ho
        # ha avisat). Se'n van del quadern al registre de la sessió, perquè en quede constància.
        quadern = carpeta_assig(a) / "quaderns" / dades["quadern"]
        totes = edicions(quadern)
        (carpeta / "registre").mkdir(exist_ok=True)
        escriu(carpeta / "registre" / f"edicions-{datetime.now():%Y%m%d-%H%M%S}.json", {"blocs": {f: totes[f] for f in propis}})
        desa_edicions(quadern, {f: d for f, d in totes.items() if f not in propis})
    # Les preguntes i el resum de la passada d'abans se'n van al registre, com les edicions (guia B).
    (carpeta / "registre").mkdir(exist_ok=True)
    try:
        (carpeta / "punt-control.json").rename(carpeta / "registre" / f"punt-control-{datetime.now():%Y%m%d-%H%M%S}.json")
    except FileNotFoundError:
        pass
    afegeix_event(carpeta, t="inici")
    processos[(a, s)] = None  # reservat fins que arranca el procés
    desa_sessio(a, s, estat="en_marxa", pas=None, conversa=None)
    en_segon_pla(executa((a, s), carpeta, prompt_sessio(a, dades)))
    return {"ok": True}


async def missatge_usuari(a, carpeta, text, fitxers, q):
    """El missatge per a Claude: el text, els fitxers adjunts (es guarden a adjunts/ de la carpeta) i els
    blocs del quadern editats a mà. Ho apunta al registre."""
    adjunts = []
    for f in fitxers or []:
        (carpeta / "adjunts").mkdir(exist_ok=True)
        nom = nom_lliure(carpeta / "adjunts", f.filename)
        (carpeta / "adjunts" / nom).write_bytes(await f.read())
        adjunts.append(nom)
    if not text.strip() and not adjunts:
        raise HTTPException(400, "El missatge és buit")
    missatge = text.strip()
    if adjunts:
        rutes = ", ".join(f"`{(carpeta / 'adjunts' / n).relative_to(ARREL).as_posix()}`" for n in adjunts)
        missatge += f"\n\nFitxers adjunts: {rutes}"
    afegeix_event(carpeta, t="usuari", text=text.strip(), adjunts=adjunts)
    return missatge + nota_edicions(a, q)


@app.post("/api/sessions/{a}/{s}/respon")
async def respon(a: str, s: str, text: str = Form(""),
                 fitxers: list[UploadFile] | None = File(None)):
    dades = llig_sessio(a, s)
    if (a, s) in processos:
        raise HTTPException(409, "Claude encara està treballant")
    if not dades["conversa"]:
        raise HTTPException(400, "Encara no hi ha cap conversa: passa-la a net primer")
    qui = claude_al_quadern(a, dades["quadern"]) if dades["quadern"] else None
    if qui:
        raise HTTPException(409, f"{qui}: espera que acabe")
    carpeta = carpeta_sessio(a, s)
    missatge = await missatge_usuari(a, carpeta, text, fitxers, dades["quadern"])
    processos[(a, s)] = None
    desa_sessio(a, s, estat="en_marxa")
    en_segon_pla(executa((a, s), carpeta, missatge, dades["conversa"]))
    return {"ok": True}


def atura_claude(clau):
    proc = processos.get(clau)
    if proc is None:
        raise HTTPException(409, "No està en marxa")
    aturats.add(clau)
    proc.terminate()
    return {"ok": True}


@app.post("/api/sessions/{a}/{s}/atura")
def atura(a: str, s: str):
    return atura_claude((a, s))


def flux_events(carpeta, clau, des_de):
    """El registre de Claude de la carpeta, des de la línia des_de, i en directe mentre treballa."""
    ruta = carpeta / "registre" / "events.jsonl"

    def linies():
        # Només les línies acabades: la darrera pot estar escrivint-se.
        return ruta.read_text(encoding="utf-8").split("\n")[:-1] if ruta.exists() else []

    async def flux():
        vistes = des_de
        while True:
            en_marxa = clau in processos
            noves = linies()
            for linia in noves[vistes:]:
                yield f"data: {linia}\n\n"
            vistes = len(noves)
            if not en_marxa:
                yield "event: tancat\ndata: {}\n\n"
                return
            await asyncio.sleep(0.5)

    return StreamingResponse(flux(), media_type="text/event-stream")


@app.get("/api/sessions/{a}/{s}/events")
async def events(a: str, s: str, des_de: int = 0):
    return flux_events(carpeta_sessio(a, s), (a, s), des_de)


# ---------- Correccions del quadern (guia Q, fase 3) ----------

@app.post("/api/quaderns/{a}/{q}/corregeix")
async def corregeix_quadern(a: str, q: str, text: str = Form(""),
                            fitxers: list[UploadFile] | None = File(None)):
    """Una correcció del document del quadern, en la conversa de correccions del quadern: la primera
    l'obri amb prompt-quadern.md i les següents la continuen."""
    carpeta = carpeta_quadern(a, q)
    qui = claude_al_quadern(a, q)
    if qui:
        raise HTTPException(409, f"{qui}: espera que acabe")
    if carpeta in compilant:
        raise HTTPException(409, "S'està compilant el LaTeX que has editat: espera que acabe")
    if not (carpeta / "quadern.tex").exists():
        raise HTTPException(400, "El quadern encara no té document: passa a net una sessió primer")
    conversa = llig(carpeta / "quadern.json").get("conversa")
    missatge = await missatge_usuari(a, carpeta, text, fitxers, q)
    if not conversa:
        missatge = prompt_quadern(a, q, missatge)
    processos[clau_quadern(a, q)] = None  # reservat fins que arranca el procés
    actualitza(carpeta / "quadern.json", estat="en_marxa")
    en_segon_pla(executa(clau_quadern(a, q), carpeta, missatge, conversa))
    return {"ok": True}


@app.post("/api/quaderns/{a}/{q}/atura")
def atura_quadern(a: str, q: str):
    return atura_claude(clau_quadern(a, q))


@app.get("/api/quaderns/{a}/{q}/events")
async def events_quadern(a: str, q: str, des_de: int = 0):
    return flux_events(carpeta_quadern(a, q), clau_quadern(a, q), des_de)


@app.get("/api/versio")
def versio():
    """Canvia cada vegada que canvia un fitxer de la pàgina (web/static/). La pàgina oberta la compara
    amb la que tenia en carregar-se i, si és diferent, es recarrega (guia R). Les dates, alhora (guia X)."""
    with os.scandir(ARREL / "web" / "static") as entrades:
        fitxers = [e.path for e in entrades if e.is_file()]
    return {"versio": str(max(lectors.map(lambda f: os.stat(f).st_mtime_ns, fitxers)))}


@app.middleware("http")
async def sense_cache(request, call_next):
    """Que el navegador sempre agafe la versió nova de la web després d'un canvi."""
    resposta = await call_next(request)
    if not request.url.path.startswith("/api/"):
        resposta.headers["Cache-Control"] = "no-cache"
    return resposta


migra_dades()
app.mount("/", StaticFiles(directory=ARREL / "web" / "static", html=True), name="web")
