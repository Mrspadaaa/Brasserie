# Reprise — 02.11, soir (lot g, son ticket Bauhaus, et le plateau)

## Objectif
Corriger tout ce qu'il a vu sur son ticket Bauhaus (D328 à D337). Refaire la vue détail d'une ligne sur mini maquettes (D345). Puis
redéployer, mais seulement après le rejeu de son ticket sur le nouveau code et le test d'écran du critique
(`node scripts/agents/controle-avant-deploiement.mjs <sha>` → AVANT-DEPLOIEMENT OK, D342).

## Règles nouvelles (ses mots dans SPEC-BRASSEUR, 02.11 soir)
- D343 : tester d'abord par la vision, sur de vraies pièces ; Vitest pour les règles de calcul seulement ; peu de fixtures (CLAUDE.md, skill
  voies, agent critique).
- D344 : le test d'écran du critique se réduit à sa question, « combien et quels problèmes il y a ? », une liste numérotée par capture.
- D341 : il accorde le retrait des tests inutiles (voie g5-tests).
- D346 : c'est nous qui codons, pas « l'app » ; un port retire ce que sa maquette n'a pas (L03).
- D347 : « À 90% d'usage hebdo, terminé tes tâches ». Lu à 81 % vers 19 h 35. À 90 % : rien de neuf, état écrit, commit.

## État des voies
- **g2b-logique** : fini, OK. Rejeu du pilote : 72 verts (g2b, confiance, renovation-d306). Le pilote a adapté
  `tests/unit/depense/stock/renovation-d306.test.tsx` (« Balai de cantonnier »).
- **g2a-ecran** : fini, OK. Codés : D328d à D335, et de g3 : B1, C1, C2, C3, C5, C7 (menu de stock seul), A2, A3, A4, D2, E1. Tests :
  2 319 verts, tsc et build verts. **Rien vu dans Chrome.**
- **g3-ecarts** : fini, `voies/g3-ecarts/ECARTS.md` (6 bloquants, 19 écarts, 8 détails). Les captures de g1 lui restent à donner (§ 6).
- **g1-audit** : en cours. Banc sur b3ab392e dans `deploy-hosting-qr`, cas g-*, mesures M1 à M13.
- **g5-tests** : en cours. Retrait des tests inutiles.
- **Plateau v0** (`plateau/`) : séries pg, pa, pu (Opus) et pz (Fable), 4 variantes chacune, en cours. Ensuite : tri pt (critique), puis
  la page v0 pour lui. La passe 2 (pp2) seulement si le quota le permet ; sinon il choisit sur le v0 (D205).

## Fichiers non commités
`src/ui/finance/ExpenseSheet.tsx`, `src/ui/depense/{Ligne,Liste,Pied,Recap}.tsx`, `src/ui/depense/{confiance,familles,finale,groupes,rangees}.ts`,
`src/ui/depense/p3c.css`, `src/theme/themes.css`, les tests de `tests/unit/depense/` (g2a, g2b, adaptés). Les commiter par chemins quand
g5 a fini ; d'abord, rejouer `copie.mjs "npx vitest run tests/unit/depense"`, puis tsc et build.

## Prochaine action, dans l'ordre
1. Au retour de g1 : rejouer ses critères (mesures en échec sur b3ab392e) ; donner ses captures à g3 si le quota le permet.
2. Au retour des séries du plateau : lancer le tri pt, publier la page v0 (artefact neuf, daté, `verifier-page.mjs --page-lot`), table « ## Pages ».
3. Au retour de g5 : rejouer la suite (mêmes échecs), puis commit local du code g2a, g2b et g5.
4. Rejouer son ticket sur le nouveau code. Prendre un commit, le sortir dans `deploy-hosting-qr` après g1, et y lancer le banc cas g-* :
   captures ouvertes par le pilote, puis test d'écran du critique, VERDICT.md, garde. Le déploiement attend AVANT-DEPLOIEMENT OK.
5. Restes : l'écran vide de 18 h 04 (non reproduit), D326 (3) à (8), le Malt Vienne, la signature de la mission.

## Risques ouverts
- Le visuel des corrections n'est pas prouvé tant que le banc n'a pas tourné sur le nouveau code.
- La vue détail sera refaite après son choix : les corrections du plateau d'aujourd'hui sont provisoires.
