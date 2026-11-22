# pu2 — tiède : une question à la fois

**Chaleur** : tiède (la forme de mon approche : le plus simple pour lui). **Idée** : le plateau pose la seule question qui manque, réponses en grandes tuiles au pouce ; le reste se lit en une ligne ; « 2 à régler · Lactose › » saute à la suivante.

## Les six cas
- a, c : aucune question (sûr = rien), la ligne de lecture seule. b : « Ce Citra, quel article ? », trois tuiles, la proposée en jaune pointillé, l’IA dit son coût. d : « Quelle unité pour « Lactose 1 » ? », chaque tuile dit son prix unitaire (« 6,20 le g » en rouge : absurde, il le voit). e : bande bleue « relue 2 → 3 », Remettre 2. f : icônes extrait et corbeille au pied du plateau ; l’extrait ouvre aussi le type fin.
- Écart : les valeurs ne sont pas des champs encadrés mais des valeurs soulignées qu’on touche (la raison : une seule zone d’action par plateau).

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
