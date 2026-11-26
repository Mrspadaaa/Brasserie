# Liens lus par Claude pour les jouables (26.11)

Ses mots : « Aucune comparaison ?? » (v7, citra) et « Pas fan de l'harcellement » (passe 4, barre « prix suisse réel ? Noter »).
Cause : dans les jouables, l'IA (capacité sample) ne peut pas ouvrir les liens ; ses notes citra ne contiennent que 2 URL et « dur à obtenir ».
Décision : la session pilote fait l'intermédiaire (« Tu peux faire cette intermédiaire », 25.11) : elle lit les pages et écrit leurs faits dans
la base de l'artefact ; la page les donne à l'IA.

## Base (capacité db de chaque jouable)
- `liens/<id>` (id = "u" + hash djb2 en hexa de l'URL exacte) : { url, titre, lu (ISO), par: "Claude (session pilote)",
  faits: [{label, valeur}], prix: [{quantite, unite, prix, devise, note?}], dispo: string|null, livraison: string|null }.
- `demandes/<id>` : { url, carnet (titre), quand } — écrit par la page pour tout lien https de ses notes sans `liens/<id>` ; la session le traite.
- Règles : [{path:"journal",read:"admin",write:"admin"},{path:"liens",read:"view",write:"admin"},{path:"demandes",read:"admin",write:"admin"}].

## Page
- Au rangement, la consigne ajoute « Ce que disent ses liens (lus par Claude le <date>) » : par lien, sa ligne, titre, prix par quantité, dispo,
  livraison, faits. Règle ajoutée : les valeurs d'un lien entrent dans la comparaison avec "source":"lien" (jamais inventées) ; un lien non lu
  → critère « ? » avec la marque « 🔗 en lecture ». Validation côté page : une valeur "lien" doit exister dans `liens/<id>`.
- Affichage : valeur venue d'un lien marquée d'un petit 🔗 ; lien en attente : puce « 🔗 en lecture ». Quand `liens/<id>` arrive (onSnapshot),
  la page relance la lecture IA du carnet (une fois).
