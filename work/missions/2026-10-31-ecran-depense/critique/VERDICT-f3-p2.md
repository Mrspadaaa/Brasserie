ACCEPTÉ — 0 bloquant ; 1 majeur et 4 détails à retoucher avant la page partagée (passe 2 de f3)

Critique Fable (portrait v2), 01.11 nuit. Les 36 captures de `voies/f3-rangees/captures/` ouvertes et regardées, 390 clair puis cave
(repos, malt concassé, houblon jaune, matériel, relié, bis, rouge d'unité, ligne ajoutée, papier), puis les 18 de 1280 ; maquette p3c-3 à droite.
Verdict de la passe 1 : `voies/f3-rangees/VERDICT-f3.md` (À REPRENDRE, 3 défauts, 5 détails). La passe a progressé : tout ce qui était demandé est fait.

## Les défauts de la passe 1, un par un

| Passe 1 | Passe 2 (capture) | État |
|---|---|---|
| 1 bloquant : le plateau ouvert était l'ancien formulaire (14 blocs) | `tactile390-clair-malt-concasse` : « imprimé « Carafa Spezial I®, Kg » · MA0301 » / « concassé, +0,10 par Kg, compris » / `[2] [Kg] × [2,4] = [4,8]` / « ✓ au centime » / Ingrédient · Service · Matériel / « article « Carafa Spezial I » · nouvel article ⇄ » / « fiche … approchée » / « plus ▾ ». 8 lignes, l'ordre de `p3c-3-geste-plateau`. Le matériel : la même chose plus sa seule liste « Fiche matériel ». Rien dit deux fois. | corrigé |
| 2 majeur : noms allemands | Banc fictif sans traduction (dit par le pilote) ; à juger au bout en bout doc14. | hors de cette passe |
| 3 majeur : ni relié, ni bis, ni rouge d'unité capturés | `relie` : Pilsner Malz, cube plein, plateau « article « Pilsner Malz » · proposé ⇄ Retirer +4 kg ». `bis` : Target bis, barre jaune « stock : Target α 11,8 [Target bis] ⇄ », comme la base. `rouge-unite` : Brauzusatz Probe en rouge « 3 ? × — », barre « imprimé 3 ? · g kg Stk », « 1 à remplir » au récap. | corrigé |
| 4 « Somme = imprimé » sur deux lignes | « ✓ Somme = imprimé 104,56 » sur une ligne | corrigé |
| 5 « · Qté × prix 9/9 lues » | « ✓ Qté × prix 12/12 » | corrigé |
| 6 « Payé le … » | « Payé · date ? », le « date ? » en rouge tirets, même chose dans le bandeau | corrigé |
| 7 « 80,46 » sans le port | « Ordre du papier 12 · 92,56 + port 12,00 » | corrigé |
| 8 le jaune d'unité sans geste au plateau | `houblon-jaune` : « unité g déduite · 85 × 0,05 = 4,25 : des grammes · à contrôler » puis `[g] kg Stk`, g pré-choisi | corrigé |
| « 0,00 + ? » jaune et rouge mêlés | « 4,50 + ? » tout en rouge (`ligne-ajoutee`) | corrigé |

Trois secondes au repos (390 clair et cave) : fournisseur, 104,56, « date ? » rouge, 12 lignes rangées par famille, « 1 relié · 7 nouveaux · 1 bis ·
3 hors stock », « 3 à contrôler » jaune, « 1 à remplir » rouge. Il comprend sans lire. Une rangée par ligne du papier, 39 px. Le ↳ sur les malts
concassés, aucun « Créer ». Le plateau ouvert couvre 30 % de l'écran (65 % avant). Ses six plaintes du 01.11 : tenues, sauf la traduction (à voir sur doc14).

## Défauts restants

### Majeur

**1. Un lien proposé par la lecture n'a pas son jaune sur la rangée, et le récap le dit en phrase** — `tactile390-clair-relie` (rangée Pilsner Malz,
plateau « · proposé ») et `tactile390-clair-repos` (récap, ligne « Lectures 2/2 · 1 proposée par la lecture, à vérifier », sur deux lignes à 390).
- La rangée de Pilsner Malz est marquée comme un relié sûr (cube plein, aucune couleur) ; le plateau dit « proposé » ; le récap compte « 1 relié » puis
  ajoute, en texte petit et coupé, « 1 proposée par la lecture, à vérifier ». Trois mots pour un état : il demandera « proposé ou relié ?? ».
- Règle : D277, « Pas sûr mais repris, flag jaune. Je contrôle » et « pas que pour les unités mais globalement pour tout » (SPEC 01.11) ; D1 (une phrase
  au premier plan là où la base a des pastilles : « 2 bis ④ ⑥ », « 1 unité ? ⑤ »).
- Correction : le picto de lien de la rangée en jaune pointillé (`data-dp-niveau="repris"`) tant que le lien est proposé et non confirmé ; au récap, une
  pastille jaune « 1 proposé » à côté de « 1 relié », et la phrase « 1 proposée par la lecture, à vérifier » disparaît ; au plateau, « proposé » reste,
  et un toucher sur ⇄ ou « Garder » le fait passer à « relié » (le jaune tombe, comme pour l'unité).

### Détails

**2. Le champ d'unité vide affiche « kg, g » tronqué** — `tactile390-clair-rouge-unite` et `ligne-ajoutee` (plateau, deuxième champ de la ligne de
calcul) : le texte d'attente « kg, g, Stk… » est coupé à « kg, g » et se lit comme une valeur. Correction : texte d'attente « ? » ou « unité », en rouge
tirets comme le reste de la rangée.

**3. Deux ⇄ pour un bis ouvert** — `tactile390-clair-bis` : « · nouvel article ⇄ » dans le plateau, puis « stock : Target α 11,8 [Target bis] ⇄ » juste
dessous. Le même geste deux fois sur 60 px. Correction : quand le plateau est ouvert, la barre jaune se fond dans la ligne « article » du plateau
(« article « Target bis » · nouvel article · stock : Target α 11,8 [Target bis] ⇄ ») ; la barre seule reste pour la rangée fermée (la base).

**4. Le texte d'attente de la date, « jj.mm.aaaa », et « Changer le mois, garder le jour » sous le plateau** — `tactile390-clair-materiel`, `rouge-unite`
(bas d'écran) : la carte « Date de l'achat » s'ouvre d'office avec son avertissement de deux lignes « À confirmer · Date absente ou illisible. Indique la
date de l'achat. ». La date est déjà rouge dans le bandeau et « Payé · date ? » : trois fois le même manque. Correction : la carte fermée au repos, ouverte
au toucher de « date ? » (D262b) ; l'avertissement en une ligne.

**5. « 4 Stk » sûr contre « 1 Stk » jaune dans la même famille** — `tactile390-clair-repos` : Hopfensack « 4 Stk » sans couleur, Kronkorken « 1 Stk » et
Candi Sugar « 1 Stk » jaunes. La règle de f2 (unité déduite d'une pièce de matériel) le justifie ; lui ne voit que deux Stk de couleurs différentes.
Pas un défaut à corriger : le dire sur la page partagée (« Stk déduit : jaune quand une seule ligne l'imprime »).

## Hors de l'écran, à dire sur la page
- 1280 : la planche colle la maquette mobile agrandie à droite du plateau (aucune maquette 1280 du plateau) ; l'écran 1280 lui-même est bon, plateau
  compact de 5 lignes.
- Cave : « Confirmer » et le segment choisi passent en ambre ; cohérent avec le thème, rien à redire.
- « Rattacher les 5 » et « +5 ↳ » de la base n'ont plus d'objet (le concassage est un état, pas une ligne) : écart justifié, à écrire dans RESULTAT.

## Phrase prédite
« Là on est bon, c'est la vue de base et c'est compact, le concassage en ↳ c'est exactement ça, et quand j'ouvre une ligne j'ai ce qu'il faut. Juste
proposé ou relié ?? faut que ça soit jaune si c'est pas sûr. Et la traduction on verra sur ma commande. »

Au repos : « vachement bien ». Après un toucher : « très bien mais » (le lien proposé). Reste à voir sur doc14 : les noms en français, et un vrai relié.
