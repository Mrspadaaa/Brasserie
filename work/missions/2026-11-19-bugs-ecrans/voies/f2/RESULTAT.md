OK — T3-8, T3-9, LR3-NOTE-1 : barre Apports alignée, graphe couché sur deux colonnes, alerte de prix à 10× le tarif

# Voie f2
- T3-8 | corrigé | b889caa6d | cause probable : la barre ne comptait que les écritures portant `finance.kind` contribution/withdrawal ; la section « Apports et prélèvements » range toute écriture de catégorie `apports`, même ancienne sans bloc finance (le sens se lit par `transactionKind`, qui retombe sur la catégorie). Nouvelle règle pure `apportsDePeriode` (calculs.ts), appelée par le journal : mêmes écritures, même signe que la section ; aucune écriture = null (inconnu, pas 0). Test `bugs-f2-T3-8.test.ts` (800 + 3 890 + 3 600 = 8 290,00 ; échouait avant, fonction absente). Limite : la cause exacte des 3 890 et 3 600 n'est pas relue sur les données réelles (jamais lues) ; à confirmer en ligne après déploiement (la barre doit dire +8 290,00 en « Tout »). Le jeu de démo n'a aucun apport : pas de capture de la barre.
- T3-9 | corrigé | f4912fbb1 | à 844×340 (téléphone couché), Opérations reprend la disposition de l'ordinateur : graphe, frise et légende à gauche (hauteur de pile 56 px), liste à droite ; la bande défile avec la page. Mesure avant : première opération à y=372 sur 340 de haut (KO) ; après : y=110 (OK), clair et cave ; 390 et 1280 inchangés (même mesure, mêmes captures). Banc `banc.mjs`.
- LR3-NOTE-1 | corrigé | 4e461ff68 | la tuile 75 cl à 569,50 était déjà refusée (T3B-13) ; ajouté l'alerte demandée : `alertePrixLigne` (tuileVente.ts) — prix unitaire > 10 fois le tarif du format, ou, sans tarif sûr, prix au litre hors [1 ; 100] — affichée dans la ligne libre d'un format (role=alert) et gardée sur le ticket (« à vérifier : … »). Alerte, pas refus ; prix absent ou volume nul : aucune alerte. Tests `bugs-f2-LR3-NOTE-1.test.ts` (échouait avant) et `bugs-f2-LR3-NOTE-1-caisse.test.tsx`. Données réelles : jamais lues ni écrites ; geste en ligne prêt dans `GESTE-LR3-NOTE-1.md`.

Tour 2 (critique k3, 20.11 ; liste dans voies/k3/CORRECTIONS-f2.md, « ## Fait ») :
- T3-8 : preuve visible ajoutée (`banc-apports.mjs`, 3 apports ZZ TEST en dev-local : 800 avec bloc finance, 3 890 et 3 600 sans) : la barre « Apports » du graphe et le titre de la section « Apports et prélèvements » disent tous deux +8 290,00, à 1280 et 390, clair et cave (`operations-apports-*.png`, `…-section.png`). Verdict inchangé.
- T3-9 : le + flottant (844×340) ne couvre plus « +720,00 » ni « + pièce » : gouttière de 76 px à droite de la colonne de la liste (09e971e5d, floating-actions.css) ; mesure du banc : liste et boutons s'arrêtent à x=756, le + commence à x=776 (avant : 832, KO).
- LR3-NOTE-1 : une seule ligne d'avis dans la ligne libre (l'alerte remplace la note du tarif) ; la tuile au tarif faux dit « 759,33 CHF le litre » sans « prix ? » ; « Encaisser » est bien grisé (attribut `disabled`) tant que TWINT ou Espèces n'est pas choisi (Comptoir, « Payé ici ») : le ticket le dit (« Choisis TWINT ou Espèces pour encaisser ») ; la barre « Mon mois / Encaisser » se ferme jusqu'au bord de la feuille à 390 (8b9152ebc). Alerte, pas refus : « Ajouter la ligne » reste actif. Banc `banc-vente.mjs` corrigé (au doigt, `Input` est un textarea : champ visé par son aria-label) : `VENTE OK` à 390 et 1280, clair et cave.
- Nouveau défaut vu en passant, hors liste : à 390 l'étiquette « +8 290,00 » de la barre Apports dépasse de 7 px le bord droit du cadre du graphe, et « +1 520,00 » (Ventes) est traversé par le trait pointillé (operations-apports-390-clair.png). Piles.tsx (zone f2) : à reporter au registre, pas corrigé ici (liste figée).

ACCORD : LR3-NOTE-1 — la vente réelle « 10 × Bière 75 cl — Restaurant du Lac » à 5 695,00 CHF (10.11) est-elle un test ou une saisie fausse ? Si fausse : l'annuler par contre-écriture (jamais supprimer) ; le tarif « Pale Ale 75 cl » à 569,50 est aussi à corriger dans Clients › Tarifs (geste dans voies/f2/GESTE-LR3-NOTE-1.md).

Tests : `npx vitest run <26 fichiers : tests de la voie + ceux de calculs, TransactionJournal, tuileVente, Caisse> --reporter=dot` → 195 passés, 0 échoué (`tests.txt`). `tsc --noEmit` : aucune erreur sur les fichiers touchés.

Captures (voies/f2/captures/ ; celles citées sont ouvertes et regardées) :
- operations-844x340-{clair,cave}-avant.png : graphe + frise + légende empilés, première opération sous le bord (y=372 sur 340) ; -apres.png : graphe à gauche, Charges fixes / Ventes à droite, première opération à y=110.
- operations-390-{clair,cave}-apres.png et operations-1280-{clair,cave}-apres.png : inchangés (piles, frise, légende, liste ; mêmes valeurs mesurées qu'avant).
- vente-libre-1280-cave.png : « 75 cl · tarif à corriger », ligne libre ouverte, prix 569,5 saisi : deux lignes d'avis ambre (le tarif à corriger, puis « 569,50 CHF l'unité, soit 759,33 CHF le litre : hors de l'ordinaire. Vérifie le prix. »), bouton « Ajouter la ligne » actif (pas de refus).
- vente-ticket-1280-clair.png (et cave) : la ligne « 1 × 75 cl 569,50 » porte dessous « à vérifier : 569,50 CHF l'unité, soit 759,33 CHF le litre… », en ambre, sans casser le ticket.
Mesures : banc-avant.txt (T3-9 KO), banc-apres.txt (T3-9 OK), banc-vente.txt (1280 clair et cave : alerte et ticket présents).

DEMANDE EXECUTANT : (390 tactile de la caisse, non obtenu : le banc ne trouve pas le champ « Prix unitaire » à 390, alors qu'il le trouve à 1280 ; probablement un défaut du banc, pas du produit)
1. `node scripts/with_server.mjs --server "npm run dev -- --port 3106 --strictPort" --port 3106 --env VITE_FIREBASE_API_KEY=fake -- node work/missions/2026-11-19-bugs-ecrans/voies/f2/banc-vente.mjs`
2. À 390, si `champ` reste nul : ouvrir `captures/vente-libre-390-clair.png` (déjà blanche = la page a perdu son rendu ?) ; corriger le banc (attendre la caisse, `isMobile`), relancer.
3. Sortie attendue : `VENTE OK` ; captures à ouvrir : `vente-libre-390-{clair,cave}.png`, `vente-ticket-390-{clair,cave}.png` (alerte visible, ticket lisible à 390).
Aucun fichier de src/ à toucher pour cela.

CONNAISSANCE : Opérations à 844×340 : le disque utile n'est que ~215 px (en-tête 40, onglets 75, barre du bas 50) ; seule une disposition en deux colonnes tient graphe et première opération.
LEÇON PROPOSÉE : aucune
