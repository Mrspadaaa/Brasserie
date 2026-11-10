# PREUVES — port f2d (Mon mois), exécution de la DEMANDE EXECUTANT

Statut : PARTIEL. Dépense : 12 captures faites et ouvertes. Caisse : 390 non obtenu (désignation introuvable à 390 dans le script) ; 1280 obtenu (clair et sombre).

## Préalables
- `node_modules` du worktree : seul `react-zoom-pan-pinch` 4.2.0 y est. Les outils (vitest, vite, tsc) viennent de `C:/Users/mrspa/Documents/Brasserie/node_modules` (résolution par remontée).
- `tsc --noEmit` : 2 erreurs, toutes `functions/src/*` (`firebase-admin/firestore`), attendu. Aucune dans `src/`.
- `vite build --outDir <scratchpad>/dist-build` : vert (16,7 s). `dist/` non touché.
- Serveur : `PORT=3127 npm run dev`, PID 25800, arrêté en fin de voie.

## Captures (`port/captures/`, fixtures `?dev-local&finance-demo` en mémoire, « ZZ » seulement)
Script : `captures/capturer.mjs` (Haiku). Planches côte à côte avec la maquette : scratchpad `planche-p1` à `p7`.

| Fichier | État montré | Défaut vu |
|---|---|---|
| depense-ferme-390-clair.png | Total 58,40, pour quoi « ZZ Malt Pilsner 25 kg », Brassage, onglet « Mon mois +58,40 » fermé, Règlement « Payé le 10.11.2026 par défaut » | Pied : bouton « Mon mois » petit (36 px, écart connu) |
| depense-ouvert-paye-390-clair.png | Carte « Payée ou à payer ? » ouverte, Payé coché, tuiles payé 383,80 et dépensé 755,20 (+58,40), pile Brassage pleine | Scrim couvre toute la fenêtre (OK) ; couleurs crème app au lieu de la maquette (écart connu) ; pile hachurée non cernée nettement |
| depense-ouvert-apayer-390-clair.png | Après toucher « À payer » dans la carte, Règlement derrière = « À payer », tuile à payer 458,40 cernée | Pile Brassage : segment « à payer » hachuré cerné, peu lisible à 390 |
| depense-ferme-390-sombre.png | Idem clair, thème sombre | Bouton Enregistrer jaune plein, lisible |
| depense-ouvert-paye-390-sombre.png | Carte ouverte sombre, Payé coché | Contraste de la hachure ambre faible |
| depense-ouvert-apayer-390-sombre.png | À payer coché, Règlement derrière « À payer » | Idem ; scrim assombrit le Pied |
| depense-ferme-1280-clair.png | Sheet pleine largeur, Mon mois fermé +58,40 | Pied : bouton Enregistrer à droite, carte absente (attendu) |
| depense-ouvert-paye-1280-clair.png | Carte ouverte en bas à droite, Payé | Carte petite à 1280 (130 px de pile, écart connu) |
| depense-ouvert-apayer-1280-clair.png | À payer coché, Règlement « À payer » derrière | OK |
| depense-ferme-1280-sombre.png | Idem sombre | OK |
| depense-ouvert-paye-1280-sombre.png | Carte ouverte sombre | OK |
| depense-ouvert-apayer-1280-sombre.png | À payer coché | OK |
| caisse-ouverte-encaisse-1280-clair.png | 12 × « ZZ TEST Bière 33 cl » à 4,50 = 54,00 au ticket et « Facturer 54,00 CHF », Mon mois +54,00 | Carte CUTE EN HAUT : son bord supérieur sort de la coque (pas de rangée collante vérifiée) |
| caisse-ouverte-qr-1280-clair.png | Clic « Facture QR » dans le groupe « Comment il paie », client Café du Bourg | Doute : l'aperçu est identique à l'encaissé (QR déjà visible) ; bascule non vérifiée visuellement |
| caisse-ouverte-encaisse-1280-sombre.png / caisse-ouverte-qr-1280-sombre.png | Idem en sombre | Idem (carte coupée en haut) |
| caisse-ouverte-*-390-*.png | NON OBTENU : sur 390, le champ « Désignation » du formulaire « Autre » n'est pas trouvé (attente 20 s). Les captures 390 existantes ne sont pas dans la demande (ligne libre sans désignation, panier vide, carte fermée) : à ne pas utiliser. | Cause non traitée |

Les maquettes `v0/f2d/f2d-haut.png`, `f2d-sombre.png`, `f2d-1280.png` sont dans les planches. `f2d-etat.png` non planché (écart signalé). Rien d'autre n'a été jugé.

## Tests (`npx vitest run` sur les fichiers listés, base = commit aba23489 dans `scratchpad/base`, node_modules par jonction)
- Base : 62 fichiers, 52 en échec de chargement, 129 tests verts.
- Worktree : 63 fichiers (dont `tests/unit/effetPiece.test.ts`, absent de la base), 48 en échec, 271 verts, 440 rouges.
- Comparaison par liste de fichiers (`compare.mjs`) : **aucun nouveau fichier en échec**. 4 fichiers corrigés (`caisseVente`, `incomeProofFlows`, `soldeDepartCause`, `depense/doublon/feuille`), en échec de chargement sur la base.
- Douteux : 440 tests rouges dans 48 fichiers qui échouent aussi sur la base. La base ne donne pas de compte de tests par fichier (échec au chargement), donc on ne peut pas dire si ce sont les mêmes assertions. À ouvrir par le pilote.

## Écarts et doutes
- Caisse 390 : non réalisée (voir tableau).
- Caisse : carte coupée en haut à 1280 ; bascule QR non prouvée.
- Dépense : écarts connus de la RESULTAT (teintes, hauteur de pile, 36 px) confirmés ; pas de réglage fait (aucun fichier source touché).
- Fichiers de travail dans `captures/` : `recon*.mjs`, `capturer.mjs`, `planche.mjs`. Pas de capture de recon conservée.

## Passe 2 (10.11) : corrections de l'écran, captures rejouées et ouvertes

Corrigé (src/ui/finance/ongletMois/ seulement ; ni Caisse.tsx ni Pied.tsx touchés) :
1. Caisse 1280, carte coupée : la rangée du bouton est dans la zone qui défile, qui rognait la carte. La carte se pose en `fixed`, mesurée au rectangle de la rangée : au-dessus si elle y tient entière, sinon dessous, sinon pleine hauteur de fenêtre avec défilement interne. Largeur 420 px à droite de la rangée à ≥ 900 px, 8 px de marge au-dessous. Vue : carte entière à 1280 (dessous la rangée avec « Facture QR », pleine hauteur avec « Payé ici » : elle recouvre alors le bout droit de la rangée, « Mon mois » reste visible) et à 390.
2. « Mon mois » entier à 1280 : le bouton ne rétrécit plus (`flex: 0 0 auto`, plus d'ellipse).
3. Bouton 44 px (f2d : 44), rayon 12. Pile la plus haute 210 px (celle de Ventes dans f2d : 210), colonne de piles 244 px (f2d : 236 + ses noms), à 390 comme à 1280. Plus aucune cible sous 24 px (bascule 32, bouton 44).
4. « Payée ou à payer » n'existe plus nulle part dans `src/` (les aria-label deviennent « Règlement de la pièce » / « Règlement de la vente »). Restent seulement le titre de f2d (la maquette) et la `<title>`.

Preuves :
- `npx tsc --noEmit` : 2 erreurs, `functions/src/*` (firebase-admin), admises.
- `npx vitest run tests/unit/effetPiece.test.ts` : 18 verts. Aucun test d'écran propre à l'onglet (pas de fichier de test sous ongletMois).
- `npx vite build --outDir <tmp>/dist-onglet` : vert (14,6 s).
- Serveur `PORT=3127`, `?dev-local&finance-demo`, arrêté à la fin (plus de réponse sur 3127).
- Captures (`captures/capturer.mjs`, COMBOS=…), toutes ouvertes en image : depense-{ferme,ouvert-paye,ouvert-apayer}-390-{clair,sombre}, -1280-clair ; caisse-ouverte-{encaisse,qr}-390-{clair,sombre} et -1280-clair, avec une vraie ligne ajoutée (« Autre » → « ZZ TEST verres », 12 × 4,50 → « Ajouter la ligne » : ticket 54,00). « encaisse » = après un toucher sur « ✓ Encaissé » dans la carte (reçu « Quittance », « payé ici », encaissé 774,00 +54,00) ; « qr » = après un toucher sur « Facture QR » dans la carte (« Facturer 54,00 CHF », à encaisser 54,00 +54,00, pile Ventes hachurée cernée). Le script d'avant ne trouvait pas le champ à 390 : sur tactile, « Désignation » est un `textarea` (sélecteur corrigé).
- Les `-1280-sombre` et `depense-*-1280-sombre`, non demandés, datent de la passe 1 (avant les corrections de cette passe) : ne pas s'y fier.

Écarts restants avec f2d : couleurs de fond de la carte et des piles = jetons de l'app (crème/cave), pas les teintes fixes de f2d ; fixture de démo : « payé » 296,80 / 355,20 au lieu de 325,40 (autres pièces du jeu) ; Caisse 1280 avec « Payé ici » : la carte recouvre le bout droit de la rangée (la place manque au-dessus et dessous), toujours entière, le bouton « Mon mois » reste visible.
