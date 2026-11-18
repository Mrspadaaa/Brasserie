OK — da accepté, avec des retouches : les 13 besoins sont couverts, le premier plan donne le choix et son pourquoi. 2 valeurs sont fausses : la dominance « partout » et le critère du frigo non classé.

# Critique · da « Fil de notes qui se range seul »

Relu par un regard neuf (Opus) le 16.11. J'ai lu CADRE, NOTE, PORTRAIT et SPEC (l. 1748 à 1793), ouvert les 16 captures claires et 2 sombres (repos, comparer), et lu `proto.src.html` (domine, choisir, ·vous). `gestes.mjs` rejoué : **GESTES OK** (17 contrôles).
Il n'y a aucune capture à 1280.

**Phrase prédite du brasseur** : « Là c'est vachement mieux : j'écris, je colle, ça se range, et le pourquoi est en haut. Mais Comparer c'est long, et pourquoi la meilleure barre est la plus petite ??? »

## Besoins

| # | Couvert | Comment |
|---|---|---|
| B1 | oui | Une ligne dans la liste, puis ↑ : le carnet est créé au statut *idée*. Testé avec « étiqueteuse », une catégorie neuve. |
| B2 | oui | Un seul champ « Écrire, ou coller un lien… » (avec photo et voix). Le fil est daté. Aucune structure n'est imposée. |
| B3 | oui | Une phrase qui nomme une façon la range en pastille. La tuile Façons retient ou écarte. Sur l'évier, l'IA peut chercher les façons. |
| B4 | oui | L'IA propose « En faire le critère qui oriente ? ». Le critère s'affiche ensuite sous le bandeau et encadre son tableau. Le frigo fait exception : son critère n'est pas classé (problème 2). |
| B5 | oui | 6, 5 et 4 articles, de fournisseurs et de pays différents (CH, DE, IT, FR, AT). |
| B6 | oui, avec des défauts | Un tableau par caractéristique, le meilleur en tête. Deux défauts : les barres sont inversées pour « moins = mieux » (problème 3), et le « partout » de la dominance est faux (problème 1). |
| B7 | oui | Puces × et +, « Ajouter » et « Proposer ». Le code n'a aucun gabarit : l'IA propose pour le frigo, la ventilation, l'évier et l'étiqueteuse. |
| B8 | oui | Le bandeau du choix est en tête du carnet. La feuille Choisir prend le pourquoi en une ligne, les écartés et un « à revoir si ». Dans la frise ADR, la décision remplacée reste barrée. On peut demander « Pourquoi ce fournisseur ? ». |
| B9 | oui | Une carte par carnet : titre, statut en 4 points, choix et pourquoi, ou la prochaine étape. Aucune caisse ni prix au premier plan. Le titre de la ventilation est coupé (problème 5). |
| B10 | oui | « Vérifier la disponibilité maintenant », « Proposer », « Chercher », « Redonner à l'IA ». Tout est facultatif et marqué « exemple ». |
| B11 | oui | Un lien collé affiche un chargement, puis la carte (photo, nom, prix, fournisseur, pays, stock). Un lien sans aperçu donne une carte avec Compléter et Redonner à l'IA. |
| B12 | oui | Une bascule par carte et dans la fiche, « tous les 3 jours : stock ici et chez d'autres, baisse de prix ». On voit « Aussi chez … (AT) ». L'alerte est un point « −600 CHF » sur la ligne du carnet. En revanche, la baisse est invisible dans la fiche (problème 4). |
| B13 | oui, avec un écart | 4 carnets sont joués, plus une catégorie neuve. Un exemple propre à l'embouteillage traîne dans Choisir (problème 7). |

## Touchers (depuis la liste des carnets ; saisie au clavier non comptée)

- **Noter une recherche : 3.** Carnet, champ, ↑. Depuis l'intérieur du carnet, 2.
- **Ajouter une solution (lien) : 5.** Carnet, champ, appui long, Coller, ↑. Une façon dite par une phrase prend 3 touchers.
- **Comparer : 2.** Carnet, puis la tuile Comparer.
- **Choisir avec son pourquoi : 4 à 5.** Carnet, Articles (ou la carte du fil), fiche, « Choisir celui-ci », « Garder ce choix ». Le pourquoi est pré-rempli ; le corriger demande 1 toucher de plus et la saisie.
- **Retrouver le pourquoi plus tard : 0.** La ligne de la liste le dit déjà. Le détail en demande 2 (carnet, Décisions), la question à l'IA 3.

## Notes /10

- Besoin : **8,5**
- Brasseur : **7,5**
- UX/UI : **7,5**
- Fluidité : **7,5**

## Problèmes (17)

### Valeurs fausses

1. **Le « partout » de la dominance est faux** (Comparer, embouteillage et frigo).
   - « Iso 2 becs : moins bien que Iso 4 semi-auto partout, sauf prix » est faux : le CO₂ est égal (5 g contre 5 g) et l'encombrement est plus petit (60×40 contre 90×60). Ce dernier est ignoré parce qu'il est stocké en texte.
   - « Vitrine occasion … partout » est faux aussi : la plage, la consommation et le bruit sont inconnus. `domine()` saute les « ? » et dit quand même « partout ». C'est contraire à la règle d'honnêteté du PORTRAIT : l'inconnu ne compte jamais.
   - Correction : ne dire « partout » que si toutes les caractéristiques actives sont connues et pires ou égales. Sinon, nommer ce qui est comparé (« moins bien sur volume, fûts et porte ; 3 inconnues »). Passer l'encombrement en nombre (surface au sol, moins = mieux).
2. **Le critère du frigo n'est pas classé.** « Plage de température » est le critère qui oriente, mais elle est en texte « à lire » : pas de meilleur en tête, pas de vert, et elle sort de la dominance. Le critère qui doit trancher ne tranche rien.
   - Correction : une caractéristique classable, « Tient 2 °C en été » (oui / non / ?) ou « Température mini tenue (°C), moins = mieux », proposée par l'IA quand le critère est posé.
3. **Les barres « moins = mieux » se lisent à l'envers.** Le meilleur a la barre la plus courte : 40 ppb donne une barre verte minuscule, 220 ppb une barre grise pleine. En trois secondes, la longueur dit l'inverse du classement.
   - Correction : une barre d'atout (longue = meilleure) pour tous les sens, avec la valeur brute à droite.
4. **La baisse de prix est invisible dans la fiche.** Dans la fiche de l'article (Iso 4 CH), les barres de l'historique partent de zéro : de 12 300 à 11 700 (−5 %), elles ont la même hauteur. Rien n'écrit la baisse à côté du prix « 11 700 CHF ».
   - Correction : une pastille « −600 CHF depuis le 10 nov. » à côté du prix, et une mini-courbe à axe resserré.
5. **Sens métier : la capacité du frigo est implausible.** Le tableau « Fûts de 20 L, plus = mieux » donne 6 fûts pour 2 000 L utiles et 8 pour 2 500 L, soit 6 % du volume. Une chambre de 2 m³ prend 20 à 30 fûts de 20 L. La donnée vient de la fixture et du CADRE.
   - Correction : 24 et 30 fûts. Ou bien, si « 6 fûts » est son besoin, une caractéristique « Loge mes 6 fûts » (oui / non).

### Premier plan et lisibilité

6. **Le titre de la ventilation est coupé** sur la liste : « Ventilation de la salle de … ». « De quoi on parle » est tronqué au premier plan (B9).
   - Correction : titre sur 2 lignes, statut passé sous le titre.
7. **Un exemple propre à l'embouteillage traîne dans Choisir** (ventilation) : le champ « À revoir si » propose « ex. le volume dépasse 1 000 L par mois » (B13).
   - Correction : un exemple tiré de la catégorie, ou un exemple générique (« ex. si le prix baisse de 20 % »).
8. **Le premier plan est en jargon.** La liste et le bandeau écrivent « Iso 4 pré-év. », alors que la ligne doit dire de quoi on parle.
   - Correction : « Isobarique 4 becs (pré-évacuation) » sur la liste et le bandeau ; les noms courts restent dans les tableaux.
9. **Ventilation : 5 articles annoncés, 4 comparés.** « Ensuite : 5 articles à comparer », mais Comparer dit « 4 articles » : le lien sans aperçu disparaît des tableaux sans trace.
   - Correction : le garder en fin de chaque tableau, avec « ? » et Compléter.
10. **La puce « Passe une porte de 80 cm ·vous » se lit mal** : on lit « vous » collé au libellé.
    - Correction : une petite marque « à vous » (crayon), ou une puce de bordure pleine.
11. **Le critère de la ventilation est ambigu** : « plus de condensation au plafond » peut se lire « davantage de condensation ».
    - Correction : « zéro condensation au plafond » (fixture).

### Gestes et disposition

12. **On ne choisit pas depuis la comparaison.** Le seul « Choisir » est dans la fiche : il faut revenir à Articles, puis à la fiche (4 à 5 touchers). C'est pourtant dans les tableaux qu'il décide.
    - Correction : toucher une ligne du tableau ouvre la fiche, avec « Choisir celui-ci ».
13. **Le fil, cœur de l'approche A, commence sous la ligne de flottaison** (≈ 1 150 px sur 1 688 à 390). Il est poussé vers le bas par le bandeau, le critère, 4 grandes tuiles et le champ.
    - Correction : les 4 tuiles en une rangée de pastilles compactes (le NOTE parle de « pastilles »), le fil remonté.
14. **Des outils de démo ressemblent à des boutons de l'app.** Les pastilles pointillées « à jouer » (« coller un lien d'article », « lien sans aperçu ») sont posées au-dessus du fil.
    - Correction : un panneau « démo » replié, hors du carnet.
15. **Le + volant masque la colonne des valeurs** dans Comparer : « 400 » est caché sous le +, en clair comme en sombre.
    - Correction : une marge basse de 96 px, et la colonne des valeurs décalée pendant le défilement.
16. **Sur l'évier, la tuile Comparer est mise en avant pour rien** : elle est bleue (« 5 caractéristiques »), alors qu'il n'y a aucun article.
    - Correction : une tuile atténuée, « 5 caractéristiques prêtes · 0 article ».
17. **Les prix ne sont pas écrits pareil** : « 11700 CHF » sans espace dans « Caractéristiques lues », contre « 11 700 CHF » au-dessus.
    - Correction : même format partout.

### Doutes (non comptés)

- Les propositions de l'IA dans le fil (« Oui, critère / Juste une note », « Écarter Gravité / Garder les deux ») sont facultatives. Mais deux boutons noirs par note peuvent lui rappeler les étapes refusées de ky et kz (« trop contraignant »). À voir sur sa réaction.
- Il manque les captures à 1280 et l'état « veille : rupture chez ce fournisseur, dispo ailleurs » (cas du frigo, CADRE).
- L'emplacement (Finances › Matériel › Carnets) et la forme de l'alerte restent des choix ouverts, à montrer en variantes avec db et dc (L24).

LEÇON PROPOSÉE : une marque de dominance (« moins bien partout ») ne s'affiche que si toutes les caractéristiques actives sont connues et comparables ; une valeur inconnue ou stockée en texte la rend fausse.
