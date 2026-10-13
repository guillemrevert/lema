---
name: guia-implementacio
description: Usa-la SEMPRE abans d'implementar qualsevol canvi a LEMA (web local, scripts, plantilla, instruccions de CLAUDE.md o flux.html), també si és petit o si l'usuari diu «fes la X del pla». Primer s'escriu una guia d'implementació i s'espera el vist-i-plau; no es toca el codi abans.
---

# Guia d'implementació

Abans d'implementar res, escriu una guia i ensenya-la a l'usuari. No toques cap fitxer de codi fins que diga que sí.

## On va

`guies/<lletra>-<nom-curt>.md` a l'arrel del repositori. La lletra és la del pla del frontend de `web-local.md` (A, B, C…). Si el canvi no hi és, apunta'l primer al pla o posa un nom sense lletra.

## Què ha de dir

En valencià i explicativa: cada punt s'explica en paraules planes, sense donar res per sabut. Per a cada canvi, què notarà l'usuari, per què es fa i com funcionarà per dins. Ha de tindre estes seccions:

1. **Estat:** proposta, aprovada o feta, amb la data.
2. **Què i per què:** el canvi en dues o tres línies i d'on ve (petició de l'usuari, `millores.md` d'una classe…).
3. **Decisions:** què s'ha triat i què no. Les opcions no triades també van a «Opcions no triades» de `web-local.md`. Si encara n'hi ha de pendents, pregunta-les abans d'acabar la guia.
4. **Fitxers:** cada fitxer que es toca i què hi canvia.
5. **Instruccions de Claude:** si canvia el que fa Claude en algun pas, què canvia a `CLAUDE.md`, a `web/prompt.md` i a `flux.html` (`PASSOS`, nova entrada a `HISTORIAL` i republicar).
6. **Dades:** si canvia algun format (`classe.json`, `esquema.yaml`…), com es lligen les classes d'abans.
7. **Passos:** en ordre.
8. **Com es prova:** a `localhost:8300`, amb quina classe i què s'ha de vore.

## Ordre

1. Si és una pantalla nova, primer el mock-up: una pàgina HTML estàtica, sense res que funcione. La pantalla es mostra neta, tal com es veurà, sense etiquetes damunt. Davall, una explicació part per part (què veus, què pots fer, per a què serveix, què cal), amb les alternatives una al costat de l'altra. La guia l'enllaça.
2. La guia, i esperar el vist-i-plau.
3. Abans de tocar cap fitxer, apuntar-se a `hey.md`: la guia i la fase, la sessió i els fitxers. Si algun ja és d'una altra sessió, esperar o escriure-li.
4. Implementar seguint la guia. Si cal desviar-se'n, actualitzar-la.
5. Provar, posar l'estat a «feta», fer el commit amb la guia inclosa i llevar l'entrada de `hey.md`.
