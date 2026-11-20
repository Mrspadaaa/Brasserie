# REPRISE v5b (19.11, 2e arrêt à 152 k) : état juste dans RESULTAT.md (17 ids jugés, 2 non joués, 4 problèmes provisoires).

## Serveur
Arrêté, 5193 et 5195 libres (vérifié). Relance (Bash, en fond, cwd port-carnet) :
`VITE_FIREBASE_API_KEY=fake node_modules/.bin/vite --config ../Brasserie/work/missions/2026-11-19-carnet-tour3/voies/v3/vite.v3.config.mjs --port 5195 --strictPort`
Scripts : `PORT_BANC=5195 node g4.mjs e12,te35` (sélection par argument). `doigt()` de g4 touche au doigt après contrôle elementFromPoint.
Planches : `node planche.mjs <sortie.png> <largeur> <img…>` (P1 à P7 faites et ouvertes).

## Reste
1. E1-2 (corriger g4, bloc `fait('e12')`) : après `taper('#purchase-total','3')`, toucher « Articles, stock et matériel » (oublié en g4).
   Les rangées sont des `<details>` fermés : les ouvrir au doigt (`ouvrirRangee`) avant de chercher `Libellé/Quantité/Montant ligne N`
   et les cases `[aria-label="Unité à remplir, ligne N"]` (leurs boutons ont un texte vide tant que la rangée est fermée).
   g3 a créé 6 rangées « Ligne sans libellé » : vérifier d'abord combien de rangées la saisie à la main ouvre (problème 4 à confirmer ou retirer).
   Rouvrir : Finances › « Opérations » › la dépense ZZ TEST (marche, g4) ; la vue rouverte montre « Dans la facture · N lignes » : lire l'unité de chaque ligne (« Modifier »).
2. TE-35 : feuille ouverte par « Modifier ZZ TEST » ; les montants sont sous « À étudier · mon estimation » (« 4 900,00 + livraison 0,00 + pose 0,00 ») :
   toucher cette ligne, lister les champs, puis « abc », « −5 », « -5 » et lire message et total.
3. Question ouverte : compléter sur la saisie à la main (capture e12 au geste juste) et la confirmation ; renuméroter « Problèmes ».
4. Arrêter le serveur, vérifier le port libre ; ligne finale « N problèmes : … ».
