# Améliorer les jouables v7 et passe 4 selon son feedback (26.11)

Sa demande : « jouables déjà publiés (v7 et passe 4) je veux que tu les améliore selon mon feedback et les infos que tu as, et que tu en
recrée une nouvelle de 0 avec les anciens choix, le classement que j'ai fait. » Ce brief couvre la première partie : v7 et passe 4. La
nouvelle, construite de zéro, est JOUABLE-P5.md.

Fichiers :
- v7 : `work/missions/2026-11-25-carnet-document/jouable/m4b-v7.html`, publié https://claude.ai/artifact/MkVwvZtuysD48vgaJiiejS
- passe 4 : `work/missions/2026-11-25-carnet-passe4/jouable/p4.html`, publié https://claude.ai/artifact/7osEWid1m3qPbSZG2wnRRR

On garde le moteur et les acquis :
- Claude via sample, journal ;
- liens/ et demandes/ ;
- lecture automatique quand il arrête d'écrire ;
- Organisé par défaut ;
- aucune question collée au pouce ;
- noms réels.

## Améliorations (ses mots : work/refonte-frontend/v4/SPEC-BRASSEUR.md, 25.11 soir → fin)

1. **Moins enfantin, toujours visuel.** « trop enfantin et simpliste », « toujours bon visuel pour un visal learner ».
   - Noms réels de 2 à 5 mots ; emoji de 16 px au plus, qui accompagne sans remplacer.
   - Ni bulles géantes, ni pastilles décoratives, ni hachures.
   - Gardés : couleur d'état, jauges, barres de prix, icônes au trait.
   - Défauts : TROP-ENFANTIN, PRO-MAIS-PAS-CLAIR.
2. **Arbre compact avec catégorie › sous-catégorie.** « Pas de sous catégories », « vue en arbre mais pas assez compact ». Une ligne par
   carnet ; plus de 12 carnets visibles à 390 px.
3. **Un champ texte en bas plutôt qu'un bouton.** À côté : « + », et ✦ pour la suggestion de l'IA. « une action en moins », « une autre
   action pour de la suggestion de l'ia ».
4. **Comparer en vue dédiée, son choix figé du 17.11.**
   - Écrans choisis : h04-7, v03-4, g05-8, g01-8, h06-7 (images
     `work/missions/2026-11-17-carnet-retouches/maquettes/page2/img/<id>.webp`).
   - Contenu de la vue : barres du critère classées, Côte à côte avec le meilleur en vert, Compromis, Écartés, toutes les
     caractéristiques, « + Ajouter une caractéristique », « ✦ Proposer ».
   - Organisé ne garde que le résumé « qui gagne quoi », à quantité égale (prix par unité livrée).
   - La vue tient 6 offres ou plus. Défauts : COMPARER-PAS-SON-CHOIX, COMPARER-BEAUCOUP-D-OPTIONS, COMPARER-QUI-GAGNE.
   - Référence de rendu : `work/missions/2025-11-25-carnet-passe4/mini/O-comparer-caracteristiques.html` et `O-options-b.html`, en cours de
     reprise ; relis-les à la fin.
5. **Tableau seulement là où il compare**, adapté au cas. Jamais un tableau de propriétés ni un symbole muet ailleurs.
6. **Précis.**
   - Dates comptées depuis aujourd'hui, jour de la semaine juste, heure suisse.
   - « trouvé », « pas trouvé » et « estimé » distingués.
   - Chaque valeur renvoie à sa ligne.
   - « Estimation 150 CHF (exemple) » affichée sur l'écoulement.
7. **Pratique.** L'action principale sous le pouce ; cibles de 44 px au moins ; moins de touchers.
8. **En-tête utile, pas de frise générique, Organisé pas trop textuel.** Défauts : ENTETE-PEU-UTILE, FRISE-GENERIQUE,
   ORGANISE-TROP-TEXTUEL.
9. **Jetons communs.** Couleurs, tailles et barre du pouce reprennent `work/missions/2026-11-25-carnet-passe4/mini/COMMUN.md`, pour
   que les trois jouables se ressemblent.

## Contrat
- Un agent par fichier. Tu ne possèdes que TON fichier, `cap-amelio/` à côté de lui, et `RESULTAT-AMELIO.md` à côté de lui.
- Gestes joués sur Chrome 9222 :
  - puppeteer-core, dans ton onglet ;
  - à la fin : page.close() puis browser.disconnect(), jamais browser.close() ;
  - `window.claude` simulé.
- Captures « avant » et « après » de chaque point, à 390 × 844, toutes ouvertes.
- Tableau des 9 points dans RESULTAT-AMELIO.md (fait / pourquoi pas).
- Commit local de tes chemins. La publication est faite par le pilote.
- Si ton contexte approche 350 k : écris `REPRISE-AMELIO.md` et rends « REPRISE : … ».
- Rends une ligne : points n/9, gestes, commit.
