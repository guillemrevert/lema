# Guia · Carpeta de disseny i instruccions de disseny

**Estat:** feta el 13/10/2026. Provat:

- `disseny/recursos-visuals/mascota-demo.html` s'obri des del lloc nou i el mussol es mou (el botó «Content» tanca els ulls).
- Només esta guia parla encara de `recursos/`, perquè explica el canvi.
- L'enllaç de `CLAUDE.md` i els de `disseny.md` porten a fitxers que existeixen.
- Tots els colors que `disseny.md` diu que són per a text passen el 4,5:1 amb el seu fons.

**Canvis respecte de la proposta:**

- El taronja fosc dels avisos, `#B45309`, dona 4,4:1 damunt del crema i no arriba al mínim. Per al text dels avisos he posat `#8F4207` (6,4:1), que també és de la web d'ara, i per al dels errors `#9A1E17` (7,0:1). Cadascun va amb el seu fons clar.
- L'SVG i la demo deien «mascota d'Apunts». Ara diuen «mascota de LEMA», com vas triar.
- El comentari de dalt de l'SVG tenia els accents mal codificats des del commit `23a9386` (`«` s'havia guardat com `Â«`). Està arreglat. El dibuix no estava afectat.

## Què i per què

**Què demanes.** Una carpeta `disseny/` que ho reunisca tot: els recursos visuals (la carpeta `recursos/`, ordenada i amb el nom nou) i unes instruccions de disseny que es facen sempre a partir d'ara.

**Per a què serveix un `disseny.md`.** Cada sessió de Claude llig `CLAUDE.md` en començar, però no la resta de fitxers. Si `CLAUDE.md` diu «per a tot el que és visual, segueix `disseny/disseny.md`», qualsevol sessió que faça una pantalla, un mock-up o una pàgina el llegirà abans. Així totes fan servir els mateixos colors i les mateixes lletres, i posen la mascota igual. Sense això, cada sessió tria pel seu compte, i per això la web i les pàgines que publique Claude podrien acabar amb aspectes diferents.

No té lletra perquè no és del pla del frontend de `web-local.md`.

## Decisions

Les tres primeres les has triades tu. La resta són propostes meues.

| Què | Proposta | Alternativa |
| --- | --- | --- |
| De què parteixen les instruccions | **La guia de marca:** els seus colors i la mascota | Els colors i les lletres de la web d'ara, més la mascota |
| Nom de l'eina | **LEMA.** El mussol és la mascota de LEMA, i el text «Apunts de ciència i enginyeria» de la guia de marca no es fa servir | «Apunts», o deixar-ho per a més endavant |
| On s'apliquen | **La web local, els mock-ups i les pàgines que publica Claude** (com `flux.html`) | També el PDF. No: el PDF continua amb el seu aspecte de llibre (decisió 2) |
| Nom de la carpeta | `disseny/recursos-visuals/`, amb guió | «recursos visuals», amb espai: els espais donen problemes als enllaços i a la terminal |
| Noms de les imatges | Curts i sense espais: `guia-de-marca.png` i `mascota-expressions.png` | Deixar els d'ara |
| Les dues imatges PNG | **Entren al repositori** (3 MB): són la referència de la marca, i `disseny.md` les cita | Continuar fora de git |
| On va `disseny.md` | Dins de `disseny/`, amb els recursos | A l'arrel, al costat de `CLAUDE.md` |
| La web d'ara | **No canvia amb esta guia.** S'adaptarà a la marca tota d'un colp, amb una guia pròpia i un mock-up. Fins llavors, les pantalles de la web i els seus mock-ups mantenen l'aspecte d'ara, perquè la web no quede mig vella mig nova. Només s'hi pot afegir la mascota | Adaptar-la ja dins d'esta guia, que seria molt més gran |
| Lletres | La guia de marca no en diu res. De moment, les de la web: IBM Plex Sans per al text i IBM Plex Mono per al codi. La del nom LEMA es tria en la guia d'adaptar la web | Triar-ne una de nova ara |

Les opcions no triades van a «Opcions no triades» de `web-local.md`.

## Què posarà `disseny/disseny.md`

Un document curt, amb estes parts:

1. **Per a què és i on s'aplica.** A la web local, als mock-ups i a les pàgines publicades. Al PDF, no.
2. **Nom.** LEMA.
3. **Colors**, cadascun amb el seu ús:

   | Color | Codi | Per a què |
   | --- | --- | --- |
   | Blau fosc | `#1E2A44` | Text, títols, botons principals i enllaços |
   | Crema | `#F7EFE6` | Fons de la pàgina |
   | Blanc | `#FFFFFF` | Targetes i panells damunt del crema |
   | Gris clar | `#E8EBF2` | Vores i fons secundaris |
   | Taronja | `#F4A261` | Destacar (el que està triat, una marca). Mai en text: damunt del crema no es llig bé |
   | Taronja suau i marró | `#A67C52`, `#4A392F` | Detalls i ombres, com en la mascota |

   La guia de marca no té colors per a text secundari ni per a errors i avisos. Els agafe de la web d'ara: un gris blavós per al text secundari, el roig `#B4231B` per als errors i el taronja fosc `#B45309` per als avisos. (Al final, per contrast, `#9A1E17` i `#8F4207`: vegeu «Canvis respecte de la proposta».)
4. **Lletres.** Les de la decisió de dalt.
5. **Formes.** Cantons arredonits, com la icona de la guia de marca; molt d'espai; ombres suaus o cap.
6. **La mascota.**
   - On és: `disseny/recursos-visuals/mascota.svg`, i `mascota-demo.html` amb exemples.
   - On va bé: les pantalles buides, mentre s'espera Claude, els errors i la benvinguda.
   - On no va: mentre llegeixes o revises apunts, perquè distrau, ni al PDF.
   - Com s'anima: només amb les peces de l'SVG, amb moviments suaus, i quieta si el navegador demana menys moviment.
   - Què no s'ha de fer: deformar-la, canviar-li els colors o posar-ne la PNG a la web en lloc de l'SVG.
   - Expressions: ara n'hi ha quatre (normal, saluda, pensa i contenta). Les altres de `mascota-expressions.png` (concentrada amb la tauleta, dubte) encara no estan fetes en SVG.
7. **Mentre la web no s'adapte**, la regla de la decisió de dalt.

## Fitxers

| Fitxer | Què hi canvia |
| --- | --- |
| `disseny/disseny.md` | Nou, amb el contingut de dalt |
| `disseny/recursos-visuals/guia-de-marca.png` | És `recursos/Guia de marca Apunts amb mussol mascote.png`, mogut i amb el nom nou |
| `disseny/recursos-visuals/mascota-expressions.png` | És `recursos/Mascota mes realista i en mes textures.png`, mogut i amb el nom nou |
| `disseny/recursos-visuals/mascota.svg` | Mogut. El comentari de dalt diu el nom nou de la PNG i «mascota de LEMA» |
| `disseny/recursos-visuals/mascota-demo.html` | Mogut. El mateix canvi en el comentari de l'SVG que porta dins, i el títol «Mussol de LEMA» |
| `CLAUDE.md` | Una línia a «Com treballar amb l'usuari» |
| `hey.md` | Fora la línia que diu que les PNG estan sense commit |
| `web-local.md` | Les opcions no triades |

La carpeta `recursos/` desapareix.

## Instruccions de Claude

- **`CLAUDE.md`**, a «Com treballar amb l'usuari», una línia nova:

  > Tot el que és visual (la web local, els mock-ups i les pàgines publicades) segueix [`disseny/disseny.md`](disseny/disseny.md). El PDF no: manté l'aspecte de llibre (decisió 2).

- **`web/prompt.md`:** cap canvi. El Claude de la web passa apunts a net i no fa pantalles.
- **`flux.html`:** cap canvi. No canvia cap pas del flux.

## Dades

Cap canvi.

## Passos

1. Afegir a la meua entrada de `hey.md` tots els fitxers de dalt.
2. Moure els fitxers a `disseny/recursos-visuals/` amb els noms nous (`git mv` per als que ja són al repositori) i esborrar `recursos/`, que quedarà buida.
3. Canviar el nom de la PNG al comentari de `mascota.svg` i de `mascota-demo.html`.
4. Escriure `disseny/disseny.md`.
5. Afegir la línia a `CLAUDE.md`.
6. Llevar la línia de les PNG de `hey.md`.
7. Provar.
8. Posar l'estat a «feta», fer el commit amb esta guia i llevar la meua entrada de `hey.md`.
9. Proposar-te la guia següent: adaptar la web a la marca, amb mock-up.

## Com es prova

- `disseny/recursos-visuals/mascota-demo.html` s'obri al navegador i el mussol es mou.
- No queda cap fitxer que parle de `recursos/`.
- L'enllaç de `CLAUDE.md` obri `disseny/disseny.md`.
- Els colors de `disseny.md` passen el contrast mínim per a text (4,5:1) on diu que són per a text.
