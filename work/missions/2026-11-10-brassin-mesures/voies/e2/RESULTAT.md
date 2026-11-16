ECHEC — 1280 non joué ; à 390, aucune écriture saveBrewSession, mais la case « ? » n'ouvre pas la feuille (état « à synchroniser » hérité).

Fichiers : voies/e2/e2.mjs (script), requetes.json (dernier passage, jetons Bearer retirés), essai1/, essai2/, essai3/ (mêmes fichiers des passages précédents), captures/ (7 PNG du dernier passage, e2-03 et e2-05 ouvertes), tests.txt.

Méthode : profil copié de profil-test (connexion conservée), `setRequestInterception(true)` avant le premier geste, test POST factice annulé (ERR_BLOCKED_BY_CLIENT) avant et après chargement, bundle index-a3wBuonJ.js confirmé. Toute requête non GET annulée et journalisée (OPTIONS/HEAD seules laissées passer, aucune vue).

Attendu / lu :
1. Profil « neuf » sans file locale : NON TENU. Le profil copié portait `brew-outbox-…-LOT-016` (3003 car.) et `…LOT-017-conflict-backup` (18775 car.) ; retirées par script puis rechargement (essais 2 et 3). Un profil réellement vierge n'a pas la connexion.
2. Première requête non GET : au chargement, avant tout geste : identitytoolkit accounts:lookup, securetoken token, getBrewerActivity, syncFinancialLedger, Firestore Listen/channel (corps : en-têtes + jeton + groupes d'écoute, rien de brassin). Ensuite : 1 Listen/channel par geste (brassins, reprendre, 10 s ; le geste « case ? » en a produit 1 dans l'essai 1). 0 requête vers saveBrewSession, 0 corps avec version, aire, étape, mesures ou brouillon.
3. Reprendre (390) : la Conduite s'ouvre sur « Journal à synchroniser · brouillon conservé », bandeau « Connexion interrompue — Confirmation de cette écriture en attente… Réessayer / Recharger le serveur », sans aucune requête brassin émise. Étape Empâter (palier échu de 2 h 55), horloge 00:00 présente, carte « Relevés du jour 0/2 » (Maische ? °C, pH ? pH) sous l'horloge. Boutons Mesurer, Note, Noter, Terminer le palier désactivés ; cases « Relever Maische » et « Relever pH » actives.
4. Case « ? » touchée : AUCUNE feuille (e2-05 : Conduite inchangée). Piste et × : sans objet (× vu = « Fermer » de l'en-tête, non touché : la feuille n'existe pas). 
5. Console : seules erreurs = nos requêtes annulées (ERR_BLOCKED_BY_CLIENT, Firestore « Could not reach backend »). Aucune erreur applicative propre.
6. 1280 : non joué (la feuille ne s'ouvre pas à 390 ; plafond de tours).

Problèmes :
1. Sans réseau en écriture, le brassin s'ouvre déjà en « Journal à synchroniser » et la feuille Mesurer ne s'ouvre plus : état à documenter (cause : lecture serveur bloquée donc journal non confirmé, ou état local IndexedDB hérité du profil copié, non départagé).
2. Différence avec e1 : e1 (état serveur joignable) a ouvert la feuille et vu POST saveBrewSession 409. Ici aucun POST brassin n'est parti au chargement, à Reprendre, après 10 s ni au toucher de case. L'écriture d'e1 vient donc de l'ouverture de la feuille (ou de la reprise du journal avec réseau), pas de Reprendre seul : non prouvé ici faute de feuille ouverte.
3. Les Listen Firestore et le POST getBrewerActivity/syncFinancialLedger sont des lectures en POST : « tout non GET annulé » coupe aussi la lecture (Firestore dégradé).

Essais : 3 passages de script au total (essai1 profil hérité, essai2 outbox retirée, essai3 + état des boutons).
Douteux : la cause exacte du refus d'ouverture ; l'état local IndexedDB hérité ; 1280 jamais vu.
Reste à faire (pilote) : rejouer avec autorisation ciblée des seules lectures (Listen/channel, getBrewerActivity, syncFinancialLedger, accounts:lookup, token) en ne coupant que saveBrewSession, pour voir si la feuille s'ouvre et quelle écriture part ; puis 1280.

CONNAISSANCE : Reprendre un brassin en cours ne déclenche aucun POST saveBrewSession ; au chargement, les POST sont des lectures (Firestore Listen, getBrewerActivity, syncFinancialLedger, jeton) — vu en ligne le 10.11 avec toute requête non GET annulée.
LEÇON PROPOSÉE : Couper tous les non GET en ligne casse aussi les lectures Firebase (POST) et change l'état de l'app. Cause : Firestore et les fonctions lisent en POST. Règle : n'annuler que les écritures nommées (saveBrewSession, etc.) et laisser passer les lectures listées.
