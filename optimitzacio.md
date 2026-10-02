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
| 2 | Llegir els PDF de la font com a text (`pypdf`) en lloc d'imatge | Alt | Pendent: cal instal·lar `pypdf` |
| 3 | Catàleg de fonts (etapa 3): llegir cada font sencera una sola vegada i després buscar al catàleg | Alt a partir de la segona classe | Pendent |
| 4 | Fotos dretes, sense passar per WhatsApp i reduïdes a uns 1.500 px pel costat llarg | Mitjà | Pendent |
| 5 | Saber a quin tema de la font correspon la classe, o mirar primer l'índex de la font | Mitjà | Pendent |
| 6 | Ampliar zones de la foto només quan hi ha un dubte real | Baix | Pendent |
| 7 | No regenerar els blocs ja revisats | Mitjà en temes llargs | Previst a l'especificació |

## Idees per a més endavant

- **Un model més barat per als passos mecànics** (crear carpetes, escriure fitxers, compilar), i el model gran només per comparar amb la font (pas 3).
- **Scripts per als passos 0 i 6.** Preparar carpetes i compilar el PDF sense passar per Claude.
- **Prompt caching a la ferramenta exportable.** Les instruccions, el perfil i el diccionari es repeteixen a cada crida a l'API.
