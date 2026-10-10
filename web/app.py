"""Web local de LEMA.

Crea classes, hi guarda els fitxers i llança Claude Code («Passa a net») en una
conversa nova per a cada classe. El que fa Claude es resumeix, línia a línia, a
registre/events.jsonl de la classe, i la web ho llig en directe.

Dades (fora de git):
  dades/perfil-lletra.md
  dades/assignatures/<assignatura>/
    notacio.yaml
    fonts/<font>/          font.json, els PDF, el text extret i index.txt
    classes/<AAAA-MM-DD>/  classe.json, apunts/, adjunts/, registre/ i el que escriu Claude
"""

import asyncio
import json
import os
import re
import subprocess
import sys
import unicodedata
from datetime import datetime
from pathlib import Path, PurePosixPath

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

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
processos = {}  # (assignatura, classe) -> procés de Claude en marxa
aturats = set()  # classes que l'usuari ha aturat
tasques = set()  # perquè asyncio no perda les tasques en segon pla


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


def escriu(ruta, dades):
    ruta.write_text(json.dumps(dades, ensure_ascii=False, indent=2), encoding="utf-8")


def carpeta_assig(a):
    if a not in ASSIGNATURES:
        raise HTTPException(404, "Assignatura desconeguda")
    return DADES / "assignatures" / a


def carpeta_classe(a, c):
    return dins(carpeta_assig(a) / "classes", c)


def migra(dades):
    """Abans del 07/10/2026, cada classe tenia una sola font (`font` i `tema_font`)."""
    if "font" in dades:
        font, tema = dades.pop("font"), dades.pop("tema_font", None)
        dades["fonts"] = [{"id": font, "temes": [tema] if tema else []}] if font else []
    return dades


def llig_classe(a, c):
    dades = migra(llig(carpeta_classe(a, c) / "classe.json"))
    if dades["estat"] == "en_marxa" and (a, c) not in processos:
        dades["estat"] = "aturada"  # el servidor s'ha reiniciat a mitges
    return dades


def desa_classe(a, c, **canvis):
    ruta = carpeta_classe(a, c) / "classe.json"
    dades = migra(llig(ruta))
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


def afegeix_event(carpeta, **event):
    (carpeta / "registre").mkdir(exist_ok=True)
    event["ts"] = ara()
    with open(carpeta / "registre" / "events.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")


def nombre_events(carpeta):
    ruta = carpeta / "registre" / "events.jsonl"
    return ruta.read_text(encoding="utf-8").count("\n") if ruta.exists() else 0


# ---------- Assignatures i fonts ----------

@app.get("/api/assignatures")
def assignatures():
    resultat = []
    for a, nom in ASSIGNATURES.items():
        base = carpeta_assig(a)
        classes = []
        for fitxa in sorted((base / "classes").glob("*/classe.json"), reverse=True):
            d = llig_classe(a, fitxa.parent.name)
            classes.append({k: d.get(k) for k in ("id", "data", "titol", "estat", "pas")})
        fonts = [info_font(f.parent) for f in sorted((base / "fonts").glob("*/font.json"))]
        resultat.append({"id": a, "nom": nom, "classes": classes, "fonts": fonts})
    return resultat


@app.post("/api/assignatures/{a}/fonts")
async def puja_font(a: str, nom: str = Form(...), que_es: str = Form(...),
                    origen: str = Form(""), fitxers: list[UploadFile] = File(...)):
    id_font = slug(nom)
    if not id_font:
        raise HTTPException(400, "La font necessita un nom")
    carpeta = carpeta_assig(a) / "fonts" / id_font
    if carpeta.exists():
        raise HTTPException(409, f"Ja hi ha una font que es diu «{nom}»")
    if not fitxers or any(Path(f.filename or "").suffix.lower() != ".pdf" for f in fitxers):
        raise HTTPException(400, "La font han de ser fitxers PDF")
    carpeta.mkdir(parents=True)
    for f in fitxers:
        (carpeta / nom_lliure(carpeta, f.filename)).write_bytes(await f.read())
    escriu(carpeta / "font.json", {"nom": nom.strip(), "que_es": que_es.strip(), "origen": origen.strip()})
    # Text i índex de cada PDF, sense passar per Claude (mesures 2 i 5 d'optimitzacio.md).
    proc = await asyncio.to_thread(
        subprocess.run, [sys.executable, str(ARREL / "extreu-font.py"), str(carpeta)],
        capture_output=True, text=True, encoding="utf-8")
    if proc.returncode:
        raise HTTPException(500, f"No s'ha pogut extraure el text: {proc.stderr[-400:]}")
    return info_font(carpeta)


# ---------- Classes ----------

class NovaClasse(BaseModel):
    assignatura: str
    data: str
    titol: str = ""


class FontClasse(BaseModel):
    id: str
    temes: list[str] = []  # els PDF de la font on és la classe; buit: Claude mira l'índex


class CanvisClasse(BaseModel):
    titol: str | None = None
    fonts: list[FontClasse] | None = None
    nota: str | None = None
    apunts: list[str] | None = None


@app.post("/api/classes")
def crea_classe(nova: NovaClasse):
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", nova.data):
        raise HTTPException(400, "Data no vàlida")
    base = carpeta_assig(nova.assignatura) / "classes"
    id_classe, n = nova.data, 2
    while (base / id_classe).exists():
        id_classe, n = f"{nova.data}-{n}", n + 1
    (base / id_classe / "apunts").mkdir(parents=True)
    fonts = sorted((carpeta_assig(nova.assignatura) / "fonts").glob("*/font.json"))
    dades = {
        "id": id_classe, "assignatura": nova.assignatura, "data": nova.data,
        "titol": nova.titol.strip(), "apunts": [],
        # Si l'assignatura només en té una, ja va triada.
        "fonts": [{"id": fonts[0].parent.name, "temes": []}] if len(fonts) == 1 else [],
        "nota": "", "estat": "nova", "pas": None,
        "sessio": None, "tokens": 0, "creada": ara(),
    }
    escriu(base / id_classe / "classe.json", dades)
    return dades


@app.get("/api/classes/{a}/{c}")
def classe(a: str, c: str):
    carpeta = carpeta_classe(a, c)
    fitxers = []
    for arrel, carpetes, noms in os.walk(carpeta):
        if arrel == str(carpeta):  # el que puja l'usuari i el registre no són resultats
            carpetes[:] = [d for d in carpetes if d not in ("apunts", "adjunts", "registre")]
        rel = Path(arrel).relative_to(carpeta)
        fitxers += [(rel / n).as_posix() for n in noms
                    if Path(n).suffix not in SOROLL and n != "classe.json"]
    fitxers.sort()
    pdfs = [f for f in fitxers if f.endswith(".pdf") and "/" not in f]
    return {**llig_classe(a, c), "fitxers": fitxers, "pdf": pdfs[0] if pdfs else None,
            "events": nombre_events(carpeta)}


@app.put("/api/classes/{a}/{c}")
def modifica_classe(a: str, c: str, canvis: CanvisClasse):
    actual = llig_classe(a, c)
    nous = canvis.model_dump(exclude_unset=True)
    if "apunts" in nous and sorted(nous["apunts"]) != sorted(actual["apunts"]):
        raise HTTPException(400, "L'ordre ha de tindre les mateixes fotos")
    if "fonts" in nous:
        ids = [f["id"] for f in nous["fonts"]]
        if len(set(ids)) != len(ids):
            raise HTTPException(400, "Hi ha una font repetida")
        for f in nous["fonts"]:
            carpeta = dins(carpeta_assig(a) / "fonts", f["id"])
            for tema in f["temes"]:
                dins(carpeta, tema)
    return desa_classe(a, c, **nous)


@app.post("/api/classes/{a}/{c}/apunts")
async def puja_apunts(a: str, c: str, fitxers: list[UploadFile] = File(...)):
    carpeta = carpeta_classe(a, c) / "apunts"
    if any(Path(f.filename or "").suffix.lower() not in APUNTS for f in fitxers):
        raise HTTPException(400, "Els apunts han de ser JPG, PNG, WebP o PDF")
    apunts = llig_classe(a, c)["apunts"]
    for f in fitxers:
        nom = nom_lliure(carpeta, f.filename)
        (carpeta / nom).write_bytes(await f.read())
        apunts.append(nom)
    return desa_classe(a, c, apunts=apunts)


@app.delete("/api/classes/{a}/{c}/apunts/{nom}")
def lleva_apunt(a: str, c: str, nom: str):
    dins(carpeta_classe(a, c) / "apunts", nom).unlink()
    apunts = [n for n in llig_classe(a, c)["apunts"] if n != nom]
    return desa_classe(a, c, apunts=apunts)


@app.get("/api/fitxer/{a}/{ruta:path}")
def fitxer(a: str, ruta: str):
    return FileResponse(dins(carpeta_assig(a), ruta))


# ---------- Claude ----------

def ordre_claude(missatge, sessio=None):
    ordre = ["claude", "-p", missatge, "--output-format", "stream-json", "--verbose",
             "--permission-mode", "bypassPermissions"]
    if sessio:
        ordre += ["--resume", sessio]
    if os.environ.get("LEMA_MODEL"):
        ordre += ["--model", os.environ["LEMA_MODEL"]]
    # Sense terminal no pot preguntar amb l'eina: escriu les preguntes i acaba el torn.
    return ordre + ["--disallowedTools", "AskUserQuestion"]


def prompt_classe(a, dades):
    base = f"dades/assignatures/{a}"
    carpeta = f"{base}/classes/{dades['id']}"
    fonts = []
    for f in dades["fonts"]:
        nom = llig(carpeta_assig(a) / "fonts" / f["id"] / "font.json")["nom"]
        temes = ", ".join(f"`{t}`" for t in f["temes"]) or "no ho sap; mira l'índex"
        fonts.append(f"  - {nom}: `{base}/fonts/{f['id']}`. "
                     f"{'Temes' if len(f['temes']) > 1 else 'Tema'} on és la classe: {temes}.")
    valors = {
        "assignatura": ASSIGNATURES[a],
        "carpeta": carpeta,
        "carpeta_assig": base,
        "fonts": "\n".join(fonts),
        "apunts": "\n".join(f"  {i}. `{carpeta}/apunts/{n}`"
                            for i, n in enumerate(dades["apunts"], 1)),
        "nota": dades["nota"].strip() or "cap",
        # De la carpeta de la classe a l'arrel del repositori hi ha cinc nivells.
        "plantilla": "../../../../../plantilla-base",
    }
    plantilla = (ARREL / "web" / "prompt.md").read_text(encoding="utf-8")
    return re.sub(r"\{(\w+)\}", lambda m: valors.get(m.group(1), m.group(0)), plantilla)


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


async def executa(a, c, missatge, sessio=None):
    """Una crida a Claude Code: llig el que fa i ho resumeix a events.jsonl."""
    carpeta = carpeta_classe(a, c)
    registre = carpeta / "registre"
    registre.mkdir(exist_ok=True)
    nom = datetime.now().strftime("%Y%m%d-%H%M%S")
    estat, vistos, tokens, final = "esperant", set(), 0, None
    try:
        with open(registre / f"claude-{nom}.jsonl", "w", encoding="utf-8") as cru, \
             open(registre / f"claude-{nom}.err", "w", encoding="utf-8") as err:
            proc = await asyncio.create_subprocess_exec(
                *ordre_claude(missatge, sessio), cwd=ARREL,
                stdout=asyncio.subprocess.PIPE, stderr=err, limit=64 * 2**20)
            processos[(a, c)] = proc
            async for linia in proc.stdout:
                cru.write(linia.decode("utf-8", "replace"))
                try:
                    m = json.loads(linia)
                except ValueError:
                    continue
                tipus = m.get("type")
                if m.get("session_id"):
                    sessio = m["session_id"]
                if tipus == "assistant":
                    msg = m.get("message", {})
                    if msg.get("id") not in vistos:  # un missatge pot arribar en diverses línies
                        vistos.add(msg.get("id"))
                        tokens += suma_tokens(msg.get("usage", {}))
                        afegeix_event(carpeta, t="tokens", n=tokens)
                    for bloc in msg.get("content", []):
                        if bloc.get("type") == "text" and bloc["text"].strip():
                            for n in MARCA_PAS.findall(bloc["text"]):
                                desa_classe(a, c, pas=int(n))
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
        if (a, c) in aturats:
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
    total = llig(carpeta / "classe.json").get("tokens", 0) + tokens
    afegeix_event(carpeta, t="fi", estat=estat, tokens=tokens,
                  durada=(final or {}).get("duration_ms"))
    desa_classe(a, c, estat=estat, sessio=sessio, tokens=total)
    processos.pop((a, c), None)
    aturats.discard((a, c))


def en_segon_pla(corrutina):
    tasca = asyncio.create_task(corrutina)
    tasques.add(tasca)
    tasca.add_done_callback(tasques.discard)


@app.post("/api/classes/{a}/{c}/passa")
async def passa_a_net(a: str, c: str):
    dades = llig_classe(a, c)
    if (a, c) in processos:
        raise HTTPException(409, "Ja està en marxa")
    if not dades["apunts"]:
        raise HTTPException(400, "Falten les fotos dels apunts")
    if not dades["fonts"] or not all((carpeta_assig(a) / "fonts" / f["id"] / "font.json").exists()
                                     for f in dades["fonts"]):
        raise HTTPException(400, "Falta triar la font")
    afegeix_event(carpeta_classe(a, c), t="inici")
    processos[(a, c)] = None  # reservat fins que arranca el procés
    desa_classe(a, c, estat="en_marxa", pas=None, sessio=None)
    en_segon_pla(executa(a, c, prompt_classe(a, dades)))
    return {"ok": True}


@app.post("/api/classes/{a}/{c}/respon")
async def respon(a: str, c: str, text: str = Form(""),
                 fitxers: list[UploadFile] | None = File(None)):
    dades = llig_classe(a, c)
    if (a, c) in processos:
        raise HTTPException(409, "Claude encara està treballant")
    if not dades["sessio"]:
        raise HTTPException(400, "Encara no hi ha cap conversa: passa-la a net primer")
    carpeta = carpeta_classe(a, c)
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
        rutes = ", ".join(f"`dades/assignatures/{a}/classes/{c}/adjunts/{n}`" for n in adjunts)
        missatge += f"\n\nFitxers adjunts: {rutes}"
    afegeix_event(carpeta, t="usuari", text=text.strip(), adjunts=adjunts)
    processos[(a, c)] = None
    desa_classe(a, c, estat="en_marxa")
    en_segon_pla(executa(a, c, missatge, dades["sessio"]))
    return {"ok": True}


@app.post("/api/classes/{a}/{c}/atura")
def atura(a: str, c: str):
    proc = processos.get((a, c))
    if proc is None:
        raise HTTPException(409, "No està en marxa")
    aturats.add((a, c))
    proc.terminate()
    return {"ok": True}


@app.get("/api/classes/{a}/{c}/events")
async def events(a: str, c: str, des_de: int = 0):
    ruta = carpeta_classe(a, c) / "registre" / "events.jsonl"

    def linies():
        # Només les línies acabades: la darrera pot estar escrivint-se.
        return ruta.read_text(encoding="utf-8").split("\n")[:-1] if ruta.exists() else []

    async def flux():
        vistes = des_de
        while True:
            en_marxa = (a, c) in processos
            noves = linies()
            for linia in noves[vistes:]:
                yield f"data: {linia}\n\n"
            vistes = len(noves)
            if not en_marxa:
                yield "event: tancat\ndata: {}\n\n"
                return
            await asyncio.sleep(0.5)

    return StreamingResponse(flux(), media_type="text/event-stream")


@app.middleware("http")
async def sense_cache(request, call_next):
    """Que el navegador sempre agafe la versió nova de la web després d'un canvi."""
    resposta = await call_next(request)
    if not request.url.path.startswith("/api/"):
        resposta.headers["Cache-Control"] = "no-cache"
    return resposta


app.mount("/", StaticFiles(directory=ARREL / "web" / "static", html=True), name="web")
