# Carnet : améliorations, regard UX/UI (21.11)

Regard : expert UX/UI, skills `boosters-ux` (B1 à B13) et `impeccable` (mode Operate). Brief : `BRIEF-AMELIORATIONS.md`.
Ce qu'on cherche : ce qui remplace du texte et des listes par une représentation, les gestes instantanés, la cohérence avec
l'étagère du Stock (`MurStock`, épicerie) et la fiche v02 du Calendrier (`2026-11-21-calendrier-fiche/v02.html`, en port D412).
Pas de bug ici (déjà CRP, CRB, CRU) ; un constat de code utile est signalé, au pilote de le verser à BUGS.md (L05).

## Sources lues et limites

- Code au worktree `port-carnet` (e26a46f36) : `modele.ts`, `operations.ts` (`planDepuisChoix` l. 591-605), `CarnetsVue.tsx`
  (`envoyerAVenir` l. 1394), `analyseLocale.ts` (devises l. 140-155), `finance/types.ts` (`EquipmentUpgrade` l. 128-142),
  `finance/upgradeForecast.ts` (bandeau « Caisse fin de mois » d'À venir), `types/index.ts` (`EquipmentItem` l. 114),
  `services/purchaseEntry.ts` l. 728-730 (facture → Parc), `stock/MurStock.tsx`, `carnets/doublons.ts` (fuse.js).
- Captures regardées : sa capture 03 (Chambre froide, 390), `calendrier-fiche/captures/v02-repos.jpg`.
- Choix et refus : `maquettes.json` (base Carnet ra+p5f, règle n° 1 ; **K5 « Fiche prix + caisse (s2a2) » : « Ça correspond pas
  du tout à mes besoins ?? »** ; CR-AVENIR-CAL), REGLES.md R1 à R12, GAIN.md, PORTRAIT v2.
- **Limite (GAIN point 2)** : chaînes **non rejouées au doigt** ici ; gestes « aujourd'hui » estimés sur le code et les chasses
  CRU/CRB (jouées à 390). Avant toute mini maquette, le pilote rejoue chaque chaîne retenue et note gestes et secondes.
- Fréquence : sa capture 03 montre Carnets 15, À venir 11, Réalisés 0. Phase d'équipement : plusieurs comparaisons et achats par
  mois (estimé sur ces compteurs, pas mesuré).

## Constat de code qui porte le reste (à verser par le pilote)

`planDepuisChoix` (operations.ts:595-601) : un article choisi en **EUR** part dans À venir avec `amountCents: 0`,
`budgetKnown: false`, `stage: 'research'`. Le prix lu est **perdu** au passage ; la courbe de caisse ne le voit pas. `date: ''`
aussi : l'achat n'a pas de date. `deliveryCents` et `installationCents` existent dans `EquipmentUpgrade` mais ne sont jamais
nourris par le carnet. Aucun taux de change dans `src/domain/carnets` (grep « EUR » : seulement la reconnaissance de devise).

## Cohérence : trois formes déjà choisies à réemployer (R7)

| Forme | D'où | Dans le Carnet |
|---|---|---|
| **Pastille chiffrée**, pleine si connue, **pointillée « CHF ? »** si inconnue | fiche v02 du Calendrier | prix, volume, date, dispo d'un article ; remplace « rien encore », « aucune », « prix ? » en texte |
| **Pastille → règle au pouce** (toucher, elle s'élargit, la valeur bouge en direct) | fiche v02 (edition) | date d'achat, délai, part du port ; jamais un sélecteur de date |
| **Toucher → bulle, puis fiche** ; teinte par famille ; chiffre en pastille | étagère du Stock (`MurStock`) | article de Comparer : bulle courte (prix rendu, dispo, lien) puis `FicheArticle` |
| Teinte de rangée **Achats** (bleu) ; négatif en rouge | Calendrier | l'achat envoyé garde le bleu d'Achats ; un dépassement de caisse se dit en rouge, comme la courbe |

Règle de lecture : chiffre + unité en IBM Plex Mono `tnum`, texte en Source Sans (CRU-6). Inconnu = pastille pointillée, jamais
zéro ni phrase (B8).

## Idées

Format : geste aujourd'hui → visé · gain · fréquence · coût · donnée · classe · formes à montrer (2 ou 3 mini maquettes).

### U1 — Prix rendu en CHF (EUR → CHF, port, TVA d'import)
- Aujourd'hui : prix en EUR affiché tel quel (quand il est lu, CRP-1) ; port, TVA, frais de dédouanement dans sa tête ; à
  l'envoi dans À venir, le prix EUR devient 0 (constat ci-dessus), il le retape dans À venir (≈ 6 gestes + clavier, estimé).
- Visé : une étiquette « ≈ 2 480 CHF rendu », calculée seule ; à un toucher, la décomposition. Envoyée telle quelle à À venir
  (`purchaseCents`, `deliveryCents`), marquée estimation (R2).
- Gain : **ressaisie supprimée** et **erreur de caisse évitée** (achat EUR invisible sur la courbe). Règles R1, R4, R5.
- Fréquence : chaque article d'une boutique allemande ; mensuelle au moins en phase d'équipement (estimé).
- Coût : moyen. Taux du jour (BNS ou BCE) gardé avec sa date pour le hors ligne, « ≈ » affiché. TVA d'import CH 8,1 % (taux
  normal) ; droits de douane sur les produits industriels supprimés en Suisse depuis le 1.1.2024 : reste TVA + forfait du
  transporteur. Un réglage par vendeur : prix TTC allemand (19 %) ou HT export. Son assujettissement à la TVA (récupérable ou non)
  se règle une fois. Ces faits sont à vérifier par le pilote avant code.
- Classe : **vrai gain**.
- Formes : (a) **étiquette prix rendu** : gros CHF en mono, sous-ligne fine « 1 990 € · port · TVA », décomposée au toucher ;
  (b) **barre empilée** horizontale (article / port / TVA-frais) avec le total au bout, segments teintés ; (c) **pastille v02**
  « CHF ? » pointillée tant qu'un morceau manque (port inconnu), pleine quand tout est connu.

### U2 — « Ce qui compte » en un geste, sans attendre l'IA
- Aujourd'hui : critères posés par l'IA ou par une phrase tapée ; le rang 1 sort de nulle part (CRB-5) ; « rien encore : l'IA le
  proposera » au premier plan (CRB-6).
- Visé : dans Comparer, **toucher le nom d'une rangée l'épingle** : elle monte en tête, devient critère (`Caracteristique`, sens
  proposé par l'unité : prix et délai « moins », m³ « plus »), le rang se recalcule en direct et dit sur quoi il repose.
- Gain : **erreur rendue impossible** (rang sans raison) ; critère en 1 toucher au lieu d'une phrase (≈ 4 gestes + clavier → 1).
  Règles R3, R4, R11.
- Fréquence : chaque carnet à comparer (mensuelle au moins, estimé).
- Coût : petit à moyen. `Critere.caracteristique` existe ; `comparer.ts` classe déjà.
- Classe : **vrai gain**.
- Formes : (a) **épingle sur la rangée** (picto à gauche du nom, rangée épinglée collée en tête) ; (b) **puces d'attributs**
  au-dessus des colonnes (prix · m³ · porte · délai), l'ordre de toucher = l'ordre de décision ; (c) **glisser une rangée** vers le
  haut (poignée), équivalent au toucher : un appui sur la poignée la monte d'un cran (B9).

### U3 — Étiquettes verte ou rouge des contraintes de chez lui (« ça entre ? », 230/400 V)
- Aujourd'hui : il compare « Largeur de la porte », dimensions, tension en lisant les cellules (quand elles s'affichent, CRB-3).
- Visé : quelques contraintes posées une fois par carnet ou pour la brasserie (porte L × H, hauteur sous plafond, 400 V oui/non,
  place au sol) ; chaque article porte une **étiquette verte « passe · 6 cm de marge »** ou **rouge « porte trop étroite »**.
  Seule l'exception s'étiquette (B7) : rien si tout passe et qu'aucune contrainte n'est posée.
- Gain : **erreur coûteuse rendue impossible** (une chambre froide qui ne passe pas la porte, un groupe 400 V sans prise).
  Règles R4, R6.
- Fréquence : par gros article (quelques fois par an), mais l'erreur est irréversible : le filtre GAIN (« chaîne au moins
  mensuelle ») n'est **pas** tenu ; je le garde en vrai gain pour le coût de l'erreur, au pilote de trancher.
- Coût : moyen. `analyseLocale` lit déjà « la porte du local fait … » (l. 343) et `tient 80 °C` en oui-non ; manque la lecture de
  « 1800 x 1500 x 2200 mm » en L / P / H (CRU-6 la demande aussi).
- Classe : **vrai gain** (étiquette) ; la silhouette dessinée : **nice to have**.
- Formes : (a) **étiquette verte/rouge** dans la ligne d'article, marge en mono ; (b) **silhouette à l'échelle** : rectangle de
  la porte en trait, face de l'article en plein, superposés, vert ou rouge ; (c) **vue de dessus** du coin du local avec
  l'empreinte de l'article (gros, rare : à montrer pour qu'il juge, pas à recommander).

### U4 — « Je prends celle-ci » : choisir et envoyer d'un toucher
- Aujourd'hui : Choisir (pourquoi, écartés, souvent au clavier) → retour → « Envoyer dans À venir » → message « Dans À venir. » →
  aller dans À venir poser la date et corriger le prix. ≈ 8 à 10 gestes + clavier (estimé sur `Choisir.tsx`, `CarnetOuvert.tsx:467`).
- Visé : bouton **« Prendre »** dans l'en-tête de colonne de Comparer et sur la ligne d'article ; un toucher = choix (pourquoi
  proposé depuis les critères épinglés : « moins cher, 4,06 m³ »), plan À venir créé avec prix rendu (U1) et horizon (U5) ;
  message « Pris · Dans À venir, mars · Annuler » (R1, L9). Renommer le pourquoi en touchant son texte (R12).
- Gain : **≥ 60 % de gestes en moins** (estimé), ressaisie de prix et de date supprimée. Règles R1, R11, R12.
- Fréquence : chaque achat décidé (mensuelle en phase d'équipement, estimé).
- Coût : petit à moyen ; `planDepuisChoix` et `poserSortie` existent, il faut les enchaîner et les nourrir.
- Classe : **vrai gain**.
- Formes : (a) **bouton « Prendre »** dans l'en-tête de chaque colonne ; (b) **glisser la ligne d'article vers la droite**
  (action de rangée, avec bouton visible en repli, R11) ; (c) **pastille de rang qui devient coche** au toucher, la colonne prise
  prend la teinte Achats, les autres pâlissent.

### U5 — Délai et date d'achat : frise courte, réglée au pouce
- Aujourd'hui : `dispo` lu en texte (« en stock ») ; plan envoyé avec `date: ''` ; date posée dans À venir à la main.
- Visé : l'achat part avec un **horizon** (R2 : ce mois, 1 mois, 3 mois) et, si la page le donne, la **livraison estimée**
  (« en stock » → 1 à 2 semaines ; « 4 à 6 semaines » lu). Réglé sur une pastille date v02 → règle au pouce. Au Calendrier, la
  barre Achats va de la commande à la livraison.
- Gain : **oubli de date rendu impossible**, ressaisie supprimée. Règles R1, R2, R3.
- Fréquence : chaque achat (mensuelle, estimé).
- Coût : moyen (lecture du délai, horizon par défaut ; la règle au pouce est celle de la fiche v02 portée).
- Classe : **vrai gain**.
- Formes : (a) **frise courte** commande → livraison → installation, pouces sur les deux bouts ; (b) **pastille date v02**
  seule (« mars ») qui s'élargit en règle ; (c) **puces d'horizon** (Ce mois · 1 m · 3 m · Plus tard) sur une rangée.

### U6 — Payable quand ? (budget contre la caisse)
- Aujourd'hui : rien dans le carnet ; À venir a son bandeau « Caisse fin de mois » (`upgradeForecast.ts`) et le Calendrier sa courbe.
- Visé : **pas de jauge ni de fiche caisse dans le carnet** (refus K5 d'une « Fiche prix + caisse » ; R5 : la courbe le porte déjà).
  À la place, pendant le geste « Prendre » (U4) ou le réglage de date (U5), **une étiquette « payable dès avril »** ou « caisse
  à −1 200 en mars » en rouge, tirée de `buildForecast`, et la conséquence vue sur la courbe du Calendrier (R4).
- Gain : **erreur évitée** (acheter un mois où la caisse passe en négatif). Règle R4.
- Fréquence : chaque achat (mensuelle, estimé). Coût : petit (prévision existante).
- Classe : étiquette dans le geste : **vrai gain** ; jauge budget/caisse au repos dans le carnet : **écartée** (K5, doublon).
- Formes : (a) **étiquette** « payable dès avril » sous le prix rendu ; (b) **mini-courbe** (le tracé de `Courbe.tsx` réduit) avec
  le prix en trait horizontal, montrée seulement pendant le réglage de date ; (c) **aucune marque** dans le carnet, la pastille
  date vire au rouge sur un mois en creux.

### U7 — Reçu, puis au Parc, sans retaper
- Aujourd'hui : la facture lue crée un `EquipmentItem` (`purchaseEntry.ts:728-730`) avec le libellé de facture, sans lien vers le
  carnet, sans lien de notice, sans garantie ; le carnet reste « choisi » et ne sait pas que c'est reçu.
- Visé : la ligne de facture qui correspond au plan À venir du carnet (vendeur, montant proche) propose « C'est la chambre froide
  du carnet ? Oui » ; le Parc reçoit nom court, prix, date, lien de la page (notice), garantie (2 ans par défaut, « selon vendeur »
  à régler), et le carnet passe « Au Parc depuis le … ».
- Gain : **ressaisie supprimée** (nom, prix, lien), oubli de garantie évité. Règles R1, R8.
- Fréquence : chaque achat reçu (mensuelle, estimé). Coût : moyen (rapprochement facture ↔ plan ; champs garantie et lien neufs
  sur `EquipmentItem`).
- Classe : **vrai gain**.
- Formes : (a) **pastille « Au Parc »** dans la ligne de carnet, qui ouvre la carte du Parc ; (b) **jauge de garantie** sur la
  carte du Parc (temps restant en barre, rouge à 2 mois de la fin) ; (c) **carte « reçu » type ticket** dans le Parc, liens
  notice et carnet en pied.

### U8 — Déjà au Parc ou au stock ?
- Visé : en collant un article, une étiquette « déjà au Parc : Cuve 60 L » si un `EquipmentItem` actif ressemble (fuse.js de
  `doublons.ts`).
- Gain : achat en double évité, mais rare. Coût : petit. Classe : **nice to have**.
- Formes : (a) étiquette grise sous le nom ; (b) pastille picto Parc sur la carte d'article.

### U9 — Lire Comparer d'un coup d'œil : barres dans les cellules et prix par unité utile
- Visé : dans une rangée numérique, chaque valeur porte une **barre de fond proportionnelle** (4,06 m³ contre 2,6 m³) ; une
  rangée dérivée **CHF par m³** (ou par fût) quand prix et volume sont connus ; la meilleure valeur garde son surlignage.
- Gain : lecture (B1, B11), aucun geste ni ressaisie en moins : ne passe pas GAIN point 4. Coût : petit.
- Classe : **nice to have** (à greffer au port de Comparer, CRU-1, sans être candidat en mini maquette seul).
- Formes : (a) barre de fond ; (b) points sur une échelle commune par rangée ; (c) chiffre + écart « +56 % ».

### U10 — Même article chez plusieurs vendeurs, et l'occasion
- Visé : deux liens du même article (même nom normalisé, même dimensions) se fondent en **une colonne avec une plage de prix**
  (bâton min–max, vendeur le moins cher en tête) au lieu de deux colonnes jumelles.
- Ricardo, Anibis : pages dynamiques, lecture par `lireLien` non éprouvée, conditions d'usage à lire ; le collage d'un lien
  reste possible tel quel. Pas de recherche automatique.
- Classe : fusion multi-vendeurs **nice to have** (coût moyen, fréquence faible) ; recherche d'occasion automatique **écartée**.
- Formes : (a) plage de prix en bâton dans la cellule prix ; (b) pile de pastilles vendeur sous l'en-tête de colonne.

## Écartés (raison en une ligne)

- Jauge budget contre caisse au repos dans le carnet : refus K5 (« Ça correspond pas du tout à mes besoins ?? ») et doublon de
  la courbe du Calendrier et du bandeau d'À venir (R5).
- Coût d'usage en kWh : puissance absorbée rarement lue sur la page, prix du kWh absent, fréquence faible ; l'étiquette 230/400 V
  (U3) suffit.
- Recherche automatique sur Ricardo, Anibis : pages dynamiques, conditions d'usage, résultat incertain ; coller le lien suffit.
- Vue de la chaîne entière idée → Parc dans une seule page : déjà refusée (pe2, pe5) ; la pastille d'état de U7 suffit.

## Bilan

- Vrais gains : U1 prix rendu, U2 ce qui compte en un geste, U3 étiquettes de contraintes (fréquence à trancher), U4 Prendre d'un
  toucher, U5 délai et date, U6 étiquette « payable dès » dans le geste, U7 reçu vers le Parc (7).
- Nice to have : U8 doublon Parc, U9 barres et CHF par m³, U10 multi-vendeurs, silhouette à l'échelle de U3 (4).
- Écartés : jauge caisse au repos, kWh, recherche d'occasion, vue chaîne entière (4).
- Top 3 : **U4 + U1** (Prendre d'un toucher, avec le prix rendu en CHF qui arrive juste dans À venir : corrige la perte du prix
  EUR), **U2** (épingler ce qui compte, rang expliqué), **U5** (date et délai réglés au pouce, comme la fiche v02).
- Avant les mini maquettes : rejouer au doigt les chaînes U1, U2, U4, U5 (GAIN point 2) ; vérifier les faits de TVA et de douane
  (U1) ; tout se greffe sur sa base ra+p5f sans changer son dessin (règle n° 1) ; une page de choix par idée, formes côte à côte
  avec sa base (L24).
