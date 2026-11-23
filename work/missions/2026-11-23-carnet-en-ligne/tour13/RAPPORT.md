# Carnet en ligne : tour 13 (23.11, 07:20 à 07:45 UTC)

App : https://brasserie-l-affinee.web.app/. Paquet attendu **index-G_FP2w6G.js** (c5f0f18d0). Testeur : Opus.
Outil : playwright-core `connectOverCDP('http://127.0.0.1:9222')`, MA page dans une fenêtre neuve (`Target.createTarget`),
390×844, DPR 3, UA Android, toucher CDP (`Input.dispatchTouchEvent`). Fin : `page.close()` puis déconnexion ; Chrome et
ses onglets intacts. Captures dans ce dossier ; chaque capture citée a été ouverte et regardée (planches A, B, C : 4 captures côte à côte).

## E-2 : paquet servi (sans vider le cache)

| Chargement | Paquet | Note |
|---|---|---|
| 1 | index-zpcbYIem.js (tour 12) | le serveur sert déjà sw.js avec G_FP2w6G ; nouveau SW « installing » |
| 2 | index-zpcbYIem.js | idem (capture 01) |
| 3 à 5 (≈ 60 s) | index-zpcbYIem.js | précache en cours |
| ≈ 60 s après le 1er | **index-G_FP2w6G.js** | la page se recharge seule, sans bandeau (capture 04) ; stable aux rechargements suivants |

Verdict : **KO partiel** (CA13-1). Le tour 13 arrive seul en une minute, pas au 2e chargement.

## Priorités

| Cas | Verdict | Preuve |
|---|---|---|
| L-1 lien collé (vrai lien ggmgastro de Chambre froide) | **OK** : « lecture de la page… » puis article lu à 30 s, 2 763,65 CHF, photo | 15-lien-15000ms, 15-lien-60000ms |
| L-2 phrase de la liste (aperçu « Déjà un carnet proche : Chambre froide ») | **OK** : nouveau carnet ZZ ; Chambre froide identique avant, après et à la fin (texte et capture). L'IA a rendu le carnetId de Chambre froide, l'app l'a ignoré ; pas de « Y ajouter ? » (CA13-11) | 11, 12-ajout-3, planche-A (13), 58 |
| L-9 à L-12 carnet = À venir = Calendrier | **OK** pour la date et le prix dans les deux sens : 3 mois → S8 22 févr. ; 500 CHF + 6 mois → À venir « mai 2027 · 500 CHF », Calendrier S20 17 mai −500 ; glisser au Calendrier → carnet S21 ; prix 12 345,67 à À venir → carnet et Calendrier −12 346. Archivé : le carnet ne dit plus « Dans À venir » (L-12 OK). **KO** après archivage : valeurs périmées (CA13-3) ; prévisions contradictoires (CA13-6) | 16, 17, 19, 20, 23, planche-A (24, 25), planche-B (32), 36, planche-C (37), 45 |
| Photos des vendeurs (CSP, L-23) | **OK** : photos ggmgastro visibles (Chambre froide et ZZ), aucune erreur CSP en console | 07, 08, 15-lien-60000ms |
| Texte du Carnet à 14 px (D430) | **OK** : carnet ouvert, 14 px partout hors titre 18 px (mesure DOM), rien sous 14 px | 07, 36 |
| Frise pour les dates (D431) | **OK** sur Quand du carnet et sur la fiche du Calendrier (date touchée → frise, glisser → 30 mai) ; Modifier et l'éditeur d'À venir non joués | 16, 23, planche-A (24) |
| Retour du téléphone (L-13) | **KO partiel** : OK fiche → carnet → liste (Atelier) et Comparer → carnet ; inerte 5 fois sur un carnet ouvert depuis Calendrier/À venir (CA13-2) | planche-B (47), 43 ; fiche → carnet → liste au DOM |
| « 12’345,50 » (L-38) | **OK** : 12 345,50 | planche-B (28) |
| « 12,345.67 » (L-36) | **OK** : 12 345,67, rien tronqué | planche-B (29) |

## LISTE.md classes (a) et (b), autres lignes rejouées

| L | Verdict | Preuve |
|---|---|---|
| L-8 deux états | **KO** (CA13-7) | planche-A (12-ajout-0), 36 |
| L-9 poser le prix | OK : « prix ? · Poser le prix » sur la fiche (non posé sur un vrai article) | 08 |
| L-14 Supprimer un carnet lié | OK pour le dialogue (Supprimer rouge, « 1 critère et 1 article ») ; plan archivé orphelin (CA13-4) | 49, 57 |
| L-15 formats | **KO partiel** (CA13-8) ; fiche d'article sans chasse fixe | 07, 08, 46 |
| L-18 rangée Quand | OK : puces sur 2 lignes, frise, Au calendrier à part, choix marqué | 16, 19 |
| L-19 tableau à 390 | **KO partiel** (CA13-10) | 07 |
| L-20 retirer un critère | OK : Retirer, « Critère retiré · Annuler », Annuler le rend | 38, 40 ; « Critère retiré · Annuler » au DOM |
| L-22 libellé du menu | OK : « Supprimer le carnet » | 49 (DOM du menu) |
| L-25 « d&#039; » | OK : « Tôle d'acier » (ancien et nouvel article) | 08, 15-lien-60000ms |
| L-26 Comparer | OK à 390 (1re valeur ≈ 410 px) ; 844 non joué ; mots coupés (CA13-9) | 46 |
| L-31 à L-34 liste | OK : titres sur 2 lignes, « Dans À venir depuis le 20 nov. · Voir » sur 1 ligne, budget et date sur les Idées, « Chercher un carnet » entier | 06 |
| L-35 recherche et Faits | OK : « Faits 5 · hors de la recherche · Tout montrer » | DOM seulement |
| L-40 À venir : années | OK : « juil. 2026 », « mai 2027 » | 20 |
| L-42 prévisions | **KO** (CA13-6) | planche-B (28, 32) |
| L-49 bulle d'enregistrement | **KO** (CA13-5) | 17, 20, 36 |
| L-50 rechargement | OK : rouvre Stocks › Matériel › Carnets, l'écran quitté | 45 |
| L-51 Ouvrir / Voir | OK lecture étroite : Ouvrir rend le carnet lui-même ; il s'ouvre sous Stocks › Matériel › Carnets (deuxième adresse) | 19 |
| L-66 titre de la fiche du Calendrier | OK : sur 2 lignes, entier | 17, 23 |
| L-70 durée d'un achat | **KO** sur la fiche (CA13-13) | 23 |

Non joués (44) : L-3 à L-7, L-10, L-16, L-17 (paysage), L-21, L-24, L-27 à L-30 (L-30 : « Y ajouter en façon » vise Chambre froide, vrai carnet), L-37,
L-39, L-41, L-43 à L-48, L-52 à L-65, L-67 à L-69, L-71, L-72. Calendrier à l'échelle année : exclu (consigne). 390×660 et 844×340 non joués.

## Bilan

Rejoués : 29 (dont E-2) ; **OK 22**, **KO 7** (E-2, L-8, L-13, L-15, L-19, L-42, L-49 ; plus L-70 vu en route), non reproduit 0.
Défauts : **13** (B 0, G 2, m 5, d 6) dans `defauts.jsonl` : CA13-1 à CA13-13.

## Données

- Créé : carnet « ZZ TEST — tour13 — cellule de garde 2,6 m3 pour chambre froide », son plan (À venir, Calendrier), archivé.
- Retiré : carnet (Supprimer), puis le plan archivé resté orphelin (Archives › Supprimer › Oui, supprimer).
- Disparition vérifiée après rechargement : Carnets (16 → 15), À venir, Archives (« Tes projets mis de côté » vide), recherche
  universelle « tour13 » : 0 résultat, Calendrier « à dépenser » revenu à −4 563 (planche-C : 62, 54 ; recherche au DOM).
- Vraies données : lecture seule. Chambre froide identique au début et à la fin (captures 07, 58). Rien d'autre touché.
- Vu en route, pas de moi : des ventes « ZZ T… » au Calendrier S44–S49 (capture 54) et le critère E-1 dans Chambre froide.

## IA

3 appels aiTask : 2 `rangerCarnet` (gemini-3.8-flash, 7,5 s et 29,9 s), 1 `lireLien` (sans modèle). ≈ **0,01 CHF** (`../ia-journal.jsonl`).
