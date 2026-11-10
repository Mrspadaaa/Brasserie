OK — r4b retouchée (R1, R2, Photographier le QR) : règlement de la base, données de z2

## Livré
- `qr/v1/r4/etat.html` : six états `?etat=confirme|contredit|partiel|illisible|sans|lecture`, à 390 et à 1280 (deux colonnes de l'app).
  Classes `qrr4-…`, script dans une fonction immédiate, assemblé par concaténation et `join`. La v0 (`qr/v0/r4/`) n'a pas été touchée.
- `qr/v1/r4/NOTE.md` : la base en ligne, élément par élément (repris tel quel, ou ce qui change et pourquoi) ; R1, R2 ; défauts et
  greffes de la SYNTHESE ; l'honnêteté ; les boosters.
- `qr/v1/r4/capturer.mjs`, `gestes.json`, `controles.log` ; captures `r4b-<état>-390.png` et `r4b-<état>-1280.png` (12), et 14
  `r4b-geste-*.png` (mêmes noms qu'avant, plus `proposition-adoptee`, `proposition-adoptee-ouverte`, `rattacher`, `photographier`).

## Retouches du verdict v1 (VERDICTS-v1, section r4)
- **R1** : « ① Règlement · Payé le 12.10.2026 · supposée » dans les six états, numéro compris. Les points sont numérotés dans l'ordre :
  ① Total en contredit, puis Règlement, puis mouture. En confirme et en contredit seulement, un chip pointillé ambre propose « À payer ·
  30 j · 11.11 · proposé par le QR ». La tuile ne passe à « À payer · 11.11 », avec la jauge et « déduite : QR, 30 jours net »,
  qu'après son toucher : `r4b-geste-proposition-adoptee.png`, et `-ouverte.png` pour le panneau Échéance. En sans, partiel et
  illisible, la base reste seule.
- **R2** : le jeu de données de z2 et z4 : 7 lignes, Maris Otter et sa mouture « Rattacher », point mouture ×1 +3,75, mêmes montants
  (110,40), même compte de preuve, mêmes sous-titres de plis. Seul écart de mise en page : la tuile TVA de la base en ligne, gardée.
- **Facultatif** : « Photographier le QR » dans la rangée hachurée de l'illisible (`r4b-geste-photographier.png`).
- Les corrections d'avant restent : défauts 1 à 4 de la SYNTHESE, les cinq greffes, et les retouches communes.

## Contrôles (`<dir>` = qr/v1 ; journal : `qr/v1/r4/controles.log`)
- controle-choix `--ecran=depense` : `CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s))` (pas d'entrée dépense dans
  `ecrans.json`).
- controle-commun `--profil=sans-houblons --sans-lignes` : `COMMUN OK`.
- mots-premier-ecran `--max=100 --profil=sans-houblons --sans-lignes` : `r4 78 mots`, `MOTS OK`.
- controle-contraste `--profil=sans-houblons` : `CONTRASTE OK`, pire 4,73:1.
- verifier-page `--min-images 0` : `PAGE OK (0 images chargées, 390 px, sans erreur)`.
- Ces outils ne lisent que l'état par défaut (confirme) ; les cinq autres états sont jugés sur leurs captures.

## Captures ouvertes et jugées en plein format
- États à 390 : confirme, contredit, partiel, illisible, sans, lecture. À 1280 : confirme.
- Gestes : proposition-adoptee, proposition-adoptee-ouverte, photographier, rattacher.
- Corrigé après regard : à 1280, l'étiquette « proposé » de « Pour quoi ? » s'étirait sur toute la largeur (`flex:none`).

## Ce qui tient, ce qui casse
- Tient : la base en ligne est complète, Règlement compris ; rien ne change sans son toucher (total, règlement, mouture) ; les six
  états se distinguent ; la fixture est celle de z2 et z4 : il compare le seul QR.
- Faible : le chip de proposition vit dans la rangée des points, sous la tuile TVA et non sous Règlement ; c'est son libellé
  « À payer » qui le relie au règlement. En contredit, la zone des points prend deux rangées à 390.

**Prédiction** : « Le lu / QR / lignes en colonnes c'est très très bien, et là le règlement reste comme je l'ai, le QR propose : ok. »

DÉCISION À PRENDRE : aucune
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
