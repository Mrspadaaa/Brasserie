# Nuit du 16 au 17.11 : plan du pilote (reprise)

Ses mots : « On passe bientôt en mode nuit. » Autonomie ; rien d'irréversible (déploiement, push, données réelles) sans lui.

## En cours (workflows)
- wtupoto3n `choix-ouverts-jouable` → choix-ouverts/jouable/ : publier (porte + 5 protos), ligne Pages.
- wjiyk03r5 `liens-interactions` → liens-app/page-inter/ : publier (clair seul : retirer les images cave).
- wv8iis19y `calendrier-interactions` → calendrier/page14/ : publier (clair seul).
- wd3wemk0r `calendrier-r6b-suite` → calendrier/page15/ : publier.
À chaque retour : ouvrir 1 ou 2 captures, retirer le cave, verifier-page PAGE OK, publier, Pages, commit.

## Ensuite, cette nuit
1. Porter dans l'app, sur une branche locale, tests + build + parcours Chrome local (390 tactile, 1280, deux thèmes) : pastille C (Stocks), Fournisseur v1, Suppression v2, Lot v1. Sans déploiement.
2. Au matin : une page « ce qui t'attend » : les choix nouveaux (pages 14, 15, interactions, jouable), et les accords groupés (déployer les ports).

## Choix inscrits ce soir
Corps calendrier gi2/r2-c (choisi-a + r2-c) ; en-tête portrait r6b ; pastille C tel quel ; i1 i3 i4 i6 i8 gardés, i5 i7 refusés ; mini maquettes en clair seul.

## Ses réponses (16.11, avant la nuit)
- Ports : il choisit sur https://claude.ai/artifact/T5xF2RhFpsoijv1KomxeLL ; sans réponse, ne porter que ce qui ne dépend pas du calendrier (fournisseur, suppression, lot, pastille C), l'onglet attend.
- Calendrier : « Le critique tranche, j'ajuste » : enchaîner page15 → assemblage (corps gi2/r2-c + en-tête retenue + gestes retenus) → critique → correction → page du matin.
- Déploiement : « Oui, si tout est vert » : seulement les parties portées, rejouées en ligne sur ZZ TEST puis retirées.
- Carnet : « Assembler étape par étape » : le critique choisit ra ou p5f par étape, scénario rejoué de zéro.

## Ports (lancés 16.11 soir)
- Les cinq : onglet, fournisseur, suppression, lot, pastille. Worktree ../ports-nuit, branche claude/ports-nuit-1611 depuis en-ligne/2026-11-16-brassins-apresmidi. Workflow wi5w4ykc0 (wf_54c86dfd-f79) : ports en série, critique vision, correction + checklist DEPLOY.md.
- Au retour PRET A DEPLOYER : déployer l'hébergement seul depuis ../ports-nuit (pas npm run deploy), tag en-ligne/2026-11-17-ports-nuit, jouer en ligne sur ZZ TEST puis retirer.
- Pastille : la fenêtre de l'histogramme se règle au doigt (bords et déplacement, début libre : « juste 50 51 ») : jouable fait par un agent ; l'ajouter au port (claude/ports-nuit-1611) au retour de wi5w4ykc0.

## Gestes (page14, critique tranche, nuit)
- Retenus par le critique : déplacer f1-b (+ courbe avant/après de c4-a ; brassin : f6-a) ; allonger f2-a (+ alerte de promesse) ; poser f3-a (vente), f3-b (durée) ; ouvrir f4-b (+ actions de f4-a) ; appui long f5-b ; dépendances f6-b ; période c1-b + c5-a ; lire une semaine c2-b (+ glisser c3-a) ; agrandir c3-b ; et si c4-a.
- À assembler sur la base gi2/r2-c + en-tête retenue (page15), après son ajustement au matin.
- surligner-ecarts : un élément déplacé (puce « 6 sem. ») ou une bande qui change fait un rectangle presque plein écran : à améliorer (zones par composants, pas par pixels) avant la prochaine page.

## Tranché par le critique cette nuit (à ajuster au matin)
- En-tête portrait : z2 (un seul rang sous la courbe, « S47 – S52 » dans la brosse) ; z1 en second. Paysage : w3 (comme le portrait), w2 en second.
- Liens : L9 = l9-b (+ boutons −/+ de a, lien « Tous les gestes » vers c) ; L4 = l4-a et l4-b ; L1 = l1-b et l1-a ; L29 = l29-a (+ aperçu de b) ; L14 = l14-a (+ ligne « attendue ≈ … » de b). Restes du critique : Porter unique d'un écran à l'autre, pastille cohérente, « Lié à » à une seule place.

## Tranché cette nuit (suite)
- En-tête sobre : portrait s1 (s4 second), paysage t1 (t3 second) — critique contre ses six phrases, contrôles ENTETE et COMPACT verts.
- Mode graph : g4b premier (g2b, g3b) ; ses étiquettes gardent les montants (lot lancé avant « juste quel info avec date ») : à aligner sur s1 si choisi.
- « + S47 » refusé (i7) retiré des maquettes du mode graph (build-b.mjs).
