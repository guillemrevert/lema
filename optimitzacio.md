# Optimització

Com aconseguir que passar una sessió a net coste el mínim de tokens sense perdre qualitat. És una llista viva: quan s'aplica una mesura, es marca i s'apunta quant ha estalviat.

## Punt de partida: tres sessions de la web (05–10/10/2026)

Dades dels registres de cada sessió (`dades/.../sessions/<sessió>/registre/claude-*.jsonl`). La Prova 1 (02/10) no té una mesura neta: es va fer al final d'una conversa llarga.

El cost és a preu de l'API. Amb la subscripció Max no es paga, però és una bona mesura del que gasta del límit. Els preus que es dedueixen dels registres, per milió de tokens, són:

- **Entrar a la conversa:** 8 $. Inclou les instruccions, els fitxers llegits, les imatges i el que ha escrit Claude en el pas anterior.
- **Tornar a llegir la conversa a cada pas:** 0,20 $.
- **Escriure:** 20 $. Inclou el raonament intern.

| Sessió | Fotos | Crides a Claude | Cost | Conversa en acabar |
| --- | --- | --- | --- | --- |
| 2026-09-30-2 | 9 | 2 | 1,83 $ | 117.000 tokens |
| 2026-10-05 | 2 | 3 | 2,74 $ | 154.000 tokens |
| 2026-10-07 | 3 | 2 | 2,32 $ | 129.000 tokens |

Repartiment de la sessió del 05/10, semblant en les altres dues:

| | Cost | Part |
| --- | --- | --- |
| Entrar a la conversa | 1,15 $ | 42 % |
| Escriure (blocs i raonament) | 0,90 $ | 33 % |
| Tornar a llegir la conversa | 0,68 $ | 25 % |

## On se'n van els tokens

Dades de la primera crida de cada sessió, que és la que llig els materials:

- **Instruccions en començar: 26.000–27.000 tokens.** Claude Code carrega 25 eines i 69 ordres. `CLAUDE.md` i el prompt de la web en són una part petita.
- **Orientar-se: uns 10.000 tokens i 3 accions.** Claude llig `web-local.md` (el prompt l'esmenta), busca les carpetes, i llig `sessio.json` i el registre, encara que el prompt ja diu on és cada cosa.
- **Font: uns 10.000 tokens.** L'índex sencer (16.000 caràcters) i trossos de text de diverses pàgines.
- **Fotos: uns 2.500 tokens cadascuna**, al voltant d'un 3 % de la sessió.
- **Ampliacions: uns 8.000 tokens cadascuna.** No hi ha eina per retallar, i Claude compila un PDF amb LaTeX per ampliar una zona. Costa més que la foto sencera.
- **Escriure: 16.000–23.000 tokens.** Entre la meitat i dos terços és raonament intern.
- **Després del punt de control:** les crides continuen la mateixa conversa. Mentre no passe una hora, tornar-la a llegir és barat. Si passa més d'una hora, s'ha de tornar a entrar sencera, i costa uns 0,85 $.

## Mesures

| # | Mesura | Estalvi esperat | Estat |
| --- | --- | --- | --- |
| 1 | Una conversa nova per a cada sessió | Alt | Aplicada: la web obri una conversa per sessió |
| 2 | Llegir els PDF de la font com a text (`pypdf`) en lloc d'imatge | Alt | Aplicada: la web executa `extreu-font.py` quan es puja una font |
| 3 | Catàleg de fonts (etapa 3): llegir cada font sencera una sola vegada i després buscar al catàleg | Alt a partir de la segona sessió | Pendent. La mesura 11 en fa una versió barata |
| 4 | Fotos dretes, sense passar per WhatsApp i reduïdes a uns 1.500 px pel costat llarg | Baix: les fotos són un 3 % | Pendent |
| 5 | Mirar primer l'índex de la font | Mitjà | Aplicada: prompt de la web |
| 6 | Ampliar zones de la foto només quan hi ha un dubte real | Mitjà: cada ampliació costa més que una foto | Pendent |
| 7 | No regenerar els blocs ja revisats | Mitjà en temes llargs | Previst a l'especificació |
| 8 | Compilar amb [`compila.py`](compila.py): fa les dues passades de `pdflatex` i només torna "OK, N pàgines" o l'error amb fitxer i línia | Baix–mitjà | Aplicada: la web l'usa |
| 9 | No mirar el PDF compilat com a imatge: Claude es fia de `compila.py` i el PDF el revisa l'usuari | Mitjà | Acordat |
| 10 | Un dossier de la sessió fet per un programa (rutes, fitxa, perfil, diccionari, materials) i un prompt que no convide a explorar | Uns 8.000–10.000 tokens i 4–6 accions per sessió | Aprovada: [guia](guies/optimitzacio-tokens.md), fase 4 |
| 11 | `busca-font.py`: l'índex només dels temes de la sessió i el passatge exacte de cada resultat. La cerca per semblança, la idea de partida, va eixir malament en el prototip (vegeu baix) | Uns 5.000 tokens per sessió | Aprovada: guia, fase 3 |
| 12 | [`retalla.py`](retalla.py): retallar i ampliar una zona de la foto (Pillow) en lloc de compilar un PDF | De 8.000 a uns 200–1.000 tokens per ampliació | Feta el 13/10/2026 (guia, fase 2). Claude encara no la coneix: el prompt la presentarà a la fase 4 |
| 13 | Carregar només les eines que calen a Claude Code (`--tools "Bash,Read,Write,Edit"` i `--disable-slash-commands`) | Part dels 27.000 tokens de començar, a cada crida | Feta el 13/10/2026 (guia, fase 1). Falta mesurar quant baixa |
| 14 | Respondre el punt de control abans d'una hora | Evita uns 0,85 $ per sessió | Consell per a l'usuari |
| 15 | Menys raonament quan s'escriuen els blocs (pas 5) | Fins a la meitat del cost d'escriure | Només si una prova demostra que la qualitat no baixa |

Les mesures 10–13 juntes podrien estalviar entre un 15 i un 25 % per sessió, sense tocar la qualitat. És una estimació. Es comprova mesurant la sessió següent amb [`mesura-sessio.py`](mesura-sessio.py), que dona, per a cada crida a Claude, les accions, el context en començar i el cost separat en el que entra, el que es torna a llegir i el que s'escriu.

## Mesures 2 i 5: prova amb els PDF de Wuolah (02/10/2026)

**Script:** [`extreu-font.py`](extreu-font.py). Ús: `python extreu-font.py <carpeta>`. No passa per Claude. Per a cada PDF escriu un `.txt` amb el text pàgina a pàgina, marcat amb la pàgina impresa i la del PDF (`=== p. 7 [pdf 8] ===`), i un `index.txt` amb una línia per cada definició, teorema, lema, corol·lari, observació, exemple i secció.

**Resultat:**

- Els 4 PDF són LaTeX, no escanejos: entre 1.000 i 2.300 caràcters per pàgina. Les 57 pàgines útils fan 79.000 caràcters de text.
- L'índex dels 4 temes fa 215 línies i 16.000 caràcters, uns 5.000 tokens. A la Prova 1 se n'havien llegit unes 25 pàgines com a imatge.
- L'script ja corregeix els accents partits (`Definici´ o`), els parèntesis grans de LaTeX, la portada i el peu de pàgina de Wuolah.

**Limitacions:**

- **Subíndexs i superíndexs aplanats:** `σ i(α1)` pot ser σ^i(α₁) o σ_i(α₁). Per al pas 3 (identificar i comparar) el text basta. Per copiar una fórmula al document final, cal mirar eixa pàgina com a imatge.
- **Espais perduts** al voltant dels símbols (`SigaGun grup`). Es llig bé igualment.
- **Delimitadors grans** (claus de casos, parèntesis molt grans) que ixen com a lletres soltes: `®`, `Ç`, `å`.
- **Específic de Wuolah:** l'script coneix la portada i el peu de pàgina de Wuolah. Amb una altra font (llibre, diapositives) caldrà comprovar on va el número de pàgina. Si no el troba, posa `p. ?` i deixa el número del PDF.
- **Fonts escanejades:** amb un escaneig no hi ha text i la mesura 2 no serveix.

**Flux del pas 3:** primer l'índex, després el text de les pàgines que calguen, i només com a imatge les pàgines amb fórmules que es copien al document. Aplicat al prompt de la web (`web/prompt.md`).

## Idea: escàner de text i cerca a la font per programa (13/10/2026)

**Proposta de l'usuari:**

1. Un escàner de text (OCR) instal·lat a l'ordinador llig les fotos dels apunts.
2. Claude no llig la pàgina sencera: només mira els trossos on l'OCR ha tret coses sense sentit, per si s'ha equivocat.
3. Amb això hi ha un esborrany del que ha escrit l'usuari.
4. Un programa compara l'esborrany amb la font, sense que Claude haja de comprendre res, i troba els trossos que més s'hi assemblen.
5. Si una coincidència passa d'un percentatge, s'agafa eixa.

El principi és que el programa faça tot el que no cal entendre, i Claude només el que sí.

**Valoració:**

- **L'OCR (parts 1 i 2): descartat de moment.** Les fotos són un 3 % de la sessió. Encara que l'OCR llegira perfecte, l'estalvi màxim seria d'un 5 %. A més, els OCR locals llegeixen malament la lletra a mà i les fórmules: si en falla moltes, Claude acaba mirant la imatge igualment i es perd qualitat.
- **La cerca per programa (part 4): passa a ser la mesura 11.** Claude llig les fotos, com ara, i escriu una línia per bloc amb el tipus i les paraules clau. Un script la compara amb el text de la font (el que trau `extreu-font.py`) i torna els 3 candidats més semblants amb el percentatge, i només el text del passatge. Per exemple: `B04 → Teorema 1.18 (Lagrange), p. 7, 82 %`. Substitueix llegir l'índex sencer i les pàgines equivocades.
  **Prototip (13/10/2026): no funciona prou bé.** Comparant trossos de 3 lletres, amb més pes per al títol i el tipus, i provat amb els esquemes de les sessions passades: dels 9 blocs que sí que són a la font, el bo ix el primer en 3 i entre els 3 primers en 5. Els blocs que no són a la font trauen fins a un 48 %, i els que sí, des d'un 17 %, així que cap percentatge no els separa. La mesura 11 passa a ser la part mecànica: l'índex dels temes de la sessió i el passatge exacte que Claude demana. Una cerca per significat (embeddings) queda per a més endavant.
- **El percentatge (part 5) només decideix on mirar, no quina versió s'agafa.** "f contínua" i "f de classe C¹" s'assemblarien en més d'un 90 % i són diferents. Amb un percentatge alt, Claude només compara eixe passatge curt amb els apunts. Costa poc, però no es pot saltar: ho exigeixen la decisió 7 i la regla de no arreglar res en silenci.
- **El principi s'aplica a altres llocs on gasta més:** el dossier de la sessió (mesura 10) i el retall de fotos (mesura 12).

## Idees per a més endavant

- **Un model més barat per als passos mecànics** (crear carpetes, escriure fitxers, compilar), i el model gran només per comparar amb la font (pas 3).
- **Scripts per als passos 0 i 6.** Ja hi ha `extreu-font.py` (pas 0) i `compila.py` (pas 6), i la web els usa. Crear les carpetes és una sola ordre, així que no cal script.
- **Prompt caching a la ferramenta exportable.** Les instruccions, el perfil i el diccionari es repeteixen a cada crida a l'API.
