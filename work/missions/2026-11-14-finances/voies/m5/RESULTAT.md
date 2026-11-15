OK — 10 mini maquettes : Modifier modifie (4), Payer et apport justifiés (5), fiche à barre

## Fichiers écrits (tous dans voies/m5)
- `_gen/build.mjs` (greffes par split/join à repère unique), `_gen/m2base.mjs` (copie de voies/m2/build.mjs, exporte sans écrire),
  `_gen/m1/commun.mjs` et `_gen/m1/ap.mjs` (copies de voies/m1/_gen), `fonts/` (copie de m2/fonts).
- Par id : `etat.html`, `<id>.png` (780 px, clair), `NOTE.md` (5 à 6 lignes) ; `tests.txt`.
- Rejouer : `node work/missions/2026-11-14-finances/voies/m5/_gen/build.mjs [ids]`.

## Une ligne par id (image ouverte et jugée)
- m5mo-a (tiède) : m2mo-a telle quelle ; Montant en champ 45,50 (42,00 barré au libellé) ; ligne verte « ✓ payé 9 nov. · banque 45,50 », « Le paiement suit le montant · garder 42,00 payé ».
- m5mo-b (froide) : idem ; deux pastilles « ✓ payé 42,00 » + hachure « reste 3,50 à payer », bouton « Payer 3,50 ».
- m5mo-c (chaude) : segment « Le paiement suit · payé 45,50 » / « Reste à payer · payé 42,00 · reste 3,50 » + rangée v6a avant (barrée) / après.
- m5mo-d (libre) : lignes de la pièce éditables (Nettoyant alcalin 5 L 42,00 ✓ ; Gants nitrile 3,50 hachure) qui font le total 45,50.
- m5pa-a : m2pa-a + rangée « Justificatif · avis de débit, quittance » pointillée, Photo / Fichier ou PDF, avant le bouton.
- m5pa-b : m2pa-b + ligne « Preuve » dans le volet ouvert : « photo du justificatif » / « fichier », pointillées.
- m5pa-c : m2pa-c + vignette du justificatif joint « avis de débit · ✓ joint · 9 nov. · 250,00 », « Changer », au-dessus de l'effet sur novembre.
- m5pa-d : m2pa-d + un seul « Justificatif du virement · joint aux 2 pièces » sous les deux pièces.
- m5ap-a : m1ap-c telle quelle + « Justificatif · relevé ou quittance » (Photo / Fichier ou PDF) sous le Motif.
- m5fo-a : m2fo-a telle quelle + la barre de m2fo-c sous « Dans la facture » ; les rangées colorées dessous en sont la légende.

## Critères
- G1 : `MINIS OK (10 maquettes, 4 vues)` (exit 0 ; aussi dans tests.txt). Le mot « lock » n'est plus dans les m5mo (classe renommée `-mt`).
- G2 : `MINIS ECHEC` (exit 1) : m2mo-a motif absent ; m2pa-a…d « justificatif » absent. Témoin rouge comme attendu.
- `git status` : rien d'écrit hors voies/m5 (les 4 fichiers modifiés hors m5 l'étaient avant la voie).
- `controle-choix.mjs` non joué : maquettes statiques de voie, pas un écran de l'app.

## Captures
`work/missions/2026-11-14-finances/voies/m5/<id>/<id>.png` pour les 10 ids ci-dessus.

## Prédiction
« Là oui, je peux changer le montant et je vois ce que devient le paiement ; le justificatif est enfin là. »

DÉCISION À PRENDRE : au port, une seule règle pour un montant modifié après paiement (a : le paiement suit ; b et c : la différence passe à payer ;
d : paiement par ligne, règle neuve) ; c'est le choix du brasseur sur la page de choix. Le justificatif du paiement et de l'apport est un champ
neuf (PaymentSheet et MovementSheet n'ont aucune pièce jointe).
CONNAISSANCE : `moneyLocked = !!draft.finance` (EditTransactionModal l. 37) désactive montant et TVA de toute opération déjà passée en finance, payée ou non.
LEÇON PROPOSÉE : aucune
