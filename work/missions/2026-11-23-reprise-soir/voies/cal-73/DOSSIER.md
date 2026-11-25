# Dossier — Calendrier, test en ligne du tour 73 (index-L94x-z-O.js), 25.11

## Où
- https://brasserie-l-affinee.web.app dans le Chrome de débug : puppeteer-core connect 127.0.0.1:9222, ton onglet neuf, 390 × 844, deviceScaleFactor 2, TOUCHER (CDP). Fin : page.close() de ton onglet, browser.disconnect(). JAMAIS browser.close(). Jamais Claude in Chrome. Une autre voie (critique-73) teste le Carnet en même temps : reste dans le Calendrier et Finances.
## Ses données : regarder seulement
- Relevé AVANT/APRÈS : soldes, « CHF à dépenser », période du Calendrier (localStorage compris), les barres de la frise, À venir ; identiques. Tout geste fini seulement sur « ZZ TEST — k73 … » créé puis retiré.
## À juger (BUGS.md : `grep -n "^| CALP-6 \|^| CALP-13 \|^| Q4-\|^| POI-" work/missions/BUGS.md`, et FILE-CONTINUE « Calendrier »)
- CALP-6, CALP-13 ; bandeau « Enregistrement sur le serveur… » qui reste ; « −1 663 » sous ± ; bouton de durée en retard.
- Ses mots : « Q-4 : la vitesse du défilement au bord, à essayer sur ton téléphone. Trop lente sur le calendrier » ; « l'actionnable est du coup plus difficile sur mobile. Rentre la zone plus accessible » ; S53 sans année (« Non ») ; « 3 Javier en S53 ?? ».
- Lenteur MESURÉE (performance.now autour de chaque geste : ouvrir, glisser une barre, défiler 3 semaines, ouvrir une vente), à froid et à chaud, 3 fois chacun.
- Preuves anciennes : jour exact à 3 semaines, Ventes, vente → fiche.
- Puis un passage libre « comme le brasseur » : planifier un brassin ZZ, le déplacer, l'allonger, le retirer.
## Verdict
« combien et quels problèmes ? », liste numérotée B/m/D avec capture ; chaque problème à BUGS.md (préfixe K73-), format des lignes C72 ; controle-bugs → BUGS OK. Aucun appel IA. 2 captures 1280, 2 en sombre (thème posé dans ton onglet seulement). Garde 15 tours pour le ménage et le relevé après.
