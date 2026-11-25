# Juge critique au portrait, tour 1 (25.11 soir)

Grille : PORTRAIT.md v2 (note = la plus basse de « se voit en 3 s » et « répond au besoin », jamais une moyenne ; nos juges notent
+0,5 à +1 au-dessus de lui, donc notes tirées vers le bas). Règles dures : § ORGANISE-TROP-TEXTUEL, § FRISE-GENERIQUE, § ENTETE-PEU-UTILE.
Captures ouvertes : les 24 de `cap/` (2 cas × repos/geste) et les 72 de `cap12/`, en planches côte à côte (v1-v3, v4-v6) par cas.
B = bloquant (valeur fausse, geste ou info clé absente, illisible, règle dure ou refus explicite rejoué) ; m = mineur.

## Communs aux 6 (à corriger partout, comptés une fois)
- **C1 (B) Résolu invisible** — `cap12/v*-pilsner.png` : « Commandé 2 sacs, brassin maintenu » se lit partout comme un problème ouvert
  (v6 : héros « Autre fournisseur, maintenant »). Valeur fausse.
- **C2 (B) Échéance et événement sans jours restants** — `cap12/v*-assurance.png` (31 déc.), `v*-fete.png` (avant mars),
  `v*-chaudiere.png` (demain 7h), `v*-bouteilles.png` (avant le 15) : une pastille ⏳ parmi d'autres, aucun « J-36 ». § FRISE-GENERIQUE
  demande « échéance : jours restants ; événement : compte à rebours ».
- **C3 (B) Option sans titre, réduite à « emoji + ? »** — `cap12/v*-sureau.png` (♨️ ? ❄️ ? = deux façons d'infuser), `v*-chaudiere.png`
  (👷 ? 📅 ? = technicien, décaler au jeudi), `v*-pilsner.png` (📅 ? 🔄 ?), `v*-co2.png` (🔧 ? = « raccord changé », déjà fait). Refus
  explicite : « Les icône sont pas parlant du tout ». Une option se nomme par son titre ; le coût est un attribut, pas l'étiquette.
- **C4 (B) Date de la tâche perdue** — `cap12/v*-bar.png` (lundi), `v*-cave.png` (samedi 6 déc.), `v*-co2.png` (dans une semaine).
- **C5 (B) Sens métier, bouteilles** — `cap12/v1/v2/v4/v6-bouteilles.png` : l'occasion 0.20/bt est couronnée (ou rangée en vert « sûr »)
  alors qu'elle n'a que 400 bouteilles pour un besoin de 600. Un gagnant qui ne couvre pas le besoin trompe. Montrer ⚠ 400/600 et le coût
  total par offre (Verallia ≈ 504 CHF pour 1 200 min, B ≈ 410 CHF livré) : c'est la vraie question « laquelle, avant le 15 ».
- **C6 (B) Ligne perdue, bar** — `cap12/v*-bar.png` : « Il demande un prix pro » n'apparaît nulle part (réponse `reponses/bar.json`
  sans cette ligne). C'est la décision du carnet.
- **C7 (m) Doublons** — `cap12/v*-ecoulement.png` : 150 CHF deux fois (chiffre + coût d'option) ; `v*-fete.png` : 10 fûts deux fois ;
  `v*-pilsner.png` : 4 CHF et +4 CHF/sac.
- **C8 (m) Picto faux** — `cap12/v*-co2.png` : 1,2 bar porte 📈 (hausse) alors que la pression chute ; `v6-*` 🔢 « 1234 » est muet.
- **C9 (m) Sens métier, citra** — `cap/v1-v6-citra-repos.png` : α 13,6 % couronné contre 10–15 % ; l'intervalle contient la valeur,
  rien ne gagne (« il faut des intervalles »).
- Doute, non compté : l'option conseillée par l'IA (`conseille: true`, Fournisseur B) ne porte aucun ★ dans `cap12/v*-bouteilles.png`,
  alors qu'elle en porte un dans l'écoulement.

## v1 — Carte mentale
**Avis.** Le dessin à la main (`cap/v1-ecoulement-repos.png`, `v1-citra-repos.png`) est le plus « visuel » des six : le cœur ✓1 ?2 dit en
une seconde où en est le problème, les formes (rond piste, carré tâche, pointillé IA) se lisent sans lire. Mais la carte n'a pas
d'entrée : l'œil tourne, la prochaine action est une branche parmi d'autres, et dès 8 branches elle se marche dessus. Étiquettes en
13 px sous les nœuds : petit pour lui.
Phrase prédite : « Visuellement c'est sympa, mais je sais pas par où commencer, et sur les bouteilles c'est le bordel. »
**Problèmes.**
1. B — `cap12/v1-fete.png` : 10 branches, « Réserver le stand » coupé (« éserver le stan »), « 10 fût » et « Gobelets consignés »
   se chevauchent (chev 3).
2. B — `cap12/v1-bouteilles.png` : 13 branches, Verallia et Fournisseur B se recouvrent ; 29 mots, à la limite.
3. B — `cap12/v1-assurance.png` : « Chiffre d'affaires 2026 » coupé au bord gauche.
4. B — aucune prochaine action dominante : `cap12/v1-chaudiere.png`, « Appeler le technicien » (brassage demain 7h) pèse autant que
   « 10 min ».
5. m — `cap12/v1-pilsner.png`, `v1-ecoulement.png` : cœur « ✓0 ?0 » ou « ?0 », bruit sans sens.
6. m — `cap12/v1-cave.png`, `v1-sureau.png` : un cœur vide pour un mémo ; la carte n'apporte rien quand il n'y a que des tâches.
**À greffer.** L'anneau ✓n ?n au cœur (avancement d'un problème, propre au genre) ; la grammaire de formes (rond / carré / pointillé
violet IA) ; la feuille du geste (`cap/v1-ecoulement-geste.png` : n° de ligne, mots surlignés, « Mes notes ↩ »).
**Note : 6/10.**

## v2 — Tuiles
**Avis.** Les gros chiffres se lisent à deux mètres (`cap12/v2-co2.png` : 1,2 bar le 15 / 0,4 bar le 22, la chute se voit), la tuile
« 1/2 Joint » est une bonne jauge de recherche, et l'Aide en feuille (`cap/v2-ecoulement-geste.png`) est la plus lisible des six. Mais
la taille ne suit pas l'importance : une tuile géante dit « 2 fûts par mois » sur 3 lignes, deux tuiles entières disent « ? », et
la prochaine action descend sous les tuiles.
Phrase prédite : « Les gros chiffres c'est bien, mais pourquoi un énorme ? qui prend la moitié de l'écran ? »
**Problèmes.**
1. B — `cap12/v2-bouteilles.png` : 53 mots au premier écran (plafond 30, § ORGANISE-TROP-TEXTUEL) ; « 0.20/bt » déborde ;
   « par 600 » en géant ne dit rien.
2. B — `cap12/v2-pilsner.png`, `v2-sureau.png`, `v2-chaudiere.png` : coût inconnu « ? » avec une barre bleue pleine. L'inconnu ne se
   montre jamais plein (honnêteté ; le dessin à la main le hachurait, `cap/v2-ecoulement-repos.png`).
3. B — `cap12/v2-chaudiere.png` : la tâche urgente « Appeler le technicien » est en bas, coupée par le champ.
4. m — `cap12/v2-pilsner.png` « +4 CHF/sac » et `v2-levure.png` « 3e générat » coupés au bord de la tuile.
5. m — `cap12/v2-citra.png` : bandeau « MotlerHops 👑0 Brau und Rauchshop 👑0 » en gros, pour rien.
6. m — `cap12/v2-fete.png` : la liste passe sous l'écran (sb 1).
**À greffer.** Le chiffre clé en très grand avec sa date dessous (paire 1,2 bar / 0,4 bar) ; la tuile « n/N trouvé » ; l'Aide en
feuille à trois lignes typées ✓ ☐ 💡 avec ✕ et ＋.
**Note : 6/10.**

## v3 — Chemin (métro)
**Avis.** La table de comparaison à la main (`cap/v3-citra-repos.png`, une ligne par critère, la case gagnante en vert) est la meilleure
comparaison des six, et la bulle sur place (`cap/v3-ecoulement-geste.png`) garde le contexte. Mais le genre rejoue la plainte : une
ligne verticale de stations, la même pour tous les carnets, au centre de l'écran.
Phrase prédite : « C'est encore la frise, juste à la verticale. Et pourquoi un téléphone partout ? »
**Problèmes.**
1. B — § FRISE-GENERIQUE : la ligne 🔎 → station → 🛠️ est fixe pour tous les cas (`cap12/v3-assurance.png`, `v3-cave.png`, `v3-fete.png` :
   chemin de problème imposé à une échéance, un mémo, un événement ; 🛠️ vide).
2. B — `cap12/v3-co2.png`, `v3-pilsner.png`, `v3-levure.png`, `v3-sureau.png` : la station « maintenant » est toujours 📞, même pour
   « Faire un starter » ou « Goûter la voisine ». Picto faux.
3. B — halo jaune lumineux autour de la station (`cap/v3-ecoulement-repos.png`) : refus explicite « glowing, halos ».
4. B — `cap12/v3-bouteilles.png` : grille à 2 colonnes pour 3 offres, en-têtes décalés, « 0.5 » coupé, 34 mots.
5. B — `cap12/v3-pilsner.png` : « 3 déc. » dans la station « maintenant » alors que c'est réglé.
6. m — grands vides entre stations (`cap12/v3-cave.png`, `v3-assurance.png`) : la moitié de l'écran est noire.
**À greffer.** La table de comparaison critère × vendeur, case gagnante colorée (à étendre à N colonnes) ; la bulle de ligne posée
sous l'élément touché.
**Note : 5/10.**

## v4 — Feu tricolore
**Avis.** L'idée (vert sûr / jaune attend / rouge manque) est forte pour un TDAH, et la jauge de coût hachurée pour l'inconnu
(`cap/v4-ecoulement-repos.png`) est honnête. Mais les lampes sont fixes et ne suivent pas les rangées : dès qu'une rangée manque,
la couleur ment.
Phrase prédite : « Le feu dit rouge et à côté c'est écrit en orange ? Je comprends rien. »
**Problèmes.**
1. B — couleur fausse, 9 cas sur 12 : `cap12/v4-ecoulement.png` (« Contacter entreprise X » orange en face du rouge),
   `v4-citra.png` (Prix ? Dispo ? rouges en face du vert), `v4-pilsner.png`, `v4-fete.png`, `v4-assurance.png`, `v4-cave.png`
   (tout l'orange en face du vert), `v4-levure.png`, `v4-sureau.png`.
2. B — `cap12/v4-bouteilles.png` : repères 0.2 / 0 / 0.55 superposés, Verallia lu « 0 » au lieu de 0.42. Valeur fausse.
3. B — `cap12/v4-sureau.png`, `v4-co2.png` : jauge de coût pour des façons d'infuser ou une seule option inconnue ; la jauge ne répond à
   rien.
4. m — `cap12/v4-chaudiere.png` : 👷 et 📅 se chevauchent dans le hachuré.
5. m — `cap12/v4-ecoulement.png` : « 150 CHF » (une estimation) rangé en vert « sûr ».
**À greffer.** La jauge de coût à hachures pour l'inconnu, quand au moins 2 options ont un coût connu ; le code vert / jaune / rouge,
mais porté par chaque pastille, pas par une colonne fixe ; l'Aide en éventail au-dessus du bouton (`cap/v4-ecoulement-geste.png`).
**Note : 4/10.**

## v5 — Kanban
**Avis.** Trois colonnes à vignettes, c'est net et connu. Mais le kanban range des tâches, et un carnet contient surtout des faits et
des pistes : les valeurs tombent dans « Fait », les colonnes restent vides, et les vignettes étroites cassent chaque libellé en deux.
Phrase prédite : « α 13,6 dans Fait ?? Et la moitié de l'écran est vide. »
**Problèmes.**
1. B — valeur fausse : `cap/v5-citra-repos.png` (α 13,6 % et arômes en « Fait »), `cap12/v5-bouteilles.png` (0.20/bt et par 600 en
   « Fait », rien n'est fait).
2. B — `cap12/v5-pilsner.png` : « Fait » vide, tout en « À faire » alors que c'est commandé.
3. B — chiffres perdus : `cap12/v5-co2.png` (1,2 → 0,4 bar), `v5-fete.png` (budget 1 500 CHF), `v5-sureau.png` (4.5%),
   `v5-levure.png` (3e génération, 12 jours), `v5-bar.png` (2 fûts/mois, 20 L).
4. B — `cap12/v5-citra.png` : les noms écrasent la barre du duel ; `v5-bouteilles.png` : duel à 3 en texte, sans barre.
5. m — 2 colonnes vides sur 3 : `cap12/v5-cave.png`, `v5-assurance.png`, `v5-fete.png` (liste coupée en bas, sb 1-2).
6. m — `cap/v5-citra-repos.png` : vignettes ☆ + drapeau seuls, muettes.
**À greffer.** Le duel en barre 👑1 / 👑2 en tête d'un achat à 2 vendeurs (`cap/v5-citra-repos.png`) ; la carte qui se retourne sur sa
ligne (`cap/v5-ecoulement-geste.png`).
**Note : 4/10.**

## v6 — Une seule chose maintenant
**Avis.** La seule qui répond en trois secondes à la question d'un TDAH : quoi faire maintenant. Le héros (picto géant, verbe en gras,
✓ énorme, ⏭) se lit sans lire, le reste est rangé en rangées à repère (🔎 trouvé, 💰 coût, ⏳ délai) et le « 4 ↩ » tient la promesse
« chaque chose renvoie à sa ligne ». Tient sur 10 cas sur 12 sans casser la mise en page. Ce qui manque : le héros ne sait pas dire
« réglé », ni « quand », et sur un achat il choisit la mauvaise chose.
Phrase prédite : « Ça c'est vachement bien, je vois direct quoi faire. Mais le pilsner il est déjà commandé, et pour les bouteilles c'est
pas la livraison la question. »
**Problèmes.**
1. B — `cap12/v6-pilsner.png` : héros « Autre fournisseur, maintenant » pour une chose déjà commandée (C1).
2. B — `cap12/v6-bouteilles.png` : héros « Livraison ? » au lieu du vrai choix « quelle offre, avant le 15 » ; « 400 seulement » absent ;
   le bas (État ?) passe sous le champ.
3. B — le héros n'a pas la date : `cap12/v6-bar.png` (lundi), `v6-cave.png` (samedi 6 déc.), `v6-chaudiere.png` (demain 7h est
   deux rangées plus bas, sans « J-1 »).
4. m — icône de rangée en double avec celle de la pastille : `cap12/v6-assurance.png` (⏳ ⏳ 31 déc.), `v6-fete.png` (☐ ☐ Tireuse).
5. m — `cap12/v6-cave.png` : le héros répète le titre du carnet (« Ranger la cave »).
6. m — `cap/v6-ecoulement-geste.png` : l'Aide en pile recouvre le héros ; on perd « maintenant » pendant qu'on trie l'Aide.
**À greffer.** Tout le squelette : héros + rangées à repère + « n ↩ » + ⚖️ › ✋ › 📦 dans le coin du héros pour un achat.
**Note : 7/10.**

## Classement
1. **v6 (7)** — la seule qui dit quoi faire en 3 s sur presque tous les cas ; défauts de contenu du héros, pas de structure.
2. **v1 (6)** — la plus visuelle à la main, l'anneau ✓ ? est la meilleure jauge de problème ; casse dès 8 branches, pas d'entrée.
3. **v2 (6)** — gros chiffres et Aide en feuille excellents ; la taille ne suit pas l'importance, l'inconnu plein, 53 mots.
4. **v3 (5)** — meilleure table de comparaison, mais rejoue la frise et le halo.
5. **v5 (4)** — net, mais range des faits en « Fait » : valeur fausse et colonnes vides.
6. **v4 (4)** — l'idée du feu est bonne, mais la couleur ment dans 9 cas sur 12.

## À écarter (sous 6)
- **v3** : le genre même (chemin fixe) est la frise refusée (§ FRISE-GENERIQUE) ; garder sa table de comparaison et sa bulle.
- **v4** : le feu fixe ment ; garder la jauge hachurée et le code couleur porté par la pastille.
- **v5** : le kanban force des faits dans « Fait » ; garder le duel en barre.
- v1 et v2 restent au tour 2, à 6 tout juste : à 5 au tour 2, elles sortent aussi.

## Recette de la meilleure combinaison (mécanisme → source)
1. **Squelette** : héros « maintenant » (picto géant, verbe, ✓, ⏭, n ↩) puis rangées à repère → **v6**.
2. **Héros selon l'état** : problème ouvert → la prochaine action, avec l'anneau ✓n ?n en petit dans son coin → **v1** ; réglé →
   héros vert « ✓ Réglé : commandé 2 sacs » et le reste replié → neuf (C1) ; échéance / événement → « J-36 » en gros dans le héros → neuf
   (C2) ; achat → ⚖️ › ✋ › 📦 dans le coin → **v6**, et le héros pose la question du choix (« Quelle offre ? avant le 15 »).
3. **Date de la tâche** sous le verbe du héros (« lundi », « sam. 6 déc. ») → neuf (C4).
4. **Chiffre clé** : au plus 2 en grand, avec date ou unité dessous (1,2 bar le 15 → 0,4 bar le 22) → **v2** ; les autres en pastilles.
5. **Comparaison** : table critère × vendeur, case gagnante colorée, N colonnes, coût total et ⚠ quantité insuffisante → **v3**
   (table) + C5 ; à 2 vendeurs, la barre de duel 👑1 / 👑2 en tête → **v5**.
6. **Options** : nommées par leur titre, coût en attribut ; jauge hachurée seulement si ≥ 2 coûts connus → **v4** ; ★ conseillé IA
   visible.
7. **Couleur d'état** portée par la pastille elle-même (vert trouvé, jaune à vérifier, rouge bloque) → **v4**, sans colonne fixe.
8. **Formes** : rond = piste, carré = tâche, pointillé violet = proposition de l'IA → **v1**.
9. **Geste** : toucher → feuille de la ligne, mots surlignés, « Mes notes ↩ » → **v1** ; Aide en feuille typée ✓ ☐ 💡 avec ✕ ＋, qui ne
   cache pas le héros → **v2**.
10. **Nettoyage** : pas de doublon chiffre / coût (C7), pas d'icône de rangée répétée dans la pastille (v6 m4), « prix pro » présent (C6).

LEÇON PROPOSÉE : un rendu générique de réponses écrites à la main reprend les défauts du modèle commun dans les 6 variantes (C1 à C4) :
corriger `adapt.js` (état résolu, date de tâche, titre d'option, jours restants) avant de retoucher chaque variante.
