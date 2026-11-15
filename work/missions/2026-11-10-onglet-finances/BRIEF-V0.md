# Brief v0 — onglet « effet sur mes finances » (concepteurs Opus, 3 séries de 5)

Lis `DOSSIER.md` (même dossier) en entier, ouvre les trois captures v6a et deux ou trois captures de `captures/`. Ne lis pas
d'autres sources sauf besoin précis. Charge `boosters-ux` (avec impeccable et ui-design-system) une fois.

## Ta série
- **Série 1 — froide** (`f1a`…`f1e`) : au plus près de v6a et de la lecture étroite. Les piles v6a telles quelles dans un
  onglet ; chaque concept varie *comment l'écart se voit* (axe 2) et la forme de l'onglet (axe 1). Une au moins reprend
  l'état « Après ✓ Payé » de v6a presque mot pour mot.
- **Série 2 — tiède** (`f2a`…`f2e`) : les axes 3, 4 et 5. Piles + solde prévu, bascule payé / à payer par « ✓ Payé » 24 px,
  encaissement et facture QR à encaisser, onglet segmenté « Saisie | Finances », ligne-résumé qui s'étire.
- **Série 3 — chaude** (`f3a`…`f3e`) : représentations modernes plus libres, toujours lisibles comme les piles de v6a
  (cascade avant → après, pile qui grandit d'un segment lumineux, comparaison au doigt, mois en anneau…). Une seule idée par
  concept ; ses exemples (v6a) en tiennent un tiers au plus.
- Cinq concepts vraiment différents dans ta série (composition, forme de l'onglet, représentation de l'écart) ; pas de squelette
  commun.

## Rendu par concept, dans `work/missions/2026-11-10-onglet-finances/v0/<id>/` (tu ne possèdes que tes 5 dossiers)
- `index.html` : page statique autonome, 390 px d'abord, tenant à 1280 ; deux thèmes par jetons ; l'état par paramètre :
  `?etat=ferme` (onglet fermé sur la Nouvelle dépense), sans paramètre (onglet ouvert, dépense ZZ Malt 58,40 payée),
  `?etat=encaisse` (onglet ouvert sur la Caisse, encaissement ZZ 54,00). Ajoute `&theme=sombre` qui pose `data-theme="dark"`.
- Captures (Chrome sans écran, 390×844, échelle 2, thème clair) : `<id>-haut.png` (ouvert), `<id>-ferme.png`,
  `<id>-etat.png` (encaissement). Outil : `node scripts/agents/verifier-page.mjs <fichier> --captures <préfixe>` ou puppeteer-core
  (skill webapp-testing). **Ouvre chaque capture** et juge-la comme le brasseur (L12) avant de rendre.
- `NOTE.md` ≤ 120 mots : nom en mots du brasseur (≤ 4 mots), l'idée en une phrase, la lecture choisie sur chaque axe, chaleur,
  ce qui casse.
- Vérifie toi-même : aucun chiffre hors fixtures ; écarts exacts ; cibles ≥ 24 px ; aucune liste d'items ni d'opérations ;
  rien sous 11 px dans l'onglet ; contraste lisible dans les deux thèmes.

## Plafond
Environ 10 tours par concept, 60 tours au total. Rends une seule ligne : `<série> : 5 concepts, captures vues, <problème éventuel>`.
