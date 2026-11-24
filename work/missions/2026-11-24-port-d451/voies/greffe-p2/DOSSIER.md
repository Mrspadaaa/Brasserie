# Dossier greffe-p2 (voie 6)

Maquette : work/missions/2026-11-24-carnet-personas/maquettes2/v01.html (source src/v01.html), écrans `carnet`
(houblons), `carnet-froid`, `articles`, `fiche`, `comparer`, `comparer-sans`. Captures côte à côte :
maquettes2/cap/actuel-{carnet,carnet-froid,articles,fiche,comparer,comparer-sans}.png et v01-*.png correspondants.
Les écrans `liste`, `memo`, `probleme`, `recolte`, `idee` ne sont pas à toi (voies liste et probleme).

Ses mots (CLASSEMENT-1) : houblons « le tableau et la note » (B7 : 2 ou 3 caractéristiques, plus la note) ; matériel
« volume, température, prix » (B8) ; articles « J'aime bien l'idée, retiré à droite » (B9) ; fiche « la photo en tout petit
à la place de l'icône » (B10) ; Comparer avec critère : qui gagne quoi, compromis gagné / perdu (B11) ; sans critère :
différences d'abord, égaux repliés, « barre … en complément » (B12). SPEC : « Pas juste le prix, 2 ou 3 caractéristiques
principales ».

Ce que la maquette montre (texte extrait) :
- Carnet houblons : tableau « article · α · récolte · CHF/kg » ; « Selon la quantité · CHF/kg, rendu » (1 kg, 5 kg, 20 kg) ;
  « Arômes catalogue » en couleurs ; note rattachée à un article (« ⚠ rattachée à MotlerHops ») ; « Articles 2 · Comparer ·
  4 lignes diffèrent ».
- Chambre froide : « article · m³ · m² sol · CHF » ; ligne de contexte « 0 à 8 °C des deux côtés · TTC, port offert · rang :
  prix au m³ » ; critère « Prix au m³ · moins = mieux · proposé par l'IA » ; note « Place au local … les deux passent ».
- Articles : cartes avec α, dispo, conditionnement et prix ; glisser à gauche : Déplacer, Retirer (retiré à droite) ;
  « Conditionnement de Brau · le choix fait le prix » (au gramme, 1 kg, 5 kg, 20 kg et CHF/kg).
- Fiche : photo en tout petit à la place de l'icône ; α du lot, arômes ; tableau « je prends · prix · CHF/kg rendu » ; TVA
  d'import comptée, « port non lu » ; récolte, forme, origine, dispo ; sa note citée ; « ✓ Choisir · MotlerHops, 1 kg ».
- Comparer avec critère : « Prix au kilo, rendu · moins = mieux · 1 kg », rang ; « Côte à côte · le meilleur coché » ;
  lignes CHF/kg, α, récolte, dispo, vendu par, « identiques » repliés.
- Comparer sans critère : « L'IA propose : prix au m³ · Poser » ; « 5 diffèrent » d'abord ; « 18 identiques ▸ » repliés ;
  barres en complément ; « Écartés · 1 » repliés ; « ✓ Choisir la 4,06 m³ ».
Le sens métier a été vérifié par le critique (VERDICT § 2 : 40,69 € → ≈ 41 CHF/kg TVA d'import comprise).

Disparaît (PLAN n° 7) : le tableau « rang · article · CHF » au prix seul (TableauCarnet.tsx, `rangColonne`, en-tête CHF).
Gardé : prix HT / CHF / frais (D447), « dès » d'une offre seulement quand la page publie plusieurs prix, Escalader, Relire,
accord D450, veille « demandée · pas encore relevée ».

Pas de surapprentissage (B23) : les colonnes se choisissent par la catégorie et les caractéristiques lues (houblon : α,
récolte, CHF/kg ; autre : les 2 ou 3 qui distinguent, `rangDeDecision`), jamais par le nom « Citra » ou « chambre froide ».

Tests (Vitest, règles seulement) : colonnes d'un carnet houblons et d'un carnet matériel ; un 3e genre neuf (ex. fûts :
volume, raccord, prix) ; prix par quantité (1, 5, 20 kg) et inconnu absent ; égaux repliés et nombre « n diffèrent ».
