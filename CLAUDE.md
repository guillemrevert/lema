# LEMA — Prova 1

**LEMA**: *Lector i Editor de Manuscrits Acadèmics*. Repositori: `lema`.

## Context

Eina per passar a net apunts de matemàtiques escrits a mà, usant Claude. No és un transcriptor: els apunts diuen **què** es va explicar i en quin ordre; les fonts del professor diuen **com** s'ha d'escriure cada resultat. El contingut el mana la font; la notació, els apunts.

Especificació completa: https://claude.ai/code/artifact/b1a1eb4b-aa49-4437-b29b-882a081b9eca

Aquesta prova és l'**etapa 1** del full de ruta. L'objectiu és provar la combinació apunts + font abans de construir res més:

1. Sap reconstruir cada bloc dels apunts a partir de la font del professor?
2. Llig prou bé la lletra per identificar cada bloc i per al que no és a la font?

> La secció "Emmagatzematge i dispositius" de l'especificació està desfasada: on es guarden els fitxers i com es connecta Drive encara està per decidir. No la seguisques en aquesta prova.

## Flux

Els apunts de l'usuari diuen què es va fer i en quin ordre. Cada bloc es busca a la font del professor, que és text net: si hi és, s'agafa d'allí i desapareixen els dubtes de lletra. La lletra només cal llegir-la prou bé per identificar cada bloc i per al que no és a la font.

1. Lectura general dels apunts.
2. Divisió en blocs.
3. Per a cada bloc:
   1. Identificar-lo: de quin resultat o demostració es tracta.
   2. Mirar com està fet a la font.
   3. Mirar com està als apunts.
   4. Decidir quina versió s'agafa i quines petites modificacions cal fer (decisió 7), i apuntar al diccionari de notació com escriuen els apunts cada concepte.
4. Punt de control: l'usuari revisa l'esquema i respon les preguntes obligatòries, en una sola tanda.
5. Escriure cada bloc, sempre amb la notació de l'usuari (decisió 8).
6. Muntatge i PDF.

### Diagrama del flux

[`flux.html`](flux.html) dibuixa aquest flux amb les instruccions i els canvis de cada pas. Està publicat a https://claude.ai/artifact/VgnAEHRNnpvhkr4PyRxV6X.

Quan canvien les instruccions d'un pas, en el mateix commit:

1. S'actualitza el pas a `PASSOS`, dins de `flux.html`.
2. S'afegeix una entrada al principi d'`HISTORIAL` amb la versió següent (v4, v5…), la data i el que ha canviat en cada pas.
3. Es republica la pàgina a la mateixa adreça.

Si `flux.html` i `CLAUDE.md` no coincideixen, mana `CLAUDE.md`.

## Decisions preses

Tenen prioritat sobre l'especificació si hi ha contradicció.

| # | Decisió | Tria |
| --- | --- | --- |
| 1 | Com arriben els apunts | Fotos fetes amb una app d'escanejar (pàgines rectes i amb bon contrast) |
| 2 | Document final | PDF compilat amb LaTeX, amb aspecte de llibre. L'usuari no l'edita a mà: marca el que està malament i Claude ho corregeix |
| 3 | Idioma | Sempre la llengua dels apunts. El que es trau d'una font en una altra llengua es tradueix. Els noms de teoremes coneguts en una altra llengua van entre parèntesis la primera vegada |
| 4 | Demostracions no fetes a classe | Si els apunts no en diuen res, no s'afegeixen. Si als apunts posa "falta demo" (o la marca equivalent de l'usuari), es busca a les fonts i s'afegeix en una caixa "No vist a classe, tret de [font], p. X". Si no es troba, es marca "Demostració pendent, no trobada a les fonts" |
| 5 | Preguntes a l'usuari | Dos tipus (vegeu baix) |
| 6 | Primera prova | Una classe d'Anàlisi II + un material del professor |
| 7 | Quina versió s'agafa | Segons la comparació amb la font. **Equivalent:** el text de la font. **Diferent però vàlid** (a classe es va fer una altra demostració o es van canviar hipòtesis a propòsit): la dels apunts, amb noteta. **Apunts falsos:** la de la font, amb la correcció marcada. **Dubtós:** pregunta obligatòria. Si el bloc no és a la font, es fa amb els apunts. El que és als apunts i no a la font (un pas extra, un comentari del professor) es manté |
| 8 | Notació | Sempre la de l'usuari. Si un símbol només apareix a la font, es manté el de la font |

### Decisió 5 en detall: dos tipus de preguntes

**Obligatòries.** Claude no continua fins que l'usuari respon. Es fan **totes juntes, en una sola tanda**, al punt de control, **després d'haver buscat cada bloc a la font**: només es pregunta el que la font no resol.

- Símbol dubtós dins d'una fórmula.
- Hipòtesi que sembla falsa i no se sap si és un error dels apunts.
- Pàgina o zona il·legible.

**Notetes.** Claude tria una opció, l'aplica i continua, però deixa una noteta que l'usuari resol amb un clic (opcions o sí/no). Exemples:

- Quina font o demostració s'ha usat.
- Paraula dubtosa que el context aclareix.
- Discrepància vàlida entre apunts i font (es manté la versió dels apunts).

En aquesta prova no hi ha vista web, així que les notetes es presenten com una llista numerada a l'informe, i al PDF apareixen com una marca al marge amb el mateix número:

```
N1 · Teorema 2.3 · He llegit "contínua". Correcte?  [Sí]  [No, és: ___]
N2 · Teorema 2.3 · Apunts: "f contínua"; font: "f de classe C¹". He deixat la dels apunts.  [Apunts]  [Font]
```

## Materials d'entrada

L'usuari els deixa a `prova-1/`:

1. `apunts/`: fotos d'una classe d'Anàlisi II.
2. `fets/`: un material del professor (apunts, diapositives o capítol del llibre que segueix).
3. Un `.txt` amb dues línies sobre eixe material: què és i d'on surt.

## Passos

Tenen la mateixa numeració que el flux i que `flux.html`.

0. **Preparació.**
   - Preparar la carpeta de treball amb l'estructura mínima de l'especificació (secció "Formats de dades"), només per a Anàlisi II i aquest tema. Res més.
   - Fer la fitxa de la font a partir de la descripció de l'usuari.
1. **Lectura general** (Fase 1).
   - Comprovar la qualitat de les fotos; si alguna no es pot llegir, avisar abans de continuar.
   - Llegir els apunts sencers.
   - Si ja hi ha un diccionari de notació d'una sessió anterior, es pot consultar per llegir millor. El diccionari no es fa ací, sinó al pas 3.
2. **Divisió en blocs** (Fase 1).
   - Fer l'esquema de blocs (definició, teorema, proposició, lema, corol·lari, demostració, exemple, observació), amb la pàgina d'origen.
3. **Per a cada bloc** (Fase 2).
   - Identificar de quin resultat o demostració es tracta.
   - Buscar-lo a la font. Amb una sola font, llegir-la directament; no cal catàleg.
   - Comparar-lo amb els apunts (hipòtesis, conclusió i, en les demostracions, l'argument) i classificar la diferència: equivalent / diferent però vàlid / versió dels apunts falsa / dubtós.
   - Apuntar al diccionari de notació com escriuen els apunts cada concepte, a partir de la comparació amb la font.
   - Decidir la versió segons la decisió 7.
   - Classificar els dubtes que la font no resol en obligatoris i notetes.
4. **Punt de control.** Mostrar a l'usuari, **en una sola tanda**, l'esquema de blocs (amb on s'ha trobat cada bloc a la font) i les preguntes obligatòries. Esperar les respostes i guardar-les al perfil de lletra (símbols, lletres i paraules, abreviatures).
5. **Escriure cada bloc** amb la versió decidida i la notació del diccionari. Citar la font i la pàgina. Aplicar la regla de "falta demo".
6. **Muntatge i entrega** (Fase 3). Plantilla LaTeX mínima amb els entorns de cada tipus de bloc, les marques (dubte, correcció, nota, caixa "no vist a classe") i les notetes numerades al marge. Compilar el PDF i entregar-lo amb l'informe.

## Què s'ha d'entregar

- `tema.tex` i `tema.pdf`.
- Esquema de blocs, diccionari de notació, perfil de lletra i fitxa de la font, com a fitxers de text.
- Un informe curt de la prova amb:
  - Nombre de blocs detectats i de quins tipus.
  - Nombre de preguntes obligatòries i de notetes.
  - Llista de notetes en el format de dalt.
  - Per a quants blocs s'ha trobat el resultat a la font.
  - Correccions fetes respecte als apunts.
  - Problemes trobats que suggereixen canvis a l'eina (van a `millores.md`).

## Com sabrem si la prova ha anat bé

- Els blocs que són a la font s'han trobat i aparellat bé.
- L'esquema de blocs necessita poques correccions.
- Les preguntes obligatòries són poques i totes tenen sentit.
- Els errors que queden són de lectura, no d'estructura.
- Claude no ha "arreglat" res en silenci: tota diferència amb els apunts està marcada.

La valoració final la fa l'usuari revisant el PDF.

## Fora d'abast en aquesta prova

- Drive, GitHub Actions i qualsevol automatització.
- Vista web de revisió amb subratllat i xinxetes.
- Catàleg de fonts i diverses fonts alhora.
- Document incremental entre sessions.

## Com treballar amb l'usuari

- Respondre en valencià, de manera concisa i directa.
- Si hi ha diverses maneres de fer una cosa, preguntar quina prefereix abans de fer-la.
- Fer el mínim que funcione; res de sobreenginyeria.
- Ser sincer amb els resultats, també si la prova ix malament.
