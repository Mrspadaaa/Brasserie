OK — 28 problèmes, 1 bloquant

# k2, test d'écran T3B, tour 1 (Opus, 20.11)

Question : « combien et quels problèmes ? » sur les captures APRÈS correctif de h1, f1, e1 et v1 (banc local, fixtures simulées, non déployé).
Bilan des constats : T3B-4 réglé au 390, pas au 1280 ; T3B-5 réglé ; T3B-6 NON PROUVÉ (onglet Simuler jamais capturé) ; T3B-7 en partie (l'état replié n'est capturé nulle part) ;
T3B-8 : libellé réglé, donnée encore fausse ; T3B-9 réglé ; T3B-10 non reproduit (aucune capture du cas en ligne) ; T3B-11, T3B-12 et T3B-13 réglés à l'écran.

## Problèmes (voie / id / capture / problème / gravité)

1. h1 / T3B-5 / h1-apres-{m390,d1280}-{clair,cave}-fiche-nelson : « Mots de la fiche : White wine, fruity, grape, gooseberry » reste en anglais au premier plan. Le brasseur lit la fiche du fournisseur, pas ses mots / gênant
2. h1 / T3B-5 / idem : « Thiols : forte » : l'accord est faux (thiols est au pluriel). Écrire « Teneur en thiols : forte » / détail
3. h1 / T3B-5 / idem : « Valeurs de la variété » apparaît deux fois (sélecteur, puis la ligne juste dessous), et « Hopsteiner, 2025 — houblon brut » est répété sous chaque ligne / détail
4. h1 / T3B-5 / h1-apres-d1280-{clair,cave}-fiche-nelson : à 1280, la fiche s'étale sur toute la largeur. Le texte fait 12 à 13 px, les barres α, β et huiles s'étirent sur 1 240 px et « Modifier la variété » est rejeté à l'autre bout de l'écran. Ce n'est pas à sa place à 1280 / gênant
5. h1 / T3B-4 / h1-apres-d1280-{clair,cave}-sources-{repos,ouvert} : à 1280, la phrase d'intro, les 4 boutons « Ajouter… » et « Attributions et licences des référentiels GitHub » restent à plat, alors qu'au 390 ils passent sous « Gérer ». TE-52 avait été vu à 1280 : il n'y est pas réglé / gênant
6. h1 / T3B-4 / h1-apres-m390-{clair,cave}-sources-repos : « Gérer les sources et les modèles » n'a pas l'habillage des trois autres replis (fond gris, police plus petite ; en cave, titre blanc au lieu de jaune) / détail
7. h1 / T3B-4 / *-sources-ouvert (390 et 1280) : du jargon reste visible : « référentiels GitHub », « Les axes pèsent autant les uns que les autres », « Autres référentiels · comparer les sources » / détail
8. h1 / hors voie / *-sources-tout-deplie : le catalogue des levures affiche « Forme non documentée · 2 caractéristique(s) » et « 1733 référence(s) trouvée(s) ». C'est le même genre de texte que le « Forme non précisée » retiré par TE-49 / détail
9. h1 / T3B-4 / h1-apres-d1280-cave-sources-* : « Les repères de base : … » est écrit en gris foncé sur noir, contraste faible en cave / détail
10. f1 / hors voie / fiche-390-{clair,cave}-1, fiche-1280-clair-1 : sur le graphique d'Empâtage, les étiquettes « 66 °C · 60′ » et « 44 °C · 15′ » sont barrées par la ligne de grille. Elles sont aussi dans une police à empattements, différente de tout le reste / gênant
11. f1 / fiche-{390,1280}-*-0 : la carte affiche « Wyeast 3068 · 125 mL », puis « Produit exact non choisi » juste en dessous. Les deux se contredisent / gênant
12. f1 / T3B-12 / fiche-*-3 : redites. « Ébullition 60′ » est suivi de « Ébullition de 60 min. » ; le titre « Fermentation » est suivi du sous-titre « Fermentation » ; les pastilles « Primaire » et « Garde » répètent le mot qui est juste à côté / détail
13. f1 / T3B-11 / fiche-390-*-4, fiche-1280-*-3 : la densité du brassin s'écrit « 1.062 » (avec un point), alors que le bandeau dit « 1,062 » / détail
14. f1 / fiche-*-4 : le Déroulé finit par « FIN DE RECETTE » en capitales, après une ligne vide (reste de l'import). Le Bilan écrit aussi « AVANT la fin de l'ébullition » / détail
15. f1 / fiche-1280-* : à 1280, la colonne fait environ 970 px, mais la barre « Préparer un brassin » est plus large qu'elle. Les deux ne sont pas alignées / détail
16. e1 / T3B-7 / nolo-{390,1280}-{clair,cave} : dans les 4 captures, « Réglages et détails du calcul » est ouvert. Le premier plan montre donc 6 champs, la plage, le plan d'eau, 3 alertes et « Appliquer » grisé : c'est encore un cockpit. L'état replié n'est visible dans aucune capture / gênant
17. e1 / T3B-7 et T3B-9 / nolo-* et malts-* : du jargon « PPG » au premier plan : « Compléter les potentiels PPG : … » et le pied de carte « PPG — · fiche » / gênant
18. e1 / T3B-7 / nolo-390-{clair,cave} : dans le titre du dépliant, « atténuation 8–25 » laisse le « % » seul sur la ligne suivante / détail
19. e1 / T3B-7 / nolo-390-{clair,cave} : le bouton + flottant recouvre le texte du plan d'eau (« Plan d'eau incompatible… ») / gênant
20. e1 / T3B-8 et T3B-9 / malts-*-390-* : le bouton + flottant est collé à « Suivant — Houblons », à environ 8 px. Au pouce, on risque de toucher l'un pour l'autre / gênant
21. e1 / T3B-9 / malts-* : la bascule « Grain ⇄ » et la rangée des cinq noms, juste en dessous, servent à la même chose. Deux commandes pour un seul choix / détail
22. e1 / T3B-8 / malts-coriandre-{390,1280}-{clair,cave} : la ligne dit « épice : ni sucre ni couleur, hors du décompte du grain », mais la famille « Grain » reste encadrée. Selon le RESULTAT d'e1, l'article est en plus créé au stock dans la catégorie Malt. Une épice entre ainsi au stock comme malt : valeur fausse, la plainte MV-8 revient sous une autre forme. Il faut soit une famille épice ou une section additifs, soit refuser la création avec un renvoi (DÉCISION d'e1) / BLOQUANT
23. e1 / T3B-7 / nolo-1280-clair : les champs NOLO sont en texte brun sur fond gris. Ils ont l'air désactivés alors qu'on peut les saisir / détail
24. v1 / T3B-13 / vendre-390-{clair,cave} : la tuile 75 cl dit « à vérifier · prix ? » sans dire pourquoi ni où corriger. La raison (759 CHF le litre, Atelier › Tarifs) n'est que dans une infobulle, qu'on ne peut pas ouvrir au doigt / gênant
25. v1 / T3B-13 / vendre-390-cave-clic75 : en cave, les champs de la ligne libre (« Pale Ale · 75 cl », quantité, prix) sont gris sur fond gris, difficiles à lire / gênant
26. v1 / T3B-13 / vendre-* : « à vérifier · prix ? » sert à deux causes différentes, le fût 20 L sans fût lié et le 75 cl au prix aberrant. Un seul libellé pour les deux / détail
27. v1 / T3B-10 / previsions-390-{clair,cave}-12mois : les noms de mois se touchent (« déc. janv. », « juil. août ») / détail
28. v1 / T3B-10 / previsions-* : la bulle « achats ≥ 66,40 ×2, 20.11 » est codée (« ≥ », « ×2 ») ; elle ne se lit pas en mots / détail

## Doutes (non comptés)
- f1, T3B-6 : la capture « simuler » est restée sur le Bilan (« onglet trouvé false »). Le correctif n'est donc pas vu. Je ne vois pas non plus d'onglet « Simuler » dans « Détail des ajouts et IBU » à 390.
- f1 : ABV 6,5 % pour OG 1,062 et FG 1,015. La formule simple donne 6,2 %, la formule alternative 6,4 %. À vérifier.
- f1 : la fixture (Milk Stout, Wyeast 3068, objectif « Girofle · épices », repos férulique) n'est pas une recette crédible. Ce n'est pas un défaut de l'app, mais la fiche n'est pas jugée sur une vraie pièce (L28).
- f1 : je ne vois pas si les 300 g de lactose, désormais en « Additifs », comptent encore dans l'OG et la FG.
- h1 : « Arômes : Fruité, Agrumes, Épicé » pour Nelson Sauvin. « Épicé » ne colle pas à sa réputation (vin blanc, groseille) ; lien avec L14.
- v1, T3B-10 : les captures n'ont qu'une bulle et un solde de −66,40. Le cas du constat (« TEST −9 » sur « −703,68 ») n'est pas reproduit. Le correctif est préventif et n'est pas prouvé.
- Captures non ouvertes (états déjà vus dans le même thème ou la même largeur) : f1 fiche-390-clair, fiche-1280-clair, fiche-1280-cave (pleines pages), fiche-1280-cave-1 et -2 ; e1 malts-coriandre-1280-cave, malts-repos-1280-clair ; v1 previsions-390-clair-{30jours,12mois}, previsions-390-cave-90jours, previsions-1280-clair-{30jours,12mois}, previsions-1280-cave-{30jours,90jours} ; h1 « avant » non rouvertes.

## DEMANDE EXECUTANT
1. f1, T3B-6 (Simuler) : dans `voies/f1/banc/capturer.mjs`, ouvrir « Détail des ajouts et IBU », puis cliquer l'onglet dont le nom est exactement « Simuler » (rôle tab ; repli : le bouton au texte exact « Simuler », jamais « Simuler une variante de levure »). Capturer `fiche-{390,1280}-{clair,cave}-simuler.png` (4) et écrire dans EXECUTANT.md : onglet trouvé true/false, présence de « durée d'ébullition » (attendu : absente), et le texte de « Viser des IBU ». Commande : `node scripts/with_server.mjs --server "npx vite --port 3108 --strictPort" --port 3108 --timeout 120 -- node work/missions/2026-11-19-bugs-ecrans/voies/f1/banc/capturer.mjs`.
2. e1, T3B-7 (NOLO replié) : la même capture `nolo-*`, avec une fixture dont le plan d'eau est compatible (fermenteur ≥ 30 L, cuve ≥ 45 L), pour voir le dépliant fermé. Produire `nolo-replie-{390,1280}-{clair,cave}.png` et compter les dépliants au premier plan (attendu : 1, fermé).
3. e1, T3B-8 (coriandre après Entrée) : taper « coriandre », puis Entrée. Capturer la liste Malts/sucres (`malts-coriandre-apres-390-clair.png`) : la ligne affiche-t-elle « % du grain » ? Capturer ensuite Stocks › Articles, la fiche « coriandre » (`stock-coriandre-390-clair.png`) : quelle catégorie ?
4. h1, T3B-4 (nouveaux libellés) : ouvrir « Ajouter des références, des études et des modèles », puis chacun de ses sous-replis. Capturer `h1-apres-m390-{clair,cave}-ajouts-ouverts.png` (défilement compris), pour voir « Ajouter la base communautaire », « Ajouter la liste de variétés libre », etc.
5. v1, T3B-10 : sur le banc `finance-demo=reel`, injecter un plan « ZZ TEST — achat » de 9 CHF au 25.12, avec un solde final d'environ −703,68. Capturer l'écran Prévisions entier (pas seulement le graphique) en 90 j, 390 clair et cave : `previsions-cas-enligne-390-{clair,cave}.png`. Rapporter la mesure de recouvrement bulle × solde.
6. v1, T3B-13 : à 390, toucher « à vérifier » sur la tuile 75 cl et capturer `vendre-390-clair-toucher-averifier.png`. La raison s'affiche-t-elle sans infobulle ?
