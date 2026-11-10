OK — Opérations passe 3 : v5a–v5d, v4c serré, chaque opération entière sur sa ligne ; PAGE, MOTS, COMMUN, PANEL OK

## Fichiers écrits (tous sous `work/missions/2026-11-09-compta-prix/p3/`)
Ses mots : « v4c … j'aime bien mais plus de détails et plus compact, pas assez d'info sur les opérateurs directement, sans les
déroulement, ouvrir ». Les quatre gardent le rangement par catégorie et les piles de v4c ; aucun tiroir ; chaque opération montre
qui, quoi, payé / à payer, date ou échéance, pièce, et son geste (✓ Payé, + pièce).
- `v5a/` (froide) v4c serré : piles de 112 px avec le mois, puis toutes les lignes en deux étages, liseré de catégorie, pastilles d'état.
  État : après « ✓ Payé » sur le loyer.
- `v5b/` (tiède) piles couchées : chaque catégorie est une barre à l'échelle commune (720,00 = la piste) qui sert d'en-tête à ses
  lignes ; tableau Quoi · qui | Quand | Pièce | CHF, en-tête collé. État : filtre « Sans pièce 4 ».
- `v5c/` (chaude) la carte du mois : treemap entré 720,00 | dépensé 696,80, une tuile par opération, surface = montant, tout écrit
  sur la tuile ; matériel et retard 2025 à part sous la carte. État : décembre vide, loyer prévu hachuré pâle.
- `v5d/` (tiède) le livre à trois colonnes : piles Entré · Payé · À payer en têtes de colonne ; le montant tombe dans la colonne de
  son état. État : réponse IA « Qui attend mon argent ? » (exemple, source citée).
- Chaque dossier : `etat.html` (classes préfixées), `NOTE.md`, `<id>-haut.png`, `<id>-page.png`, `<id>-1280.png`, `<id>-etat.png`.
  Script de capture 1280 et états hors dépôt (scratchpad de session, `cap-voie-v.mjs`). Rien dans `src/`, aucun commit.

## Sorties décisives (dernier rejeu, les 4)
- `verifier-page.mjs --min-images 0 --captures` : PAGE OK × 4 (390 px, sans erreur) ; 1280 : débord 0 × 4.
- `mots-premier-ecran.mjs --profil=sans-houblons --sans-donnees --sans-lignes --max=60 --page=etat.html` : v5a 24, v5b 29, v5c 43,
  v5d 28 → MOTS OK.
- `controle-commun.mjs --profil=sans-houblons --sans=mots --page=etat.html` : couleurs, survol, blocs, contraste, standard, parlant,
  brutes OK → COMMUN OK (premier passage en échec : rayons hors échelle, 3 contrastes à 4,4:1, `title` au survol sur v5b, une icône
  à 1,8 px ; corrigés).
- `controle-panel.mjs` (4 premiers écrans) : médiane 0,63, 0 sous 0,50, ressemblance 0,87, 0/6 paires → PANEL OK.
- Aucun `type="number"`, aucun IBAN.

## Corrections transversales tenues
payé 325,40 ≠ à payer 400,00 (+ 60,00 en retard de 2025, toujours hors novembre) ≠ dépensé 696,80 (matériel 28,60 à part) ;
couleurs et hachures nommées sur chaque page ; décimales constantes ; pièces jointes marquées « exemple » (la fixture n'en dit rien) ;
dates et tiers tirés de la fixture (9 nov. payé · banque ; loyer échéance 25 nov. ; solde atelier depuis le 20 déc. 2025).
Pas de coût du litre ni de grille de prix sur ces écrans.

## Captures (ouvertes : les 4 `-haut`, les 4 `-page`, v5a/v5c/v5d `-1280`)
`p3/v5a/v5a-haut.png` … `p3/v5d/v5d-haut.png` ; mêmes noms en `-page.png`, `-1280.png`, `-etat.png`.

## Prédiction
Il prendra v5a (« c'est v4c, mais je vois tout ») ou v5c pour la surprise (« le loyer mange la moitié »), en demandant v5a pour un mois chargé.

DÉCISION À PRENDRE : aucune nouvelle (le rangement par catégorie est son choix ; la carte v5c a besoin d'un repli « En liste » au-delà
d'une dizaine d'opérations, déjà dessiné en bouton).

CONNAISSANCE : `controle-standard.mjs` en profil sans-houblons n'accepte que les rayons 10, 16, 24 px, la pilule et le rond (DESIGN.md) ;
les 6, 7, 8, 12, 14 px des maquettes passe 2 copiés tels quels échouent en S3.

LEÇON PROPOSÉE : aucune
