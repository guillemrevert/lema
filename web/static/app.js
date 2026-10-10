"use strict";

// Rutes: #/ (nova classe) i #/classe/<assignatura>/<classe>/<materials|progres|resultat>.

const PASSOS = ["Preparació", "Lectura general", "Divisió en blocs", "Per a cada bloc",
  "Punt de control", "Escriure", "Muntatge i PDF"];
const ESTATS = { nova: "Sense començar", en_marxa: "En marxa", esperant: "Esperant-te",
  acabada: "Acabada", aturada: "Aturada", error: "Error" };
// Com es diu cada eina de Claude al registre. null: no s'ensenya.
const VERBS = { Read: "Llig", Write: "Escriu", Edit: "Edita", MultiEdit: "Edita", NotebookEdit: "Edita",
  Bash: "Executa", Glob: "Busca", Grep: "Busca", Task: "Delega", Agent: "Delega",
  WebFetch: "Consulta", WebSearch: "Cerca", TodoWrite: null };
const ICONES = {
  mes: '<path d="M12 5v14M5 12h14"/>',
  puja: '<path d="M12 15V4"/><path d="M7 9l5-5 5 5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  creu: '<path d="M6 6l12 12M18 6L6 18"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  clip: '<path d="M21 11.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  avis: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><path d="M12 16.5v.01"/>',
  play: '<path d="M7 5l12 7-12 7z" fill="currentColor" stroke="none"/>',
  stop: '<rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" stroke="none"/>',
};

const lateral = document.getElementById("lateral");
const principal = document.getElementById("principal");
let assignatures = [];
let flux = null;      // EventSource del registre de Claude
let rellotge = null;  // interval del temps del torn

if (window.marked) {
  // Els missatges de Claude no poden injectar HTML a la pàgina.
  marked.use({ renderer: { html: (t) => escapa(typeof t === "string" ? t : t.text) } });
}

// ---------- Utilitats ----------

function h(tag, props, ...fills) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "class") el.className = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const f of fills.flat(Infinity)) {
    if (f != null && f !== false) el.append(f instanceof Node ? f : String(f));
  }
  return el;
}

function icona(nom, mida = 18, gruix = 1.8) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [k, v] of Object.entries({ width: mida, height: mida, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", "stroke-width": gruix, "stroke-linecap": "round", "stroke-linejoin": "round",
    "aria-hidden": "true" })) s.setAttribute(k, v);
  s.innerHTML = ICONES[nom];
  return s;
}

function escapa(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function api(ruta, opcions = {}) {
  const r = await fetch(ruta, opcions);
  const dades = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(dades.detail || r.statusText);
  return dades;
}

const ambJson = (method, dades) => ({
  method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(dades),
});

function avisa(text) {
  const t = h("div", { class: "toast", role: "alert" }, text);
  document.body.append(t);
  setTimeout(() => t.remove(), 6000);
}

function urlFitxer(a, ...parts) {
  return `/api/fitxer/${a}/` + parts.flatMap((p) => p.split("/")).map(encodeURIComponent).join("/");
}

const dataLlarga = (iso) => iso.split("-").reverse().join("/");
const dataCurta = (iso) => iso.split("-").reverse().slice(0, 2).join("/");
const nomClasse = (c) => c.titol || `Classe del ${dataCurta(c.data)}`;
const hora = (ts) => new Date(ts).toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" });
const tokens = (n) => (n || 0).toLocaleString("ca-ES");

function durada(ms) {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
}

function textEstat(c) {
  if (c.estat === "en_marxa" && c.pas != null) return `En marxa · pas ${c.pas}`;
  return ESTATS[c.estat] || c.estat;
}

function markdown(text) {
  const div = h("div", { class: "md" });
  if (!window.marked) {
    div.textContent = text;
    div.style.whiteSpace = "pre-wrap";
    return div;
  }
  div.innerHTML = marked.parse(text, { breaks: true });
  if (window.renderMathInElement) {
    renderMathInElement(div, {
      throwOnError: false,
      delimiters: [
        { left: "$$", right: "$$", display: true }, { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false }, { left: "\\(", right: "\\)", display: false },
      ],
    });
  }
  return div;
}

// Les línies «PAS n» i «ESTAT: …» són per a la web: no cal ensenyar-les.
const netejaText = (text) => text.replace(/^\W*PAS\s+\d\b.*$/gm, "").replace(/^\W*ESTAT:.*$/gim, "").trim();

function camp(etiqueta, control, extra) {
  return h("div", { class: "camp" }, h("label", { for: control.id }, etiqueta, extra), control);
}

// ---------- Navegació ----------

function ruta() {
  const [vista, a, c, pestanya] = location.hash.replace(/^#\/?/, "").split("/");
  return { vista, a, c, pestanya };
}

function anar(desti) {
  if (location.hash === desti) pinta();
  else location.hash = desti;
}

function tancaFlux() {
  if (flux) flux.close();
  flux = null;
  clearInterval(rellotge);
}

async function pinta() {
  tancaFlux();
  try {
    assignatures = await api("/api/assignatures");
    const r = ruta();
    pintaLateral(r);
    if (r.vista === "classe" && r.a && r.c) await pintaClasse(r.a, r.c, r.pestanya);
    else pintaNova();
  } catch (e) {
    principal.replaceChildren(h("div", { class: "avis roig" }, icona("avis", 22), h("div", {}, e.message)));
  }
}

window.addEventListener("hashchange", pinta);
pinta();

// ---------- Lateral ----------

function pintaLateral(r) {
  lateral.replaceChildren(...[
    h("a", { href: "#/", class: "logo" },
      h("span", { class: "logo-nom" }, "LEMA"),
      h("span", { class: "logo-sub" }, "Lector i Editor de Manuscrits Acadèmics")),
    h("a", { href: "#/", class: "boto-sec" + (r.vista === "classe" ? "" : " actiu") },
      icona("mes", 16, 2.2), "Nova classe"),
    assignatures.map((as) => h("div", { class: "grup" },
      h("h2", {}, as.nom),
      as.classes.length
        ? as.classes.map((c) => {
          const actiu = r.a === as.id && r.c === c.id;
          return h("a", { href: `#/classe/${as.id}/${c.id}`, class: "classe-nav" + (actiu ? " actiu" : ""),
            "aria-current": actiu ? "page" : null },
          h("span", { class: "classe-nom" }, nomClasse(c)),
          h("span", { class: `estat estat-${c.estat}` }, h("span", { class: "punt" }), textEstat(c)));
        })
        : h("p", { class: "buit" }, "Encara no hi ha classes."))),
  ].flat());
}

// ---------- Nova classe ----------

function pintaNova() {
  const avui = new Date();
  const iso = new Date(avui - avui.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  let ultima = null;
  try { ultima = localStorage.getItem("lema-assignatura"); } catch { /* sense emmagatzematge */ }

  const assig = h("select", { id: "assig" },
    assignatures.map((a) => h("option", { value: a.id, selected: a.id === ultima }, a.nom)));
  const data = h("input", { id: "data", type: "date", value: iso, required: true });
  const titol = h("input", { id: "titol", type: "text", placeholder: "p. ex. Cicles i transposicions" });
  const boto = h("button", { type: "submit", class: "boto" }, "Crea la classe");

  const form = h("form", {
    class: "targeta",
    onsubmit: async (e) => {
      e.preventDefault();
      boto.disabled = true;
      try {
        const c = await api("/api/classes", ambJson("POST",
          { assignatura: assig.value, data: data.value, titol: titol.value }));
        try { localStorage.setItem("lema-assignatura", assig.value); } catch { /* res */ }
        anar(`#/classe/${c.assignatura}/${c.id}/materials`);
      } catch (err) {
        avisa(err.message);
        boto.disabled = false;
      }
    },
  },
  h("div", { class: "camps" },
    camp("Assignatura", assig),
    camp("Dia de la classe", data),
    camp("Títol ", titol, h("span", { class: "opcional" }, "(opcional)"))),
  h("div", { class: "dreta" }, boto));

  const passos = [
    ["Materials", "Puja les fotos dels apunts i tria la font: apunts del professor, diapositives, un llibre o apunts d'un altre alumne."],
    ["Passa a net", "Claude llig els apunts, busca cada bloc a la font i s'atura una sola vegada per preguntar-te el que la font no resol."],
    ["Resultat", "El PDF amb la teua notació i les correccions marcades. Si hi veus alguna cosa malament, li ho dius i ho corregeix."],
  ];
  principal.replaceChildren(h("div", { class: "contingut estret" },
    h("div", { class: "titol" },
      h("h1", {}, "Nova classe"),
      h("p", { class: "subtitol" }, "Tria l'assignatura i el dia. Després hi puges les fotos dels apunts i la font.")),
    form,
    h("section", { class: "titol", "aria-labelledby": "com-va" },
      h("h2", { id: "com-va", class: "seccio-titol" }, "Com va"),
      h("ol", { class: "com-va" }, passos.map(([nom, text], i) => h("li", {},
        h("span", { class: "num" }, i + 1), h("strong", {}, nom), h("span", { class: "detall" }, text)))))));
}

// ---------- Classe ----------

async function pintaClasse(a, c, pestanya) {
  const classe = await api(`/api/classes/${a}/${c}`);
  const assig = assignatures.find((x) => x.id === a);
  if (!pestanya) {
    pestanya = { nova: "materials", acabada: "resultat" }[classe.estat] || "progres";
  }
  const cos = h("div", { class: "contingut" }, capcalera(classe, assig, pestanya));
  if (pestanya === "progres") pintaProgres(cos, classe);
  else if (pestanya === "resultat") await pintaResultat(cos, classe);
  else pintaMaterials(cos, classe, assig);
  principal.replaceChildren(cos);
}

function capcalera(classe, assig, pestanya) {
  const base = `#/classe/${classe.assignatura}/${classe.id}`;
  const actives = { materials: true, progres: classe.estat !== "nova", resultat: Boolean(classe.pdf) };
  const noms = { materials: "Materials", progres: "Progrés", resultat: "Resultat" };
  return h("header", { class: "capcalera" },
    h("div", {},
      h("span", { class: "detall" }, assig.nom + (classe.titol ? ` · ${dataLlarga(classe.data)}` : "")),
      h("h1", {}, classe.titol || `Classe del ${dataLlarga(classe.data)}`)),
    h("nav", { class: "pestanyes", "aria-label": "Seccions de la classe" },
      Object.entries(noms).map(([id, nom]) => (actives[id]
        ? h("a", { href: `${base}/${id}`, class: id === pestanya ? "actiu" : null,
          "aria-current": id === pestanya ? "page" : null }, nom)
        : h("span", { "aria-disabled": "true" }, nom)))));
}

// ---------- Materials ----------

function pintaMaterials(cos, classe, assig) {
  const bloquejat = classe.estat === "en_marxa";
  const desa = async (canvis) => {
    try {
      await api(`/api/classes/${classe.assignatura}/${classe.id}`, ambJson("PUT", canvis));
    } catch (e) {
      avisa(e.message);
    }
  };
  if (bloquejat) {
    cos.append(h("div", { class: "avis blau" }, icona("avis", 22),
      h("div", {}, "Claude està treballant amb estos materials. Els podràs canviar quan pare.")));
  }
  cos.append(
    seccioApunts(classe, bloquejat),
    seccioFont(classe, assig, desa, bloquejat),
    seccioNota(classe, desa, bloquejat),
    barraPassa(classe, assig),
  );
}

function seccioApunts(classe, bloquejat) {
  const a = classe.assignatura;
  const c = classe.id;

  async function puja(fitxers) {
    if (!fitxers.length) return;
    const f = new FormData();
    for (const x of fitxers) f.append("fitxers", x);
    try {
      await api(`/api/classes/${a}/${c}/apunts`, { method: "POST", body: f });
      pinta();
    } catch (e) {
      avisa(e.message);
    }
  }

  let arrossegada = null;  // índex de la foto que s'està movent
  const fotos = classe.apunts.map((nom, i) => {
    const url = urlFitxer(a, "classes", c, "apunts", nom);
    const pdf = nom.toLowerCase().endsWith(".pdf");
    const foto = h("div", {
      class: "foto",
      draggable: bloquejat ? null : "true",
      ondragstart: (e) => { arrossegada = i; e.dataTransfer.effectAllowed = "move"; },
      ondragover: (e) => { if (arrossegada !== null) { e.preventDefault(); foto.classList.add("sobre"); } },
      ondragleave: () => foto.classList.remove("sobre"),
      ondrop: async (e) => {
        foto.classList.remove("sobre");
        if (arrossegada === null) return;  // fitxers de fora: els agafa la secció
        e.preventDefault();
        e.stopPropagation();
        const ordre = [...classe.apunts];
        ordre.splice(i, 0, ...ordre.splice(arrossegada, 1));
        arrossegada = null;
        try {
          await api(`/api/classes/${a}/${c}`, ambJson("PUT", { apunts: ordre }));
          pinta();
        } catch (err) {
          avisa(err.message);
        }
      },
      ondragend: () => { arrossegada = null; },
    },
    h("a", { href: url, target: "_blank", class: "miniatura", draggable: "false" },
      pdf ? icona("doc", 36) : h("img", { src: url, alt: `Pàgina ${i + 1} dels apunts`, loading: "lazy", draggable: "false" }),
      h("span", { class: "pag" }, `pàg. ${i + 1}`)),
    h("div", { class: "peu-foto" },
      h("span", { class: "nom-fitxer", title: nom }, nom),
      bloquejat ? null : h("button", {
        type: "button", class: "boto-icona", "aria-label": `Lleva ${nom}`,
        onclick: async () => {
          try {
            await api(`/api/classes/${a}/${c}/apunts/${encodeURIComponent(nom)}`, { method: "DELETE" });
            pinta();
          } catch (e) {
            avisa(e.message);
          }
        },
      }, icona("creu"))));
    return foto;
  });

  const input = h("input", { type: "file", id: "fotos", class: "ocult", multiple: true,
    accept: "image/jpeg,image/png,image/webp,application/pdf", onchange: (e) => puja(e.target.files) });
  const seccio = h("section", {
    class: "targeta", "aria-labelledby": "t-apunts",
    ondragover: (e) => {
      if (!bloquejat && arrossegada === null && e.dataTransfer.types.includes("Files")) {
        e.preventDefault();
        seccio.classList.add("arrossegant");
      }
    },
    ondragleave: (e) => { if (!seccio.contains(e.relatedTarget)) seccio.classList.remove("arrossegant"); },
    ondrop: (e) => {
      seccio.classList.remove("arrossegant");
      if (!bloquejat && arrossegada === null && e.dataTransfer.files.length) {
        e.preventDefault();
        puja(e.dataTransfer.files);
      }
    },
  },
  h("div", { class: "cap-seccio" },
    h("h2", { id: "t-apunts" }, "Apunts"),
    h("p", {}, classe.apunts.length > 1
      ? "Les fotos de la classe, en ordre. Arrossega-les per canviar-lo."
      : "Les fotos de la classe, en ordre.")),
  h("div", { class: "graella-fotos" }, fotos,
    bloquejat ? null : h("label", { for: "fotos", class: "afegeix" },
      icona("puja", 26), h("strong", {}, "Afegeix fotos"), h("span", {}, "o arrossega-les ací"))),
  input,
  h("p", { class: "nota-petita" }, "JPG, PNG, WebP o PDF."));
  return seccio;
}

function seccioFont(classe, assig, desa, bloquejat) {
  const seccio = h("section", { class: "targeta", "aria-labelledby": "t-font" });
  // Les fonts triades, amb els temes (PDF) de cada una. Les que ja no existeixen no compten.
  const triades = classe.fonts.filter((t) => assig.fonts.some((f) => f.id === t.id));
  let nova = !assig.fonts.length;  // el formulari d'una font nova, obert

  async function canvia(fonts) {
    await desa({ fonts });
    pinta();
  }

  function opcio(titol, detall, actiu, onchange, cos) {
    return h("div", { class: "opcio" + (actiu ? " triada" : "") },
      h("label", { class: "opcio-cap" },
        h("input", { type: "checkbox", checked: actiu, disabled: bloquejat, onchange }),
        h("span", {}, h("strong", {}, titol), h("span", { class: "detall" }, detall))),
      actiu && cos ? cos() : null);
  }

  function cosFont(f) {
    const temes = triades.find((t) => t.id === f.id).temes;
    const marca = (nom, si) => canvia(triades.map((t) => (t.id !== f.id ? t : {
      id: t.id,
      // En l'ordre de la font, no en el que s'han marcat.
      temes: f.pdfs.map((p) => p.nom).filter((n) => (n === nom ? si : temes.includes(n))),
    })));
    return h("div", { class: "opcio-cos" },
      h("fieldset", { class: "temes" },
        h("legend", {}, "En quins temes de la font és la classe? ", h("span", { class: "opcional" }, "(opcional)")),
        h("ul", { class: "pdfs" }, f.pdfs.map((p) => h("li", {},
          h("label", { class: "nom" },
            h("input", { type: "checkbox", checked: temes.includes(p.nom), disabled: bloquejat,
              onchange: (e) => marca(p.nom, e.target.checked) }),
            p.nom),
          p.amb_text
            ? h("span", { class: "detall" }, `${p.pagines} p. · text extret`)
            : h("span", { class: "detall avis-text" }, "sense text: es llegirà com a imatge"))))),
      h("p", { class: "nota-petita" },
        "Si no en marques cap, Claude mirarà l'índex. Si els marques, no llig pàgines que no calen."));
  }

  function cosNova() {
    const nom = h("input", { id: "fn-nom", type: "text", required: true, placeholder: "p. ex. Professor" });
    const que = h("input", { id: "fn-que", type: "text", required: true, placeholder: "p. ex. Apunts del professor, temes 1 a 4" });
    const don = h("input", { id: "fn-don", type: "text", placeholder: "p. ex. Aula Virtual, setmana 2" });
    const triats = h("span", {}, "o arrossega'ls ací. Se n'extrau el text i l'índex en pujar-los.");
    const pdfs = h("input", { id: "fn-pdfs", type: "file", class: "ocult", multiple: true, accept: "application/pdf",
      onchange: () => { triats.textContent = [...pdfs.files].map((f) => f.name).join(", "); } });
    const boto = h("button", { type: "submit", class: "boto" }, "Puja la font");
    const zona = h("label", { for: "fn-pdfs", class: "afegeix ample",
      ondragover: (e) => e.preventDefault(),
      ondrop: (e) => {
        e.preventDefault();
        pdfs.files = e.dataTransfer.files;
        pdfs.dispatchEvent(new Event("change"));
      } },
    icona("puja", 26), h("span", {}, h("strong", {}, "Tria els PDF de la font"), triats));
    return h("form", {
      class: "opcio-cos",
      onsubmit: async (e) => {
        e.preventDefault();
        if (!pdfs.files.length) { avisa("Tria almenys un PDF"); return; }
        const f = new FormData();
        f.append("nom", nom.value);
        f.append("que_es", que.value);
        f.append("origen", don.value);
        for (const x of pdfs.files) f.append("fitxers", x);
        boto.disabled = true;
        boto.textContent = "Pujant i extraient el text…";
        try {
          const font = await api(`/api/assignatures/${classe.assignatura}/fonts`, { method: "POST", body: f });
          await canvia([...triades, { id: font.id, temes: [] }]);
        } catch (err) {
          avisa(err.message);
          boto.disabled = false;
          boto.textContent = "Puja la font";
        }
      },
    },
    zona, pdfs,
    h("div", { class: "camps" }, camp("Nom curt", nom), camp("Què és", que), camp("D'on surt", don)),
    h("div", { class: "accions" },
      h("span", { class: "nota-petita" }, "Es guarda a l'assignatura: la podràs triar en les classes següents."),
      boto));
  }

  function pintaSeccio() {
    seccio.replaceChildren(
      h("div", { class: "cap-seccio" },
        h("h2", { id: "t-font" }, "Fonts"),
        h("p", {}, "D'on es reconstrueix cada bloc. Pots marcar-ne més d'una: si un bloc és a més d'una i no coincideixen, Claude en tria una i t'ho diu en una noteta.")),
      h("fieldset", { class: "opcions" },
        h("legend", { class: "ocult" }, "Tria les fonts"),
        assig.fonts.map((f) => {
          const pagines = f.pdfs.reduce((s, p) => s + p.pagines, 0);
          const detall = [f.que_es, `${f.pdfs.length} PDF · ${pagines} pàgines · índex de ${f.entrades} entrades`]
            .filter(Boolean).join(" · ");
          return opcio(f.nom, detall, triades.some((t) => t.id === f.id),
            (e) => canvia(e.target.checked
              ? [...triades, { id: f.id, temes: [] }]
              : triades.filter((t) => t.id !== f.id)),
            () => cosFont(f));
        }),
        bloquejat ? null : opcio("Puja una font nova",
          "PDF del professor, diapositives, un capítol del llibre o apunts d'un altre alumne.", nova,
          (e) => { nova = e.target.checked; pintaSeccio(); }, cosNova)));
  }

  pintaSeccio();
  return seccio;
}

function seccioNota(classe, desa, bloquejat) {
  const text = h("textarea", { id: "nota", rows: 3, disabled: bloquejat,
    placeholder: "p. ex. La demostració del teorema la tinc en una altra foto. El professor va canviar una hipòtesi a propòsit.",
    onchange: (e) => desa({ nota: e.target.value }) });
  text.value = classe.nota || "";
  return h("section", { class: "targeta" },
    h("h2", {}, "Per a Claude ", h("span", { class: "opcional" }, "(opcional)")),
    h("label", { for: "nota", class: "detall" }, "Alguna cosa que haja de saber abans de començar."),
    text);
}

function barraPassa(classe, assig) {
  const a = classe.assignatura;
  const c = classe.id;
  const fonts = classe.fonts
    .map((t) => ({ ...t, nom: assig.fonts.find((f) => f.id === t.id)?.nom }))
    .filter((t) => t.nom);
  const n = classe.apunts.length;
  let falta = null;
  if (!n) falta = "Falten les fotos dels apunts.";
  else if (!fonts.length) falta = "Falta triar la font.";
  const enMarxa = classe.estat === "en_marxa";
  const repetir = classe.estat !== "nova";

  const boto = h("button", {
    type: "button", class: "boto gran", disabled: Boolean(falta) || enMarxa,
    onclick: async () => {
      if (repetir && !confirm("Començarà una conversa nova i Claude tornarà a fer la classe des del principi. Continuar?")) return;
      boto.disabled = true;
      try {
        await api(`/api/classes/${a}/${c}/passa`, { method: "POST" });
        anar(`#/classe/${a}/${c}/progres`);
      } catch (e) {
        avisa(e.message);
        boto.disabled = false;
      }
    },
  }, icona("play", 16), repetir ? "Torna a passar a net" : "Passa a net");

  const resum = falta || [
    `${n} ${n === 1 ? "foto" : "fotos"}`,
    (fonts.length > 1 ? "Fonts: " : "Font: ") +
      fonts.map((t) => t.nom + (t.temes.length ? ` (${t.temes.join(", ")})` : "")).join(", "),
    "Es fa en una conversa nova de Claude Code",
  ].join(" · ");
  return h("div", { class: "barra-accio" },
    h("div", {}, h("strong", {}, enMarxa ? "Claude hi està treballant" : falta ? "Encara no" : "A punt per passar a net"),
      h("span", {}, resum)),
    boto);
}

// ---------- Progrés ----------

function estatPas(i, pas, estat) {
  if (estat === "acabada") return "fet";
  if (pas == null) return "pendent";
  if (i < pas) return "fet";
  if (i === pas) return estat === "en_marxa" ? "actual" : "aturat";
  return "pendent";
}

function pintaPassos(llista, pas, estat) {
  llista.replaceChildren(...PASSOS.map((nom, i) => {
    const e = estatPas(i, pas, estat);
    return h("li", { class: e, "aria-current": e === "actual" || e === "aturat" ? "step" : null },
      h("span", { class: "cercle" }, e === "fet" ? icona("check", 12, 3.2) : i),
      nom,
      e === "aturat" && estat === "esperant" ? h("span", { class: "sufix" }, "· esperant-te") : null);
  }));
}

function avisEstat(classe) {
  const base = `#/classe/${classe.assignatura}/${classe.id}`;
  const avisos = {
    esperant: ["taronja", "Claude s'ha aturat i t'espera", "Llig el seu últim missatge i respon-li baix perquè continue."],
    aturada: ["gris", "Aturada", "Pots escriure-li baix perquè continue on ho havia deixat."],
    error: ["roig", "Hi ha hagut un error", "Mira l'últim missatge. Pots escriure-li baix perquè ho torne a intentar."],
  };
  if (classe.estat === "acabada") {
    return h("div", { class: "avis blau" }, icona("check", 22, 2.4),
      h("div", {}, h("strong", {}, "Acabada"),
        h("span", {}, "El PDF és a ", h("a", { href: `${base}/resultat` }, "Resultat"), ".")));
  }
  const avis = avisos[classe.estat];
  if (!avis) return null;
  return h("div", { class: `avis ${avis[0]}`, role: "status" }, icona("avis", 22, 2),
    h("div", {}, h("strong", {}, avis[1]), h("span", {}, avis[2])));
}

function pintaProgres(cos, classe) {
  const a = classe.assignatura;
  const c = classe.id;
  const enMarxa = classe.estat === "en_marxa";
  const passos = h("ol", { class: "passos", "aria-label": "Passos" });
  pintaPassos(passos, classe.pas, classe.estat);

  const feed = h("div", { class: "feed", "aria-live": "polite" });
  const treballant = enMarxa ? h("div", { class: "esperant-claude" }, h("span", { class: "gira" }), "Claude hi està treballant…") : null;
  const tempsEl = h("dd", {}, "—");
  const tokensEl = h("dd", {}, tokens(classe.tokens));

  cos.append(
    passos,
    avisEstat(classe),
    h("div", { class: "columnes" },
      h("div", { class: "col-principal" },
        h("section", { class: "targeta", "aria-labelledby": "t-feed" },
          h("h2", { id: "t-feed" }, "Què fa Claude"), feed, treballant),
        enMarxa || !classe.sessio ? null : caixaResposta(classe, classe.estat === "esperant"
          ? { titol: "La teua resposta", boto: "Envia i continua",
            placeholder: "P1: …\nP2: …" }
          : { titol: "Escriu-li a Claude", boto: "Envia", placeholder: "p. ex. Continua." })),
      h("aside", { class: "col-lateral" },
        h("section", { class: "targeta compacta", "aria-labelledby": "t-sessio" },
          h("h2", { id: "t-sessio" }, "Sessió"),
          h("dl", { class: "dades" },
            h("dt", {}, enMarxa ? "Temps" : "Últim torn"), tempsEl,
            h("dt", {}, "Tokens"), tokensEl,
            h("dt", {}, "Estat"), h("dd", { style: "font-family: var(--sans)" }, ESTATS[classe.estat])),
          enMarxa ? h("button", { type: "button", class: "boto-sec",
            onclick: async (e) => {
              e.currentTarget.disabled = true;
              try { await api(`/api/classes/${a}/${c}/atura`, { method: "POST" }); } catch (err) { avisa(err.message); }
            } }, icona("stop", 14), "Atura") : null))),
  );

  // Registre: primer el que ja hi havia (classe.events línies) i després el que arriba en directe.
  let rebuts = 0;
  let eines = null;     // la llista d'eines on van les línies seguides
  let iniciTorn = null;
  let tokensTorn = 0;

  const afegeix = (node) => {
    const baix = innerHeight + scrollY >= document.body.scrollHeight - 120;
    feed.append(node);
    if (baix && rebuts > classe.events) scrollTo(0, document.body.scrollHeight);
  };
  const liniaEina = (verb, detall, error) => {
    if (!eines) { eines = h("ul", { class: "eines" }); afegeix(eines); }
    eines.append(h("li", { class: error ? "error" : null },
      h("span", { class: "verb" }, verb), h("span", { class: "ruta" }, detall || "")));
  };

  function event(ev, viu) {
    if (!["eina", "error_eina", "tokens"].includes(ev.t)) eines = null;
    switch (ev.t) {
      case "inici":
        afegeix(h("div", { class: "separador" }, `Passa a net · ${hora(ev.ts)}`));
        iniciTorn = ev.ts;
        tokensTorn = 0;
        break;
      case "usuari":
        afegeix(h("div", { class: "usuari" },
          h("span", { class: "qui" }, `Tu · ${hora(ev.ts)}`),
          ev.text ? h("p", {}, ev.text) : null,
          ev.adjunts && ev.adjunts.length ? h("p", { class: "detall" }, "Adjunts: " + ev.adjunts.join(", ")) : null));
        iniciTorn = ev.ts;
        tokensTorn = 0;
        break;
      case "pas":
        afegeix(h("h3", { class: "titol-pas" }, `Pas ${ev.n} · ${PASSOS[ev.n] || ""}`));
        if (viu) pintaPassos(passos, ev.n, "en_marxa");
        break;
      case "text": {
        const text = netejaText(ev.text);
        if (text) afegeix(markdown(text));
        break;
      }
      case "eina": {
        const verb = ev.nom in VERBS ? VERBS[ev.nom] : ev.nom;
        if (verb !== null) liniaEina(verb, ev.detall);
        break;
      }
      case "error_eina":
        liniaEina("Error", ev.text, true);
        break;
      case "tokens":
        tokensTorn = ev.n;
        if (enMarxa) tokensEl.textContent = tokens(classe.tokens + tokensTorn);
        break;
      case "error":
        afegeix(h("div", { class: "avis roig" }, icona("avis", 20), markdown(ev.text)));
        break;
      case "fi":
        afegeix(h("p", { class: "fi-torn" }, [
          { esperant: "Torn acabat", acabada: "Acabat", aturada: "Aturat", error: "Acabat amb error" }[ev.estat] || "Torn acabat",
          ev.durada ? durada(ev.durada) : null,
          ev.tokens ? `${tokens(ev.tokens)} tokens` : null,
        ].filter(Boolean).join(" · ")));
        if (ev.durada) tempsEl.textContent = durada(ev.durada);
        if (viu) pinta();
        break;
      default:
        break;
    }
  }

  flux = new EventSource(`/api/classes/${a}/${c}/events`);
  flux.onmessage = (e) => {
    rebuts += 1;
    event(JSON.parse(e.data), rebuts > classe.events);
  };
  flux.addEventListener("tancat", tancaFlux);
  flux.onerror = tancaFlux;

  if (enMarxa) {
    rellotge = setInterval(() => {
      if (iniciTorn) tempsEl.textContent = durada(Date.now() - new Date(iniciTorn));
    }, 1000);
  }
}

function caixaResposta(classe, { titol, placeholder, boto }) {
  const a = classe.assignatura;
  const c = classe.id;
  const text = h("textarea", { id: "resposta", rows: 5, placeholder,
    onkeydown: (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) form.requestSubmit(); } });
  const triats = h("span", { class: "detall" });
  const fitxers = h("input", { type: "file", id: "adjunts", class: "ocult", multiple: true,
    onchange: () => { triats.textContent = [...fitxers.files].map((f) => f.name).join(", "); } });
  const envia = h("button", { type: "submit", class: "boto" }, boto);
  const form = h("form", {
    class: "targeta resposta",
    onsubmit: async (e) => {
      e.preventDefault();
      const f = new FormData();
      f.append("text", text.value);
      for (const x of fitxers.files) f.append("fitxers", x);
      envia.disabled = true;
      try {
        await api(`/api/classes/${a}/${c}/respon`, { method: "POST", body: f });
        anar(`#/classe/${a}/${c}/progres`);
      } catch (err) {
        avisa(err.message);
        envia.disabled = false;
      }
    },
  },
  h("label", { for: "resposta", class: "titol-caixa" }, titol),
  text,
  h("div", { class: "accions" },
    h("div", { class: "esquerra" },
      h("label", { for: "adjunts", class: "boto-sec" }, icona("clip"), "Adjunta fitxers"), fitxers, triats),
    envia));
  return form;
}

// ---------- Resultat ----------

async function pintaResultat(cos, classe) {
  const a = classe.assignatura;
  const c = classe.id;
  const url = (ruta) => urlFitxer(a, "classes", c, ruta);
  const tex = classe.fitxers.find((f) => f.endsWith(".tex") && !f.includes("/"));

  if (classe.pdf) {
    cos.append(h("section", { class: "targeta", "aria-labelledby": "t-pdf" },
      h("div", { class: "accions" },
        h("div", { class: "cap-seccio" },
          h("h2", { id: "t-pdf" }, classe.pdf),
          h("p", {}, "Amb la teua notació. Al marge, d'on ve cada bloc i les marques.")),
        h("div", { class: "esquerra" },
          h("a", { class: "boto", href: url(classe.pdf), target: "_blank" }, "Obre el PDF"),
          tex ? h("a", { class: "boto-sec", href: url(tex), download: tex }, "Descarrega el .tex") : null)),
      h("iframe", { class: "visor-pdf", src: `${url(classe.pdf)}?v=${Date.now()}`, title: classe.pdf })));
  }

  let informe = null;
  if (classe.fitxers.includes("informe.md")) {
    const r = await fetch(url("informe.md"));
    if (r.ok) informe = await r.text();
  }

  cos.append(h("div", { class: "columnes" },
    h("div", { class: "col-principal" },
      informe ? h("section", { class: "targeta", "aria-labelledby": "t-informe" },
        h("h2", { id: "t-informe" }, "Informe"), markdown(informe)) : null,
      classe.sessio ? caixaResposta(classe, {
        titol: "Hi ha alguna cosa malament?", boto: "Envia a Claude",
        placeholder: "p. ex. Definició 1.2: és r, no n. Teorema 1.4: posa-hi la demostració de la font.",
      }) : null),
    h("aside", { class: "col-lateral" },
      h("section", { class: "targeta compacta", "aria-labelledby": "t-fitxers" },
        h("h2", { id: "t-fitxers" }, "Fitxers"),
        h("ul", { class: "fitxers" }, classe.fitxers.map((f) => h("li", {},
          h("a", { href: url(f), target: "_blank" }, f))))),
      h("section", { class: "targeta compacta", "aria-labelledby": "t-sessio" },
        h("h2", { id: "t-sessio" }, "Sessió"),
        h("dl", { class: "dades" }, h("dt", {}, "Tokens"), h("dd", {}, tokens(classe.tokens)))))));
}
