# pu4 — chaude : face à face, la facture et le stock

**Chaleur** : chaude. **Idée** : le mapping se voit. La ligne lue à gauche, l’article du stock à droite, le lien au milieu (= relié, ≈ proposé, ∅ hors stock, ? à remplir) ; ce qui diffère est marqué des deux côtés, et la décision se prend dessous.

## Les six cas
- a : = vert, stock 18 → 24 Kg après réception. b : ≈ jaune, α 12,5 et 13,1 marqués des deux côtés, trois gestes (Citra bis proposé, Relier, Nouveau IA ≈ 1 ct). c : ∅, carte stock en pointillé « hors stock · Matériel · Nettoyage ». d : ? rouge, « Kg comme au stock » proposé en jaune, le champ unité a le focus. e : 2 barré, 3 en bleu, 4 → 7 sachets, Remettre 2. f : la carte facture devient l’extrait du document ; type fin et Supprimer dessous.
- Les quantités « après réception » sont calculées sur la fixture (stock + ligne), pas inventées.

## Baseline p3c-3 (plancher à enrichir), cochée
- [x] imprimé « … » · référence (au plateau ; le nom français sur la rangée, choix B du nom)
- [x] quantité, unité, × prix = montant sur une ligne ; [x] « ✓ au centime » (gris « au centime ? » tant que l’\unité manque)
- [x] segment Ingrédient · Service · Matériel (Détartrant en Matériel)
- [x] article « … » · relié ⇄ Retirer ; [x] mouture « ↳ … Rattacher » sur Maris Otter
- [x] plateau dans la rangée, sous elle, liste groupée (bande teintée, filet de famille), pied Catégorie | Papier + Confirmer, sans puce « Payé le »
- [x] d-lue : valeur relue en bleu, ancienne barrée ; [x] D277 : sûr = rien, proposé = jaune pointillé, inconnu = rouge sur le champ même
- Jetons : themes.css (clair, cave) recopiés en couleurs pleines ; polices locales (aucune requête réseau, la police Google de p3c-3 retirée).

## Contrôles (joués une fois sur etat.html, état par défaut = cas d ; sorties dans plateau/voies/pu/sorties/)
- controle-commun --profil=sans-houblons --sans-lignes : COMMUN OK (mots, couleurs, survol, blocs, contraste, standard, parlant, brutes OK)
- mots-premier-ecran --profil=sans-houblons --sans-lignes : pu1 52, pu2 72 (alerte modérée, < 98), pu3 59, pu4 54
- controle-contraste --profil=sans-houblons : CONTRASTE OK (pire 5,2:1, « 1 corrigée »)
- verifier-page --min-images 0 : PAGE OK (390 px, sans erreur)
- captures : 9 par variante, 0 erreur, 0 requête réseau ; chaque plateau tient entre sa rangée et le pied (36/36)
- controle-panel (24 cas ouverts à 390) : PANEL ECHEC, ressemblance 0,91 ≥ 0,90 et 1 % de paires presque identiques : la liste commune (baseline) domine le premier écran. Voir RESULTAT.
- controle-choix : sans objet (Dépense absent du registre ecrans.json ; son choix p3c-3 est celui du brief).
