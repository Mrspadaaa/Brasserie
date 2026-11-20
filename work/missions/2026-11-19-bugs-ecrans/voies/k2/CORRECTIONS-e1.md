# Corrections e1, tour 2 (critique k2, 20.11)

Liste figée (L18) : chaque point est corrigé et prouvé seul (test si c’est une règle ; capture 390 et 1280, clair et cave, ouverte), ou écarté avec raison. Un point « hors voie » de la critique se corrige s’il est dans ton « Possède » (voies/e1/VOIE.md) ; sinon « ouvert — hors voie : fichier ». Même contrat que voies/e1/VOIE.md : COMMUN.md, test rouge d’abord, commit par chemins « Bugs T3B (e1) k2 : … » terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> », jamais de déploiement ni de données réelles, jamais stash/reset/checkout.

## Problèmes (RAPPORT.md, même dossier)
16. e1 / T3B-7 / nolo-{390,1280}-{clair,cave} : dans les 4 captures, « Réglages et détails du calcul » est ouvert. Le premier plan montre donc 6 champs, la plage, le plan d'eau, 3 alertes et « Appliquer » grisé : c'est encore un cockpit. L'état replié n'est visible dans aucune capture / gênant
17. e1 / T3B-7 et T3B-9 / nolo-* et malts-* : du jargon « PPG » au premier plan : « Compléter les potentiels PPG : … » et le pied de carte « PPG — · fiche » / gênant
18. e1 / T3B-7 / nolo-390-{clair,cave} : dans le titre du dépliant, « atténuation 8–25 » laisse le « % » seul sur la ligne suivante / détail
19. e1 / T3B-7 / nolo-390-{clair,cave} : le bouton + flottant recouvre le texte du plan d'eau (« Plan d'eau incompatible… ») / gênant
20. e1 / T3B-8 et T3B-9 / malts-*-390-* : le bouton + flottant est collé à « Suivant — Houblons », à environ 8 px. Au pouce, on risque de toucher l'un pour l'autre / gênant
21. e1 / T3B-9 / malts-* : la bascule « Grain ⇄ » et la rangée des cinq noms, juste en dessous, servent à la même chose. Deux commandes pour un seul choix / détail
22. e1 / T3B-8 / malts-coriandre-{390,1280}-{clair,cave} : la ligne dit « épice : ni sucre ni couleur, hors du décompte du grain », mais la famille « Grain » reste encadrée. Selon le RESULTAT d'e1, l'article est en plus créé au stock dans la catégorie Malt. Une épice entre ainsi au stock comme malt : valeur fausse, la plainte MV-8 revient sous une autre forme. Il faut soit une famille épice ou une section additifs, soit refuser la création avec un renvoi (DÉCISION d'e1) / BLOQUANT
23. e1 / T3B-7 / nolo-1280-clair : les champs NOLO sont en texte brun sur fond gris. Ils ont l'air désactivés alors qu'on peut les saisir / détail

## Doutes à trancher

- Point 21 : la bascule « Grain ⇄ » vient de sa maquette (règle n° 1) : ne pas la retirer ; lecture étroite au choix, notée.
- Points 19 et 20 : le + flottant (src/ui/floating-actions.css, tu peux y écrire, git diff d’abord) : même gouttière de 76 px que T3-10/k1.
- Point 22 (bloquant) : une épice ne doit pas entrer au stock comme malt : catégorie existante adaptée (grep des catégories de stock), sinon ne pas créer d’article de stock et le dire.

## Preuves demandées (à produire toi-même)
2. e1, T3B-7 (NOLO replié) : la même capture `nolo-*`, avec une fixture dont le plan d'eau est compatible (fermenteur ≥ 30 L, cuve ≥ 45 L), pour voir le dépliant fermé. Produire `nolo-replie-{390,1280}-{clair,cave}.png` et compter les dépliants au premier plan (attendu : 1, fermé).
3. e1, T3B-8 (coriandre après Entrée) : taper « coriandre », puis Entrée. Capturer la liste Malts/sucres (`malts-coriandre-apres-390-clair.png`) : la ligne affiche-t-elle « % du grain » ? Capturer ensuite Stocks › Articles, la fiche « coriandre » (`stock-coriandre-390-clair.png`) : quelle catégorie ?

## Rendre
En bas de ce fichier, « ## Fait » : une ligne par point « n° | corrigé <sha> / écarté <raison> / ouvert <raison> | capture ». Mettre à jour voies/e1/RESULTAT.md si un verdict change, puis tests.txt ; `node work/missions/2026-11-19-bugs-ecrans/verdicts.mjs e1` et `--tests` OK. Réponse : une ligne.

## Fait
16 | corrigé aea1fcabf | nolo-replie-{390,1280}-{clair,cave}.png : 1 dépliant, fermé ; nolo-* (plan d'eau bloqué) : fermé aussi
17 | corrigé aea1fcabf | nolo-390-clair.png (« potentiel d’extrait ») ; malts-repos-390-cave.png (« potentiel — · fiche »)
18 | corrigé aea1fcabf | nolo-replie-390-clair.png : « atténuation 13–17 % » passe à la ligne en bloc
19 | corrigé aea1fcabf | nolo-ouvert-fin-390-{clair,cave}.png : aucun texte sous le + (mesure : 0)
20 | corrigé aea1fcabf | malts-repos-390-{clair,cave}.png : écart + / Suivant 20 px (11 avant)
21 | corrigé aea1fcabf (lecture étroite) | malts-repos-*.png : la bascule reste seule commande, les cinq noms sont une légende
22 | corrigé aea1fcabf (catégorie « Additif ») ; ouvert pour la section Additifs : hors voie BrewWizard.tsx | malts-coriandre-apres-390-clair.png ; stock : prouvé par le test (stock dev-local vide)
23 | corrigé aea1fcabf | nolo-replie-1280-clair.png : champs blancs, encre sombre
Preuves 2 et 3 : produites (nolo-replie-*, malts-coriandre-apres-390-clair, stock-coriandre-390-clair : « hors du grain », catégorie Additif au test).
