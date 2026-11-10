# g1a — Synthèse, froide : le résultat du mois en tête, Situation et Coûts en une seule page

**Chaleur** : froide (affine la baseline). **Idée** : « Gagné +23,20 CHF » en premier chiffre, ventes contre charges en deux barres, puis la baseline resserrée (trésorerie, à payer, coût d'un litre, fournisseurs).
**Où vit l'écran** : Finances › Synthèse ; les sous-onglets Situation / Coûts disparaissent (une page).

## Chiffres (fixture `src/dev/financeDemo.ts`, novembre 2026)
Ventes 720,00 − charges 696,80 (fixes 468,00 · brassage 186,80 · nettoyage 42,00) = **+23,20 CHF** ; matériel 28,60 à part (amorti).
Octobre (‹) : 0,00 − 28,00 (petits achats) = −28,00. Fournisseurs : Atelier 400,00 · Comptoir du brasseur 228,80 · Énergie 68,00 · Inox & Co 28,60.
IA (✦, au toucher) : « exemple · le loyer pèse 57 % des charges » = 400,00 / 696,80, source « 6 opérations de novembre ».

## Problèmes de l'inventaire résolus
1 (le résultat du mois existe enfin), 2 (un seul résultat : ventes − charges, matériel à part), 22 (titre ≠ onglet, plus de sous-onglets), 30 (format suisse partout).

## Baseline (plancher)
Trésorerie + ⚙ solde (ligne ›) · règlements à payer + Payer + Tout voir (titre ›) · répartition par catégorie (pastilles) · mois ‹ › + tout l'historique (icône) · coût des brassins + Estimer (+) · fournisseurs · Compagnon (✦). **Part** : « Investissements et matériel » replié → Prévisions › Projets de matériel (même liste, problème 26). Alerte TVA : sous 80 % du seuil (720 / 100 000), absente comme aujourd'hui.

## Boosters UX (boosters-ux)
- `periode-mois` — suivre ; ‹ › ; le mois change le chiffre et les barres (capture `g1a-apres.png` : octobre, −28,00 en rouge).
- `balance-mois` — lire ; deux barres ventes / charges empilées ; un toucher sur un segment nomme le poste.
- `pastilles-categories` — lire ; pastilles DESIGN.md (catégories comptables).
- `fournisseurs-barres` — comparer ; barres horizontales.
- `payer-ligne`, `tresorerie`, `ia-expliquer` (✦ au toucher, réponse « exemple », source).
- B1 OK (6 boosters marqués) · B2 OK (+23,20 à 28 px domine) · B3 OK (60 mots hors données) · B4 OK · B5 à mesurer · B6 OK (12/14/28 px, Plex Mono tnum) · B7 non mesuré (pastilles DESIGN.md) · B8 OK (annexe : solde de départ à confirmer, hachures + « ? ») · B9 s.o. v0 · B10 s.o. (aucune saisie) · B11 « J'ai gagné 23,20 CHF en novembre, il me reste 4 181,60, je dois 460 » · B12 OK · B13 « Payer » 28 px de haut.

## Contrôles (sorties)
`verifier-page.mjs --min-images 0` : PAGE OK · `mots-premier-ecran --sans-donnees --profil=sans-houblons --max=60` : 60 mots · `controle-panel` (les 6 de la voie) : PANEL OK, remplissage g1a 0,45.
Captures : `g1a-haut.png`, `g1a-page.png`, `g1a-1280.png`, `g1a-apres.png`.

## Tient / casse
Tient : la réponse en un coup d'œil, tout le reste reconnaissable. Casse : c'est encore une liste ; le chiffre « +23,20 » est petit à côté de la trésorerie, il faut lire « Gagné ».
