# Audit p5 face à da (16.11)

Trois regards indépendants. p5 et da joués avec puppeteer-core à 390×844 tactile (clavier simulé de 300 px) et à 844×390 (clavier de 180 à 200 px). 15 écrans, toutes les planches côte à côte ouvertes.
Preuves : `%TEMP%\carnet-audit-p5\`, `%TEMP%\ux-p5\`, `%TEMP%\carnet-p5-da\` (scripts, journaux, planches).
Règles : SPEC 16.11 (« un seul champ ; l'IA propose le critère », « Ca semble pas fini », « Da semble globalement meilleure »), PORTRAIT § 7.
Aucun des deux ne gère le clavier : ni visualViewport, ni interactive-widget dans la balise viewport.

## Inutilisables (au moins deux regards sur trois)

- **Évier** (3/3). Pourquoi : une seule ligne sur un écran vide à 80 %. Ni façons, ni caractéristiques, ni champ. Le critère proposé par l'IA ne vit que dans un toast, disparu à +6,5 s. C'est une impasse.
  Correction : reprendre l'état idée de da. D'abord la carte fixe « ✦ Je peux chercher les façons courantes… Chercher / Plus tard », puis les caractéristiques proposées (bacs, matière, profondeur, douchette, prix) et le champ unique. Le critère proposé devient une carte du journal « Oui, critère / Juste une note », jamais un toast.
- **Noter** (2/3). Pourquoi : il faut 3 touchers (+, Écrire, Ajouter). On écrit dans un écran plein qui cache le carnet. En paysage, Ajouter passe sous le clavier. Après l'envoi, ni « rangé : … » ni proposition de critère durable. Il préfère le champ unique de da : les deux autres sont « horribles ».
  Correction : supprimer le panneau Note. Mettre le champ unique de da dans le carnet (texte, lien, photo, micro), avec envoi en 1 toucher. Deux options : dans le fil, où il est mesuré visible au-dessus d'un clavier de 300 px, ou fixé en bas et remonté par visualViewport, avec la barre d'onglets et le + masqués pendant la saisie. Après l'envoi : la puce « ✦ rangé : … », puis la carte « En faire le critère qui oriente ? ».
- **Comparer à 390** (2/3). Pourquoi : on ne lit que 2 colonnes sur 7. La 3ᵉ est coupée en demi-chiffres (« 4 », « ? »), ce qui fait cassé, et rien ne dit qu'on peut glisser. Le + recouvre les lignes du bas. Dans Écartés, une valeur est surlignée en vert comme celle du choix.
  Correction : en portrait, prendre les tableaux par caractéristique de da (critère en tête et encadré, meilleur en premier, barre depuis zéro). Ajouter, Proposer et « Lien sans aperçu · Compléter » restent visibles. Greffer la typo de p5 (15 à 18 px). Écartés en gris sous chaque tableau, sans vert. Garder le tableau complet de p5 en paysage.
- **Carnet neuf (Étiqueteuse)** (2/3). Pourquoi : 70 % de l'écran est vide. La rangée « ✦ À comparer » est coupée au bord. Aucune suite proposée : ni façons, ni liens, ni critère. Une fois tout gardé, on retombe sur l'impasse d'Évier, et le titre perd « semi-auto ».
  Correction : reprendre l'état neuf de da (« Idée · Déposez ce que vous trouvez », le champ unique). Caractéristiques proposées en puces sur plusieurs lignes (flex-wrap), carte « Ensuite : Coller un lien · Chercher les façons ». Garder le titre tel que dit.

## Faibles (un seul regard les rejette, ou défaut net)

- **Carnet ouvert** (rejeté par 1/3) : ni champ ni critère qui oriente, journal replié, 45 % vide. Correction : ligne « ★ Oxygène, moins = mieux », pourquoi entier, champ unique.
- **Frigo** (rejeté par 1/3) : journal réduit à « 3 notes, 1 décision, 1 alerte ⌄ », avec l'alerte cachée, et 75 % vide. Correction : ne jamais replier une alerte, déplier la décision.
  Donnée : « assez pour 6 fûts » contre 30 fûts dans Comparer. Écrire « besoin : 6 fûts · capacité 30 » (à vérifier dans la fixture).
- **Journal** : notes repliées par défaut, ligne « ✦ rangé : façon X » de da perdue. Déplier les dernières (variante `&journal=apercu`) et remettre la ligne IA en 15 px au moins.
- **Pourquoi** : écartés repliés alors que la place est libre, et plus de question libre. Les déplier s'il y en a 4 au plus, et remettre le champ « Demander… » avec ses 3 puces.
- **Caractéristiques, Autre** : le formulaire Nom, Unité, sens a Unité et Ajouter sous le clavier. Le remplacer par le champ unique : l'IA déduit l'unité et le sens.
- **Lien collé, À la main** : Fournisseur et Garder sous le clavier, valeurs lues absentes, carnet de rangement invisible. Ajouter « Lu : 7 valeurs, 1 ? · Rangé dans Ventilation » et mettre Garder en haut.
- **Fiche en paysage** : la photo seule remplit l'écran. Photo à gauche (40 %), détails à droite, max-height 28vh en portrait.
- **Ventilation** : rond ✓ muet sur les façons. Libellé « Retenir » ou « à trancher », et « 5 articles · 1 à compléter » sous le bandeau.
- **Liste des carnets** : pas de champ « Une idée, un besoin… », « Données d'exemple » sans action, pastille « ↓ 600 CHF » qu'il n'aime pas. Il faut le champ en tête et « −600 CHF » en texte.
- **Menu + en paysage** : la rangée « Partout » est coupée. Mettre max-height calc(100dvh − 24px) avec défilement, ou 2 colonnes.
- **Choisir** : l'interrupteur « Arrêter leur veille » est une double négation, il n'y a pas de bouton Terminé et la raison ne se corrige pas.

## Mieux que da (à greffer)

- Typo : corps de 18 px, aucun texte sous 14 px (da en a de 16 à 113 par écran) et aucune cible sous 44 px (da a des croix de 24 px).
- Comparer en paysage 844×390 : les 7 colonnes sont lisibles et le meilleur est en vert. C'est le meilleur écran des deux.
- Choisir sans frappe : 1 toucher sur la ligne, raisons chiffrées tirées du tableau (« débit 1'200 contre 1'800 »). Dans da, Garder passe sous le clavier.
- Ligne touchée dans Comparer : « Battu partout par Table 2 becs, sauf le prix », avec Fiche et Choisir.
- Fiche : offres ailleurs avec prix et stock, courbe du prix en marches, veille par interrupteur, achat prévu.
- Articles : liste compacte, écartés en gris. Caractéristiques : liste ★, coche et sens visibles.
- Journal déplié : un picto par type, des dates nettes. Le menu + sépare « Dans ce carnet » et « Partout ».
- Fiche d'arrivée après un lien collé, avec « Rangé dans … · Annuler ».

## Moins bien que da (à reprendre de da)

- Le champ unique (texte, lien, photo, micro), en tête de liste et dans chaque carnet.
- Les propositions de l'IA en cartes durables : critère qui oriente, caractéristiques proposées, « Chercher les façons ».
- Le critère qui oriente affiché sous le titre du carnet, et le pourquoi entier dans le bandeau.
- La trace « ✦ rangé : … » sous chaque note, les valeurs lues avec « ? » et « Lien sans aperçu · Compléter / Redonner à l'IA » dans le fil.
- Le stock et le délai par article (« sur commande », « 6 sem. »), la veille datée (dernier et prochain passage).
- Le démarrage guidé d'une idée, les écartés dépliés avec leur raison, la question libre dans Pourquoi.
- Défauts de da à ne pas reprendre : « exemple.invalid/e5 » et « /v5 » affichés, paysage inutilisable, corps de 12 à 13 px dans Comparer. Dans da, la proposition de critère arrive sous le champ, donc sous le clavier.
