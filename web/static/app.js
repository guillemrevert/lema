"use strict";

// Rutes: #/ (nova sessió), #/assignatura/<assignatura>/<quaderns|fonts>
// i #/sessio/<assignatura>/<sessió>/<materials|progres|resultat>, amb #/…/resultat/costat per a la vista dividida.

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
  esquerra: '<path d="M15 6l-6 6 6 6"/>',
  dreta: '<path d="M9 6l6 6-6 6"/>',
  avall: '<path d="M6 9l6 6 6-6"/>',
  llapis: '<path d="M4 20h4L18.5 9.5l-4-4L4 16z"/><path d="M13 7l4 4"/>',
};

const lateral = document.getElementById("lateral");
const principal = document.getElementById("principal");
let assignatures = [];
let flux = null;      // EventSource del registre de Claude
let rellotge = null;  // interval del temps del torn
let sortida = null;   // la posa «Costat a costat»: diu si el LaTeX té canvis sense desar
let hashAnterior = location.hash;

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
const nomSessio = (c) => c.titol || `Sessió del ${dataCurta(c.data)}`;
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

function llegeix(clau) {
  try { return localStorage.getItem(clau); } catch { return null; }  // sense emmagatzematge
}

function recorda(clau, valor) {
  try { localStorage.setItem(clau, valor); } catch { /* sense emmagatzematge */ }
}

// Noms curts per als PDF d'una font: sense l'extensió ni les paraules que tenen tots en comú
// («wuolah-premium-Tema-1-EA.pdf» → «Tema 1»). Si el que canvia és un número, es manté la paraula d'abans.
function nomsCurts(noms) {
  const paraules = noms.map((n) => n.replace(/\.pdf$/i, "").split(/[\s_-]+/).filter(Boolean));
  if (paraules.length < 2) return paraules.map((p) => p.join(" "));
  const comunes = (llistes) => {
    let k = 0;
    while (llistes.every((p) => k < p.length - 1 && p[k] === llistes[0][k])) k += 1;
    return k;
  };
  let davant = comunes(paraules);
  const darrere = comunes(paraules.map((p) => [...p].reverse()));
  if (davant && paraules.some((p) => /^\d/.test(p[davant] || ""))) davant -= 1;
  return paraules.map((p) => p.slice(davant, p.length - darrere).join(" ") || p.join(" "));
}

// ---------- Quaderns ----------

const nomQuadern = (assig, id) => assig.quaderns.find((t) => t.id === id)?.nom;

// El desplegable de quaderns de l'assignatura, amb el «+» per crear-ne un sense eixir del formulari.
// canvia(id) rep el quadern triat o el que s'acaba de crear. Cada sessió en té un (decisió 9): si encara
// no en té cap (les d'abans), el desplegable demana que en tries un.
function selectorQuadern(assig, triat, { id, disabled, canvia }) {
  const caixa = h("div", { class: "amb-boto" });
  const mes = h("button", { type: "button", class: "boto-icona", "aria-label": "Nou quadern", title: "Nou quadern",
    disabled, onclick: () => modeNou() }, icona("mes", 18, 2));

  function modeLlista() {
    caixa.replaceChildren(
      h("select", { id, disabled, onchange: (e) => { triat = e.target.value; canvia(triat); } },
        triat ? null : h("option", { value: "", selected: true, disabled: true },
          assig.quaderns.length ? "Tria el quadern" : "Encara no hi ha cap quadern: crea'n un amb el «+»"),
        assig.quaderns.map((t) => h("option", { value: t.id, selected: t.id === triat }, t.nom))),
      mes);
  }

  function modeNou() {
    const nom = h("input", { id, type: "text", placeholder: "p. ex. Tema 2. Anells · Pràctiques de laboratori", "aria-label": "Nom del quadern nou",
      onkeydown: (e) => {
        if (e.key === "Enter") { e.preventDefault(); crea(); }
        if (e.key === "Escape") { e.preventDefault(); modeLlista(); }
      } });
    const boto = h("button", { type: "button", class: "boto", onclick: () => crea() }, "Crea");
    async function crea() {
      if (!nom.value.trim()) { nom.focus(); return; }
      boto.disabled = true;
      try {
        const quadern = await api(`/api/assignatures/${assig.id}/quaderns`, ambJson("POST", { nom: nom.value }));
        // La llista torna del servidor, en el mateix ordre que tindrà a la barra lateral.
        assig.quaderns = (await api("/api/assignatures")).find((x) => x.id === assig.id).quaderns;
        triat = quadern.id;
        modeLlista();
        canvia(triat);
      } catch (err) {
        avisa(err.message);
        boto.disabled = false;
      }
    }
    caixa.replaceChildren(nom, boto, h("button", { type: "button", class: "boto-sec", onclick: modeLlista }, "Cancel·la"));
    nom.focus();
  }

  modeLlista();
  return caixa;
}

// ---------- Navegació ----------

function ruta() {
  const [vista, a, c, pestanya, sub] = location.hash.replace(/^#\/?/, "").split("/");
  return { vista, a, c, pestanya, sub };
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

// Adreces d'abans de quaderns i sessions (10/10/2026): #/classe/… i #/assignatura/<a>/temes.
const ADRECES_VELLES = [[/^#\/classe\//, "#/sessio/"], [/^(#\/assignatura\/[^/]+)\/temes$/, "$1/quaderns"]];

async function pinta() {
  for (const [vella, nova] of ADRECES_VELLES) {
    if (vella.test(location.hash)) {
      history.replaceState(null, "", location.hash.replace(vella, nova));
      break;
    }
  }
  tancaFlux();
  sortida = null;
  hashAnterior = location.hash;
  try {
    assignatures = await api("/api/assignatures");
    const r = ruta();
    pintaLateral(r);
    if (r.vista === "sessio" && r.a && r.c) await pintaSessio(r.a, r.c, r.pestanya, r.sub);
    else if (r.vista === "assignatura" && r.a) pintaAssignatura(r.a, r.c);
    else pintaNova();
  } catch (e) {
    principal.replaceChildren(h("div", { class: "avis roig" }, icona("avis", 22), h("div", {}, e.message)));
  }
}

// Si el LaTeX té canvis sense desar, abans d'eixir de la pàgina es pregunta.
const potsEixir = () => !sortida || !sortida()
  || confirm("Tens canvis al LaTeX sense desar. Si te'n vas, es perden. Te'n vas igualment?");

window.addEventListener("hashchange", () => {
  if (!potsEixir()) {
    history.replaceState(null, "", hashAnterior);  // et quedes on eres, sense tornar a pintar
    return;
  }
  pinta();
});
window.addEventListener("beforeunload", (e) => {
  if (sortida && sortida()) {
    e.preventDefault();
    e.returnValue = "";
  }
});
pinta();

// ---------- Lateral ----------

// Inicials d'una assignatura per a la barra plegada: «Anàlisi II» → «AII».
const inicials = (nom) => nom.split(/\s+/).map((p) => (/^[IVX]+$/.test(p) ? p : p[0])).join("").toUpperCase();

function grupsPlegats() {
  try { return new Set(JSON.parse(llegeix("lema-grups-plegats") || "[]")); } catch { return new Set(); }
}

function plegaLateral(si) {
  recorda("lema-lateral-plegada", si ? "1" : "0");
  pintaLateral(ruta());
  lateral.querySelector(".plega")?.focus();
}

function plegaGrup(id) {
  const plegats = grupsPlegats();
  if (plegats.has(id)) plegats.delete(id);
  else plegats.add(id);
  recorda("lema-grups-plegats", JSON.stringify([...plegats]));
  pintaLateral(ruta());
  lateral.querySelector(`[data-grup="${id}"]`)?.focus();
}

function pintaLateral(r) {
  const plegada = llegeix("lema-lateral-plegada") === "1";
  lateral.classList.toggle("plegada", plegada);
  // Plegada: el logo, el «+» de nova sessió i una inicial per assignatura.
  if (plegada) {
    lateral.replaceChildren(
      h("a", { href: "#/", class: "logo-mini", title: "LEMA", "aria-label": "LEMA" }, "L"),
      h("button", { type: "button", class: "plega", title: "Desplega la barra", "aria-label": "Desplega la barra lateral",
        "aria-expanded": "false", onclick: () => plegaLateral(false) }, icona("dreta", 16, 2)),
      h("a", { href: "#/", class: "inicial blau" + (r.vista ? "" : " actiu"), title: "Nova sessió", "aria-label": "Nova sessió" },
        icona("mes", 18, 2.2)),
      ...assignatures.map((as) => h("a", { href: `#/assignatura/${as.id}/quaderns`,
        class: "inicial" + (r.a === as.id ? " actiu" : ""), title: as.nom, "aria-label": as.nom }, inicials(as.nom))));
    return;
  }

  const plegats = grupsPlegats();
  const enllac = (as, c) => {
    const actiu = r.a === as.id && r.c === c.id;
    return h("a", { href: `#/sessio/${as.id}/${c.id}`, class: "classe-nav" + (actiu ? " actiu" : ""),
      "aria-current": actiu ? "page" : null },
    h("span", { class: "classe-nom" }, nomSessio(c)),
    h("span", { class: `estat estat-${c.estat}` }, h("span", { class: "punt" }), textEstat(c)));
  };
  // Les sessions de cada assignatura, agrupades pel quadern. Les que no en tenen, al final.
  const grups = (as) => {
    const llista = as.quaderns.map((t) => ({ nom: t.nom, sessions: as.sessions.filter((c) => c.quadern === t.id) }))
      .filter((g) => g.sessions.length);
    const sense = as.sessions.filter((c) => !as.quaderns.some((t) => t.id === c.quadern));
    if (sense.length) llista.push({ nom: llista.length ? "Sense quadern" : null, sessions: sense });
    return llista;
  };
  lateral.replaceChildren(...[
    h("div", { class: "cap-lateral" },
      h("a", { href: "#/", class: "logo" },
        h("span", { class: "logo-nom" }, "LEMA"),
        h("span", { class: "logo-sub" }, "Lector i Editor de Manuscrits Acadèmics")),
      h("button", { type: "button", class: "plega", title: "Plega la barra", "aria-label": "Plega la barra lateral",
        "aria-expanded": "true", onclick: () => plegaLateral(true) }, icona("esquerra", 16, 2))),
    h("a", { href: "#/", class: "boto-sec" + (r.vista ? "" : " actiu") },
      icona("mes", 16, 2.2), "Nova sessió"),
    assignatures.map((as) => {
      const plegat = plegats.has(as.id);
      const actiu = r.vista === "assignatura" && r.a === as.id;
      return h("div", { class: "grup" },
        h("div", { class: "cap-grup" },
          h("h2", {}, h("a", { href: `#/assignatura/${as.id}/quaderns`, class: actiu ? "actiu" : null,
            "aria-current": actiu ? "page" : null }, as.nom)),
          h("button", { type: "button", class: "plega-grup", "data-grup": as.id, "aria-expanded": plegat ? "false" : "true",
            "aria-label": `${plegat ? "Desplega" : "Plega"} ${as.nom}`, title: plegat ? "Desplega" : "Plega",
            onclick: () => plegaGrup(as.id) }, icona(plegat ? "dreta" : "avall", 14, 2))),
        plegat ? null : as.sessions.length
          ? grups(as).map((g) => [g.nom ? h("h3", { class: "quadern-nav" }, g.nom) : null, g.sessions.map((c) => enllac(as, c))])
          : h("p", { class: "buit" }, "Encara no hi ha sessions."));
    }),
  ].flat());
}

// ---------- Nova sessió ----------
// Nova sessió i Materials són la mateixa pàgina: dalt, la fitxa de la sessió. Abans de crear-la,
// davall hi ha «Com va»; després, els materials (vegeu pintaMaterials).

function pintaNova() {
  const passos = [
    ["Materials", "Puja les fotos dels apunts i tria la font: apunts del professor, diapositives, un llibre o apunts d'un altre alumne."],
    ["Passa a net", "Claude llig els apunts, busca cada bloc a la font i s'atura una sola vegada per preguntar-te el que la font no resol."],
    ["Resultat", "Els blocs de la sessió s'afegeixen al document del quadern, amb la teua notació i les correccions marcades. Si hi veus alguna cosa malament, li ho dius i ho corregeix."],
  ];
  principal.replaceChildren(h("div", { class: "contingut" },
    h("div", { class: "titol" },
      h("h1", {}, "Nova sessió"),
      h("p", { class: "subtitol" }, "Una sessió és cada vegada que afegeixes apunts a un quadern: una classe, una pràctica… Tria l'assignatura, el quadern i el dia, i en crear-la ací mateix hi puges les fotos i tries la font.")),
    fitxaNova(),
    h("section", { class: "titol", "aria-labelledby": "com-va" },
      h("h2", { id: "com-va", class: "seccio-titol" }, "Com va"),
      h("ol", { class: "com-va" }, passos.map(([nom, text], i) => h("li", {},
        h("span", { class: "num" }, i + 1), h("strong", {}, nom), h("span", { class: "detall" }, text)))))));
}

function fitxaNova() {
  const avui = new Date();
  const iso = new Date(avui - avui.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  let as = assignatures.find((x) => x.id === llegeix("lema-assignatura")) || assignatures[0];
  let quadern = null;

  // El quadern de l'última sessió creada en esta assignatura; si ja no hi és, l'últim quadern.
  function quadernInicial() {
    const recordat = llegeix(`lema-quadern-${as.id}`);
    quadern = as.quaderns.some((t) => t.id === recordat) ? recordat
      : as.quaderns.length ? as.quaderns[as.quaderns.length - 1].id : null;
  }

  const assig = h("select", { id: "assig",
    onchange: () => { as = assignatures.find((x) => x.id === assig.value); quadernInicial(); pintaQuadernTriat(); } },
  assignatures.map((x) => h("option", { value: x.id, selected: x.id === as.id }, x.nom)));
  const data = h("input", { id: "data", type: "date", value: iso, required: true });
  const titol = h("input", { id: "titol", type: "text", placeholder: "p. ex. Cicles i transposicions" });
  const boto = h("button", { type: "submit", class: "boto" }, "Crea la sessió");
  const llocQuadern = h("div", { class: "camp" });

  function pintaQuadernTriat() {
    llocQuadern.replaceChildren(h("label", { for: "quadern" }, "Quadern"),
      selectorQuadern(as, quadern, { id: "quadern", canvia: (t) => { quadern = t; } }));
  }
  quadernInicial();
  pintaQuadernTriat();

  return h("form", {
    class: "targeta fitxa-classe",
    onsubmit: async (e) => {
      e.preventDefault();
      if (!quadern) {
        avisa("Tria el quadern, o crea'n un amb el «+».");
        return;
      }
      boto.disabled = true;
      try {
        const c = await api("/api/sessions", ambJson("POST",
          { assignatura: as.id, data: data.value, titol: titol.value, quadern }));
        recorda("lema-assignatura", as.id);
        recorda(`lema-quadern-${as.id}`, quadern);
        anar(`#/sessio/${c.assignatura}/${c.id}/materials`);
      } catch (err) {
        avisa(err.message);
        boto.disabled = false;
      }
    },
  },
  h("div", { class: "camps fitxa-camps" },
    camp("Assignatura", assig),
    llocQuadern,
    camp("Dia de la sessió", data),
    camp("Títol ", titol, h("span", { class: "opcional" }, "(opcional)"))),
  h("div", { class: "peu-form" },
    h("p", { class: "nota-petita" }, "Els blocs de la sessió s'afegiran al document del quadern."), boto));
}

// ---------- Assignatura ----------

function pintaAssignatura(a, pestanya) {
  const as = assignatures.find((x) => x.id === a);
  if (!as) throw new Error("No existeix esta assignatura.");
  pestanya = pestanya === "fonts" ? "fonts" : "quaderns";
  const nou = pestanya === "quaderns" ? formNouQuadern(as) : null;
  const noms = { quaderns: "Quaderns", fonts: "Fonts" };
  const cos = h("div", { class: "contingut" },
    h("header", { class: "capcalera" },
      h("div", { class: "cap-assig" },
        h("div", {}, h("span", { class: "detall" }, "Assignatura"), h("h1", {}, as.nom)),
        nou ? h("button", { type: "button", class: "boto-sec",
          onclick: () => { nou.hidden = false; nou.querySelector("input").focus(); } }, icona("mes", 16, 2.2), "Nou quadern") : null),
      h("nav", { class: "pestanyes", "aria-label": "Seccions de l'assignatura" },
        Object.entries(noms).map(([id, nom]) => h("a", { href: `#/assignatura/${a}/${id}`,
          class: id === pestanya ? "actiu" : null, "aria-current": id === pestanya ? "page" : null }, nom)))),
    nou);
  if (pestanya === "quaderns") pintaQuaderns(cos, as);
  else pintaFonts(cos, as);
  principal.replaceChildren(cos);
}

function formNouQuadern(as) {
  const nom = h("input", { id: "nou-quadern", type: "text", placeholder: "p. ex. Tema 2. Anells",
    onkeydown: (e) => { if (e.key === "Escape") { e.preventDefault(); form.hidden = true; } } });
  const boto = h("button", { type: "submit", class: "boto" }, "Crea");
  const form = h("form", {
    class: "targeta compacta", hidden: true,
    onsubmit: async (e) => {
      e.preventDefault();
      if (!nom.value.trim()) { nom.focus(); return; }
      boto.disabled = true;
      try {
        await api(`/api/assignatures/${as.id}/quaderns`, ambJson("POST", { nom: nom.value }));
        pinta();
      } catch (err) {
        avisa(err.message);
        boto.disabled = false;
      }
    },
  },
  h("label", { for: "nou-quadern", class: "titol-caixa" }, "Nou quadern"),
  h("div", { class: "amb-boto" }, nom, boto,
    h("button", { type: "button", class: "boto-sec", onclick: () => { form.hidden = true; } }, "Cancel·la")));
  return form;
}

// Una línia per sessió: dia, nom i estat.
function liniaSessio(as, c, extra) {
  return h("li", {},
    h("span", { class: "data" }, dataCurta(c.data)),
    h("a", { class: "nom", href: `#/sessio/${as.id}/${c.id}` }, nomSessio(c)),
    h("span", { class: `estat estat-${c.estat}` }, h("span", { class: "punt" }), textEstat(c)),
    extra);
}

function pintaQuaderns(cos, as) {
  const sense = as.sessions.filter((c) => !as.quaderns.some((t) => t.id === c.quadern));
  if (!as.quaderns.length) {
    cos.append(h("div", { class: "avis gris" }, icona("avis", 22), h("div", {},
      h("strong", {}, "Encara no hi ha cap quadern"),
      h("span", {}, "Crea'n un amb «Nou quadern»: un tema, unes pràctiques, un article… Cada sessió afegeix els seus blocs al document del seu quadern."))));
  }
  for (const t of as.quaderns) cos.append(targetaQuadern(as, t));
  if (sense.length) {
    cos.append(h("section", { class: "targeta", "aria-labelledby": "t-sense" },
      h("div", { class: "quadern-cap" }, h("h2", { id: "t-sense" }, "Sense quadern"),
        h("span", { class: "detall" }, `${sense.length} ${sense.length === 1 ? "sessió" : "sessions"}`)),
      h("ul", { class: "llista-classes" }, sense.map((c) => liniaSessio(as, c,
        as.quaderns.length ? h("a", { class: "petit", href: `#/sessio/${as.id}/${c.id}/materials` }, "Posa-la en un quadern") : null)))));
  }
}

function targetaQuadern(as, t) {
  const sessions = as.sessions.filter((c) => c.quadern === t.id);
  const cap = h("div", { class: "quadern-cap" });
  const pintaCap = () => cap.replaceChildren(
    h("div", { class: "nom-quadern" }, h("h2", {}, t.nom),
      h("button", { type: "button", class: "boto-icona petit", title: "Canvia el nom",
        "aria-label": `Canvia el nom de «${t.nom}»`, onclick: edita }, icona("llapis", 16))),
    h("span", { class: "detall" }, `${sessions.length} ${sessions.length === 1 ? "sessió" : "sessions"}`));

  // El nom es converteix en un camp de text. Intro desa i Esc cancel·la.
  function edita() {
    const nom = h("input", { type: "text", value: t.nom, "aria-label": "Nom del quadern",
      onkeydown: (e) => {
        if (e.key === "Enter") { e.preventDefault(); desa(); }
        if (e.key === "Escape") { e.preventDefault(); pintaCap(); }
      } });
    const boto = h("button", { type: "button", class: "boto", onclick: () => desa() }, "Desa");
    async function desa() {
      if (!nom.value.trim()) { nom.focus(); return; }
      boto.disabled = true;
      try {
        await api(`/api/assignatures/${as.id}/quaderns/${t.id}`, ambJson("PUT", { nom: nom.value }));
        pinta();
      } catch (err) {
        avisa(err.message);
        boto.disabled = false;
      }
    }
    cap.replaceChildren(h("div", { class: "edita-nom" }, nom, boto,
      h("button", { type: "button", class: "boto-sec", onclick: pintaCap }, "Cancel·la")));
    nom.focus();
    nom.select();
  }
  pintaCap();

  const url = (fitxer) => urlFitxer(as.id, "quaderns", t.id, fitxer);
  const doc = t.pdf
    ? h("div", { class: "fila-doc" }, icona("doc", 26),
      h("div", { class: "nom" }, h("strong", {}, "Document del quadern"),
        h("span", { class: "detall" }, [t.pdf.pagines ? `${t.pdf.pagines} pàgines` : null,
          `actualitzat el ${new Date(t.pdf.data).toLocaleDateString("ca-ES")}`].filter(Boolean).join(" · "))),
      h("a", { class: "boto", href: `${url("quadern.pdf")}?v=${encodeURIComponent(t.pdf.data)}`, target: "_blank" }, "Obre el PDF"),
      h("a", { class: "boto-sec", href: url("quadern.tex"), download: "quadern.tex" }, "Descarrega el .tex"))
    : h("div", { class: "fila-doc buida" }, icona("doc", 26),
      h("div", { class: "nom" }, h("strong", {}, "Encara no hi ha document"),
        h("span", { class: "detall" }, "Es fa la primera vegada que passes a net una sessió d'este quadern.")));
  return h("section", { class: "targeta", "aria-label": t.nom }, cap, doc,
    sessions.length
      ? h("ul", { class: "llista-classes" }, sessions.map((c) => liniaSessio(as, c)))
      : h("p", { class: "nota-petita" }, "Encara no hi ha cap sessió en este quadern."));
}

function pintaFonts(cos, as) {
  if (!as.fonts.length) {
    cos.append(h("div", { class: "avis gris" }, icona("avis", 22), h("div", {},
      h("strong", {}, "Encara no hi ha cap font"),
      h("span", {}, "Puja'n una ací baix. Després la triaràs a Materials de cada sessió."))));
  }
  for (const f of as.fonts) {
    const pagines = f.pdfs.reduce((s, p) => s + p.pagines, 0);
    cos.append(h("section", { class: "targeta", "aria-label": f.nom },
      h("div", { class: "quadern-cap" }, h("h2", {}, f.nom),
        h("span", { class: "detall" }, [f.que_es, f.origen].filter(Boolean).join(" · "))),
      h("ul", { class: "pdfs" }, f.pdfs.map((p) => h("li", {},
        h("a", { class: "nom", href: urlFitxer(as.id, "fonts", f.id, p.nom), target: "_blank" }, p.nom),
        p.amb_text
          ? h("span", { class: "detall" }, `${p.pagines} p. · text extret`)
          : h("span", { class: "detall avis-text" }, "sense text: es llegirà com a imatge")))),
      h("p", { class: "nota-petita" },
        `${f.pdfs.length} PDF · ${pagines} pàgines · índex de ${f.entrades} entrades. Es tria a Materials de cada sessió.`)));
  }
  cos.append(h("section", { class: "targeta", "aria-labelledby": "t-font-nova" },
    h("div", { class: "cap-seccio" },
      h("h2", { id: "t-font-nova" }, "Puja una font nova"),
      h("p", {}, "PDF del professor, diapositives, un capítol del llibre o apunts d'un altre alumne.")),
    formFontNova(as.id, (font) => {
      avisa(`S'ha pujat «${font.nom}». Ja la pots triar a Materials de cada sessió.`);
      pinta();
    })));
}

// Formulari per pujar una font a l'assignatura. pujada(font) es crida quan ja s'ha extret el text.
function formFontNova(a, pujada) {
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
  icona("puja", 24), h("span", {}, h("strong", {}, "Tria els PDF de la font"), triats));
  return h("form", {
    class: "font-nova",
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
        pujada(await api(`/api/assignatures/${a}/fonts`, { method: "POST", body: f }));
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
    h("span", { class: "nota-petita" }, "Es guarda a l'assignatura: la podràs triar en totes les sessions."),
    boto));
}

// ---------- Sessió ----------

async function pintaSessio(a, c, pestanya, sub) {
  const sessio = await api(`/api/sessions/${a}/${c}`);
  const assig = assignatures.find((x) => x.id === a);
  if (!pestanya) {
    pestanya = { nova: "materials", acabada: "resultat" }[sessio.estat] || "progres";
  }
  const costat = pestanya === "resultat" && sub === "costat" && Boolean(sessio.pdf);
  const cos = h("div", { class: "contingut" + (costat ? " ample" : "") }, capcalera(sessio, assig, pestanya));
  if (pestanya === "progres") pintaProgres(cos, sessio);
  else if (pestanya === "resultat") await pintaResultat(cos, sessio, assig, costat);
  else pintaMaterials(cos, sessio, assig);
  principal.replaceChildren(cos);
}

function capcalera(sessio, assig, pestanya) {
  const base = `#/sessio/${sessio.assignatura}/${sessio.id}`;
  const actives = { materials: true, progres: sessio.estat !== "nova", resultat: Boolean(sessio.pdf) };
  const noms = { materials: "Materials", progres: "Progrés", resultat: "Resultat" };
  return h("header", { class: "capcalera" },
    h("div", {},
      h("span", { class: "detall" }, [assig.nom, nomQuadern(assig, sessio.quadern),
        sessio.titol ? dataLlarga(sessio.data) : null].filter(Boolean).join(" · ")),
      h("h1", {}, sessio.titol || `Sessió del ${dataLlarga(sessio.data)}`)),
    h("nav", { class: "pestanyes", "aria-label": "Seccions de la sessió" },
      Object.entries(noms).map(([id, nom]) => (actives[id]
        ? h("a", { href: `${base}/${id}`, class: id === pestanya ? "actiu" : null,
          "aria-current": id === pestanya ? "page" : null }, nom)
        : h("span", { "aria-disabled": "true" }, nom)))));
}

// ---------- Materials ----------

function pintaMaterials(cos, sessio, assig) {
  const bloquejat = sessio.estat === "en_marxa";
  const desa = async (canvis) => {
    try {
      await api(`/api/sessions/${sessio.assignatura}/${sessio.id}`, ambJson("PUT", canvis));
    } catch (e) {
      avisa(e.message);
    }
  };
  if (bloquejat) {
    cos.append(h("div", { class: "avis blau" }, icona("avis", 22),
      h("div", {}, "Claude està treballant amb estos materials. Els podràs canviar quan pare.")));
  }
  cos.append(
    fitxaSessio(sessio, assig, desa, bloquejat),
    h("div", { class: "materials" },
      h("div", { class: "materials-graella" },
        h("div", { class: "col-materials" },
          seccioApunts(sessio, bloquejat),
          seccioNota(sessio, desa, bloquejat)),
        seccioFont(sessio, assig, desa, bloquejat))),
    barraPassa(sessio, assig),
  );
}

// La fitxa d'una sessió creada: l'assignatura i el dia queden fixats (són el nom de la carpeta).
function fitxaSessio(sessio, assig, desa, bloquejat) {
  const a = sessio.assignatura;
  const c = sessio.id;
  const quadern = nomQuadern(assig, sessio.quadern) ? sessio.quadern : null;
  const canvia = async (canvis) => { await desa(canvis); pinta(); };
  const titol = h("input", { id: "titol", type: "text", value: sessio.titol || "", disabled: bloquejat,
    placeholder: "p. ex. Cicles i transposicions", onchange: (e) => canvia({ titol: e.target.value.trim() }) });
  // Els blocs de la sessió són al document del quadern si Resultat el llista entre els fitxers.
  const alQuadern = sessio.fitxers.some((f) => f.startsWith("quaderns/") && f.includes(`/blocs/${c}/`));

  const confirma = h("div", { class: "avis roig", hidden: true, role: "alertdialog", "aria-labelledby": "t-esborra" });
  const esborra = h("button", { type: "button", class: "boto perill",
    onclick: async () => {
      esborra.disabled = true;
      esborra.textContent = alQuadern ? "Esborrant i refent el PDF del quadern…" : "Esborrant…";
      try {
        const r = await api(`/api/sessions/${a}/${c}`, { method: "DELETE" });
        anar("#/");
        avisa(r.avis || `S'ha esborrat «${nomSessio(sessio)}». Està a ${r.paperera}.`);
      } catch (err) {
        avisa(err.message);
        esborra.disabled = false;
        esborra.textContent = "Esborra";
      }
    } }, "Esborra");
  confirma.append(icona("avis", 22), h("div", {},
    h("strong", { id: "t-esborra" }, `Vols esborrar «${nomSessio(sessio)}»?`),
    h("span", {}, "Les fotos i el que ha escrit Claude van a la paperera de dades/." +
      (alQuadern ? " Els seus blocs es lleven del document del quadern i el PDF del quadern es torna a fer." : "")),
    h("div", { class: "botons" }, esborra,
      h("button", { type: "button", class: "boto-sec", onclick: () => { confirma.hidden = true; } }, "Cancel·la"))));

  return h("section", { class: "targeta fitxa-classe", "aria-label": "Fitxa de la sessió" },
    h("div", { class: "camps fitxa-camps" },
      h("div", { class: "camp" }, h("span", { class: "etiqueta" }, "Assignatura"), h("span", { class: "fix" }, assig.nom)),
      h("div", { class: "camp" }, h("label", { for: "quadern" }, "Quadern"),
        selectorQuadern(assig, quadern, { id: "quadern", disabled: bloquejat, canvia: (t) => canvia({ quadern: t }) })),
      h("div", { class: "camp" }, h("span", { class: "etiqueta" }, "Dia de la sessió"), h("span", { class: "fix" }, dataLlarga(sessio.data))),
      camp("Títol ", titol, h("span", { class: "opcional" }, "(opcional)"))),
    h("div", { class: "peu-form" },
      h("p", { class: "nota-petita" }, quadern
        ? "Els blocs de la sessió van al document del quadern."
        : "Esta sessió encara no té quadern: tria'n un per poder-la passar a net."),
      bloquejat ? null : h("button", { type: "button", class: "enllac-suau",
        onclick: () => { confirma.hidden = false; esborra.focus(); } }, "Esborra la sessió")),
    sessio.estat === "nova" || !quadern ? null : h("p", { class: "nota-petita" },
      "Si canvies el quadern, el que ja ha escrit Claude no es mou: s'aplica la pròxima vegada que passes la sessió a net."),
    confirma);
}

function seccioApunts(sessio, bloquejat) {
  const a = sessio.assignatura;
  const c = sessio.id;

  async function puja(fitxers) {
    if (!fitxers.length) return;
    const f = new FormData();
    for (const x of fitxers) f.append("fitxers", x);
    try {
      await api(`/api/sessions/${a}/${c}/apunts`, { method: "POST", body: f });
      pinta();
    } catch (e) {
      avisa(e.message);
    }
  }

  let arrossegada = null;  // índex de la foto que s'està movent
  const fotos = sessio.apunts.map((nom, i) => {
    const url = urlFitxer(a, "sessions", c, "apunts", nom);
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
        const ordre = [...sessio.apunts];
        ordre.splice(i, 0, ...ordre.splice(arrossegada, 1));
        arrossegada = null;
        try {
          await api(`/api/sessions/${a}/${c}`, ambJson("PUT", { apunts: ordre }));
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
            await api(`/api/sessions/${a}/${c}/apunts/${encodeURIComponent(nom)}`, { method: "DELETE" });
            pinta();
          } catch (e) {
            avisa(e.message);
          }
        },
      }, icona("creu", 14, 2))));
    return foto;
  });

  const input = h("input", { type: "file", id: "fotos", class: "ocult", multiple: true,
    accept: "image/jpeg,image/png,image/webp,application/pdf", onchange: (e) => puja(e.target.files) });
  const seccio = h("section", {
    class: "targeta compacta", "aria-labelledby": "t-apunts",
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
    h("p", {}, sessio.apunts.length > 1
      ? "Les fotos de la sessió, en ordre. Arrossega-les per canviar-lo."
      : "Les fotos de la sessió, en ordre.")),
  h("div", { class: "graella-fotos xicoteta" }, fotos,
    bloquejat ? null : h("label", { for: "fotos", class: "afegeix" },
      icona("puja", 22), h("strong", {}, "Afegeix fotos"), h("span", {}, "o arrossega-les"))),
  input,
  h("p", { class: "nota-petita" }, "JPG, PNG, WebP o PDF."));
  return seccio;
}

function seccioFont(sessio, assig, desa, bloquejat) {
  const seccio = h("section", { class: "targeta compacta", "aria-labelledby": "t-font" });
  // Les fonts triades, amb els temes (PDF) de cada una. Les que ja no existeixen no compten.
  const triades = sessio.fonts.filter((t) => assig.fonts.some((f) => f.id === t.id));

  async function canvia(fonts) {
    await desa({ fonts });
    pinta();
  }

  function filaFont(f) {
    const triada = triades.find((t) => t.id === f.id);
    const pagines = f.pdfs.reduce((s, p) => s + p.pagines, 0);
    const detall = [f.que_es, `${f.pdfs.length} PDF · ${pagines} pàgines`].filter(Boolean).join(" · ");
    const noms = nomsCurts(f.pdfs.map((p) => p.nom));
    const marca = (nom, si) => canvia(triades.map((t) => (t.id !== f.id ? t : {
      id: t.id,
      // En l'ordre de la font, no en el que s'han marcat.
      temes: f.pdfs.map((p) => p.nom).filter((n) => (n === nom ? si : t.temes.includes(n))),
    })));
    return h("div", { class: "font-fila" },
      h("label", { class: "cap" },
        h("input", { type: "checkbox", checked: Boolean(triada), disabled: bloquejat,
          onchange: (e) => canvia(e.target.checked
            ? [...triades, { id: f.id, temes: [] }]
            : triades.filter((t) => t.id !== f.id)) }),
        h("span", {}, h("strong", {}, f.nom), h("span", { class: "detall" }, detall))),
      triada ? h("div", { class: "xips", role: "group", "aria-label": `PDF de ${f.nom} on és la sessió` },
        f.pdfs.map((p, i) => {
          const si = triada.temes.includes(p.nom);
          return h("label", { class: "xip" + (si ? " triat" : ""), title: p.nom },
            h("input", { type: "checkbox", checked: si, disabled: bloquejat, onchange: (e) => marca(p.nom, e.target.checked) }),
            `${noms[i]} · ${p.pagines} p.`,
            p.amb_text ? null : h("span", { class: "sense-text", title: "No té text: es llegirà com a imatge" }, "sense text"));
        })) : null);
  }

  function pintaSeccio() {
    // Sense filter, un null es pintaria com el text «null».
    seccio.replaceChildren(...[
      h("div", { class: "cap-seccio" },
        h("h2", { id: "t-font" }, "Fonts"),
        h("p", {}, "D'on es reconstrueix cada bloc. Si en marques més d'una i no coincideixen, Claude en tria una i t'ho diu en una noteta.")),
      assig.fonts.length ? h("div", { class: "llista-fonts" }, assig.fonts.map(filaFont)) : null,
      assig.fonts.length ? h("p", { class: "nota-petita" },
        "Marca els PDF on és la sessió. Si no en marques cap, Claude mira l'índex.") : null,
      assig.fonts.length ? null : h("p", { class: "detall" },
        "Esta assignatura encara no té cap font. Puja-la a la pàgina de l'assignatura: la podràs triar en totes les sessions."),
      h("a", { class: "enllac", href: `#/assignatura/${sessio.assignatura}/fonts` },
        icona("mes", 14, 2.2), "Puja una font nova a l'assignatura"),
    ].filter(Boolean));
  }

  pintaSeccio();
  return seccio;
}

function seccioNota(sessio, desa, bloquejat) {
  const text = h("textarea", { id: "nota", rows: 2, disabled: bloquejat,
    placeholder: "p. ex. La demostració del teorema la tinc en una altra foto. El professor va canviar una hipòtesi a propòsit.",
    onchange: (e) => desa({ nota: e.target.value }) });
  text.value = sessio.nota || "";
  return h("section", { class: "targeta compacta" },
    h("div", { class: "cap-seccio" },
      h("h2", {}, "Per a Claude ", h("span", { class: "opcional" }, "(opcional)")),
      h("label", { for: "nota", class: "detall" }, "Alguna cosa que haja de saber abans de començar.")),
    text);
}

function barraPassa(sessio, assig) {
  const a = sessio.assignatura;
  const c = sessio.id;
  const fonts = sessio.fonts
    .map((t) => ({ ...t, nom: assig.fonts.find((f) => f.id === t.id)?.nom }))
    .filter((t) => t.nom);
  const n = sessio.apunts.length;
  const quadernNom = nomQuadern(assig, sessio.quadern);
  let falta = null;
  if (!quadernNom) falta = "Falta triar el quadern.";
  else if (!n) falta = "Falten les fotos dels apunts.";
  else if (!fonts.length) falta = "Falta triar la font.";
  const enMarxa = sessio.estat === "en_marxa";
  const repetir = sessio.estat !== "nova";
  // Els blocs editats a mà des de «Costat a costat»: Claude els tornarà a escriure (decisió 2).
  const editats = (sessio.editats || []).map((f) => f.split("/").pop());
  const avisRepetir = "Començarà una conversa nova i Claude tornarà a fer la sessió des del principi."
    + (editats.length ? `\n\nHas editat a mà ${editats.length === 1 ? "1 bloc" : `${editats.length} blocs`} d'esta sessió`
      + ` (${editats.join(", ")}). Claude escriurà tots els blocs de nou i perdràs eixos canvis.` : "")
    + "\n\nContinuar?";

  const boto = h("button", {
    type: "button", class: "boto gran", disabled: Boolean(falta) || enMarxa,
    onclick: async () => {
      if (repetir && !confirm(avisRepetir)) return;
      boto.disabled = true;
      try {
        await api(`/api/sessions/${a}/${c}/passa`, { method: "POST" });
        anar(`#/sessio/${a}/${c}/progres`);
      } catch (e) {
        avisa(e.message);
        boto.disabled = false;
      }
    },
  }, icona("play", 16), repetir ? "Torna a passar a net" : "Passa a net");

  const resum = falta || [
    `${n} ${n === 1 ? "foto" : "fotos"}`,
    (fonts.length > 1 ? "Fonts: " : "Font: ") +
      fonts.map((t) => {
        // Els PDF marcats, amb el nom curt de la font («Tema 1»).
        const pdfs = assig.fonts.find((f) => f.id === t.id).pdfs.map((p) => p.nom);
        const curts = nomsCurts(pdfs);
        const marcats = t.temes.map((n) => curts[pdfs.indexOf(n)] || n);
        return t.nom + (marcats.length ? ` (${marcats.join(", ")})` : "");
      }).join(", "),
    `Va al quadern «${quadernNom}»`,
    "Es fa en una conversa nova de Claude Code",
  ].filter(Boolean).join(" · ");
  return h("div", { class: "barra-accio compacta" },
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

function avisEstat(sessio) {
  const base = `#/sessio/${sessio.assignatura}/${sessio.id}`;
  const avisos = {
    esperant: ["taronja", "Claude s'ha aturat i t'espera", "Llig el seu últim missatge i respon-li baix perquè continue."],
    aturada: ["gris", "Aturada", "Pots escriure-li baix perquè continue on ho havia deixat."],
    error: ["roig", "Hi ha hagut un error", "Mira l'últim missatge. Pots escriure-li baix perquè ho torne a intentar."],
  };
  if (sessio.estat === "acabada") {
    return h("div", { class: "avis blau" }, icona("check", 22, 2.4),
      h("div", {}, h("strong", {}, "Acabada"),
        h("span", {}, "El PDF és a ", h("a", { href: `${base}/resultat` }, "Resultat"), ".")));
  }
  const avis = avisos[sessio.estat];
  if (!avis) return null;
  return h("div", { class: `avis ${avis[0]}`, role: "status" }, icona("avis", 22, 2),
    h("div", {}, h("strong", {}, avis[1]), h("span", {}, avis[2])));
}

function pintaProgres(cos, sessio) {
  const a = sessio.assignatura;
  const c = sessio.id;
  const enMarxa = sessio.estat === "en_marxa";
  const passos = h("ol", { class: "passos", "aria-label": "Passos" });
  pintaPassos(passos, sessio.pas, sessio.estat);

  const feed = h("div", { class: "feed", "aria-live": "polite" });
  const treballant = enMarxa ? h("div", { class: "esperant-claude" }, h("span", { class: "gira" }), "Claude hi està treballant…") : null;
  const tempsEl = h("dd", {}, "—");
  const tokensEl = h("dd", {}, tokens(sessio.tokens));

  cos.append(
    passos,
    avisEstat(sessio),
    h("div", { class: "columnes" },
      h("div", { class: "col-principal" },
        h("section", { class: "targeta", "aria-labelledby": "t-feed" },
          h("h2", { id: "t-feed" }, "Què fa Claude"), feed, treballant),
        enMarxa || !sessio.conversa ? null : caixaResposta(sessio, sessio.estat === "esperant"
          ? { titol: "La teua resposta", boto: "Envia i continua",
            placeholder: "P1: …\nP2: …" }
          : { titol: "Escriu-li a Claude", boto: "Envia", placeholder: "p. ex. Continua." })),
      h("aside", { class: "col-lateral" },
        h("section", { class: "targeta compacta", "aria-labelledby": "t-sessio" },
          h("h2", { id: "t-sessio" }, "Sessió"),
          h("dl", { class: "dades" },
            h("dt", {}, enMarxa ? "Temps" : "Últim torn"), tempsEl,
            h("dt", {}, "Tokens"), tokensEl,
            h("dt", {}, "Estat"), h("dd", { style: "font-family: var(--sans)" }, ESTATS[sessio.estat])),
          enMarxa ? h("button", { type: "button", class: "boto-sec",
            onclick: async (e) => {
              e.currentTarget.disabled = true;
              try { await api(`/api/sessions/${a}/${c}/atura`, { method: "POST" }); } catch (err) { avisa(err.message); }
            } }, icona("stop", 14), "Atura") : null))),
  );

  // Registre: primer el que ja hi havia (sessio.events línies) i després el que arriba en directe.
  let rebuts = 0;
  let eines = null;     // la llista d'eines on van les línies seguides
  let iniciTorn = null;
  let tokensTorn = 0;

  const afegeix = (node) => {
    const baix = innerHeight + scrollY >= document.body.scrollHeight - 120;
    feed.append(node);
    if (baix && rebuts > sessio.events) scrollTo(0, document.body.scrollHeight);
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
        if (enMarxa) tokensEl.textContent = tokens(sessio.tokens + tokensTorn);
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

  flux = new EventSource(`/api/sessions/${a}/${c}/events`);
  flux.onmessage = (e) => {
    rebuts += 1;
    event(JSON.parse(e.data), rebuts > sessio.events);
  };
  flux.addEventListener("tancat", tancaFlux);
  flux.onerror = tancaFlux;

  if (enMarxa) {
    rellotge = setInterval(() => {
      if (iniciTorn) tempsEl.textContent = durada(Date.now() - new Date(iniciTorn));
    }, 1000);
  }
}

function caixaResposta(sessio, { titol, placeholder, boto }) {
  const a = sessio.assignatura;
  const c = sessio.id;
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
        await api(`/api/sessions/${a}/${c}/respon`, { method: "POST", body: f });
        anar(`#/sessio/${a}/${c}/progres`);
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

async function pintaResultat(cos, sessio, assig, costat) {
  const a = sessio.assignatura;
  const c = sessio.id;
  // Les rutes són relatives a l'assignatura: sessions/<sessió>/… o quaderns/<quadern>/…
  const url = (ruta) => urlFitxer(a, ruta);
  const propi = `sessions/${c}/`;
  const curt = (f) => (f.startsWith(propi) ? f.slice(propi.length) : f);
  const delQuadern = Boolean(sessio.pdf && sessio.pdf.startsWith("quaderns/"));
  const tex = sessio.pdf && sessio.fitxers.find((f) => f === sessio.pdf.replace(/\.pdf$/, ".tex"));
  const resposta = () => (sessio.conversa ? caixaResposta(sessio, {
    titol: "Hi ha alguna cosa malament?", boto: "Envia a Claude",
    placeholder: "p. ex. Definició 1.2: és r, no n. Teorema 1.4: posa-hi la demostració de la font.",
  }) : null);

  if (sessio.pdf) {
    const base = `#/sessio/${a}/${c}/resultat`;
    const opcio = (href, nom, actiu) => h("a", { href, class: actiu ? "on" : null, "aria-current": actiu ? "page" : null }, nom);
    cos.append(h("div", { class: "fila-vista" },
      h("nav", { class: "seg", "aria-label": "Com es veu el resultat" },
        opcio(base, "PDF sencer", !costat), opcio(`${base}/costat`, "Costat a costat", costat)),
      costat ? h("a", { class: "enllac-petit", href: url(sessio.pdf), target: "_blank" }, "Obre el PDF en una pestanya") : null));
  }
  if (costat) {
    pintaCostat(cos, sessio);
    const caixa = resposta();
    if (caixa) cos.append(caixa);
    return;
  }

  if (sessio.pdf) {
    const titol = delQuadern ? `Document del quadern «${nomQuadern(assig, sessio.quadern) || sessio.quadern}»` : curt(sessio.pdf);
    cos.append(h("section", { class: "targeta", "aria-labelledby": "t-pdf" },
      h("div", { class: "accions" },
        h("div", { class: "cap-seccio" },
          h("h2", { id: "t-pdf" }, titol),
          h("p", {}, delQuadern
            ? "El quadern sencer, amb esta sessió dins: l'informe diu a quines pàgines és. Al marge, d'on ve cada bloc i les marques."
            : "Amb la teua notació. Al marge, d'on ve cada bloc i les marques.")),
        h("div", { class: "esquerra" },
          h("a", { class: "boto", href: url(sessio.pdf), target: "_blank" }, "Obre el PDF"),
          tex ? h("a", { class: "boto-sec", href: url(tex), download: tex.split("/").pop() }, "Descarrega el .tex") : null)),
      h("iframe", { class: "visor-pdf", src: `${url(sessio.pdf)}?v=${Date.now()}`, title: titol })));
  }

  let informe = null;
  if (sessio.fitxers.includes(propi + "informe.md")) {
    const r = await fetch(url(propi + "informe.md"));
    if (r.ok) informe = await r.text();
  }

  cos.append(h("div", { class: "columnes" },
    h("div", { class: "col-principal" },
      informe ? h("section", { class: "targeta", "aria-labelledby": "t-informe" },
        h("h2", { id: "t-informe" }, "Informe"), markdown(informe)) : null,
      resposta()),
    h("aside", { class: "col-lateral" },
      h("section", { class: "targeta compacta", "aria-labelledby": "t-fitxers" },
        h("h2", { id: "t-fitxers" }, "Fitxers"),
        h("ul", { class: "fitxers" }, sessio.fitxers.map((f) => h("li", {},
          h("a", { href: url(f), target: "_blank" }, curt(f)))))),
      h("section", { class: "targeta compacta", "aria-labelledby": "t-sessio" },
        h("h2", { id: "t-sessio" }, "Sessió"),
        h("dl", { class: "dades" }, h("dt", {}, "Tokens"), h("dd", {}, tokens(sessio.tokens)))))));
}

// ---------- Resultat costat a costat ----------

// Cada bloc és un fitxer, però el LaTeX es veu en un sol text: esta línia diu on comença cada un.
const marcaBloc = (nom) => `%%%% ${nom} %%%%`;
const MARCA = /^%%%% (.+) %%%%$/;

// Cada bloc acaba en un salt de línia, perquè el text es puga ajuntar i tornar a partir igual.
const ambSalt = (text) => text.replace(/\r\n/g, "\n").replace(/\n?$/, "\n");
const ajunta = (blocs) => blocs.map((b) => `${marcaBloc(b.nom)}\n${b.text}`).join("");

// El text de cada bloc, en l'ordre dels blocs, o un error si falta, sobra o s'ha mogut alguna línia de marca.
function parteix(text, blocs) {
  const trossos = [];
  for (const linia of ambSalt(text).split("\n").slice(0, -1)) {
    const m = linia.match(MARCA);
    if (m) trossos.push({ nom: m[1], linies: [] });
    else if (trossos.length) trossos.at(-1).linies.push(linia);
    else if (linia.trim()) {
      return { error: `Hi ha text abans de la línia ${marcaBloc(blocs[0].nom)}: mou-lo dins d'un bloc o esborra'l.` };
    }
  }
  const noms = trossos.map((t) => t.nom);
  const falta = blocs.find((b) => !noms.includes(b.nom));
  if (falta) {
    return { error: `Falta la línia ${marcaBloc(falta.nom)}: torna-la a posar on començava el bloc, o clica «Descarta».` };
  }
  const sobra = noms.find((n, i) => !blocs.some((b) => b.nom === n) || noms.indexOf(n) !== i);
  if (sobra) return { error: `La línia ${marcaBloc(sobra)} no és de cap bloc o està repetida: esborra-la, o clica «Descarta».` };
  if (noms.some((n, i) => n !== blocs[i].nom)) {
    return { error: "Les línies %%%% … %%%% no estan en l'ordre d'abans, i els blocs no es poden moure d'ací: clica «Descarta»." };
  }
  return { textos: trossos.map((t) => t.linies.map((l) => `${l}\n`).join("")) };
}

// Esquerra: les fotos dels apunts o el LaTeX de la sessió, que es pot editar i compilar (decisió 2).
// Dreta: el PDF. Cada costat té la seua barra.
function pintaCostat(cos, sessio) {
  const a = sessio.assignatura;
  const c = sessio.id;
  const enMarxa = sessio.estat === "en_marxa";
  const esquerra = h("div", { class: "panell-cos" });
  const detall = h("span", { class: "nota-petita" });
  const avisos = h("div", { class: "avisos-panell", "aria-live": "polite" });
  let actual = null;
  let blocs = null;  // [{fitxer, nom, text}], com estan als fitxers
  let latex = null;  // el quadre del LaTeX, una vegada carregat
  let compilant = false;

  const pdf = h("iframe", { class: "visor-costat", title: "PDF definitiu" });
  // Sense la columna de miniatures del visor i amb la pàgina a l'amplada del panell.
  const recarregaPdf = () => { pdf.src = `${urlFitxer(a, sessio.pdf)}?v=${Date.now()}#navpanes=0&view=FitH`; };
  recarregaPdf();

  const fotos = h("div", { class: "fotos" }, sessio.apunts.map((nom, i) => {
    const src = urlFitxer(a, "sessions", c, "apunts", nom);
    return h("figure", {},
      nom.toLowerCase().endsWith(".pdf")
        ? h("iframe", { class: "foto-pdf", src, title: `Apunts ${i + 1}: ${nom}` })
        : h("a", { href: src, target: "_blank", title: "Obre la foto en una pestanya nova" },
          h("img", { src, alt: `Foto ${i + 1} dels apunts`, loading: "lazy" })),
      h("figcaption", {}, `Foto ${i + 1}`));
  }));

  const botons = {
    apunts: h("button", { type: "button", onclick: () => mostra("apunts") }, "Apunts"),
    latex: h("button", { type: "button", onclick: () => mostra("latex") }, "LaTeX"),
  };
  const descarta = h("button", { type: "button", class: "boto-sec", disabled: true,
    onclick: () => { latex.value = ajunta(blocs); avisos.replaceChildren(); actualitza(); } }, "Descarta");
  const desa = h("button", { type: "button", class: "boto", disabled: true, onclick: () => desaICompila() }, "Desa i compila");
  const accions = h("div", { class: "accions-latex", hidden: true }, descarta, desa);

  function avis(color, titol, ...linies) {
    avisos.replaceChildren(h("div", { class: `avis ${color}`, role: color === "roig" ? "alert" : "status" },
      h("div", {}, h("strong", {}, titol), linies.filter(Boolean).map((l) => h("span", { class: "pre" }, l)))));
  }

  // Els blocs canviats respecte als fitxers; null si el text no es pot partir (s'ha tocat una línia de marca).
  function canviats() {
    if (!latex || !blocs?.length) return [];
    const r = parteix(latex.value, blocs);
    return r.error ? null : blocs.filter((b, i) => r.textos[i] !== b.text).map((b) => b.nom);
  }

  function actualitza() {
    if (actual !== "latex" || !blocs?.length) return;
    const noms = canviats();
    const pendent = noms === null || noms.length > 0;
    descarta.disabled = !pendent || compilant;
    desa.disabled = !pendent || compilant || enMarxa;
    detall.textContent = noms === null ? "Sense desar: s'ha tocat una línia %%%%"
      : noms.length ? `Sense desar: ${noms.join(", ")}` : `${blocs.length} blocs`;
    detall.classList.toggle("sense-desar", pendent);
  }

  // Si es deixa la pàgina amb canvis sense desar, la navegació ho pregunta abans (vegeu potsEixir).
  sortida = () => {
    const noms = canviats();
    return noms === null || noms.length > 0;
  };

  async function desaICompila() {
    const r = parteix(latex.value, blocs);
    if (r.error) {
      avis("taronja", "No s'ha desat res.", r.error);
      return;
    }
    const canvis = blocs.map((b, i) => ({ fitxer: b.fitxer, text: r.textos[i] })).filter((x, i) => x.text !== blocs[i].text);
    if (!canvis.length) return;
    compilant = true;
    desa.textContent = "Compilant…";
    avisos.replaceChildren();
    actualitza();
    try {
      const res = await api(`/api/sessions/${a}/${c}/latex`, ambJson("POST", { canvis }));
      // Els fitxers ja tenen el text nou, haja compilat o no.
      for (const x of canvis) blocs.find((b) => b.fitxer === x.fitxer).text = x.text;
      if (res.ok) {
        const n = res.pagines;
        avis("blau", n ? `Compilat: ${n} ${n === 1 ? "pàgina" : "pàgines"}.` : "Compilat.",
          "El PDF de la dreta ja té el canvi.", res.missatge);
        recarregaPdf();
      } else {
        avis("roig", "No s'ha pogut compilar.", res.missatge,
          "El PDF és l'anterior. El teu canvi està desat: arregla'l i torna a compilar.");
      }
    } catch (e) {
      avis("roig", "No s'ha desat.", e.message);
    }
    compilant = false;
    desa.textContent = "Desa i compila";
    actualitza();
  }

  async function mostra(que) {
    actual = que;
    for (const [nom, boto] of Object.entries(botons)) {
      boto.classList.toggle("on", nom === que);
      boto.setAttribute("aria-pressed", nom === que ? "true" : "false");
    }
    accions.hidden = true;
    avisos.hidden = que !== "latex";
    if (que === "apunts") {
      const n = sessio.apunts.length;
      detall.textContent = `${n} ${n === 1 ? "foto" : "fotos"}`;
      detall.classList.remove("sense-desar");
      esquerra.replaceChildren(fotos);
      return;
    }
    if (!latex) {
      detall.textContent = "";
      esquerra.replaceChildren(h("p", { class: "nota-petita buit-panell" }, "Carregant el LaTeX…"));
      try {
        ({ blocs } = await api(`/api/sessions/${a}/${c}/latex`));
      } catch (e) {
        if (actual === "latex") esquerra.replaceChildren(h("p", { class: "nota-petita buit-panell" }, e.message));
        return;
      }
      blocs = blocs.map((b) => ({ ...b, text: ambSalt(b.text) }));
      if (blocs.length) {
        latex = h("textarea", { class: "latex", spellcheck: "false", readonly: enMarxa,
          "aria-label": "El LaTeX de la sessió", oninput: actualitza });
        latex.value = ajunta(blocs);
        if (enMarxa) {
          avis("blau", "Claude està treballant en esta sessió.", "El LaTeX es pot llegir, però el podràs editar quan pare.");
        }
      } else {
        latex = h("p", { class: "nota-petita buit-panell" }, sessio.estat === "nova"
          ? "Esta sessió encara no té blocs."
          : "Esta sessió no té blocs propis al quadern: els seus són entre els d'abans de la web (inicial).");
      }
    }
    if (actual !== "latex") return;  // mentre carregava, has tornat a les fotos
    accions.hidden = !blocs.length;
    esquerra.replaceChildren(latex);
    if (blocs.length) actualitza();
    else detall.textContent = "";
  }

  cos.append(h("div", { class: "dividida" },
    h("section", { class: "panell", "aria-label": "Apunts o LaTeX" },
      h("div", { class: "panell-cap" },
        h("div", { class: "seg", role: "group", "aria-label": "Què es veu a l'esquerra" }, botons.apunts, botons.latex),
        detall, accions),
      avisos,
      esquerra),
    h("section", { class: "panell", "aria-label": "PDF definitiu" }, pdf)));
  mostra("apunts");
}
