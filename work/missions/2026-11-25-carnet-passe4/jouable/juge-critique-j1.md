OK — 33 problèmes, 7 bloquants

# Juge critique (portrait) : jouable passe 4, tour 1

Version : jouable/p4.html, commit 0ab4212c9, 60 captures 390 × 844 en sombre, toutes ouvertes (Read). Ni 1280 ni thème clair : le contrat
n'en demande pas. Contrôles de mes règles dures : ORGANISE-TROP-TEXTUEL tenu (≤ 30 mots, un repère visuel par bloc) ; FRISE-GENERIQUE tenu
(avancement selon le genre : ●●● comparé, 36 j, ≈ 96 j, « Début dans 157 j », rien sur un mémo) ; ENTETE-PEU-UTILE tenu (info utile à 52 px) ;
CARNET-LISTE-COMPACTE tenu (14 lignes, et le domaine se replie sous filtre, 04). Valeurs vérifiées contre les notes des exemples dans p4.html
(Verallia 0.42, budget 1 500, 14 °C au lieu de 2, 2 sacs × 4 CHF, reset 10 min, jeudi) : aucune n'est inventée.

Note de l'écart (portrait § 7) : lisibilité ≈ 7,5, besoin ≈ 7,5, on garde la plus basse, moins 0,5 → **7/10**. **Répond au besoin : oui**,
comme direction : un TDAH visuel lit l'essentiel en 3 secondes. Pas encore à porter tant que les 7 B restent.

Phrase prédite du brasseur : « Là c'est vachement mieux, ça se lit d'un coup d'œil. Mais pourquoi il y a toujours des grands vides en bas ?
Et le citra c'est le même houblon, pourquoi les arômes c'est "?" d'un côté ??? »

## Par écran et par geste

**Liste (01 à 06, 51).** Avis : compacte, l'arbre et les sous-domaines sont là, chaque ligne porte un chiffre clé. Le filtre et le repli
marchent, « Ranger dans » se fait d'un toucher avec Annuler. Marche : 14 lignes, coup d'œil en 4 cases gardé, compteurs cohérents après
la correction de la chaudière (51 : 3 décidés, 9 notés). Problèmes : m1, m2, m3, m4, m5, B1.

**À faire (07 à 10).** Avis : la décision sur place (🔧 480 / ❄️ 1 200) et Annuler marchent, cocher marche. Marche : regroupement Bientôt /
Sans date, carnet d'origine sous chaque tâche. Problèmes : m6, m7, m8, B1.

**Organisé « problème » (écoulement : 21 à 34, 61).** Avis : c'est le meilleur écran. Tuiles ✓ / ?, face à face toi / sanitaire X,
« 150 CHF estimé » en pointillé, « prix du joint ? Noter » et une action pleine sous le pouce. Marche : jeton → ligne surlignée → « Revenir à
« joint » » (20, 21) ; Retenir + Annuler (22, 23) ; Fait + Annuler (24) ; Aide Garder / Non merci (25 à 28) ; « + » (29, 30) ; Noter
pré-rempli (31) ; menu ⋯ et feuille « Changé par l'IA », une case par changement (33, 34). Problèmes : B2, B7, m9, m10, m11, m12, m13.

**Décider (frigo : 40 à 42).** Avis : très clair. Barres proportionnelles (480 / 1 200 = 0,4, hauteurs justes), « 720 CHF d'écart » avec le
calcul à un toucher, Retenir sous le pouce avec l'échéance. Problèmes : B7, m6, m14.

**L'IA se trompe (chaudière : 43 à 46).** Avis : la correction est lisible (« Noté → Décidé, mis par l'IA, coupe pour revenir », « 1 citation
retirée »). Après la coupure, l'état revient à Noté. Problèmes : m3, m15, m16.

**Achat (citra 47, 48 ; 600 bouteilles ; vapeur).** Avis : la jauge ✓ n ▮▮▮ ? n et les cases hachurées disent honnêtement ce qui manque.
Écarter, choisir et Annuler marchent, et la colonne écartée reste rappelable (↺ MotlerHops). Problèmes : B4, B5, m4, m17, m18.

**Échéance, événement, planning (assurance 49, fête, embouteillage).** Avis : le compte à rebours gradué est parlant (36 j au 31 déc., le
calcul est juste depuis le 25.11) ; la liste 1/3 se coche. Problèmes : B1 (49), B7, m19, m20.

**Mémo (bar du Centre, ranger la cave).** Avis : sobre et juste. Deux manques à Noter, une action datée. Problèmes : B7, m7.

**Relecture (malt 50, levure lente, pompe).** Avis : POURQUOI en tête, puis ce que tu savais → ce que tu as fait, et « +8 CHF = 2 × 4 CHF ».
Le métier est juste : levure à 16 °C lente, montée à 19 °C ; pompe qui chauffe contre une vanne mi-fermée. Problèmes : m21.

**Autres cas (CO2, soufre, inspection, sureau, levure récoltée).** Avis : le métier est juste (H₂S d'une lager à J+5 « souvent normal : ça part
pendant la garde » ; fusible 5×20 mm 6,3 A ; sureau infusé à chaud ou à froid, fleurs fin mai). Problèmes : B6, B7, m16, m22, m23.

**IA en erreur et hors ligne (60 à 63).** Avis : le cas d'erreur montre ce que l'app lit seule, avec « Réessayer » sous le pouce ; la note
tapée hors ligne est gardée (badge 1). Problèmes : B2, B3, m24.

## Problèmes

### Bloquants (7)
- **B1** Un toast passe d'un carnet à l'autre : « Rangé : Brasserie » s'affiche sur À faire (07), « Choisi : MotlerHops » sur l'assurance (49).
  Toucher « Annuler » défait alors en aveugle un geste fait ailleurs. Le passage en fait un mineur ; je le compte bloquant, parce que ce geste
  agit sans qu'on voie sur quoi (L12). Correction : fermer le toast quand on change de carnet ou d'onglet.
- **B2** Une note ajoutée ne change rien dans Organisé. 32 : « prix du joint : 6 CHF au magasin » est noté, mais la case toi reste « ? » et
  « prix du joint ? Noter » reste. 63 : au retour du réseau, « Starter lancé ce soir » est lu, mais « Faire un starter » reste à cocher. Le
  geste n'a pas d'effet visible. Correction : rejouer une réponse mise à jour (toi = 6 CHF, question retirée ; starter coché), ou laisser la
  lecture locale remplir le prix noté.
- **B3** Hors ligne, l'Organisé déjà lu disparaît (62 contre org-levure-recoltee). 3e génération US-05, 12 jours au frigo, odeur ✓, mousse ✓ et
  « Faire un starter » sont remplacés par « Rien que l'app sache lire seule ». Valeur absente, alors qu'à la cave il n'y a souvent pas de
  réseau. Correction : garder la dernière lecture, poser le bandeau Hors ligne au-dessus, et la note en file en plus.
- **B4** Citra (47, 48, org-houblons-citra) : les arômes et l'origine sont rangés par fournisseur. Pour la même variété, on voit 🍋🥭🌴 d'un
  côté et « ? » hachuré de l'autre, et « US » deux fois. C'est faux en brasseur : les arômes sont ceux de la variété. La greffe du tour 2
  (« arômes et origine une fois, au-dessus ») n'a pas été faite. Correction : une ligne Variété au-dessus du tableau (🍋🥭🌴 · 🇺🇸) ; le tableau
  ne garde que ce qui vient du lot (α du lot, prix, stock).
- **B5** 600 bouteilles : la couronne 👑 est posée sur « 0.20/bt » d'Occasion. Or son total est « ? », elle n'a que ≤ 400 bouteilles pour 600
  voulues, et elles sont « à laver ». La recette dit « jamais de couronne face à un inconnu ; comparaison qui gagne quoi » : la valeur
  trompe. Correction : pas de couronne, ou la couronne sur le seul total complet pour 600 (B, 410 CHF), marqué « pour 600 ».
- **B6** Soufre (org-odeur) : la carte en tête cite « « fût.EST — ranger la cave » ». C'est une ligne cassée de l'exemple (« …mise en
  fût.EST — ranger la cave »). Elle n'a ni sens ni geste et prend la place de l'info utile : texte illisible. Correction : réparer la ligne de
  l'exemple. Dans le rendu, une ligne douteuse passe en petit sous J+5, avec le geste « Déplacer vers Ranger la cave ».
- **B7** Grands vides entre le contenu et le pouce : 35 à 60 % de l'écran est noir (21, 40, 43, CO2, embouteillage, sureau, bar, assurance,
  ranger). Déjà prédit au tour 2 (« pourquoi il y a des grands vides en bas ? ») ; un mineur revu deux fois devient bloquant (L12), et pour lui
  le dense utile bat le vide (portrait, erreur 2). Correction sans ajouter de mots : agrandir le visuel. Par exemple, une mini-courbe
  1,2 → 0,4 bar pour le CO2, une frise d'embouteillage plus haute, des tuiles plus grandes, des barres de décision plus hautes. Ou bien
  coller l'action sous le contenu.

### Mineurs (26)
- **m1** En-tête Brasserie (01, 06, 51) : les sous-domaines sont coupés (« · C ») sous la pastille ▸ ✓ 3.
- **m2** Liste (01) : textes coupés en plein mot : « Vérifier le prix Brau », « Bar du Centre veut nos bi… », « Chaudière en panne jour de brass… ».
- **m3** Chiffre clé muet : la chaudière affiche « 10 min » dans la liste. L'urgent, c'est le brassage demain à 7h, qui n'est en héros ni dans la
  liste ni dans Organisé (43), alors que l'assurance à 36 j a son grand compte à rebours.
- **m4** Nombres : « 4.5% » (liste, sureau) et « 0.42/bt · 0.55/bt · 0.20/bt » (600) gardent le point, alors que « 13,6 % » prend la virgule.
  La monnaie manque sur le prix à la bouteille.
- **m5** Ranger dans (05) : domaines et sous-domaines sont en vrac sur une même grille (« › Froid » à côté de « Local ») ; « un toucher suffit » ne sert à rien.
- **m6** ❄️ veut dire « neuf » pour le frigo (07, 40) : les deux options font du froid. Le bouton de Retenir n'a que l'icône. Mettre 🆕 ou le mot « Neuf ».
- **m7** Redite « Ranger la cave / Ranger la cave » (07, 10 ; pouce d'org-ranger).
- **m8** Frise À faire (07, 10) : icônes empilées, la cave cache la vapeur puis le CO2 (10). La fête est coupée au bord droit, et aucune graduation entre auj. et 1 mars.
- **m9** ✦ flotte entre « toi » et « sanitaire X » (21) ; on ne sait pas à qui il s'applique avant Retenir (même chose entre technicien et jeudi, 43).
- **m10** La ligne ⏳ porte « devis » (21) : ce n'est pas un délai.
- **m11** Aide (25 à 27) : une légende est écrite au repos en bas (« ✓ vérifier · ☐ tâche · 💡 suggestion : rien n'est posé… ») ; puis
  « ✓ check » en anglais dans À faire (27, 28).
- **m12** « bonde bouchée » a pour picto une main qui écrit ✍️, ce n'est pas l'objet (29). La tuile « + » passe seule sur une 2e ligne et
  ajoute 210 px.
- **m13** Après « retenir toi » (22), le pouce garde « Contacter l'entreprise X » : la prochaine action ne suit pas la décision.
- **m14** Frigo (40) : Réparer est en vert et Neuf en bleu. Le vert se lit « conseillé », alors que la recette dit « aucun côté mis en avant ».
- **m15** Citation de la chaudière (43, 46) : le réveil est collé à gauche, le texte centré, et « » » reste seul sur une 3e ligne (reste 2 du passage).
- **m16** « Décidé » sans décision visible (CO2, soufre).
- **m17** Citra : « poids .fr ? » est cryptique ; « 3,72 € » n'a ni poids ni CHF ; « 10 % - 15 % » est espacé (rappel de « 10  -  15 »,
  CARNET-SES-DONNEES-EXISTANTES) ; ⚠ « dur à obtenir » n'est posé sur aucune colonne ; le ✓ est doublé dans l'en-tête et le bouton (48) ;
  👀 hachuré et ? hachuré se confondent.
- **m18** Vapeur : la pastille « comparé » est jaune ici et bleue ailleurs, avec une puce jaune « décidé » dans la liste. Le mot est
  « condenser » (anglais) ; le même ♨️ sert aux deux marques.
- **m19** Embouteillage : « 01.05.2027 » s'affiche sous le bord gauche (aujourd'hui), alors que la barre bleue commence à 72 % : la date est mal placée.
- **m20** Fête : « 💰 1 500 CHF » ne dit pas que c'est un budget (ses notes : « Budget 1 500 »), alors que l'embouteillage garde « budget ».
- **m21** Relecture : 🧠 seul en tête de colonne est une icône muette (malt, levure lente, pompe). La tuile « date ? » (levure lente) ne dit pas de quelle date il s'agit.
- **m22** CO2 : « 0,4 bar le 22 » vient avant « 1,2 bar le 15 nov. », donc la baisse se lit à l'envers, et les formats de date diffèrent.
- **m23** Inspection : une prise 🔌 sert de picto au fusible, et la tuile « fusible ✓ » redit la puce « 5×20 mm fusible ».
- **m24** IA en erreur et hors ligne (60, 62) : « 🧩 ☐ ✦ avec l'IA » est une rangée d'icônes muettes. « pas trouvé » n'a pas d'objet
  (pas trouvé quoi ?).
- **m25** Toasts posés sur le contenu : ils cachent une ligne ou un libellé (06, 08, 10, 24, 29, 47, 50 : « Bon choix ? » caché).
- **m26** Mes notes (20, 30) : le titre « ZZ TEST — écoulement qui fuit » diffère d'Organisé, et la date d'en-tête passe de « mar. 24 nov. 21:26 »
  à « mer. 25 nov. 22:14 » après un ajout. Création ou modification : ce n'est pas dit.

### Doutes (non comptés)
- Le compteur ✦ baisse (2 → 1) après Retenir ou Fait (22, 24), sans explication.
- « Chiffre d'affaires 2026 » pour l'assurance : on fournit d'habitude l'exercice clos (2025) ; à voir dans ses notes.
- 504 CHF (1 200 bouteilles, minimum Verallia) contre 410 CHF (600) : ce sont des débours honnêtes, mais pas pour la même quantité.
- « Mémo » pour la demande du bar : c'est plutôt une opportunité client.
- Après Retenir sur le frigo (41), rien sous le pouce : c'est voulu (« pas de tâche fantôme »), mais la règle dit « prochaine action sous le pouce ».

## Corrections, B d'abord
1. B1 : fermer le toast au changement de carnet ou d'onglet.
2. B2 : une note ajoutée met Organisé à jour (prix du joint → case toi ; starter → coché).
3. B3 : hors ligne, garder la dernière lecture et ajouter le bandeau et la file.
4. B4 : une ligne Variété (arômes, origine) au-dessus du tableau citra ; le tableau = le lot.
5. B5 : pas de couronne face à un inconnu ; « pour 600 » sur les totaux.
6. B6 : réparer la ligne « fût.EST » de l'exemple ; une ligne douteuse passe sous l'info utile, avec un geste.
7. B7 : combler les vides par du visuel plus grand (courbe CO2, frise, tuiles, barres), sans ajouter de mots.
8. m3 et m15 : « demain 7h » en héros sur la chaudière et comme chiffre clé dans la liste ; citation alignée.
9. m4 : virgule décimale et monnaie partout (« 0,42 CHF/bt », « 4,5 % »).
10. m6, m12, m21, m23, m24 : pictos de l'objet (🆕 ou « Neuf », bonde, fusible) ; 🧠 et « 🧩 ☐ ✦ » remplacés par un mot court ou retirés.
11. m8 : frise À faire sans chevauchement (pile verticale ou décalage), graduations par mois.
12. m1, m2 : sous-domaines et chiffres clés sans coupe en plein mot (ellipse sur un mot entier, ou 2 lignes).
13. m9, m10, m13, m14, m16 : ✦ posé dans la colonne qu'il conseille ; « devis » sur la ligne 💰 ; le pouce suit la décision ; couleurs neutres
    sur Décider ; « Décidé » seulement avec la décision visible.
14. m11, m17, m18, m19, m20, m22, m25, m26 : légende de l'Aide derrière ⓘ, « vérifier » au lieu de « check » ; libellés citra (« poids ? »,
    CHF/kg, « 10–15 % », ⚠ sous sa colonne) ; couleur de « comparé » fixe, « condenseur » ; date de l'embouteillage sous le début de la barre ;
    « budget » sur la fête ; CO2 « 1,2 → 0,4 bar » ; toasts au-dessus du pouce sans couvrir ; titre et date de Mes notes alignés sur Organisé.

LEÇON PROPOSÉE : un jouable à réponses IA rejouées doit aussi rejouer la réponse après chaque geste qui ajoute une note (Noter, + hors ligne),
sinon le geste paraît sans effet ; et un état hors ligne se juge à côté de la capture en ligne du même carnet.
