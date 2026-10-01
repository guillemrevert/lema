# LEMA — Prova 1

**LEMA**: *Lector i Editor de Manuscrits Acadèmics*. Repositori: `lema`.

## Context

Eina per passar a net apunts de matemàtiques escrits a mà, usant Claude. No és un transcriptor: els apunts diuen **què** es va explicar i en quin ordre; les fonts del professor diuen **com** s'ha d'escriure cada resultat. El contingut el mana la font; la notació, els apunts.

Especificació completa: https://claude.ai/code/artifact/b1a1eb4b-aa49-4437-b29b-882a081b9eca

Aquesta prova és l'**etapa 1** del full de ruta. L'objectiu és respondre dues preguntes abans de construir res més:

1. Claude llig bé la lletra de l'usuari?
2. Sap reconstruir els blocs contrastant-los amb una font del professor?

> La secció "Emmagatzematge i dispositius" de l'especificació està desfasada: on es guarden els fitxers i com es connecta Drive encara està per decidir. No la seguisques en aquesta prova.

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

### Decisió 5 en detall: dos tipus de preguntes

**Obligatòries.** Claude no continua fins que l'usuari respon. Es fan **totes juntes, en una sola tanda**, al final de la lectura global:

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

L'usuari els adjunta a la sessió:

1. Fotos d'una classe d'Anàlisi II.
2. Un material del professor (apunts, diapositives o capítol del llibre que segueix).
3. Dues línies sobre eixe material: què és i d'on surt.

## Passos

1. **Preparar la carpeta de treball** amb l'estructura mínima de l'especificació (secció "Formats de dades"), només per a Anàlisi II i aquest tema. Res més.
2. **Fitxa de la font** a partir de la descripció de l'usuari.
3. **Fase 1 · Lectura global.**
   - Comprovar la qualitat de les fotos; si alguna no es pot llegir, avisar abans de continuar.
   - Fer l'esquema de blocs (definició, teorema, proposició, lema, corol·lari, demostració, exemple, observació), amb la pàgina d'origen.
   - Fer el diccionari de notació de l'usuari.
   - Classificar els dubtes en obligatoris i notetes.
   - Mostrar a l'usuari l'esquema i les preguntes obligatòries **en una sola tanda**, i esperar les respostes.
4. **Guardar les respostes al perfil de lletra** (símbols, lletres i paraules, abreviatures).
5. **Fase 2 · Bloc a bloc.** Per a cada bloc:
   - Identificar de quin resultat es tracta.
   - Buscar-lo a la font. Amb una sola font, llegir-la directament; no cal catàleg.
   - Comparar hipòtesis i conclusió i classificar la diferència: equivalent / diferent però vàlid / versió dels apunts falsa / dubtós.
   - Escriure amb el contingut de la font i la notació dels apunts.
   - Citar la font i la pàgina.
   - Aplicar la regla de "falta demo".
   - Les demostracions segueixen l'argument dels apunts; la font només s'usa per a passos il·legibles o incorrectes.
6. **Fase 3 · Muntatge.** Plantilla LaTeX mínima amb els entorns de cada tipus de bloc, les marques (dubte, correcció, nota, caixa "no vist a classe") i les notetes numerades al marge. Compilar el PDF.
7. **Entregar** el PDF i l'informe.

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
