# pu3 — chaude : la ligne en phrase, le tiroir au pouce

**Chaleur** : chaude. **Idée** : la ligne se lit en phrase de pastilles (6 Kg × 2,30 = 13,80, en Ingrédient, → article Maris Otter) ; la pastille qui attend un geste est déjà touchée et son choix s’ouvre dans un tiroir posé sur le pied, toujours au même endroit, sous le pouce.

## Les six cas
- a, c : pas de tiroir. b : pastille « Citra ? » jaune, tiroir à trois choix. d : pastille « ? » rouge, cerclée, tiroir « Unité · à remplir », cinq grandes cases. e : pastille bleue, tiroir pas à pas − 3 +, « 1re lecture 2, 3e lecture 3 ». f : « ⋯ » ou la pastille Nettoyage ouvrent le tiroir type fin, extrait, Supprimer.
- Écart : quantité, prix et article sont des pastilles et plus des champs (la raison : un seul endroit d’action, au pouce).

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
