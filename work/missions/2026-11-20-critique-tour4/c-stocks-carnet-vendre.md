OK — 9 problèmes, 1 bloquant

# Critique de vision, tour 4 (c) : Stocks, Carnet, Vendre, Clients

- Version : e8e9e77cb (tag en-ligne/2026-11-20-tour4), dans une copie locale (`git worktree` dans `%TEMP%/crit-t4-c`, retirée depuis).
- Banc : vite sur le port 3133, `?dev-local&finance-demo` (jeu de démonstration en mémoire), plus 13 articles « ZZ TEST — … » injectés en local (malts, Citra α 12,5 %, Nelson Sauvin, Saaz, Magnum, levures, gypse, emballages).
  Firebase factice, tout le réseau extérieur coupé. Aucun appel Gemini, aucune écriture sur des données réelles.
- Tailles : 390×660 tactile, 844×340 tactile, 1280×800, en clair et en cave.
- Captures citées : `c-captures/` (dans ce dossier). Les autres sont restées dans le dossier temporaire de session.
- Deux réglages du banc, tous deux hors du code jugé :
  - le `seedData.ts` de port-carnet n'exportait pas `initialPlanning` ; un export vide a été ajouté à la copie ;
  - un `.env.local` factice a été posé dans la copie.

## Combien et quels problèmes ?

1. **Stocks › Courses, au repos** (`390-clair-s07-courses.png`) — non bloquant.
   - L'onglet affiche « 0 à commander cette semaine · 8 manquent », puis une page vide avec seulement « Tout voir ».
   - Les 8 manques n'apparaissent qu'après ce toucher, et ils sont justes (`390-clair-s07b-courses-tout.png` : Munich 3 kg, Carapils 1 kg, Nelson Sauvin 150 g, Magnum 100 g…, groupés par fournisseur avec « Copier »).
   - En brasseur : « 0 à commander mais 8 manquent ?? », et la liste de courses est cachée derrière un toucher. Pas pratique.
2. **Stocks › Articles, l'étagère à 390** (`390-clair-s01-articles.png`) — **BLOQUANT** (texte illisible).
   - Les libellés de l'étagère font moins de 12 px : Torréfiés, Fumé, Sucres, Hazy, W. Coast, Belge/Blé, Anglaise, et les poids sous les barres (« 23 kg », « 0 g »).
   - Mesure : 11 textes sous 12 px au premier écran, 14 après une recherche.
   - Illisible sur un téléphone.
3. **Stocks › Articles, ligne Levures de l'étagère** (`390-clair-s01-articles.png`) — non bloquant. Les pictos « Z Z » et le « ? » rond ne disent pas ce qu'ils sont : des icônes muettes (refus connu, PORTRAIT § 4).
4. **Stocks à 844×340** (`844-clair-s01-articles.png`) — non bloquant.
   - L'en-tête, les sous-onglets, « Comparer une recette », Étagère/Recompter, la recherche et les pastilles prennent environ 190 px sur 340. Il reste environ 25 px pour les articles.
   - La bulle « Compagnon hors connexion » couvre en plus cette bande.
   - Au téléphone couché, on ne voit aucun article.
5. **Clients › Prix à 1280 en cave** (`1280-cave-k04-prix.png`) — non bloquant.
   - Le graphique reste dans un grand panneau blanc : le thème sombre ne s'applique pas.
   - La colonne de droite est écrasée, à environ 90 px : les boutons « 33 cl / 75 cl / Fût 20 L » se coupent sur deux lignes, et « Il manque ces données… » tient dans une colonne étroite.
   - Pas à sa place.
6. **Clients › Prix, coût du brassin inconnu** (`390-clair-k04-prix.png`) — non bloquant.
   - Tout le premier écran est un graphique de « ? » (« reste ? », « coût ? », axes « ? »).
   - Ce qui débloque la lecture (« Il manque ces données : coût du brassin "Pale Ale" ») est sous la ligne de flottaison.
   - L'affichage est honnête, mais un grand dessin vide ne répond à rien.
7. **Finances (Carnet), Synthèse à 390** (`390-clair-c01-finances.png`) — non bloquant. Le bouton « + » flottant recouvre le montant « 4 181,60 CHF » de la carte En caisse, et la bulle Compagnon couvre sa barre.
8. **Finances › Loyer › « Confirmer le paiement »** (`390-clair-c04-apres-confirmer.png`) — non bloquant.
   - Le geste ouvre « Payer l'Atelier » avec un virement de 460,00 : la dette « Solde atelier · ancienne année 60,00 » est cochée d'office avec le loyer de 400,00.
   - En brasseur : « j'ai payé le loyer, pas 460 ». Il faut décocher pour payer la seule pièce touchée.
9. **Vendre à 844×340** (`844-clair-k03-facturer.png`) — non bloquant. La feuille Vendre, centrée sur environ 340 px de large, montre les clients et deux formats. Le panier, Payé ici / Facture QR et « Facturer » restent hors de l'écran.

## Doutes (non comptés)

- **Stocks › Houblons** affiche « 136 références aucun lot » alors que 4 houblons sont en stock (`390-clair-s06-houblons.png`). Les articles « ZZ TEST — Citra » ne sont peut-être reliés à aucune fiche du catalogue. À vérifier sur un vrai stock.
- **Fûts** (`390-clair-s08-futs.png`) : DEMO-FUT-1, plein dans le jeu de démonstration, apparaît en « État inconnu », avec « 0 L pleins en cave ». C'est peut-être le jeu de démonstration, peut-être la lecture de l'état.
- **La bulle « Compagnon hors connexion · mode local »** chevauche le contenu de tous les écrans (Articles, Finances, Prix). C'est peut-être propre au mode local.
- **Clients › Carnet** : « — Aucune vente » pour Café du Bourg alors que Finances montre une vente de 720 ; le tiret ne dit rien.

## Ce qui marche (joué)

- Fiche houblon Citra : α 12,5 %, Houblon · Hopsteiner, 300 g, seuil 200 g. « +10 » donne 310, et après « Enregistrer » l'étagère passe de 350 à 360 g (`390-clair-s03-fiche-plus1.png`, `390-clair-s04-apres-enregistrer.png`).
- Recompter (rayons comptés), Fûts et sa fiche, Finances Synthèse, l'ouverture d'une opération, Clients (liste, Modifier), Vendre ouvert par « Facturer » (`390-clair-k03-facturer.png`, `1280-clair-k03-facturer.png`) et Impôt bière : tous rendus à toutes les tailles, sans débordement horizontal.
- Impôt bière : 4,56 à 9,12 CHF pour 27 L tant que la densité n'est pas notée. C'est plausible : 25,32 CHF/hl × 0,27 hl = 6,84 CHF, au milieu de la fourchette.

## Non joué (à rejouer)

- **Nouvelle dépense** (« + » › Écriture) et **Vente** (« + » › Vente) : « Écran indisponible » à toutes les tailles (`390-clair-s10-depense.png`).
  - Cause : un artefact du serveur de dev, `504 Outdated Optimize Dep` sur l'import différé de `QuickActionModal.tsx`, car le cache `.vite` est partagé par la jonction avec port-carnet.
  - Ce n'est pas jugé comme un défaut de l'app. À rejouer sur `vite build && vite preview`, ou avec un cache isolé.
- Gestes non joués :
  - Vendre : ajouter 33 cl, puis « Facturer » ;
  - Clients : Modifier › Enregistrer ;
  - Recompter : « Compter » ;
  - Fût : « Enregistrer l'état » ;
  - Finances : Opérations, Prévisions, Annuel ;
  - Facture photo ou PDF (IA, simulée) ;
  - Matériel (hors périmètre).
