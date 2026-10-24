OK — quatre jeux de pictos hors 16D (code, contenant, clef, un seul trait) posés dans les vraies cartes

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-pictos-hors16d/phz1/etat.html`, `phz1/NOTE.md` — Code : deux lettres dans une étiquette au trait (tiède)
- `…/phz2/etat.html`, `phz2/NOTE.md` — Contenant : l'objet tel qu'on le tient (tiède)
- `…/phz3/etat.html`, `phz3/NOTE.md` — Clef : la seule forme qui nomme, deux ou trois traits (chaude)
- `…/phz4/etat.html`, `phz4/NOTE.md` — Un seul trait : chaque objet d'un fil continu (chaude)
- Captures (390 × 844, ×2) : `…/captures/phz{1..4}-planche.png`, `phz{1..4}-carte.png` (Comparer Nelson Sauvin / Citra cryo / Target,
  courte puis textuelle, légende en pied), `phz{1..4}-galaxy-saaz.png` (Galaxy face à Saaz (CZ), courte et textuelle, barre huile),
  `phz{1..4}-fiche.png` (bandeau et matrice de flb5b, Nelson Sauvin, courte avec légende dépliée, puis textuelle).
- Scripts et DOM extraits dans `os.tmpdir()` seulement (gen.mjs, jeux.json, regles.css, *-dom.json). `git status` : rien hors du périmètre.

## Critères
- G1 : `JEUX-BIEN-4` (16 `data-mot` par jeu dont `en-plus`, `data-role="legende"` et `"precis"`, chaleur dans chaque NOTE, deux captures).
- G2 : `TRAIT OK` (phz1 136, phz2 152, phz3 136, phz4 152 pictos de famille visibles, 0 faute).
- `controle-panel.mjs` sur les planches : `PANEL OK` (remplissage médian 0,64, ressemblance 0,88, 0 paire identique) ; sur les cartes :
  `PANEL ECHEC` (ressemblance 0,94) par construction : la carte ne doit pas changer d'un jeu à l'autre (« Que ce soit bien intégré »).

## Comment c'est fait
- Les cartes sont le vrai DOM de la maquette jouable, rendu par son moteur sur les routes `#/comparer?h=nelson-sauvin,citra:cryo,target`,
  `#/comparer?h=galaxy,saaz-cz` et `#/fiche/nelson-sauvin`, puis figé en page statique avec le CSS de l'app (thème clair). Les mots sont ceux
  de l'aria-label « lui seul » du moteur et de `pack-fiches.json` ; l'huile est le total des fiches (Galaxy 1,8–5, Saaz 0,3–1 mL/100 g).
- Version courte : pictos blancs de 16 px dans la pastille noire « lui seul », picto de famille (12 px, sa couleur) pour un mot précis,
  qualificatifs en texte pâle, « +n ». Version textuelle : la pastille comme aujourd'hui avec le picto devant, et sous les familles un bloc
  `data-role="precis"` (« pamplemousse +1 », « fruit de la passion +1 », « pêche » ; Saaz : « citron », « herbe »).
- Place : pastille de 19 à 22 px (phz1 : 28 px, étiquettes de 22 px pour tenir 12 px de texte) ; la textuelle ajoute 1 à 3 lignes de 12 px
  par colonne précisée ; bandeau de la fiche inchangé. Les ajouts du pilote : Galaxy face à Saaz dans chaque jeu, et « on voit comme il faut
  les différence » par la barre « huile » sous la pastille (45 px contre 9 px), sur le modèle de la barre « autres » déjà dans la carte.
- Légende : pied de la tête de Comparer (12 px) et légende du « ? » de flb5b ; les NOTE disent où elle irait ailleurs (D89, u4, D113).

## Prédiction
Il garde l'intégration (« ça gêne pas ») et la barre huile pour Galaxy / Saaz, prend phz2 ou phz3 pour les objets qui se nomment (verre,
tasse, bocal, grain de café, grappe de points), refuse phz1 (« pas parlant ») et dira que cannabis, miel et gingembre sont « toujours pas
bon » dans tous les jeux : à reprendre en passe 2 avec les greffes du critique.

DÉCISION À PRENDRE : la version courte montre un mot précis par le picto de sa famille seul (le mot au toucher) ; si le brasseur veut le mot
précis lisible au premier écran, c'est la version textuelle (1 à 3 lignes de plus par colonne) ou un nouveau genre (initiale du mot sous le
picto de famille).

CONNAISSANCE : la maquette jouable accepte des routes directes (`#/comparer?h=a,b,c`, `#/fiche/<clé>`) rendues par le moteur depuis
`file://` ; une voie peut en figer le DOM pour poser un ajout dans la vraie carte sans rien inventer (vu ici : « lui seul » de Saaz contient
citron et herbe d'après Hopsteiner, pas seulement doux et noble).
LEÇON PROPOSÉE : aucune.
