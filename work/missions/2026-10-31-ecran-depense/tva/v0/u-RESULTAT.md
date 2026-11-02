# Série u — vue TVA, brief minimal (01.11)

Captures des sept états : `node work/missions/2026-10-31-ecran-depense/tva/v0/u-outils/capturer.mjs <id>` (mon outil, dans ma
série) → `tva/v0/<id>/captures/<id>-<etat>-390.png` (premier écran), `-390-page.png` (page entière), `<id>-annee-1280.png`.

## u1 — Le troisième segment (froide)

- **Idée** : Synthèse « Situation · Coûts · TVA ». Grande lecture 869,89 CHF, barre des deux taux, une ligne par poste,
  « Me la faire rembourser ? » ouvre une feuille de calcul (assujetti volontaire : 1 470,94 CHF de plus en 2026).
- **Contrôles** (racine) : `controle-commun … --profil=sans-houblons --sans-lignes` → COMMUN OK ; `mots-premier-ecran
  --max=60 --sans-lignes` → u1 56 mots, MOTS OK ; `controle-contraste` → pire 5,17:1, CONTRASTE OK ; `verifier-page
  --min-images 0` → PAGE OK ; `controle-choix --ecran=finances` → « CHOIX OK (0 écran(s) conforme(s) à son choix ; 0
  ouvert(s)) » (pas d'entrée Finances dans ecrans.json, noté tel quel) ; `capturer.mjs u1` → CAPTURES OK (0 débordement, 0
  erreur).
- **Captures ouvertes** : annee, inconnues, douteuse, etrangere, horsligne, vide, si à 390 ; annee à 1280.
- **Tient** : lisible en trois secondes, langue exacte de l'app ; l'inconnu en plage « 776,98 à 869,89 » et hachures ; le
  doute se tranche sur place (Garder 95,91 / 128,00) ; l'euro allemand jamais converti ni compté.
- **Casse / limites** : sage, aucune surprise ; 1280 en une colonne longue (barres de jauge plafonnées à 440 px). Correctifs
  faits pendant la passe : coût assujetti faux dans la feuille (1 470,94 au lieu de 2 340,83, corrigé), boutons en mono
  (mot en mono = faute), bandes grises de remplissage dans `vide` retirées. Après le premier contrôle de panel (u1 à 0,49 de
  remplissage) : la fine jauge sous chaque poste devient une barre de données derrière toute la ligne (teinte du taux), et
  la réponse passe dans un panneau gris clair ; contrôles rejoués, verts.

## u2 — La frise des mois (tiède)

- **Idée** : Annuel « Bilan · TVA ». Douze colonnes empilées par taux, un toucher ouvre le mois ; « Si j'étais assujetti »
  retourne la frise (TVA des ventes sous l'axe) : récupéré 869,89, à verser 2 340,83, 1 470,94 de plus.
- **Contrôles** : COMMUN OK ; u2 51 mots, MOTS OK ; pire 5,17:1, CONTRASTE OK ; PAGE OK ; « CHOIX OK (0 écran(s)
  conforme(s) à son choix ; 0 ouvert(s)) » ; CAPTURES OK (0 débordement, 0 erreur).
- **Captures ouvertes** : annee, inconnues, douteuse, etrangere, horsligne, vide, si à 390 ; annee à 1280 (frise à gauche,
  factures à droite).
- **Tient** : le pic de mars (fermenteur) se lit d'un coup d'œil ; la frise divergente rend le « non » du remboursement
  visible sans phrase ; l'inconnu est un chapeau hachuré « ? », jamais une colonne basse.
- **Casse / limites** : la frise divergente ne chiffre pas chaque mois (valeurs dans l'aria-label) ; en hors ligne, le
  chapeau « ? » a une hauteur fixe qui ne mesure rien (à dire au port). Corrigés pendant la passe : barres de `si`
  invisibles (piste de grille à largeur nulle), sommes mensuelles incompatibles avec les factures de juin (refaites),
  « 776,98 + ? » coupé sur deux lignes, grille vide dans `vide`.

## u3 — Dans chaque bouteille (chaude)

- **Idée** : Synthèse › Coûts. Une bouteille remplie de la TVA payée, une couche par poste ; « TVA dans chaque 33 cl :
  13,35 ct » ; seul facteur libre, le contenant (33 cl, 50 cl, 75 cl, 1 L) ; traductions brassin 120 L (48,55 CHF), part
  du prix (2,8 %), par mois. « Me la faire rembourser ? » : deux bouteilles, 22,58 ct de plus par 33 cl si assujetti.
- **Contrôles** : COMMUN OK ; u3 60 mots, MOTS OK (à la limite, après coupe de 69) ; pire 5,17:1, CONTRASTE OK ; PAGE OK ;
  « CHOIX OK (0 écran(s) conforme(s) à son choix ; 0 ouvert(s)) » ; CAPTURES OK (0 débordement, 0 erreur).
- **Captures ouvertes** : annee, inconnues, douteuse, etrangere, horsligne, vide, si à 390 ; annee à 1280.
- **Tient** : l'unité du brasseur (centimes par bouteille) rend la TVA concrète ; la pile met d'un coup d'œil le matériel
  et le verre loin devant les ingrédients ; l'inconnu est une couche hachurée bornée, jamais un 0,00.
- **Casse / limites** : le fermenteur divisé par les litres d'une seule année gonfle le chiffre (à discuter : amortir ou
  exclure le matériel) ; 60 mots tout juste ; à 1280 la bouteille reste à 420 px, colonne droite courte. Corrigés pendant
  la passe : un « 0,00 ct » pour CO₂ dans `inconnues` (exactement l'interdit, retiré), étiquette DE géante (sélecteur CSS
  trop large), libellés qui se chevauchaient, bande de traductions qui affichait des valeurs sûres dans les états
  incertains (≤, ≈, +?). Le verre de la bouteille est passé brun foncé (verre de bière) : plus lisible comme bouteille, et
  le panel était trop uniforme (ressemblance 0,91).

## u4 — Le ticket de l'année (chaude)

- **Idée** : Opérations « Journal · Ticket TVA ». Un ticket déchiré sur le comptoir : une ligne par fournisseur, codes de
  taux A (2,6 %) et B (8,1 %) comme sur les tickets suisses, barres de taux, total 869,89 en bande noire, tampon « Non
  récupérable · non assujetti ». Le coupon « Me la faire rembourser ? » se détache et devient un décompte TVA fictif aux
  chiffres AFC (200, 303, 400) : à verser 1 470,94. À 1280, le décompte reste visible à droite du ticket.
- **Contrôles** : COMMUN OK ; u4 55 mots, MOTS OK ; pire 5,03:1, CONTRASTE OK ; PAGE OK ; « CHOIX OK (0 écran(s)
  conforme(s) à son choix ; 0 ouvert(s)) » ; CAPTURES OK (0 débordement, 0 erreur).
- **Captures ouvertes** : annee, inconnues, douteuse, etrangere, horsligne, vide, si à 390 ; annee à 1280.
- **Tient** : le plus parlant des quatre ; un objet que le brasseur connaît, lu de haut en bas sans légende ; le doute
  surligné comme au marqueur, le ticket allemand agrafé à part : l'étranger ne se mélange pas au total.
- **Casse / limites** : le comptoir gris est un fond décoratif (le brasseur a déjà refusé de gros blocs qui ne disent rien,
  D82 : risque) ; les codes A / B demandent d'être appris une fois (rappelés par les barres de taux). Corrigés pendant la
  passe : tampon posé sur les valeurs des taux (déplacé), contraste du tampon tourné lu à 1:1 (bordure tournée en
  pseudo-élément, texte droit), surligneur sur toute la ligne douteuse, bouton dans un bouton, colonne droite vide à 1280,
  bord déchiré blanc sur le comptoir.

## Série

- **Panel** : `controle-panel.mjs` sur les quatre `*-annee-390.png` → « 4 captures · remplissage médian 0,60, 0 sous 0,50 ·
  ressemblance moyenne 0,88 · paires presque identiques 0/6 (0 %) », PANEL OK (premier passage : médiane 0,51, 0,92 → ECHEC ;
  corrigé par u1 barres de données, u3 verre brun, u4 comptoir et total en bande).
- **Chaleurs** : u1 froide, u2 tiède, u3 et u4 chaudes. Compositions distinctes : liste à barres (Synthèse), frise
  (Annuel), bouteille (Coûts), ticket (Opérations). Chacune pose la question du remboursement autrement : feuille, frise
  divergente, deux bouteilles, décompte.
- **Données** : fixtures cohérentes d'une variante à l'autre (869,89 = 124,48 + 745,41 ; 38 pièces ; 14 860,00 d'achats ;
  ventes 31 240,00) ; rien de réel, aucun appel Gemini. Taux suisses 2,6 % et 8,1 %, seuil 100 000 CHF.
- **Fichiers écrits** : `tva/v0/u1…u4/etat.html`, `NOTE.md`, `captures/` ; `tva/v0/u-outils/capturer.mjs` (captures des
  sept états), `u-outils/paires-sim.mjs` (ressemblance par paire), `u-outils/panel.json` (mesures) ; ce fichier.
- **Prédiction** : il s'arrêtera sur u4 (« ça c'est parlant ») et sur la bouteille de u3, trouvera u1 juste mais attendu.

DÉCISION À PRENDRE : dans u3, diviser le matériel (fermenteur 286,23) par les litres d'une seule année gonfle la TVA par
bouteille ; l'amortir, l'exclure ou le montrer à part est un choix à lui montrer en variante, pas à trancher ici.

CONNAISSANCE : en Suisse, un non-assujetti ne récupère jamais la TVA de ses achats ; seul l'assujettissement volontaire le
permet, contre 8,1 % sur toutes ses ventes de bière. À 31 240 CHF de ventes et 869,89 de TVA d'achats, il paierait
1 470,94 de plus ; le point d'équilibre est vers 11 609 CHF de ventes par an (fixtures, prix TTC inchangés). À faire
confirmer par une fiduciaire avant d'en faire un texte d'app.

LEÇON PROPOSÉE : `mots-premier-ecran.mjs` sans `--profil=sans-houblons` compte le texte d'un `<details>` fermé (u1 : 87 mots
au lieu de 56) ; une variante doit vider ou cacher (`hidden`) le contenu replié, ou le brief doit passer le profil.

TVA-U OK — quatre mini maquettes u1 à u4, sept états chacune, contrôles verts, PANEL OK
