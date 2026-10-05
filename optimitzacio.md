# Optimització

Com aconseguir que passar una classe a net coste el mínim de tokens. És una llista viva: quan s'aplica una mesura, es marca i s'apunta quant ha estalviat.

## Punt de partida (Prova 1, 02/10/2026)

- Una pàgina d'apunts, 6 blocs.
- **No hi ha una mesura neta.** La prova es va fer al final d'una conversa llarga, on abans s'havia dissenyat l'eina i el diagrama. En acabar, el context feia 433.000 tokens.
- **Lectures:** la foto (més una còpia dreta i tres ampliacions) i unes 25 pàgines de Wuolah com a imatge. D'aquestes pàgines, 20 no servien: eren del Tema 1, i el contingut era al Tema 2.
- **Primer pas:** mesurar la pròxima classe en una conversa nova, apuntant l'ús abans i després.

## On se'n van els tokens

1. **Converses llargues.** Cada pas nou torna a processar tot el que hi ha darrere.
2. **Imatges.** Una pàgina de PDF o una foto llegida com a imatge pesa molt més que el mateix contingut en text.
3. **Buscar a cegues a la font.** Llegir pàgines que després no serveixen.

## Mesures

| # | Mesura | Estalvi esperat | Estat |
| --- | --- | --- | --- |
| 1 | Una conversa nova per a cada classe | Alt | Pendent |
| 2 | Llegir els PDF de la font com a text (`pypdf`) en lloc d'imatge | Alt | Provada amb Wuolah (vegeu baix). Falta aplicar-la en una classe |
| 3 | Catàleg de fonts (etapa 3): llegir cada font sencera una sola vegada i després buscar al catàleg | Alt a partir de la segona classe | Pendent |
| 4 | Fotos dretes, sense passar per WhatsApp i reduïdes a uns 1.500 px pel costat llarg | Mitjà | Pendent |
| 5 | Saber a quin tema de la font correspon la classe, o mirar primer l'índex de la font | Mitjà | Provada: `index.txt` de l'script. Falta aplicar-la en una classe |
| 6 | Ampliar zones de la foto només quan hi ha un dubte real | Baix | Pendent |
| 7 | No regenerar els blocs ja revisats | Mitjà en temes llargs | Previst a l'especificació |
| 8 | Compilar amb [`compila.py`](compila.py): fa les dues passades de `pdflatex` i només torna "OK, N pàgines" o l'error amb fitxer i línia, en lloc d'unes 400 línies per passada | Baix–mitjà | Fet. Falta aplicar-lo en una classe |
| 9 | No mirar el PDF compilat com a imatge: Claude es fia de `compila.py` i el PDF el revisa l'usuari | Mitjà | Acordat |

## Mesures 2 i 5: prova amb els PDF de Wuolah (02/10/2026)

**Script:** [`extreu-font.py`](extreu-font.py). Ús: `python extreu-font.py prova-1/fets`. No passa per Claude. Per a cada PDF escriu un `.txt` amb el text pàgina a pàgina, marcat amb la pàgina impresa i la del PDF (`=== p. 7 [pdf 8] ===`), i un `index.txt` amb una línia per cada definició, teorema, lema, corol·lari, observació, exemple i secció.

**Resultat:**

- Els 4 PDF són LaTeX, no escanejos: entre 1.000 i 2.300 caràcters per pàgina. Les 57 pàgines útils fan 79.000 caràcters de text.
- L'índex dels 4 temes fa 215 línies i 16.000 caràcters. A ull, uns 5.000 tokens, contra les unes 25 pàgines com a imatge de la Prova 1.
- L'script ja corregeix els accents partits (`Definici´ o`), els parèntesis grans de LaTeX, la portada i el peu de pàgina de Wuolah.

**Limitacions:**

- **Subíndexs i superíndexs aplanats:** `σ i(α1)` pot ser σ^i(α₁) o σ_i(α₁). Per al pas 3 (identificar i comparar) el text basta. Per copiar una fórmula al document final, cal mirar eixa pàgina com a imatge.
- **Espais perduts** al voltant dels símbols (`SigaGun grup`). Es llig bé igualment.
- **Delimitadors grans** (claus de casos, parèntesis molt grans) que ixen com a lletres soltes: `®`, `Ç`, `å`.
- **Específic de Wuolah:** l'script coneix la portada i el peu de pàgina de Wuolah. Amb una altra font (llibre, diapositives) caldrà comprovar on va el número de pàgina. Si no el troba, posa `p. ?` i deixa el número del PDF.
- **Fonts escanejades:** amb un escaneig no hi ha text i la mesura 2 no serveix.

**Flux proposat per al pas 3, encara no aplicat:** primer l'índex, després el text de les pàgines que calguen, i només com a imatge les pàgines amb fórmules que es copien al document. S'aplicarà a `CLAUDE.md` i `flux.html` (v5) quan s'haja mesurat una classe.

## Idees per a més endavant

- **Un model més barat per als passos mecànics** (crear carpetes, escriure fitxers, compilar), i el model gran només per comparar amb la font (pas 3).
- **Scripts per als passos 0 i 6.** Preparar carpetes i compilar el PDF sense passar per Claude. Ja hi ha `extreu-font.py` (pas 0) i `compila.py` (pas 6). Crear les carpetes és una sola ordre, així que no cal script.
- **Prompt caching a la ferramenta exportable.** Les instruccions, el perfil i el diccionari es repeteixen a cada crida a l'API.
