# pg2 — le geste en tête (tiède)

**Chaleur** : tiède (la forme de l'approche pg). **L'idée** : le plateau s'ouvre sur un seul bloc, le verbe du geste (RIEN, CHOISIR, REMPLIR,
GARDER ?) et ses grosses cibles ; tout le reste tient sur une ligne de résumé, « 6 Kg × 2,30 = 13,80 · Ingrédient · « Maris Otter » · détails ⌄ · ⋯ ».

Page : `etat.html?etat=repos|a|b|c|d|e|f|a2` (`a2` : les détails ouverts) ; `&theme=cave`.

## Les six cas
(a) « ✓ Rien à faire · relié à « Maris Otter » · au centime ». (b) CHOISIR : trois tuiles Relier / Bis (proposé, jaune pointillé) / Nouveau
(fiche par l'IA, quelques ct) ; « même variété, autre récolte · rien n'est créé avant Confirmer ». (c) Rien à faire · Matériel · hors stock ;
la nature en pastille noire sur le résumé. (d) REMPLIR l'unité : 1 ? × 6,20, quatre touches de 44 px, focus sur la première.
(e) GARDER ? : 2 barré, 3 en grand et en bleu, bascule 2 | 3, la raison « 3 × 3,40 = 10,20 imprimé ». (f) « ⋯ » : un menu sur place, Voir
l'extrait, Type d'achat (Nettoyage ›), Supprimer la ligne en rouge.

## Baseline
- [x] imprimé · référence, [x] quantité unité × prix = montant, [x] ✓ au centime, [x] segment, [x] article ⇄ Retirer, [x] mouture (Détacher) :
  **au second plan**, sous « détails ⌄ » (capture `pg2-a2.png`). Écart voulu : l'idée est que le geste passe devant ; le résumé garde la mesure,
  la nature et l'article au premier plan.
- [x] plateau dans la rangée, bande, filet, pied Catégorie | Papier + Confirmer ; [x] B du nom ; [x] d-lue (2 barré, 3 bleu) ; [x] D277 sur le champ.

## Contrôles (02.11)
- `controle-commun --profil=sans-houblons --sans-lignes` : COMMUN OK ; sans `--sans-lignes` : MOTS ECHEC (115).
- `mots-premier-ecran` : 115. `controle-contraste` : pire « CHF » 5,27:1, CONTRASTE OK. `verifier-page --min-images 0` : PAGE OK. `type="number"` : 0.
- `controle-panel` (cas b des 4) : PANEL ECHEC, ressemblance 0,92 ; pg2-b ~ pg4-b au-dessus de 0,95.

## Retouches vues sur les captures
(d) « 1 ? × 6,20 = 6,20 » dit deux fois (titre et résumé) : le résumé devrait taire la mesure quand le geste la porte.
