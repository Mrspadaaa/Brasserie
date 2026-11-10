OK — série u : 4 concepts levure (carte, étagère, cuve, échelle des températures), PANEL ECHEC signalé

Fichiers écrits (v0/u1 à u4) : etat.html, NOTE.md, captures ; outil `u1/capturer.mjs` (états par #hash, cave, 1280) ; `u1/commun-sortie.txt`.

- u1 froid, la carte resserrée : la baseline à stations, levure et dose en tête, station Objectifs (FG, alcool, esters).
- u2 tiède, l'étagère : sachet, poche ou bocal posé devant, « ×2–3 sachets » ; planches En stock et Habituelles, un toucher pour changer.
- u3 chaud, la cuve : OG → plage de FG hachurée, alcool en plage, enveloppe = température (ambre hors conduite), cône = floculation ; ‹ › pour feuilleter.
- u4 chaud, l'échelle des températures : barres 10–40 °C et colonne de la conduite 18–20 °C ; la rangée touchée devient la levure et s'ouvre sur sa dose.

Sorties décisives :
- `controle-commun.mjs v0 u1 u2 u3 u4 --page=etat.html --profil=sans-houblons` : COMMUN OK (mots u1 79, u2 70, u3 64, u4 70).
- `verifier-page.mjs <etat.html> --min-images 0` : PAGE OK ×4 (sans `--min-images 0` : échec « 0 images », la maquette n'en a pas).
- `controle-panel.mjs u*-repos-390.png` : PANEL ECHEC. Remplissage médian 0,58, mais 2 écrans sous 0,50 (u1 0,49, u4 ~0,50). Ressemblance 0,94 pour 0,90 au plus : chrome commun et bas de page blanc. Non corrigé faute de tours.

Captures (ouvertes : repos de chaque concept, u1 dose et sans-produit, u2 changer, liquide et vide, u3 voss, notti et cave, u4 voss, dose et 1280) :
`v0/u<n>/u<n>-{repos,dose,vide,sans-produit,liquide,hors}-390.png`, `u3-{voss,notti}-390.png`, `u4-voss-390.png`, `u2-changer-390.png`, `u<n>-cave-390.png`, `u<n>-1280.png`.

Prédiction : « u3 la cuve, une sacrée idée, on voit ce que la levure fait ; u4 très utile pour la température ; u1 propre mais c'est la baseline. »

DÉCISION À PRENDRE : u4 montre au repos les plages de température des autres levures. Est-ce un « comparatif au repos », interdit par J2, ou les puces de l'hypothèse 4 en représentation ? À trancher au tri.

DEMANDE EXECUTANT : aucune pour la v0. En passe 2 : rejouer le panel après les retouches de remplissage :
`node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs work/missions/2026-11-09-ecran-levure/v0/u*/u*-repos-390.png`, attendu PANEL OK.

CONNAISSANCE : `controle-panel` compte le remplissage par rangées de contenu, pas par fond de panneau : un écran plein de cartes grises peut rester sous 0,50 (u1 : 0,49). `verifier-page` exige `--min-images 0` sur une maquette sans image.
LEÇON PROPOSÉE : aucune
