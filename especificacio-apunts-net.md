# Apunts a net — Especificació

Sep 29, 2026 · @Guillem Reverter Falcó

## Visió general i objectius

L'eina reconstrueix apunts de matemàtiques escrits a mà en un document LaTeX net, bloc a bloc. No és un transcriptor: els apunts diuen **què** es va explicar i en quin ordre; les fonts de referència diuen **com** s'ha d'escriure cada resultat.

Primera versió per a ús personal, començant per Anàlisi II (Universitat de València, curs 2026-27). Si funciona, es decidirà després si s'exporta per a altres persones. El disseny ha de servir per a qualsevol assignatura organitzada en blocs formals.

**Objectius**

1. Passar a net els apunts de classe amb l'estructura formal de l'assignatura: definicions, teoremes, proposicions, lemes, corol·laris, demostracions i exemples.
2. Corregir errors de lectura i de còpia contrastant cada bloc amb les fonts del professor, llibres i apunts d'altres anys.
3. Respectar la notació personal de l'usuari.
4. Deixar sempre clar d'on ve cada cosa: què era als apunts, què s'ha pres d'una font i què s'ha corregit.
5. Millorar amb l'ús: el perfil de lletra i el diccionari de notació creixen amb cada correcció.

**Fora d'abast (de moment)**

- Fitxes d'estudi, llistes de teoremes per a l'examen o resums. Es poden afegir quan el nucli funcione.
- Resoldre exercicis nous. L'eina reconstrueix el que es va explicar, no genera contingut propi.

## Principis de disseny

Set regles que guien totes les decisions de l'eina:

1. **Contingut de la font, notació de l'usuari.** L'enunciat i les hipòtesis es prenen de la font; els símbols es reescriuen amb la notació dels apunts.
2. **Mai sobreescriure en silenci.** Tota diferència entre apunts i font es classifica i, si no és trivial, es marca al document.
3. **Traçabilitat.** Cada bloc cita la font d'on s'ha pres i la pàgina dels apunts d'on ve.
4. **Marcar abans que inventar.** El que no es pot llegir ni trobar a cap font es marca com a dubte, no s'endevina.
5. **Distingir el que es va veure a classe.** El que s'afegeix des d'una font i no era als apunts va en una caixa diferent.
6. **Treballar per blocs.** Cada bloc es processa, revisa i regenera per separat. Canviar-ne un no toca els altres.
7. **Mínim necessari.** Cap peça nova fins que la simple no es quede curta. La skill és el prototip; la ferramenta exportable reutilitza el mateix nucli.

## Ús i millora contínua

L'eina s'usa amb apunts reals des de l'etapa 2 del full de ruta, molt abans de la versió definitiva, i es modifica mentre s'usa. No hi ha una fase de construcció separada de la fase d'ús.

**Què ho fa possible**

- **Tot el nucli és text editable.** Instruccions de cada fase, plantilla LaTeX, fitxes, diccionari de notació i perfil de lletra són fitxers que l'eina llig cada vegada que s'executa. Un canvi s'aplica a la sessió següent, sense reconstruir res.
- **Canvis petits i locals.** Cada millora toca una sola peça (una regla de la Fase 2, un entorn de la plantilla). Si surt malament, només afecta eixa peça.
- **Registre de millores.** Mentre s'usa, qualsevol problema o idea s'apunta en un fitxer `millores.md` amb data i exemple concret (el bloc on ha passat). Es revisa periòdicament i es decideix què s'aplica.
- **Historial de versions.** El nucli viu en un repositori git. Cada canvi és un commit amb una línia d'explicació; si una modificació empitjora els resultats, es desfà.
- **Els documents ja fets no es trenquen.** Els blocs revisats no es regeneren quan canvien les instruccions. Només es tornen a processar si l'usuari ho demana explícitament.

**Cicle d'ús**

1. Passar a net una sessió d'apunts.
2. Revisar i corregir (subratllat, xinxetes o text).
3. Si una correcció revela un problema de l'eina i no dels apunts, apuntar-lo a `millores.md`.
4. Aplicar la millora al nucli i continuar amb la sessió següent.

## Emmagatzematge i dispositius

L'eina s'usa des de l'ordinador i des del mòbil amb les mateixes dades. Els fitxers es reparteixen en dos llocs segons el tipus:

| On | Què hi va | Per què |
| --- | --- | --- |
| Repositori privat a GitHub | Nucli (instruccions, plantilles), fitxes, catàlegs, diccionari de notació, perfil de lletra, esquemes, blocs `.tex`, `millores.md` | Text que canvia sovint: l'historial de git té valor i ocupa poc |
| Google Drive | PDFs del professor, llibres, apunts d'altres anys, fotos dels apunts | Fitxers pesats que no canvien; GitHub no accepta fitxers de més de 100 MB |

- Claude accedeix als dos llocs des de qualsevol dispositiu: al repositori clonant-lo a la sessió, i a Drive amb el connector de Google Drive.
- Cada fitxa i cada esquema guarden l'**identificador** del fitxer a Drive, no la ruta. Moure o reanomenar el fitxer no trenca res.
- Flux amb el mòbil: les fotos dels apunts es pugen a una carpeta de Drive per tema i l'eina les agafa d'allí.
- Les fotos es poden reduir a uns centenars de KB; per llegir la lletra és suficient.
- Els materials del professor i els llibres són per a ús personal. Si algun dia s'exporta l'eina, només es publicaria el nucli, mai les dades.

Pendent de verificar: que el connector de Drive llig bé PDFs grans i imatges (vegeu l'etapa 1 del full de ruta).

## Arquitectura: nucli i carcassa

L'eina té dues capes. El **nucli** són les instruccions de cada fase, la plantilla LaTeX, els formats de dades i el script de compilació; és el que dona la qualitat. La **carcassa** és com s'executa: primer una skill de Claude, després un programa propi que crida l'API de Claude. El nucli és el mateix en les dues.

&#91;embedded content: arquitectura · 3 fases, 4 magatzems, 1 bucle de revisió\]

El flux central va de dalt a baix. A l'esquerra, el que s'aprén de l'usuari i millora amb l'ús; a la dreta, el que es prepara una vegada per assignatura. Les línies discontínues són la revisió: regenera només el bloc marcat i guarda les correccions.

## Entrades: apunts i biblioteca de fonts

L'eina rep dos tipus d'entrada: els apunts de l'usuari (què processar) i la biblioteca de fonts (amb què contrastar).

### Apunts de l'usuari

- Format: fotos de paper o PDF escanejat. Pendent confirmar si també s'usarà tauleta.
- S'agrupen per tema i per sessió, perquè el document es construeix de manera incremental.
- Abans de processar-los, passen el control de qualitat de fotos (vegeu Fase 1).

### Biblioteca de fonts

Cada assignatura té la seua biblioteca: materials del professor, llibres d'exercicis o de teoria, apunts d'alumnes d'altres anys. Cada font va acompanyada d'una **fitxa** escrita per l'usuari:

| Camp | Contingut | Exemple |
| --- | --- | --- |
| Nom | Identificador curt | `llibre-exercicis` |
| Què és | Tipus de document | Llibre d'exercicis resolts |
| Origen | D'on surt i qui l'ha fet | El professor en trau els exemples de classe |
| Ús | Per a què s'ha de consultar | Exemples i enunciats d'exercicis |
| Notació | Diferències de notació conegudes | Usa `f'(a)` on a classe s'escriu `Df(a)` |
| Prioritat | Pes en cas d'empat (1 = màxima) | 2 |
| Fiabilitat | Si pot contenir errors | Alta / Mitjana / Baixa |

La prioritat i la fiabilitat es dedueixen de la descripció, però l'usuari les pot fixar a mà. Ordre per defecte: materials del professor > llibres > apunts d'altres alumnes.

## Catàleg de fonts

Cada font es llig sencera **una sola vegada**, quan s'afegeix, i se n'extrau un catàleg de resultats. Després, per reconstruir un bloc, l'eina busca al catàleg en lloc de rellegir els PDFs. Això resol el problema de volum: els PDFs grans no caben tots alhora en el context.

**Entrada del catàleg (una per resultat)**

- Tipus: definició, teorema, proposició, lema, corol·lari, exemple, exercici.
- Número i nom tal com apareixen a la font ("Teorema 4.3, del valor mitjà").
- Enunciat complet en LaTeX, amb la notació original de la font.
- Hipòtesis separades en llista, per poder comparar-les una a una.
- Demostració: si la font en té, referència a la pàgina (no es copia al catàleg).
- Paraules clau i noms alternatius del resultat.
- Pàgina d'origen.

**Cerca**

Per trobar un bloc al catàleg es combinen: tipus del bloc, paraules clau i comparació de l'enunciat. En la skill ho fa Claude llegint el catàleg; en la ferramenta exportable, una cerca per similitud (embeddings) retorna els candidats i Claude tria.

**Manteniment**

- Afegir una font = crear la fitxa + generar el seu catàleg.
- Si una font s'actualitza, es regenera només el seu catàleg.
- L'usuari pot revisar i corregir el catàleg a mà: és text pla.

## Fase 1: lectura global

La Fase 1 no escriu res a net: entén els apunts sencers i produeix quatre coses que l'usuari pot revisar abans de continuar.

### 1.1 Control de qualitat de les fotos

Abans de llegir, es comprova cada imatge: borrosa, tallada, amb reflexos, girada o amb poca llum. Si alguna no passa, s'avisa i es demana repetir-la **abans** de processar res. Les pàgines es numeren en l'ordre rebut.

### 1.2 Esquema de blocs

Una llista ordenada de tots els blocs detectats:

- Identificador estable (`B017`).
- Tipus: definició, teorema, proposició, lema, corol·lari, demostració, exemple, observació.
- Número i títol si els apunts en tenen.
- Pàgina i zona d'origen als apunts.
- Resultat al qual pertany (una demostració apunta al seu teorema).
- Referències internes detectades ("per l'anterior lema").
- Marca de "demostració omesa a classe" si s'hi indica.

### 1.3 Diccionari de notació

Taula dels símbols i convencions que usa l'usuari, extreta dels apunts: `Df(a)` en lloc de `f'(a)`, `‖·‖` en lloc de `|·|`, com escriu els conjunts, les successions, les derivades parcials. S'hi afegeix cada símbol nou que aparega. Es guarda per assignatura i es reutilitza entre sessions.

### 1.4 Llista de dubtes de lectura

Fragments on la lectura no és segura, amb la proposta de Claude i el nivell de confiança. Aquests dubtes alimenten el perfil de lletra (vegeu la secció següent).

### Punt de control

L'usuari revisa l'esquema i els dubtes. Pot corregir tipus de bloc, unir o separar blocs i resoldre dubtes. Només després comença la Fase 2.

## Perfil de lletra

Claude no es reentrena: el perfil és un fitxer que se li passa cada vegada que llig apunts, perquè resolga millor els dubtes. S'omple amb els apunts reals, no amb una pàgina de calibratge, perquè la lletra de classe és la que importa.

### Tres seccions

| Secció | Què guarda | Exemple |
| --- | --- | --- |
| Símbols | Símbols matemàtics que es confonen | El meu `∈` s'assembla a `ε`; distingir-los pel context |
| Lletres i paraules | Lletres o paraules que es llegeixen malament | La `u` sembla `v`; el `1` i la `l` són iguals |
| Abreviatures | Abreviatures personals i el seu significat | `tq` = tal que; `sii` = si i només si; `Dem` = demostració |

Cada entrada pot tindre dues formes: una **regla en text** (curta, sempre present) o una **mostra en imatge** (retall amb la lectura correcta, per als casos que una regla no descriu bé).

### Com s'omple

1. En la Fase 1, Claude troba un fragment dubtós.
2. Mostra la línia sencera amb la zona dubtosa marcada i la seua proposta.
3. L'usuari confirma o escriu la lectura correcta.
4. La resposta s'afegeix al perfil.

També s'hi afegeixen les correccions de lectura fetes durant la revisió (subratllats del tipus "ací posa ∂, no δ"). Al principi hi haurà moltes preguntes; amb l'ús, cada vegada menys.

### Límits

- Les mostres en imatge ocupen context. El perfil ha de ser curt i seleccionat: com a referència, unes 30-50 regles i poques mostres.
- Quan una regla es confirma prou vegades, la mostra corresponent es pot eliminar.
- Es mostra la línia sencera en lloc d'un retall precís, perquè Claude estima coordenades de manera aproximada.
- El perfil és per persona, no per assignatura.

## Fase 2: reconstrucció bloc a bloc

Cada bloc de l'esquema es reconstrueix per separat, en cinc passos. El resultat és un fragment LaTeX amb metadades, independent de la resta.

### 2.1 Identificar el resultat

Claude llig el bloc dels apunts (amb el perfil de lletra) i decideix de quin resultat es tracta: "Teorema del valor mitjà per a funcions de ℝⁿ en ℝ". Un mateix teorema es pot enunciar de moltes formes; ací s'identifica el resultat, no la redacció.

### 2.2 Triar la font

1. Buscar al catàleg tots els candidats que corresponen al mateix resultat.
2. Triar el que **més s'assembla als apunts**: notació, ordre de les hipòtesis, forma de l'enunciat. La font més semblant és, probablement, la que seguia el professor.
3. Si n'hi ha diversos igual de semblants, desempata la **prioritat** de les fitxes.
4. Si no n'hi ha cap, el bloc es reconstrueix només amb els apunts i es marca "sense font".

### 2.3 Comparar i classificar discrepàncies

Es comparen hipòtesis i conclusió, una a una, entre els apunts i la font triada. Cada diferència cau en un d'aquests casos:

| Cas | Exemple | Decisió | Marca al document |
| --- | --- | --- | --- |
| Equivalents | Mateix enunciat, redacció o símbols diferents | Contingut de la font, notació dels apunts | Cap |
| Diferents però vàlids | Apunts: "f contínua"; font: "f de classe C¹"; el resultat és cert amb les dues | Es manté la versió dels apunts (probablement decisió del professor) | Nota amb la versió de la font |
| Versió dels apunts falsa | Falta una hipòtesi necessària | Es pren la versió de la font | Correcció marcada |
| Dubtós | No és clar si el resultat és cert amb les hipòtesis dels apunts | Es manté la dels apunts | Marcat per a revisió |

Decidir si un teorema continua sent cert amb hipòtesis més febles pot ser subtil. En cas de dubte, la regla és marcar per a revisió, no decidir.

### 2.4 Adaptar la notació

L'enunciat final es reescriu amb el diccionari de notació de l'usuari. Si un símbol de la font no té equivalent al diccionari, es manté el de la font. Més endavant, el diccionari serà editable a mà per personalitzar la notació.

### 2.5 Completar i enllaçar

- **Referències creuades.** "Per l'anterior lema" es converteix en un `\ref` al lema real. El PDF queda navegable.
- **Buits.** Si a classe es va ometre una demostració i la font la té, es pot afegir en una caixa diferenciada: "No vist a classe, tret de \[font\], p. X". Mai es barreja amb el contingut de classe.
- **Citació.** Cada bloc guarda la font usada i la pàgina, i la pàgina dels apunts d'origen.
- **Il·legible.** El que no s'ha pogut llegir ni trobar es marca en color (`\dubte{...}`).

### Demostracions i exemples

Les demostracions es transcriuen seguint l'argument dels apunts, no el de la font: el professor pot haver fet una demostració diferent. La font només s'usa per resoldre passos il·legibles o incorrectes. Els exemples es busquen al llibre d'exercicis quan la fitxa indica que el professor els en trau.

## Fase 3: muntatge, sortida i document incremental

Els blocs reconstruïts s'ajunten en un document LaTeX per tema i es compila el PDF.

### Plantilla LaTeX

- Entorns `amsthm` per a cada tipus: `definicio`, `teorema`, `proposicio`, `lema`, `corollari`, `exemple`, `observacio`, `proof`.
- Numeració automàtica per tema (Teorema 3.2), compartida entre teoremes, proposicions i lemes o separada: a decidir.
- Macros de marca: `\dubte{}` (il·legible), `\correccio{}` (canvi respecte als apunts), `\nota{}` (discrepància vàlida), caixa `noclasse` (afegit des d'una font).
- Cada bloc porta una etiqueta estable basada en el seu identificador (`\label{B017}`), perquè les referències creuades sobrevisquen als canvis.
- Notes al marge o al peu amb la font i la pàgina.
- Una plantilla per assignatura; totes comparteixen la mateixa base.

### Sortida

- Fitxer `.tex` per tema, editable.
- PDF compilat.
- Un informe breu de la sessió: blocs nous, correccions fetes, dubtes pendents.

### Document incremental

Els apunts arriben setmana a setmana. Cada sessió nova:

1. Afegeix els blocs nous al final del tema corresponent.
2. No regenera els blocs ja revisats.
3. Manté la numeració i les etiquetes existents.
4. Actualitza les referències si un bloc nou cita un d'anterior.

Per fer-ho possible, cada bloc es guarda com un fitxer propi (o una entrada pròpia) i el document és una llista ordenada de blocs. Reordenar o inserir un bloc al mig no obliga a tocar els altres.

## Revisió: subratllat i xinxetes

L'usuari revisa el resultat i marca el que cal canviar. Cada marca està lligada a un bloc, i Claude només regenera eixe bloc.

| Eina | Abast | Per a què | Exemple |
| --- | --- | --- | --- |
| Subratllat | Un tros concret de text o una fórmula sencera | Correccions precises | "Ací posa ∂, no δ"; "falta la hipòtesi de compacitat" |
| Xinxeta | El bloc sencer | Comentaris generals | "Fes aquesta demostració més detallada"; "aquest exemple és d'un altre tema" |

### Com es processa una marca

1. Claude rep el bloc, la marca i el tros subratllat (si n'hi ha).
2. Regenera només eixe bloc; amb subratllat, canvia només la zona marcada i deixa la resta intacta.
3. Si la marca és una correcció de lectura, s'afegeix al perfil de lletra.
4. Si és una correcció de notació, s'actualitza el diccionari.
5. El bloc es marca com a revisat i ja no es regenera en sessions futures.

### On es fa la revisió

Subratllar sobre un PDF compilat és complicat: costa saber a quin tros del LaTeX correspon la selecció. Per això la revisió es fa en una **vista web** on les fórmules es veuen com al PDF (KaTeX) i cada bloc coneix el seu codi. El PDF es genera al final, quan el contingut està aprovat.

Dins d'una fórmula, el subratllat agafa la fórmula sencera: seleccionar mig símbol no té sentit.

### En la fase de skill

Sense vista web, les marques es fan per text referint el bloc: "B017: la hipòtesi és C¹" o "Teorema 3.2, segona línia: és ∂". El processament és el mateix.

## Formats de dades

Tot es guarda en fitxers de text pla (Markdown, YAML, LaTeX). Així l'usuari els pot llegir i editar a mà, i la skill i la ferramenta exportable comparteixen exactament els mateixos fitxers.

### Estructura de carpetes

```
apunts-net/
  perfil-lletra.md              # per persona
  plantilla-base.tex
  assignatures/
    analisi-2/
      notacio.yaml              # diccionari de notació
      plantilla.tex             # hereta de plantilla-base
      fonts/
        llibre-exercicis.pdf
        llibre-exercicis.fitxa.yaml
        llibre-exercicis.cataleg.yaml
      temes/
        tema-03/
          apunts/               # fotos originals
          esquema.yaml          # sortida de la Fase 1
          blocs/
            B017.tex
            B017.meta.yaml
          tema-03.tex
          tema-03.pdf
```

### Fitxa d'una font

```yaml
nom: llibre-exercicis
que_es: Llibre d'exercicis resolts
origen: El professor en trau els exemples de classe
us: exemples, exercicis
notacio: "Usa f'(a) on a classe s'escriu Df(a)"
prioritat: 2
fiabilitat: alta
```

### Metadades d'un bloc

```yaml
id: B017
tipus: teorema
titol: Valor mitjà en diverses variables
origen_apunts: {pagina: 4, zona: meitat inferior}
font: {nom: apunts-professor, ref: Teorema 3.5, pagina: 22}
discrepancies:
  - cas: valid_diferent
    apunts: f contínua en [a,b]
    font: f de classe C1
referencies: [B012]
estat: revisat          # pendent | generat | revisat
```

### Diccionari de notació

```yaml
- concepte: diferencial de f en a
  usuari: Df(a)
  alternatives: ["f'(a)", "df_a"]
- concepte: norma
  usuari: "\\|x\\|"
  alternatives: ["|x|"]
```

## Full de ruta: skill → ferramenta exportable

Cinc etapes, cadascuna usable per si sola. L'eina s'usa per als apunts reals del curs des de l'etapa 2; les etapes següents s'afegeixen sense deixar d'usar-la. No es passa a la següent fins que l'anterior funciona amb apunts reals.

1. **Materials de prova.** Connectar Google Drive a Claude i provar que llig un PDF gran i unes fotos d'apunts. Després, reunir 2-3 sessions d'apunts d'Anàlisi II i una font amb la seua fitxa (preferiblement els materials del professor).
   - Per passar: tindre-ho tot en una carpeta amb l'estructura de dalt.
2. **Skill mínima.** Fase 1 (esquema + diccionari de notació + dubtes) i Fase 2 contrastant amb una sola font llegida directament, sense catàleg. Sortida `.tex` + PDF.
   - Per passar: un tema complet passat a net on les correccions de l'usuari siguen poques i de lectura, no d'estructura.
3. **Catàleg i perfil de lletra.** Generació del catàleg per a diverses fonts, selecció per semblança + prioritat, i perfil de lletra alimentat pels dubtes.
   - Per passar: amb 3 o més fonts, l'eina tria la font correcta i els dubtes de lectura baixen d'una sessió a la següent.
4. **Incremental i referències.** Blocs com a fitxers propis, sessions noves sense regenerar el revisat, `\ref` automàtics, caixa "no vist a classe", control de qualitat de fotos.
   - Per passar: un tema construït en diverses sessions sense perdre revisions.
5. **Ferramenta exportable.** Programa propi que crida l'API de Claude amb el mateix nucli: vista web de revisió amb subratllat i xinxetes, cerca al catàleg per similitud, suport per a diverses assignatures i usuaris.
   - Per passar: una altra persona la pot usar amb les seues assignatures sense ajuda.

Les etapes 1-4 són la versió personal. L'etapa 5 és opcional: només es planteja si la versió personal funciona, i el que s'aprenga usant-la canviarà el disseny.

## Riscos i límits

| Risc | Per què passa | Mitigació |
| --- | --- | --- |
| Lectura errònia d'un símbol | La lletra manuscrita és ambigua (`ε`/`∈`, `δ`/`∂`) | Perfil de lletra + contrast amb la font + marca `\dubte{}` |
| Correcció d'una cosa que estava bé | Claude "arregla" una hipòtesi que el professor va canviar a propòsit | Classificació de discrepàncies; en cas dubtós es manté la versió dels apunts i es marca |
| Judici matemàtic erroni | Decidir si un teorema és cert amb hipòtesis més febles pot ser subtil | Cas "dubtós" explícit; revisió humana obligatòria |
| Font equivocada | Dos resultats amb noms semblants o enunciats confusos | Citació de la font a cada bloc; l'usuari ho veu i ho pot canviar |
| Error heretat d'una font | Els apunts d'altres alumnes poden tindre errors | Fiabilitat a la fitxa; prioritat baixa per a fonts no oficials |
| Volum de fonts | Els PDFs grans no caben tots en el context | Catàleg fet una vegada; cerca només del necessari |
| Cost i temps | Cada bloc implica llegir, buscar i comparar | Treballar per blocs; no regenerar el revisat; catàleg reutilitzable |
| Pèrdua de revisions | Una sessió nova sobreescriu blocs ja corregits | Estat `revisat` per bloc; els blocs revisats no es regeneren |

**Límit de fons:** l'eina redueix molt la feina, però no substitueix la revisió de l'usuari. Un document net amb un error subtil és pitjor que uns apunts bruts on l'error es veu. Per això totes les decisions no trivials queden marcades.

## Decisions obertes

- [ ] Format dels apunts: només fotos i PDF escanejat, o també tauleta (GoodNotes, Notability)?
- [ ] Sortida: només LaTeX + PDF, o també un format editable fàcil (Docs, Markdown)?
- [ ] Numeració: comuna per a teoremes, proposicions i lemes, o separada per tipus?
- [ ] Caixa "no vist a classe": s'afegeix sempre que la font tinga la demostració, o només quan l'usuari ho demana?
- [ ] Tipus de blocs addicionals: observació, nota, exercici, notació?
- [ ] Llengua del document final: la dels apunts sempre, o configurable?
- [ ] Ferramenta exportable: aplicació web, d'escriptori o de línia d'ordres?
- [ ] Materials de prova: quines sessions d'Anàlisi II i quina font primer?
