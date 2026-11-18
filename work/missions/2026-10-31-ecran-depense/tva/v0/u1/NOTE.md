# u1 — Le troisième segment (froide)

- **Chaleur** : froide. La langue de l'app telle quelle : un segment de plus dans la Synthèse.
- **Idée en une phrase** : « Situation · Coûts · TVA » ; la TVA payée sur la période en une grande lecture, sa part par taux en
  une barre, puis une ligne par poste d'achat, la question « Me la faire rembourser ? » à un toucher.
- **Axes** : place (Synthèse, à côté de Coûts) ; forme (liste par poste et barre des taux) ; incertitude écrite en plage
  (« 776,98 à 869,89 », « 869,89 ou 901,98 »), jamais un zéro ; remboursement en feuille de calcul honnête.
- **Repris de la base** : en-tête (logo, thème, recherche, compagnon), onglets Synthèse · Opérations · Prévisions · Annuel,
  rangée titre + bascule (ici Situation · Coûts · TVA), réglages, rangée « Origine et limites des montants », rangée
  « Compagnon brasseur », barre du bas avec le + noir. Bleu Finances `#1F64A3`, mono pour les montants.
- **Données (fixtures)** : 38 factures, janv.–oct. 2026, 14 860,00 CHF d'achats ; TVA 869,89 = 124,48 à 2,6 % (malt,
  houblons, levures) + 745,41 à 8,1 %. Chaque ligne recalculée (TTC × taux / (100 + taux)). Ventes 31 240,00 CHF.
  Assujetti volontaire, à prix TTC inchangés : 2 340,83 à verser, 869,89 récupérés, soit 1 470,94 de plus ; gagnant sous
  11 609 CHF de ventes.
- **États** : `annee` ; `inconnues` (6 pièces sans TVA, plafond 92,91 si tout à 8,1 %, plage) ; `douteuse` (Vetropack lu
  128,00 = 10 %, attendu 95,91 ; il choisit, total en « ou ») ; `etrangere` (TVA suisse d'import 47,20 comptée ; MwSt
  allemande 38,00 EUR à part, jamais convertie en silence) ; `vide` ; `si` (feuille) ; `horsligne` (bandeau, 2 photos
  en attente comptées « ? »).
- **Boosters** : [x] barre de composition par taux [x] barre de données derrière chaque ligne (teinte du taux, longueur = TVA du poste) [x] réponse dans un panneau gris clair [x] plage d'incertitude hachurée [x] pastille
  « à vérifier » avec choix sur place [x] feuille de calcul (barre récupéré / à verser) [x] repli « Origine et limites »
  [ ] curseur (pas de facteur libre ici, L10).
- **Écart à la baseline** : aucun.
