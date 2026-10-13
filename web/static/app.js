"use strict";

// Rutes: #/ (nova sessió), #/assignatura/<assignatura>/<quaderns|fonts> (…/quaderns/nou: amb el formulari obert;
// …/fonts/<font>/<pdf>: eixa font i eixe PDF al visor; …/fonts/nova: el formulari per pujar-ne una),
// #/quadern/<assignatura>/<quadern> (…/costat: la vista dividida) i #/sessio/<assignatura>/<sessió>/<materials|progres>.

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
  llibre: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
  // Les fonts de l'assignatura: llibres en un prestatge, perquè no es confonguen amb els quaderns (guia W).
  prestatge: '<path d="M3 4h4v16H3z"/><path d="M7 7h4v13H7z"/><path d="M13.2 7.6l3.8-1 3.6 13-3.8 1z"/><path d="M3 8h4"/><path d="M7 16h4"/>',
};

const lateral = document.getElementById("lateral");
const principal = document.getElementById("principal");
let assignatures = [];
let flux = null;      // EventSource del registre de Claude
let rellotge = null;  // interval del temps del torn
let sortida = null;   // la posa «Costat a costat»: diu si el LaTeX té canvis sense desar
let hashAnterior = location.hash;
let versio = null;    // la versió de la web quan es va carregar esta pestanya (guia R)

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
// «de» amb apòstrof davant de vocal o hac: «Fonts d'Anàlisi II», «Fonts de Física».
const de = (nom) => (/^h?[aeiouàèéíïòóúü]/i.test(nom) ? `d'${nom}` : `de ${nom}`);
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

// Les fórmules dels missatges de Claude i del punt de control, per a KaTeX.
const DELIMITADORS = [
  { left: "$$", right: "$$", display: true }, { left: "\\[", right: "\\]", display: true },
  { left: "$", right: "$", display: false }, { left: "\\(", right: "\\)", display: false },
];

function markdown(text) {
  const div = h("div", { class: "md" });
  if (!window.marked) {
    div.textContent = text;
    div.style.whiteSpace = "pre-wrap";
    return div;
  }
  div.innerHTML = marked.parse(text, { breaks: true });
  if (window.renderMathInElement) {
    renderMathInElement(div, { throwOnError: false, delimiters: DELIMITADORS });
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
    const [llista, ara] = await Promise.all([api("/api/assignatures"), api("/api/versio").catch(() => null)]);
    // Si la web ha canviat des que es va obrir esta pestanya, es recarrega per no fer servir el codi vell.
    // Els canvis al LaTeX sense desar ja s'han preguntat abans de moure's (potsEixir).
    if (ara) {
      if (versio === null) versio = ara.versio;
      else if (ara.versio !== versio) {
        location.reload();
        return;
      }
    }
    assignatures = llista;
    const r = ruta();
    pintaLateral(r);
    if (r.vista === "sessio" && r.a && r.c) await pintaSessio(r.a, r.c, r.pestanya, r.sub);
    else if (r.vista === "quadern" && r.a && r.c) await pintaQuadern(r.a, r.c, r.pestanya === "costat");
    else if (r.vista === "assignatura" && r.a) pintaAssignatura(r.a, r.c, r.pestanya, r.sub);
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

// desDelNom: s'ha clicat el nom de l'assignatura, no la fletxa; el focus torna on era.
function plegaGrup(id, desDelNom) {
  const plegats = grupsPlegats();
  if (plegats.has(id)) plegats.delete(id);
  else plegats.add(id);
  recorda("lema-grups-plegats", JSON.stringify([...plegats]));
  pintaLateral(ruta());
  lateral.querySelector(`[${desDelNom ? "data-grup-nom" : "data-grup"}="${id}"]`)?.focus();
}

// La pàgina d'una assignatura, a l'última pestanya que s'hi ha mirat (guia W, fase 3).
const paginaAssig = (a) => `#/assignatura/${a}/${llegeix(`lema-pestanya-${a}`) === "fonts" ? "fonts" : "quaderns"}`;

function pintaLateral(r) {
  const plegada = llegeix("lema-lateral-plegada") === "1";
  lateral.classList.toggle("plegada", plegada);
  // Plegada: el logo, el «+» de nova sessió i una inicial per assignatura.
  if (plegada) {
    lateral.replaceChildren(
      h("a", { href: "#/", class: "logo-mini", title: "LEMA", "aria-label": "LEMA" }, h("img", { src: "/icona.svg", alt: "" })),
      h("button", { type: "button", class: "plega", title: "Desplega la barra", "aria-label": "Desplega la barra lateral",
        "aria-expanded": "false", onclick: () => plegaLateral(false) }, icona("dreta", 16, 2)),
      h("a", { href: "#/", class: "inicial blau" + (r.vista ? "" : " actiu"), title: "Nova sessió", "aria-label": "Nova sessió" },
        icona("mes", 18, 2.2)),
      ...assignatures.map((as) => h("a", { href: paginaAssig(as.id),
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
  // Cada quadern és un enllaç al seu document, amb les seues sessions dins (de la més nova a la més vella).
  const quadern = (as, q) => {
    const actiu = r.vista === "quadern" && r.a === as.id && r.c === q.id;
    const sessions = as.sessions.filter((c) => c.quadern === q.id);
    return [
      h("a", { href: `#/quadern/${as.id}/${q.id}`, class: "quadern-enllac" + (actiu ? " actiu" : ""),
        "aria-current": actiu ? "page" : null }, icona("llibre", 16), h("span", {}, q.nom)),
      sessions.length ? h("div", { class: "sessions-nav" }, sessions.map((c) => enllac(as, c))) : null,
    ];
  };
  // Les sessions d'abans que no tenen quadern, al final, perquè les poses en un o les esborres.
  const sense = (as) => {
    const llista = as.sessions.filter((c) => !as.quaderns.some((q) => q.id === c.quadern));
    return llista.length ? [h("h3", { class: "quadern-nav" }, "Sense quadern"), llista.map((c) => enllac(as, c))] : null;
  };
  lateral.replaceChildren(...[
    h("div", { class: "cap-lateral" },
      h("a", { href: "#/", class: "logo" },
        // El cap del mussol (guia Y): /icona.svg és mascota.svg retallat pel cap.
        h("img", { class: "logo-cap", src: "/icona.svg", alt: "" }),
        h("span", { class: "logo-text" },
          h("span", { class: "logo-nom" }, "LEMA"),
          h("span", { class: "logo-sub" }, "Lector i Editor de Manuscrits Acadèmics"))),
      h("button", { type: "button", class: "plega", title: "Plega la barra", "aria-label": "Plega la barra lateral",
        "aria-expanded": "true", onclick: () => plegaLateral(true) }, icona("esquerra", 16, 2))),
    h("a", { href: "#/", class: "boto-sec" + (r.vista ? "" : " actiu") },
      icona("mes", 16, 2.2), "Nova sessió"),
    assignatures.map((as) => {
      const plegat = plegats.has(as.id);
      const actiu = r.vista === "assignatura" && r.a === as.id;
      return h("div", { class: "grup" },
        h("div", { class: "cap-grup" },
          // El nom només plega, com la fletxa; la pàgina de l'assignatura s'obri amb la icona (guia W, fase 3).
          h("h2", {}, h("button", { type: "button", class: "nom-grup", "data-grup-nom": as.id,
            "aria-expanded": plegat ? "false" : "true", title: plegat ? "Desplega" : "Plega",
            onclick: () => plegaGrup(as.id, true) }, as.nom)),
          h("a", { href: paginaAssig(as.id), class: "fonts-grup" + (actiu ? " actiu" : ""),
            title: `Quaderns i fonts ${de(as.nom)}`, "aria-label": `Quaderns i fonts ${de(as.nom)}`,
            "aria-current": actiu ? "page" : null },
          icona("prestatge", 17)),
          h("button", { type: "button", class: "plega-grup", "data-grup": as.id, "aria-expanded": plegat ? "false" : "true",
            "aria-label": `${plegat ? "Desplega" : "Plega"} ${as.nom}`, title: plegat ? "Desplega" : "Plega",
            onclick: () => plegaGrup(as.id) }, icona(plegat ? "dreta" : "avall", 14, 2))),
        plegat ? null : [
          as.quaderns.length ? as.quaderns.map((q) => quadern(as, q)) : h("p", { class: "buit" }, "Encara no hi ha quaderns."),
          h("a", { href: `#/assignatura/${as.id}/quaderns/nou`, class: "nou-quadern" }, icona("mes", 14, 2.2), "Nou quadern"),
          sense(as),
        ]);
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

// sub: «nou» a Quaderns (el formulari obert) o la font a Fonts; pdf: el PDF de la font que va al visor.
function pintaAssignatura(a, pestanya, sub, pdf) {
  const as = assignatures.find((x) => x.id === a);
  if (!as) throw new Error("No existeix esta assignatura.");
  pestanya = pestanya === "fonts" ? "fonts" : "quaderns";
  recorda(`lema-pestanya-${a}`, pestanya);  // la icona de la barra hi tornarà (guia W, fase 3)
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
  else pintaFonts(cos, as, sub, pdf);
  principal.replaceChildren(cos);
  // «Nou quadern» de la barra lateral: el formulari ja obert.
  if (nou && sub === "nou") {
    nou.hidden = false;
    nou.querySelector("input").focus();
  }
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

// El nom d'un quadern amb el llapis per canviar-lo: es converteix en un camp de text, Intro desa i Esc cancel·la.
// titol(nom) fa el títol (un h1 o un h2, amb enllaç o sense); extra va al costat (p. ex. quantes sessions té).
function nomEditable(as, t, titol, extra) {
  const cap = h("div", { class: "quadern-cap" });
  const pintaCap = () => cap.replaceChildren(...[
    h("div", { class: "nom-quadern" }, titol(t.nom),
      h("button", { type: "button", class: "boto-icona petit", title: "Canvia el nom",
        "aria-label": `Canvia el nom de «${t.nom}»`, onclick: edita }, icona("llapis", 16))),
    extra,
  ].filter(Boolean));

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
  return cap;
}

function targetaQuadern(as, t) {
  const sessions = as.sessions.filter((c) => c.quadern === t.id);
  const pagina = `#/quadern/${as.id}/${t.id}`;
  const cap = nomEditable(as, t, (nom) => h("h2", {}, h("a", { href: pagina, class: "enllac-titol" }, nom)),
    h("span", { class: "detall" }, `${sessions.length} ${sessions.length === 1 ? "sessió" : "sessions"}`));

  const url = (fitxer) => urlFitxer(as.id, "quaderns", t.id, fitxer);
  const doc = t.pdf
    ? h("div", { class: "fila-doc" }, icona("doc", 26),
      h("div", { class: "nom" }, h("strong", {}, "Document del quadern"),
        h("span", { class: "detall" }, [t.pdf.pagines ? `${t.pdf.pagines} pàgines` : null,
          `actualitzat el ${new Date(t.pdf.data).toLocaleDateString("ca-ES")}`].filter(Boolean).join(" · "))),
      h("a", { class: "boto", href: pagina }, "Obre el quadern"),
      h("a", { class: "boto-sec", href: `${url("quadern.pdf")}?v=${encodeURIComponent(t.pdf.data)}`, target: "_blank" }, "Obre el PDF"))
    : h("div", { class: "fila-doc buida" }, icona("doc", 26),
      h("div", { class: "nom" }, h("strong", {}, "Encara no hi ha document"),
        h("span", { class: "detall" }, "Es fa la primera vegada que passes a net una sessió d'este quadern.")));
  return h("section", { class: "targeta", "aria-label": t.nom }, cap, doc,
    sessions.length
      ? h("ul", { class: "llista-classes" }, sessions.map((c) => liniaSessio(as, c)))
      : h("p", { class: "nota-petita" }, "Encara no hi ha cap sessió en este quadern."));
}

// La pestanya «Fonts» (guia W): una fila amb les fonts de l'assignatura i, davall, la triada, amb els seus PDF,
// el visor i la fitxa. Sense font a l'adreça, l'última que s'ha mirat en esta assignatura o la primera.
// idFont «nova», o cap font a l'assignatura: el formulari per pujar-ne una.
function pintaFonts(cos, as, idFont, nomPdf) {
  const base = `#/assignatura/${as.id}/fonts`;
  const clau = `lema-font-${as.id}`;
  if (!idFont) idFont = as.fonts.some((f) => f.id === llegeix(clau)) ? llegeix(clau) : as.fonts[0]?.id;
  const font = as.fonts.find((f) => f.id === idFont);
  if (idFont && idFont !== "nova" && !font) throw new Error("No existeix esta font.");

  if (as.fonts.length) {
    cos.append(h("nav", { class: "tria-fonts", "aria-label": "Fonts de l'assignatura" },
      as.fonts.map((f) => h("a", { href: `${base}/${f.id}`, class: "xip-font" + (f === font ? " on" : ""),
        "aria-current": f === font ? "page" : null }, f.nom)),
      h("a", { href: `${base}/nova`, class: "xip-font mes" + (font ? "" : " on"), "aria-current": font ? null : "page" },
        icona("mes", 14, 2.2), "Nova font")));
  }

  if (!font) {
    if (!as.fonts.length) {
      cos.append(h("div", { class: "avis gris" }, icona("avis", 22), h("div", {},
        h("strong", {}, "Encara no hi ha cap font"),
        h("span", {}, "Puja'n una ací baix. Després la triaràs a Materials de cada sessió."))));
    }
    cos.append(h("section", { class: "targeta", "aria-labelledby": "t-font-nova" },
      h("div", { class: "cap-seccio" },
        h("h2", { id: "t-font-nova" }, "Puja una font nova"),
        h("p", {}, "PDF del professor, diapositives, un capítol del llibre o apunts d'un altre alumne.")),
      formFontNova(as.id, (nova) => {
        avisa(`S'ha pujat «${nova.nom}». Ja la pots triar a Materials de cada sessió.`);
        anar(`${base}/${nova.id}`);
      })));
    return;
  }

  recorda(clau, font.id);
  let nom = null;
  try { nom = nomPdf && decodeURIComponent(nomPdf); } catch { /* adreça mal escrita: el primer PDF */ }
  const pdf = font.pdfs.find((p) => p.nom === nom) || font.pdfs[0];
  const pagines = font.pdfs.reduce((s, p) => s + p.pagines, 0);
  // Les sessions que l'han triada. Si Claude en passa a net alguna, està llegint els fitxers de la font:
  // no es poden afegir ni llevar PDF ni esborrar-la (el servidor també ho comprova).
  const sessions = as.sessions.filter((c) => (c.fonts || []).some((t) => t.id === font.id));
  const ocupada = sessions.find((c) => ["en_marxa", "esperant"].includes(c.estat));
  const motiu = ocupada && `Claude està passant a net «${nomSessio(ocupada)}» amb esta font: espera que acabe.`;

  const fitxa = targetaFitxa(as, font);
  const lloc = h("div", { class: "lloc-avis" });  // l'avís d'«Esborra la font»
  cos.append(h("div", { class: "font-cap" },
    h("div", {},
      h("h2", {}, font.nom),
      font.que_es || font.origen ? h("span", { class: "que" }, [font.que_es, font.origen].filter(Boolean).join(" · ")) : null,
      h("span", { class: "detall" }, [`${font.pdfs.length} PDF`, `${pagines} pàgines`, sessions.length
        ? `triada en ${sessions.length} ${sessions.length === 1 ? "sessió" : "sessions"}` : "encara no s'ha triat en cap sessió"].join(" · "))),
    h("div", { class: "fila-botons" },
      h("button", { type: "button", class: "boto-sec", onclick: () => fitxa.edita() }, icona("llapis", 16), "Edita la fitxa"),
      h("button", { type: "button", class: "boto-sec perill",
        onclick: () => avisEsborraFont(as, font, { sessions, motiu, base }, lloc) }, "Esborra la font"))),
  lloc);

  // Els PDF, amb el nom curt («Tema 1»); el sencer, en passar-hi per damunt i a la barra del visor.
  // Canviar de PDF només canvia el visor i l'adreça: no cal tornar a pintar la pàgina ni demanar
  // /api/assignatures (uns 0,1 s des de la guia X). El botó d'arrere sí que torna a pintar (hashchange).
  const noms = nomsCurts(font.pdfs.map((p) => p.nom));
  const visor = h("iframe", { class: "visor-font" });
  let actual = pdf;
  const obri = (p) => {
    actual = p;
    visor.src = `${urlFitxer(as.id, "fonts", font.id, p.nom)}#navpanes=0&view=FitH`;
    visor.title = `${font.nom}: ${p.nom}`;
  };
  const enllacos = font.pdfs.map((p, i) => h("a", { href: `${base}/${font.id}/${encodeURIComponent(p.nom)}`, title: p.nom,
    class: "pdf-font" + (p === pdf ? " actiu" : ""), "aria-current": p === pdf ? "true" : null,
    onclick: (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;  // en una pestanya nova, com un enllaç
      e.preventDefault();
      if (e.currentTarget.classList.contains("actiu")) return;
      history.pushState(null, "", e.currentTarget.getAttribute("href"));
      hashAnterior = location.hash;
      for (const a of enllacos) {
        a.classList.toggle("actiu", a === e.currentTarget);
        if (a === e.currentTarget) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      }
      obri(p);
    } },
  h("strong", {}, noms[i]),
  p.amb_text
    ? h("span", { class: "detall" }, `${p.pagines} p. · text extret`)
    : h("span", { class: "detall avis-text" }, `${p.pagines} p. · sense text: es llegirà com a imatge`)));
  if (pdf) obri(pdf);

  // La ✕ de cada PDF: la línia es posa roja i pregunta abans de llevar-lo.
  function confirmaLleva(li, p, nomCurt) {
    if (motiu) { avisa(motiu); return; }
    if (font.pdfs.length < 2) { avisa("Una font necessita almenys un PDF: si no la vols, esborra-la."); return; }
    const marcat = sessions.filter((c) => c.fonts.some((t) => t.id === font.id && t.temes.includes(p.nom))).map(nomSessio);
    const abans = [...li.childNodes];
    const torna = () => { li.classList.remove("confirmant"); li.replaceChildren(...abans); };
    const boto = h("button", { type: "button", class: "boto perill", onclick: async () => {
      boto.disabled = true;
      try {
        await api(`/api/assignatures/${as.id}/fonts/${font.id}/pdfs/${encodeURIComponent(p.nom)}`, { method: "DELETE" });
        avisa(`«${nomCurt}» és a la paperera.`);
        anar(p === actual ? `${base}/${font.id}` : location.hash);
      } catch (err) {
        avisa(err.message);
        boto.disabled = false;
      }
    } }, "Lleva'l");
    li.classList.add("confirmant");
    li.replaceChildren(
      h("div", { class: "nom-pdf" }, h("strong", {}, nomCurt), h("span", { class: "detall" }, "Va a la paperera." +
        (marcat.length ? ` ${marcat.join(", ")} ${marcat.length === 1 ? "el té marcat" : "el tenen marcat"} a Materials.` : ""))),
      h("div", { class: "botons" }, boto, h("button", { type: "button", class: "boto-sec", onclick: torna }, "Cancel·la")));
    boto.focus();
  }

  // «Afegeix PDF»: es pugen a la font i el servidor en torna a traure el text i l'índex.
  const triaPdfs = h("input", { id: "afegeix-pdfs", type: "file", class: "ocult", multiple: true, accept: "application/pdf",
    onchange: () => puja([...triaPdfs.files]) });
  const textZona = h("span", {}, h("strong", {}, "Afegeix PDF"), h("span", {}, "o arrossega'ls ací"));
  const zona = h("label", { for: "afegeix-pdfs", class: "afegeix ample",
    ondragover: (e) => e.preventDefault(),
    ondrop: (e) => { e.preventDefault(); puja([...e.dataTransfer.files]); } },
  icona("puja", 22), textZona);
  async function puja(fitxers) {
    if (!fitxers.length || triaPdfs.disabled) return;
    if (motiu) { avisa(motiu); return; }
    const dades = new FormData();
    for (const f of fitxers) dades.append("fitxers", f);
    triaPdfs.disabled = true;
    textZona.replaceChildren(h("strong", {}, "Pujant i extraient el text…"));
    try {
      await api(`/api/assignatures/${as.id}/fonts/${font.id}/pdfs`, { method: "POST", body: dades });
      avisa(fitxers.length === 1 ? "S'ha afegit el PDF." : `S'han afegit ${fitxers.length} PDF.`);
      pinta();
    } catch (err) {
      avisa(err.message);
      triaPdfs.disabled = false;
      triaPdfs.value = "";
      textZona.replaceChildren(h("strong", {}, "Afegeix PDF"), h("span", {}, "o arrossega'ls ací"));
    }
  }

  cos.append(h("div", { class: "font-cos" },
    h("section", { class: "pdfs-font", "aria-labelledby": "t-pdfs" },
      h("h3", { id: "t-pdfs" }, "PDF"),
      h("ul", {}, enllacos.map((a, i) => {
        const li = h("li", {}, a);
        li.append(h("button", { type: "button", class: "lleva-pdf", title: "Lleva este PDF",
          "aria-label": `Lleva ${noms[i]}`, onclick: () => confirmaLleva(li, font.pdfs[i], noms[i]) }, icona("creu", 16)));
        return li;
      })),
      zona, triaPdfs),
    pdf ? visor : null),
  fitxa);
}

// La fitxa d'una font: la de l'usuari (font.json) i la que fa Claude (fitxa.yaml), si ja n'hi ha.
// edita() la converteix en un formulari; en desar, Claude rep els canvis la pròxima vegada que passe a net.
function targetaFitxa(as, font) {
  const targeta = h("section", { class: "targeta compacta fitxa-font", "aria-labelledby": "t-fitxa" });
  const textClaude = fetch(urlFitxer(as.id, "fonts", font.id, "fitxa.yaml"))
    .then((r) => (r.ok ? r.text() : null)).catch(() => null);

  function veu() {
    const claude = h("p", { class: "detall" }, "Carregant…");
    targeta.replaceChildren(
      h("div", { class: "quadern-cap" }, h("h3", { id: "t-fitxa" }, "Fitxa"),
        h("button", { type: "button", class: "boto-sec", onclick: edita }, icona("llapis", 16), "Edita la fitxa")),
      h("dl", { class: "fitxa" },
        h("dt", {}, "Nom curt"), h("dd", {}, font.nom),
        h("dt", {}, "Què és"), h("dd", {}, font.que_es || "—"),
        h("dt", {}, "D'on surt"), h("dd", {}, font.origen || "—")),
      h("div", { class: "cap-fitxa-claude" }, h("strong", {}, "Fitxa per a Claude"),
        h("span", { class: "nota-petita" }, "La fa Claude la primera vegada que passa a net una sessió amb esta font, i després la reutilitza.")),
      claude);
    textClaude.then((text) => {
      if (text === null) claude.textContent = "Claude la farà la primera vegada que passe a net una sessió amb esta font.";
      else claude.replaceWith(h("pre", { class: "fitxa-claude" }, text));
    });
  }

  async function edita() {
    const text = await textClaude;
    const nom = h("input", { id: "ff-nom", type: "text", required: true, value: font.nom });
    const que = h("input", { id: "ff-que", type: "text", required: true, value: font.que_es || "" });
    const don = h("input", { id: "ff-don", type: "text", value: font.origen || "" });
    const fitxa = h("textarea", { id: "ff-fitxa", class: "fitxa-edita", spellcheck: "false",
      placeholder: "Encara no n'hi ha: Claude la farà la primera vegada que passe a net una sessió amb esta font." });
    fitxa.value = text || "";
    const boto = h("button", { type: "submit", class: "boto" }, "Desa");
    targeta.replaceChildren(h("form", {
      class: "form-fitxa",
      onsubmit: async (e) => {
        e.preventDefault();
        boto.disabled = true;
        try {
          await api(`/api/assignatures/${as.id}/fonts/${font.id}`, ambJson("PUT",
            { nom: nom.value, que_es: que.value, origen: don.value, fitxa: fitxa.value }));
          avisa("S'ha desat la fitxa.");
          pinta();
        } catch (err) {
          avisa(err.message);
          boto.disabled = false;
        }
      },
    },
    h("h3", { id: "t-fitxa" }, "Fitxa"),
    h("div", { class: "camps" }, camp("Nom curt", nom), camp("Què és", que), camp("D'on surt", don)),
    camp("Fitxa per a Claude", fitxa),
    h("p", { class: "nota-petita" }, "Claude la llig cada vegada que passa a net una sessió amb esta font. Si no quadra amb " +
      "els tres camps de dalt, manen els de dalt i Claude la corregeix. Si la deixes buida, va a la paperera i Claude en fa una de nova."),
    h("div", { class: "fila-botons" }, boto, h("button", { type: "button", class: "boto-sec", onclick: veu }, "Cancel·la"))));
    targeta.scrollIntoView({ block: "start" });
    nom.focus({ preventScroll: true });
  }

  veu();
  targeta.edita = edita;
  return targeta;
}

// L'avís d'«Esborra la font», a lloc: diu què passarà amb les sessions que l'han triada i pregunta.
// sessions: les que l'han triada; motiu: per què no es pot ara (Claude hi treballa); base: on es va després.
function avisEsborraFont(as, font, { sessions, motiu, base }, lloc) {
  if (motiu) { avisa(motiu); return; }
  const n = sessions.length;
  const acabades = sessions.filter((c) => c.estat === "acabada");
  const pendents = sessions.filter((c) => c.estat !== "acabada");
  const boto = h("button", { type: "button", class: "boto perill", onclick: async () => {
    boto.disabled = true;
    try {
      await api(`/api/assignatures/${as.id}/fonts/${font.id}`, { method: "DELETE" });
      avisa(`«${font.nom}» és a la paperera.`);
      anar(base);
    } catch (err) {
      avisa(err.message);
      boto.disabled = false;
    }
  } }, "Esborra-la");
  lloc.replaceChildren(h("div", { class: "avis roig", role: "alertdialog", "aria-labelledby": "t-esborra-font" },
    icona("avis", 22),
    h("div", {},
      h("strong", { id: "t-esborra-font" }, `Esborres «${font.nom}»?`),
      h("span", {}, n ? `Va a la paperera. ${n === 1 ? "L'ha triada 1 sessió" : `L'han triada ${n} sessions`}:`
        : "Va a la paperera. No l'has triada en cap sessió."),
      n ? h("ul", { class: "llista-avis" },
        acabades.length ? h("li", {}, `${acabades.length} ${acabades.length === 1 ? "acabada" : "acabades"}: els seus blocs no canvien.`) : null,
        pendents.length ? h("li", {}, `${pendents.length} sense acabar (${pendents.map(nomSessio).join(", ")}): ` +
          `${pendents.length === 1 ? "es queda" : "es queden"} sense esta font.`) : null)
        : null,
      h("div", { class: "botons" }, boto,
        h("button", { type: "button", class: "boto-sec", onclick: () => lloc.replaceChildren() }, "Cancel·la")))));
  boto.focus();
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
  // «Resultat» ja no és de la sessió: el document es mira al quadern (guia Q, fase 2).
  if (pestanya === "resultat") {
    history.replaceState(null, "", sessio.quadern
      ? `#/quadern/${a}/${sessio.quadern}${sub === "costat" ? "/costat" : ""}` : `#/sessio/${a}/${c}/materials`);
    return pinta();
  }
  if (!pestanya) pestanya = ["nova", "acabada"].includes(sessio.estat) ? "materials" : "progres";
  const cos = h("div", { class: "contingut" }, capcalera(sessio, assig, pestanya));
  if (pestanya === "progres") await pintaProgres(cos, sessio);
  else pintaMaterials(cos, sessio, assig);
  principal.replaceChildren(cos);
}

function capcalera(sessio, assig, pestanya) {
  const base = `#/sessio/${sessio.assignatura}/${sessio.id}`;
  const actives = { materials: true, progres: sessio.estat !== "nova" };
  const noms = { materials: "Materials", progres: "Progrés" };
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

// Quan la sessió ja és al document del quadern, un avís per anar-hi: la sessió ja no té «Resultat».
function avisAlQuadern(sessio, assig) {
  if (sessio.estat !== "acabada" || !sessio.pdf || !sessio.quadern) return null;
  return h("div", { class: "avis blau amb-boto" }, icona("check", 22, 2.4),
    h("div", {}, h("strong", {}, "Esta sessió ja és al quadern."),
      h("span", {}, `Els seus blocs són al document «${nomQuadern(assig, sessio.quadern)}».`)),
    h("a", { class: "boto", href: `#/quadern/${sessio.assignatura}/${sessio.quadern}` }, "Mira-la al quadern"));
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
  const alQuadern = avisAlQuadern(sessio, assig);
  if (alQuadern) cos.append(alQuadern);
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
      h("a", { class: "enllac", href: `#/assignatura/${sessio.assignatura}/fonts/nova` },
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
  // Un altre Claude treballa en el quadern (el corregeix o passa a net una altra sessió): només un alhora.
  const espera = !falta && sessio.ocupat;
  if (espera) falta = `${sessio.ocupat}: la podràs passar a net quan acabe.`;
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
    h("div", {}, h("strong", {}, enMarxa ? "Claude hi està treballant" : espera ? "Espera"
      : falta ? "Encara no" : "A punt per passar a net"),
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
  const avisos = {
    esperant: ["taronja", "Claude s'ha aturat i t'espera", "Llig el seu últim missatge i respon-li baix perquè continue."],
    aturada: ["gris", "Aturada", "Pots escriure-li baix perquè continue on ho havia deixat."],
    error: ["roig", "Hi ha hagut un error", "Mira l'últim missatge. Pots escriure-li baix perquè ho torne a intentar."],
  };
  if (sessio.estat === "acabada") {
    return h("div", { class: "avis blau" }, icona("check", 22, 2.4),
      h("div", {}, h("strong", {}, "Acabada"), sessio.quadern
        ? h("span", {}, "Els blocs ja són al ", h("a", { href: `#/quadern/${sessio.assignatura}/${sessio.quadern}` },
          "document del quadern"), ".")
        : null));
  }
  const avis = avisos[sessio.estat];
  if (!avis) return null;
  return h("div", { class: `avis ${avis[0]}`, role: "status" }, icona("avis", 22, 2),
    h("div", {}, h("strong", {}, avis[1]), h("span", {}, avis[2])));
}

// «Progrés» (guia B): dalt, el que cal saber, que és què fa Claude o, si s'ha aturat, el seu últim missatge i
// el quadre per respondre. El registre sencer, l'informe i els fitxers, plegats al final.

// Què fa Claude en cada pas i què ve després. null: «Quan acabe, la sessió serà al quadern…».
const ABANS_DEL_CONTROL = "Després s'aturarà per fer-te, totes juntes, les preguntes que la font no resol.";
const DESPRES_DEL_CONTROL = "Escriurà els blocs i compilarà el quadern. Ja no t'ha de preguntar res, si no troba cap problema.";
const FEINA = [
  ["prepara la carpeta i la fitxa de la font", ABANS_DEL_CONTROL],
  ["llig els apunts", ABANS_DEL_CONTROL],
  ["divideix els apunts en blocs", ABANS_DEL_CONTROL],
  ["busca cada bloc a la font", ABANS_DEL_CONTROL],
  ["apunta les teues respostes", DESPRES_DEL_CONTROL],
  ["escriu els blocs", "Després compilarà el quadern. Ja no t'ha de preguntar res, si no troba cap problema."],
  ["munta el document i compila el PDF", null],
];

// [què fa, què ve després]. Un missatge teu quan la sessió ja havia acabat (pas 6) no segueix el flux.
function feinaDeClaude(pas, torn, quadern) {
  if (torn === "usuari" && pas === 6) return ["Claude et respon", "Quan acabe, ho tindràs ací."];
  if (pas == null || !FEINA[pas]) return ["Claude comença", "Prepararà la carpeta i llegirà els apunts."];
  const [fa, despres] = FEINA[pas];
  return [`Claude ${fa}`, despres || `Quan acabe, la sessió serà al quadern${quadern ? ` «${quadern}»` : ""}.`];
}

// La targeta blava de dalt mentre Claude treballa. actualitza(pas) la canvia quan Claude passa de pas.
function targetaEstat(sessio, quadern, { tempsEl, tokensEl, atura }) {
  const titol = h("h2", { "aria-live": "polite" });
  const pasEl = h("b", {});
  const pas = h("span", {}, "Pas ", pasEl, " de 6");
  const despres = h("p", { class: "seguent" });
  const actualitza = (n) => {
    const [fa, ve] = feinaDeClaude(n, sessio.torn?.tipus, quadern);
    titol.textContent = fa;
    despres.textContent = ve;
    pas.hidden = n == null;
    pasEl.textContent = n ?? "";
  };
  actualitza(sessio.pas);
  return {
    actualitza,
    targeta: h("section", { class: "targeta ara", "aria-label": "Què fa Claude ara" },
      h("div", { class: "ara-cap" }, h("span", { class: "gira", "aria-hidden": "true" }), titol),
      h("div", { class: "xifres" }, pas, h("span", {}, "Temps ", tempsEl), h("span", {}, "Tokens ", tokensEl)),
      despres,
      h("div", {}, atura)),
  };
}

// L'avís de dalt quan Claude no treballa: acabada (amb el botó al quadern), esperant, aturada o error.
function avisDeProgres(sessio, assig) {
  if (sessio.estat === "acabada") return avisAlQuadern(sessio, assig) || avisEstat(sessio);
  if (sessio.estat === "error" && sessio.ultim_error) {
    return h("div", { class: "avis roig", role: "alert" }, icona("avis", 22, 2),
      h("div", {}, h("strong", {}, "Hi ha hagut un error"), markdown(sessio.ultim_error),
        h("span", {}, "Pots escriure-li baix perquè ho torne a intentar.")));
  }
  return avisEstat(sessio);
}

// Una secció plegada: el títol i, al costat, un resum curt; dins, el contingut.
function plegable(titol, resum, ...contingut) {
  return h("details", { class: "plegable" },
    h("summary", {}, h("span", { class: "titol-plegable" }, titol), h("span", { class: "detall" }, resum)),
    h("div", { class: "dins" }, contingut));
}

// ---------- Punt de control (guia B, fase 2) ----------
// Claude escriu les preguntes i l'esquema a punt-control.json, i la web ensenya cada pregunta en la seua secció,
// amb el tros de foto a què es refereix i les respostes. Si el fitxer no és bo, «Progrés» fa com abans.

const LLETRES = "abcdefghijklmnopqrstuvwxyz";
const MARQUES = { correccio: ["corr", "Correcció"], noteta: ["nota", "Noteta"], pendent: ["preg", "Pendent"],
  noclasse: ["nota", "No vist a classe"] };

// Un text curt del fitxer, amb les fórmules ($…$) escrites amb KaTeX. Sense Markdown: el text es posa tal qual.
function formules(text, tag = "span", props = {}) {
  const el = h(tag, props, String(text ?? ""));
  if (window.renderMathInElement) renderMathInElement(el, { throwOnError: false, delimiters: DELIMITADORS });
  return el;
}

// Si el fitxer té preguntes ben fetes. Si en falla una, es fa servir el missatge per a tot: van juntes.
function puntDeControlBo(pc) {
  if (!pc || typeof pc !== "object" || !Array.isArray(pc.preguntes)) return false;
  if (pc.blocs != null && !Array.isArray(pc.blocs)) return false;
  return pc.preguntes.every((p) => p && typeof p.id === "string" && typeof p.pregunta === "string"
    && (p.forma === "sino" || (p.forma === "opcions" && Array.isArray(p.respostes) && p.respostes.length > 0
      && p.respostes.every((r) => r && typeof r.text === "string"))));
}

// El tros de la foto on és el dubte: la foto de fons, ampliada i desplaçada fins a la zona, amb un 2 % de marge
// i almenys un 6 % d'alt. null si la zona no és bona o la foto no és una imatge de la sessió.
function trosDeFoto(sessio, p) {
  if (typeof p.foto !== "string" || !sessio.apunts.includes(p.foto) || /\.pdf$/i.test(p.foto)) return null;
  const z = p.zona;
  if (!Array.isArray(z) || z.length !== 4 || !z.every((x) => typeof x === "number" && Number.isFinite(x))) return null;
  let [x0, y0, x1, y1] = z.map((x) => Math.min(1, Math.max(0, x)));
  if (x1 <= x0 || y1 <= y0) return null;
  x0 = Math.max(0, x0 - 0.02); y0 = Math.max(0, y0 - 0.02);
  x1 = Math.min(1, x1 + 0.02); y1 = Math.min(1, y1 + 0.02);
  if (y1 - y0 < 0.06) {
    y0 = Math.max(0, Math.min((y0 + y1) / 2 - 0.03, 0.94));
    y1 = y0 + 0.06;
  }
  const w = x1 - x0;
  const alt = y1 - y0;
  const src = urlFitxer(sessio.assignatura, "sessions", sessio.id, "apunts", p.foto);
  const tros = h("div", { class: "retall", role: "img", "aria-label": `Tros de la foto ${sessio.apunts.indexOf(p.foto) + 1} on és el dubte de la ${p.id}` });
  tros.style.backgroundImage = `url("${src}")`;
  tros.style.backgroundSize = `${100 / w}% auto`;
  tros.style.backgroundPosition = `${w < 1 ? (x0 / (1 - w)) * 100 : 0}% ${alt < 1 ? (y0 / (1 - alt)) * 100 : 0}%`;
  tros.style.aspectRatio = "4";  // fins que se sàpia la mida de la foto
  const img = new Image();
  img.onload = () => { tros.style.aspectRatio = String((w * img.naturalWidth) / (alt * img.naturalHeight)); };
  img.src = src;
  return { tros, src };
}

// Si la pregunta té resposta: una opció, «Sí», o «No, és…» i «Una altra resposta» amb text.
const teResposta = (r) => Boolean(r && r.tria != null && (!["no", "altra"].includes(r.tria) || r.text?.trim()));

// El missatge que rep Claude, en un sol torn (decisió 5).
function textDeRespostes(pc, respostes, comentari) {
  const linies = pc.preguntes.length ? ["Respostes del punt de control:"] : ["Punt de control: cap pregunta."];
  for (const p of pc.preguntes) {
    const r = respostes[p.id];
    if (r.tria === "altra") linies.push(`${p.id} (una altra resposta): ${r.text.trim()}`);
    else if (r.tria === "si") linies.push(`${p.id}: Sí`);
    else if (r.tria === "no") linies.push(`${p.id}: No, és: ${r.text.trim()}`);
    else linies.push(`${p.id}: (${LLETRES[r.tria]}) ${p.respostes[r.tria].text}`);
  }
  if (comentari.trim()) linies.push(`Comentaris a l'esquema: ${comentari.trim()}`);
  else if (!pc.preguntes.length) linies.push("L'esquema està bé: continua.");
  return linies.join("\n");
}

// Una pregunta en la seua secció: dalt, el número, el bloc i el tipus de dubte; a l'esquerra, a què es refereix;
// a la dreta, la pregunta i les respostes. canvia() avisa quan canvia la resposta.
function targetaPregunta(sessio, p, r, canvia) {
  const estat = h("span", { class: "preg-estat" });
  const targeta = h("article", { class: "pregunta", id: `preg-${p.id}`, "aria-labelledby": `t-preg-${p.id}` });
  const marca = () => {
    const feta = teResposta(r);
    targeta.classList.toggle("resposta-feta", feta);
    estat.textContent = feta ? "✓ Resposta" : "Sense resposta";
  };
  const nom = `resposta-${p.id}`;
  const camps = [];  // els camps de text de «No, és…» i «Una altra resposta…»
  const tria = (valor) => {
    r.tria = valor;
    for (const c of camps) c.camp.disabled = c.valor !== valor;
    marca();
    canvia();
  };
  const opcio = (valor, ...contingut) => h("label", { class: "opcio" },
    h("input", { type: "radio", name: nom, value: String(valor), checked: r.tria === valor,
      onchange: () => tria(valor) }), h("span", { class: "text-opcio" }, contingut));
  const ambText = (valor, etiqueta, placeholder) => {
    const camp = h("input", { type: "text", class: "camp-opcio", placeholder, "aria-label": etiqueta,
      disabled: r.tria !== valor, value: r.tria === valor ? r.text || "" : "",
      oninput: (e) => { r.text = e.target.value; marca(); canvia(); } });
    camps.push({ valor, camp });
    return h("label", { class: "opcio amb-text" },
      h("input", { type: "radio", name: nom, value: valor, checked: r.tria === valor,
        onchange: () => { r.text = camp.value; tria(valor); camp.focus(); } }),
      h("span", { class: "text-opcio" }, etiqueta, camp));
  };
  const respostes = p.forma === "sino"
    ? [opcio("si", "Sí"), ambText("no", "No, és…", "com és")]
    : [...p.respostes.map((x, i) => opcio(i, h("span", { class: "lletra" }, LLETRES[i]), " · ", formules(x.text),
      x.detall ? formules(x.detall, "small") : null)), ambText("altra", "Una altra resposta…", "escriu-la ací")];

  const foto = trosDeFoto(sessio, p);
  const context = Array.isArray(p.context) ? p.context.filter((x) => Array.isArray(x) && x.length === 2) : [];
  const numFoto = sessio.apunts.indexOf(p.foto) + 1;
  const esquerra = foto || context.length ? h("div", { class: "context" },
    h("span", { class: "etiqueta" }, "A què es refereix"),
    foto ? [foto.tros, h("div", { class: "peu-retall" }, h("span", {}, `Foto ${numFoto}`),
      h("a", { href: foto.src, target: "_blank" }, "Obre la foto sencera"))]
      : numFoto > 0 ? h("div", { class: "peu-retall" }, h("a", { href: urlFitxer(sessio.assignatura, "sessions", sessio.id, "apunts", p.foto),
        target: "_blank" }, `Obre la foto ${numFoto}`)) : null,
    context.length ? h("dl", { class: "compara" }, context.map(([etiqueta, text]) => [
      h("dt", {}, String(etiqueta)), formules(text, "dd")])) : null) : null;

  targeta.append(
    h("div", { class: "preg-cap" },
      h("span", { class: "preg-num" }, p.id),
      p.bloc ? h("span", { class: "preg-bloc" }, String(p.bloc)) : null,
      p.tipus ? h("span", { class: "detall" }, String(p.tipus)) : null,
      estat),
    h("div", { class: "preg-cos" + (esquerra ? "" : " sense-context") },
      esquerra,
      h("fieldset", { class: "decidir" },
        formules(p.pregunta, "legend", { id: `t-preg-${p.id}` }),
        h("div", { class: p.forma === "sino" ? "sino" : "opcions" }, respostes))));
  marca();
  return targeta;
}

// L'esquema de blocs, plegat (obert si no hi ha cap pregunta). Amb comentari, el quadre per dir què no quadra.
function seccioEsquema(pc, { obert, comentari }) {
  const blocs = (pc.blocs || []).filter((b) => b && typeof b === "object");
  const aLaFont = blocs.filter((b) => b.font).length;
  const anarA = (id) => document.getElementById(`preg-${id}`)?.scrollIntoView({ block: "start" });
  const files = blocs.map((b) => h("li", {},
    h("span", { class: "id" }, String(b.id ?? "")),
    h("span", { class: "que" }, h("b", {}, String(b.tipus ?? "")), b.titol ? [" · ", formules(b.titol)] : null,
      b.apunts ? h("span", { class: "on" }, String(b.apunts)) : null),
    h("span", { class: "marques" },
      b.font ? formules(b.font, "span", { class: "xip font" })
        : h("span", { class: "xip sense" }, b.relacionat ? `Relacionat: ${b.relacionat}` : "No és a la font"),
      (Array.isArray(b.marques) ? b.marques : []).filter((m) => MARQUES[m]).map((m) =>
        h("span", { class: `xip ${MARQUES[m][0]}` }, MARQUES[m][1])),
      (Array.isArray(b.preguntes) ? b.preguntes : []).map((id) => h("button", { type: "button", class: "xip preg",
        title: `Vés a la ${id}`, onclick: () => anarA(id) }, String(id))))));
  const plegada = plegable("Esquema de blocs", [`${blocs.length} ${blocs.length === 1 ? "bloc" : "blocs"}`,
    ` · ${aLaFont} a la font`, pc.nota ? " · 1 nota de Claude" : ""],
  pc.nota ? formules(pc.nota, "p", { class: "claude-diu" }) : null,
  files.length ? h("ul", { class: "blocs" }, files) : h("p", { class: "nota-petita" }, "Claude no ha escrit cap bloc."),
  comentari ? [h("label", { for: "comentari-esquema", class: "titol-plegable" }, "Alguna cosa no quadra a l'esquema? ",
    h("span", { class: "opcional" }, "(opcional)")), comentari] : null);
  plegada.open = Boolean(obert);
  return plegada;
}

// Les preguntes, l'esquema i la barra d'enviar. Les respostes a mitges es guarden al navegador fins que s'envien.
function pintaPuntDeControl(cos, sessio) {
  const a = sessio.assignatura;
  const c = sessio.id;
  const pc = sessio.punt_control;
  const clau = `lema-respostes-${a}-${c}-${sessio.punt_control_data}`;
  let desat = {};
  try { desat = JSON.parse(llegeix(clau) || "{}"); } catch { desat = {}; }
  const respostes = Object.fromEntries(pc.preguntes.map((p) => [p.id, desat.respostes?.[p.id] || { tria: null, text: "" }]));
  const comentari = h("textarea", { id: "comentari-esquema", rows: 3,
    placeholder: "p. ex. Falta un bloc entre B09 i B10: a la p. 19 hi ha una observació.", oninput: () => actualitza() });
  comentari.value = desat.comentari || "";

  const fetes = h("strong", {});
  const comptador = h("div", { class: "comptador", "aria-hidden": "true" });
  const envia = h("button", { type: "button", class: "boto gran", onclick: () => enviar() },
    pc.preguntes.length ? "Envia les respostes" : "Continua");
  const explica = h("span", {});

  // Sense desa (en pintar la pàgina), no es guarda res: només quan respons alguna cosa.
  function actualitza(desa = true) {
    if (desa) recorda(clau, JSON.stringify({ respostes, comentari: comentari.value }));
    const n = pc.preguntes.filter((p) => teResposta(respostes[p.id])).length;
    const total = pc.preguntes.length;
    fetes.textContent = sessio.ocupat ? "Espera"
      : total ? `${n} de ${total} ${total === 1 ? "resposta" : "respostes"}` : "Cap pregunta";
    comptador.replaceChildren(...pc.preguntes.map((p) => h("i", { class: teResposta(respostes[p.id]) ? "fet" : null })));
    envia.disabled = n < total || Boolean(sessio.ocupat);
    explica.textContent = sessio.ocupat ? `${sessio.ocupat}: podràs enviar-les quan acabe.`
      : n < total ? "Quan les tingues totes, s'envien juntes i Claude continua."
        : "Ja les tens totes: envia-les i Claude continuarà.";
  }

  async function enviar() {
    envia.disabled = true;
    const f = new FormData();
    f.append("text", textDeRespostes(pc, respostes, comentari.value));
    try {
      await api(`/api/sessions/${a}/${c}/respon`, { method: "POST", body: f });
      try { localStorage.removeItem(clau); } catch { /* sense emmagatzematge */ }
      anar(`#/sessio/${a}/${c}/progres`);
    } catch (err) {
      avisa(err.message);
      actualitza();
    }
  }

  const n = pc.preguntes.length;
  cos.append(
    h("div", { class: "avis taronja", role: "status" }, icona("avis", 22, 2),
      h("div", {}, h("strong", {}, n ? `Claude t'espera: ${n} ${n === 1 ? "pregunta" : "preguntes"}` : "Claude t'espera: revisa l'esquema"),
        h("span", {}, !n ? "No té cap pregunta. Mira l'esquema de blocs i, si tot quadra, continua."
          : pc.blocs ? "Són les coses que la font no resol. Respon-les totes i envia-les juntes; després Claude escriurà els blocs."
            : "Respon-les i envia-les juntes perquè continue."))),
    n ? h("div", { class: "preguntes" }, pc.preguntes.map((p) => targetaPregunta(sessio, p, respostes[p.id], actualitza))) : null,
    pc.blocs ? seccioEsquema(pc, { obert: !n, comentari }) : null,
    h("div", { class: "barra-accio compacta barra-respostes" }, h("div", {}, fetes, explica), comptador, envia));
  actualitza(false);
}

// Quan acaba: el resum que Claude escriu al pas 6, en lloc del seu últim missatge.
function targetaResum(resum) {
  const xifres = [["blocs", "blocs"], ["a_la_font", "trobats a la font"], ["correccions", "correccions marcades"], ["notetes", "notetes"]]
    .filter(([camp]) => resum[camp] != null && resum[camp] !== "")
    .map(([camp, nom]) => h("div", {}, h("b", {}, String(resum[camp])), h("span", {}, nom)));
  const respostes = Array.isArray(resum.respostes) ? resum.respostes.filter((x) => typeof x === "string") : [];
  return h("section", { class: "targeta", "aria-labelledby": "t-resum" },
    h("div", { class: "quadern-cap" }, h("h2", { id: "t-resum" }, "Resum"),
      resum.pagines ? h("span", { class: "detall" }, `Pàgines ${resum.pagines} del quadern`) : null),
    xifres.length ? h("div", { class: "resum-xifres" }, xifres) : null,
    respostes.length ? [h("p", { class: "titol-plegable" }, "Les teues respostes"),
      h("ul", { class: "resum-respostes" }, respostes.map((x) => formules(x, "li")))] : null);
}

async function pintaProgres(cos, sessio) {
  const a = sessio.assignatura;
  const c = sessio.id;
  const assig = assignatures.find((x) => x.id === a);
  const propi = `sessions/${c}/`;
  let informe = null;
  if (sessio.fitxers.includes(`${propi}informe.md`)) {
    const r = await fetch(urlFitxer(a, `${propi}informe.md`));
    if (r.ok) informe = await r.text();
  }
  const enMarxa = sessio.estat === "en_marxa";
  const passos = h("ol", { class: "passos", "aria-label": "Passos" });
  pintaPassos(passos, sessio.pas, sessio.estat);

  // El registre es llig encara que estiga plegat: la targeta de dalt en necessita els passos, els tokens i el final.
  const tempsEl = h("b", {}, "—");
  const tokensEl = h("b", {}, tokens(sessio.tokens));
  const accionsEl = h("span", {}, "0 accions");
  let estat = null;
  const feed = registreClaude({ url: `/api/sessions/${a}/${c}/events`, vistos: sessio.events, enMarxa,
    tokensAbans: sessio.tokens, tempsEl, tokensEl, passos,
    compta: (n) => { accionsEl.textContent = `${tokens(n)} ${n === 1 ? "acció" : "accions"}`; },
    canviaPas: (n) => estat?.actualitza(n) });

  if (sessio.estat !== "acabada") cos.append(passos);
  if (enMarxa) {
    const atura = h("button", { type: "button", class: "boto-sec",
      onclick: async (e) => {
        e.currentTarget.disabled = true;
        try { await api(`/api/sessions/${a}/${c}/atura`, { method: "POST" }); } catch (err) { avisa(err.message); }
      } }, icona("stop", 14), "Atura");
    estat = targetaEstat(sessio, nomQuadern(assig, sessio.quadern), { tempsEl, tokensEl, atura });
    cos.append(estat.targeta);
  } else if (sessio.estat === "esperant" && sessio.punt_control_vigent && puntDeControlBo(sessio.punt_control)) {
    // Claude espera i ha escrit les preguntes d'este torn: una per secció (fase 2).
    pintaPuntDeControl(cos, sessio);
  } else {
    const avis = avisDeProgres(sessio, assig);
    if (avis) cos.append(avis);
    // Quan acaba, el resum que Claude escriu a punt-control.json; si no n'hi ha, el seu últim missatge.
    const pc = sessio.punt_control && typeof sessio.punt_control === "object" ? sessio.punt_control : null;
    const resum = sessio.estat === "acabada" && pc?.resum && typeof pc.resum === "object" ? pc.resum : null;
    const missatge = sessio.ultim_missatge ? netejaText(sessio.ultim_missatge) : "";
    if (resum) cos.append(targetaResum(resum));
    else if (missatge) {
      cos.append(h("section", { class: "targeta missatge-claude", "aria-labelledby": "t-missatge" },
        h("h2", { id: "t-missatge" }, sessio.estat === "acabada" ? "Què diu Claude" : "L'últim missatge de Claude"),
        markdown(missatge)));
    }
    if (sessio.estat === "acabada" && Array.isArray(pc?.blocs)) cos.append(seccioEsquema(pc, {}));
    if (sessio.conversa) {
      cos.append(caixaResposta({
        ...(sessio.estat === "esperant"
          ? { titol: "La teua resposta", boto: "Envia i continua", placeholder: "P1: …\nP2: …" }
          : { titol: "Escriu-li a Claude", boto: "Envia", placeholder: "p. ex. Continua." }),
        url: `/api/sessions/${a}/${c}/respon`,
        enviat: () => anar(`#/sessio/${a}/${c}/progres`),
      }));
    }
  }

  if (informe) cos.append(plegable("Informe", "informe.md", markdown(informe)));
  cos.append(plegable("Detall del que fa Claude", enMarxa ? accionsEl
    : [accionsEl, ` · ${tokens(sessio.tokens)} tokens`, sessio.durada_torn ? ` · últim torn: ${durada(sessio.durada_torn)}` : null],
  feed));
  if (sessio.fitxers.length) {
    cos.append(plegable("Fitxers de la sessió", `${sessio.fitxers.length} ${sessio.fitxers.length === 1 ? "fitxer" : "fitxers"}`,
      h("ul", { class: "fitxers" }, sessio.fitxers.map((f) => h("li", {},
        h("a", { href: urlFitxer(a, f), target: "_blank" }, f.startsWith(propi) ? f.slice(propi.length) : f))))));
  }
}

// El que fa Claude en una sessió o en les correccions d'un quadern: primer les vistos línies que ja hi havia
// al registre i després el que arriba en directe. Quan acaba un torn en directe, es torna a pintar la pàgina.
// tempsEl i tokensEl (si n'hi ha) van dient el temps del torn i els tokens; passos, el pas on és Claude.
// compta(n) rep quantes accions porta, i canviaPas(n), cada pas nou mentre treballa (la targeta de «Progrés»).
// Amb caixa, el registre té la seua barra de desplaçament i es queda baix de tot.
function registreClaude({ url, vistos, enMarxa, tokensAbans, tempsEl, tokensEl, passos, caixa, compta, canviaPas }) {
  const feed = h("div", { class: "feed" + (caixa ? " caixa" : ""), "aria-live": "polite" });
  let rebuts = 0;
  let accions = 0;
  let eines = null;     // la llista d'eines on van les línies seguides
  let iniciTorn = null;
  let tokensTorn = 0;

  // Afegeix el node al registre (o a dins, la llista d'eines) i, si estaves baix de tot, hi baixa.
  const afegeix = (node, dins = feed) => {
    const baix = caixa ? feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 60
      : innerHeight + scrollY >= document.body.scrollHeight - 120;
    dins.append(node);
    if (caixa && (baix || rebuts <= vistos)) feed.scrollTop = feed.scrollHeight;
    else if (!caixa && baix && rebuts > vistos) scrollTo(0, document.body.scrollHeight);
  };
  const liniaEina = (verb, detall, error) => {
    if (!eines) { eines = h("ul", { class: "eines" }); afegeix(eines); }
    afegeix(h("li", { class: error ? "error" : null },
      h("span", { class: "verb" }, verb), h("span", { class: "ruta" }, detall || "")), eines);
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
        if (viu && passos) pintaPassos(passos, ev.n, "en_marxa");
        if (viu && canviaPas) canviaPas(ev.n);
        break;
      case "text": {
        const text = netejaText(ev.text);
        if (text) afegeix(markdown(text));
        break;
      }
      case "eina": {
        const verb = ev.nom in VERBS ? VERBS[ev.nom] : ev.nom;
        if (verb !== null) {
          liniaEina(verb, ev.detall);
          accions += 1;
          if (compta) compta(accions);
        }
        break;
      }
      case "error_eina":
        liniaEina("Error", ev.text, true);
        break;
      case "tokens":
        tokensTorn = ev.n;
        if (enMarxa && tokensEl) tokensEl.textContent = tokens(tokensAbans + tokensTorn);
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
        if (ev.durada && tempsEl) tempsEl.textContent = durada(ev.durada);
        if (viu) pinta();
        break;
      default:
        break;
    }
  }

  flux = new EventSource(url);
  flux.onmessage = (e) => {
    rebuts += 1;
    event(JSON.parse(e.data), rebuts > vistos);
  };
  flux.addEventListener("tancat", tancaFlux);
  flux.onerror = tancaFlux;

  if (enMarxa && tempsEl) {
    rellotge = setInterval(() => {
      if (iniciTorn) tempsEl.textContent = durada(Date.now() - new Date(iniciTorn));
    }, 1000);
  }
  return feed;
}

// El quadre per escriure-li a Claude, amb fitxers adjunts. Envia el text i els fitxers a url i després crida
// enviat(). Si abans() torna fals, no s'envia.
function caixaResposta({ titol, placeholder, boto, url, abans, enviat }) {
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
      if (abans && !abans()) return;
      const f = new FormData();
      f.append("text", text.value);
      for (const x of fitxers.files) f.append("fitxers", x);
      envia.disabled = true;
      try {
        await api(url, { method: "POST", body: f });
        await enviat();
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

// ---------- Quadern ----------
// El document del quadern es mira i es revisa ací (guia Q, fase 2): «PDF sencer» o «Costat a costat», amb
// les fotos de totes les sessions i tot el LaTeX del quadern. Les sessions només hi afegeixen apunts.

async function pintaQuadern(a, q, costat) {
  const quadern = await api(`/api/quaderns/${a}/${q}`);
  const as = assignatures.find((x) => x.id === a);
  costat = costat && Boolean(quadern.pdf);
  const base = `#/quadern/${a}/${q}`;
  const url = (f) => urlFitxer(a, "quaderns", q, f);
  const n = quadern.sessions.length;
  // «Nova sessió» amb este quadern ja triat: el formulari agafa l'últim quadern recordat.
  const novaSessio = () => {
    recorda("lema-assignatura", a);
    recorda(`lema-quadern-${a}`, q);
    anar("#/");
  };

  const cos = h("div", { class: "contingut" + (costat ? " ample" : "") },
    h("header", { class: "capcalera" },
      h("div", {}, h("span", { class: "detall" }, `${as.nom} · Quadern`),
        nomEditable(as, quadern, (nom) => h("h1", {}, nom))),
      h("div", { class: "dades-quadern" },
        h("span", { class: "detall" }, [
          quadern.pdf?.pagines ? `${quadern.pdf.pagines} pàgines` : null,
          quadern.pdf ? `actualitzat el ${new Date(quadern.pdf.data).toLocaleDateString("ca-ES")}` : "encara sense document",
          `${n} ${n === 1 ? "sessió" : "sessions"}`,
        ].filter(Boolean).join(" · ")),
        h("div", { class: "fila-botons" },
          quadern.pdf ? h("a", { class: "boto-sec", href: `${url("quadern.pdf")}?v=${encodeURIComponent(quadern.pdf.data)}`,
            target: "_blank" }, "Obre el PDF") : null,
          quadern.tex ? h("a", { class: "boto-sec", href: url("quadern.tex"), download: "quadern.tex" }, "Descarrega el .tex") : null,
          h("button", { type: "button", class: "boto", onclick: novaSessio }, icona("mes", 16, 2.2), "Nova sessió en este quadern")))));

  if (!quadern.pdf) {
    cos.append(h("div", { class: "avis gris" }, icona("avis", 22), h("div", {},
      h("strong", {}, "Encara no hi ha document"),
      h("span", {}, "Es fa la primera vegada que passes a net una sessió d'este quadern."))));
  } else {
    const opcio = (href, nom, actiu) => h("a", { href, class: actiu ? "on" : null, "aria-current": actiu ? "page" : null }, nom);
    cos.append(h("div", { class: "fila-vista" },
      h("nav", { class: "seg", "aria-label": "Com es veu el document" },
        opcio(base, "PDF sencer", !costat), opcio(`${base}/costat`, "Costat a costat", costat))));
    if (costat) {
      pintaCostat(cos, {
        a,
        pdf: `quaderns/${q}/quadern.pdf`,
        enMarxa: quadern.en_marxa,
        urlLatex: `/api/quaderns/${a}/${q}/latex`,
        nota: quadern.inicial ? "Els blocs d'abans de la web no tenen fotos ací." : null,
        grups: quadern.sessions.filter((s) => s.apunts.length).map((s) => ({
          titol: s.titol ? `${s.titol} · ${dataCurta(s.data)}` : nomSessio(s),
          enllac: `#/sessio/${a}/${s.id}`,
          apunts: s.apunts.map((nom) => ({ nom, src: urlFitxer(a, "sessions", s.id, "apunts", nom) })),
        })),
      });
    } else {
      cos.append(h("iframe", { class: "visor-pdf", src: `${url("quadern.pdf")}?v=${Date.now()}`,
        title: `Document de «${quadern.nom}»` }));
    }
  }

  // Les sessions, en ordre de data. Els blocs d'abans de la web (blocs/inicial/) van primer.
  const files = [
    quadern.inicial ? h("li", {}, h("span", { class: "data" }, "—"), h("span", { class: "nom" }, "Abans de la web"),
      h("span", { class: "detall" }, "El document que ja hi havia: va primer")) : null,
    quadern.sessions.map((s) => liniaSessio(as, s, s.estat === "nova"
      ? h("a", { class: "petit", href: `#/sessio/${a}/${s.id}/materials` }, "Puja els apunts") : null)),
  ].flat().filter(Boolean);
  cos.append(h("section", { class: "targeta", "aria-labelledby": "t-sessions" },
    h("div", { class: "quadern-cap" }, h("h2", { id: "t-sessions" }, "Sessions"),
      h("button", { type: "button", class: "boto-sec", onclick: novaSessio }, icona("mes", 16, 2.2), "Nova sessió")),
    files.length ? h("ul", { class: "llista-classes" }, files)
      : h("p", { class: "nota-petita" }, "Encara no hi ha cap sessió en este quadern.")));
  if (quadern.tex) cos.append(...correccions(a, q, quadern));
  principal.replaceChildren(cos);
}

// Les correccions del document (guia Q, fase 3): una conversa de Claude per quadern. Mentre Claude
// treballa, el que fa, el temps, els tokens i «Atura»; si no, el quadre per escriure-li.
function correccions(a, q, quadern) {
  const c = quadern.correccio;
  const enMarxa = c.estat === "en_marxa";
  const tempsEl = h("span", {}, "");
  const tokensEl = h("span", {}, tokens(c.tokens));
  const feed = c.events ? registreClaude({ url: `/api/quaderns/${a}/${q}/events`, vistos: c.events, enMarxa,
    tokensAbans: c.tokens, tempsEl, tokensEl, caixa: true }) : null;
  const atura = h("button", { type: "button", class: "boto-sec",
    onclick: async () => {
      atura.disabled = true;
      try { await api(`/api/quaderns/${a}/${q}/atura`, { method: "POST" }); } catch (err) { avisa(err.message); }
    } }, icona("stop", 14), "Atura");

  const parts = [];
  if (feed) {
    parts.push(h("section", { class: "targeta", id: "correccions", "aria-labelledby": "t-correccions" },
      h("div", { class: "quadern-cap" }, h("h2", { id: "t-correccions" }, "Correccions"),
        h("span", { class: "detall" }, "Conversa del quadern · ", tokensEl, " tokens")),
      c.estat === "acabada" ? null : avisEstat({ estat: c.estat }),
      feed,
      enMarxa ? h("div", { class: "fila-treballant" },
        h("div", { class: "esperant-claude" }, h("span", { class: "gira" }), "Claude està corregint el quadern… ", tempsEl),
        atura) : null));
  }
  if (enMarxa) return parts;
  // Un altre Claude treballa en el quadern (passa a net una sessió): les correccions, quan acabe.
  if (quadern.en_marxa) {
    parts.push(h("div", { class: "avis gris" }, icona("avis", 22), h("div", {},
      h("strong", {}, `${quadern.en_marxa}.`), h("span", {}, "Li podràs demanar correccions quan acabe."))));
    return parts;
  }
  parts.push(caixaResposta({
    ...(c.estat === "esperant"
      ? { titol: "La teua resposta", boto: "Envia a Claude", placeholder: "Respon-li ací." }
      : { titol: "Hi ha alguna cosa malament al quadern?", boto: "Envia a Claude",
        placeholder: "p. ex. Definició 1.31: és l_t, no l_1. Teorema 1.4: posa-hi la demostració de la font." }),
    url: `/api/quaderns/${a}/${q}/corregeix`,
    // Claude treballarà sobre els fitxers dels blocs: els canvis al LaTeX sense desar es perdrien.
    abans: () => {
      if (!sortida || !sortida()) return true;
      avisa("Tens canvis al LaTeX sense desar: desa'ls o descarta'ls abans d'escriure-li a Claude.");
      return false;
    },
    enviat: async () => {
      await pinta();
      document.getElementById("correccions")?.scrollIntoView({ block: "start" });
    },
  }));
  return parts;
}

// ---------- Costat a costat ----------

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

// Esquerra: les fotos de les sessions, agrupades per sessió, o tot el LaTeX del quadern, que es pot editar
// i compilar (decisió 2). Dreta: el PDF. Cada costat té la seua barra.
// pdf és la ruta del PDF dins de l'assignatura; grups, [{ titol, enllac, apunts: [{ nom, src }] }]; enMarxa, què
// fa Claude en el quadern (null si no hi treballa: llavors el LaTeX es pot editar).
function pintaCostat(cos, { a, pdf: rutaPdf, enMarxa, urlLatex, nota, grups }) {
  const esquerra = h("div", { class: "panell-cos" });
  const detall = h("span", { class: "nota-petita" });
  const avisos = h("div", { class: "avisos-panell", "aria-live": "polite" });
  let actual = null;
  let blocs = null;  // [{fitxer, nom, text}], com estan als fitxers
  let latex = null;  // el quadre del LaTeX, una vegada carregat
  let compilant = false;

  const pdf = h("iframe", { class: "visor-costat", title: "PDF definitiu" });
  // Sense la columna de miniatures del visor i amb la pàgina a l'amplada del panell.
  const recarregaPdf = () => { pdf.src = `${urlFitxer(a, rutaPdf)}?v=${Date.now()}#navpanes=0&view=FitH`; };
  recarregaPdf();

  const nFotos = grups.reduce((s, g) => s + g.apunts.length, 0);
  const fotos = h("div", { class: "fotos" },
    nota ? h("p", { class: "nota-petita" }, nota) : null,
    grups.length ? null : h("p", { class: "nota-petita" }, "Encara no hi ha fotos."),
    grups.map((g) => [
      h("div", { class: "cap-sessio" },
        h("strong", {}, `${g.titol} · ${g.apunts.length} ${g.apunts.length === 1 ? "foto" : "fotos"}`),
        h("a", { href: g.enllac }, "Obre la sessió")),
      g.apunts.map((f, i) => h("figure", {},
        f.nom.toLowerCase().endsWith(".pdf")
          ? h("iframe", { class: "foto-pdf", src: f.src, title: `${g.titol}, apunts ${i + 1}: ${f.nom}` })
          : h("a", { href: f.src, target: "_blank", title: "Obre la foto en una pestanya nova" },
            h("img", { src: f.src, alt: `${g.titol}, foto ${i + 1}`, loading: "lazy" })),
        h("figcaption", {}, `Foto ${i + 1}`))),
    ]));

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
    desa.disabled = !pendent || compilant || Boolean(enMarxa);
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
      const res = await api(urlLatex, ambJson("POST", { canvis }));
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
      detall.textContent = `${grups.length} ${grups.length === 1 ? "sessió" : "sessions"} · ${nFotos} ${nFotos === 1 ? "foto" : "fotos"}`;
      detall.classList.remove("sense-desar");
      esquerra.replaceChildren(fotos);
      return;
    }
    if (!latex) {
      detall.textContent = "";
      esquerra.replaceChildren(h("p", { class: "nota-petita buit-panell" }, "Carregant el LaTeX…"));
      try {
        ({ blocs } = await api(urlLatex));
      } catch (e) {
        if (actual === "latex") esquerra.replaceChildren(h("p", { class: "nota-petita buit-panell" }, e.message));
        return;
      }
      blocs = blocs.map((b) => ({ ...b, text: ambSalt(b.text) }));
      if (blocs.length) {
        latex = h("textarea", { class: "latex", spellcheck: "false", readonly: Boolean(enMarxa),
          "aria-label": "El LaTeX del quadern", oninput: actualitza });
        latex.value = ajunta(blocs);
        if (enMarxa) avis("blau", `${enMarxa}.`, "El LaTeX es pot llegir, però el podràs editar quan acabe.");
      } else {
        latex = h("p", { class: "nota-petita buit-panell" }, "Este quadern encara no té blocs.");
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
