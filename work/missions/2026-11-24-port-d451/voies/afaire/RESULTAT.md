OK — Écran « À faire » (3 groupes, coût, lien À venir, Quand ?) et carte « À ranger » (option B), contrôlés par props.

PRÊT b433ee3c7

## Plan (éléments → composant → règle → test)
| Élément (maquette v01) | Composant | Règle (afaireRegles.ts) | Test |
|---|---|---|---|
| Groupes « Cette semaine n », « Fin du mois n », « Un jour n » (+ « Plus loin ») | `AFaire` | `libelleGroupe` ; groupes = `aFaireDe` (domaine) | carnetsAFaireRegles « groupes » (bornes dimanche/lundi, 31 déc., fuseau Zurich, retard) ; Vue « trois groupes », « en retard sans rouge » |
| Ligne : case, texte, sous-ligne picto + problème | `AFaire` | — | Vue « chaque ligne » |
| Jeton de coût « ≈ 35 CHF », « 540 CHF » ; absent = rien | `AFaire` | `coutDeTache` (0 et absent : aucun jeton) ; `montantDUnDevis` (devis du fil : « · 850 CHF » en sous-ligne, comme la maquette) | « coût », Vue « devis » |
| « · dans À venir » ; achat daté → plan | `AFaire` | `dansAVenir` ; `planDeLAchat` (`PLAN-CARNET-<id>`, idempotent, seul l'achat de l'option retenue) | « lien À venir et plan idempotent » |
| Cocher / décocher | `AFaire` (case 44 px, retour optimiste) | `cocherTache` du domaine (appelé par la voie liste) | Vue « cocher puis décocher », « disparaît / revient décochée » |
| Toucher la ligne : ouvre le problème | `AFaire` | — | Vue |
| Changer l'échéance (appui long, clic droit) | `FeuilleQuand` | `choixEcheances`, `choixActuel` ; `poserEcheance` du domaine | « changer l'échéance » (chaque choix → bon groupe), Vue |
| Carte « photo seule, sans texte » : Rattacher à X ? Oui · Nouveau problème · Laisser | `CarteARanger` | `propositionARanger` (option B), `motsDeLaCarte`, `dernierTouche`, `quandTouche` | « proposition (option B) », Vue CarteARanger |
| « truc à voir » : « rien d'autre écrit : reste ici », Laisser d'abord | `CarteARanger` | `texteMince` (mots vides, pas un exemple) | « texte mince », Vue |

## Fichiers écrits (commit b433ee3c7, par chemins)
src/ui/carnets/{AFaire.tsx, CarteARanger.tsx, afaire.css, afaireRegles.ts} ; tests/unit/{carnetsAFaireRegles.test.ts, carnetsAFaireVue.test.tsx}. Dans le dossier de voie, non commités : banc/ (banc.tsx, capturer.mjs, config Vite port 3058), cap/*.png, *.log. Rien d'autre touché (operations.ts et taches.ts lus seulement).

## BRANCHEMENT (ce que la voie liste doit fournir)
`<AFaire carnets maintenant plans? messages? onCocher onOuvrir onEcheance? picto? />`
- `carnets: CarnetDoc[]` (`lireCarnets(..., {archives:true})`), `maintenant: string|number|Date`.
- `plans`: `{id, status}[]` des plans d'À venir (pour « dans À venir ») ; `messages`: `MessageDoc[]` (devis du fil) ; les deux facultatifs.
- `onCocher(carnetId, tacheId, faite)` → `cocherTache(etat, {carnetId, tacheId, le, faite})` ; afficher « ✓ Fait · Annuler » avec l'inverse (la case revient décochée si la tâche reparaît).
- `onOuvrir(carnetId, tacheId)` → ouvrir le problème.
- `onEcheance(carnetId, tacheId, {date, precision})` → `poserEcheance(etat, {carnetId, tacheId, echeance: date, precision})` ; si la tâche porte un plan vivant (`planId`, ou achat de l'option retenue), appeler ensuite `planDeLAchat(carnet, tache, le)` et écrire le plan (`ecrirePlan`, puis `poserSortie` s'il vient d'être créé). Absent : pas d'appui long.
- `picto(c)` : le picto de catégorie du problème (défaut : `PictoObjet` d'après ses mots, souvent « étiquette d'article » pour un problème : la liste doit injecter le sien).
- La rangée « Arbre · À faire n · cloche n » et le compte `aFaireDe(...).total` sont à la liste ; `AFaire` rend le corps seulement.
`<CarteARanger element proposition origine? onRattacher onNouveau onLaisser />`
- `proposition = propositionARanger(element, carnets, messages, maintenant)` ; `element = { carnetId (le carnet « photo » à ranger, exclu), texte?, photo?, le }`.
- `onRattacher(carnetId)` : déplacer la photo/le texte dans ce carnet (`deplacer` du rangement ; le domaine ne le fait pas) ; `onNouveau` : ouvrir un problème avec l'élément ; `onLaisser` : rien.
- La carte se pose dans la page de la liste (elle porte ses variables de thème, sans marge ni fond).

## Critères (sorties décisives)
- tsc : 2 erreurs connues (seedData GanttTask, virtual:pwa-register), aucune neuve dans mes fichiers. Un `npm run build` rejoué a montré une 3e erreur dans src/ui/atelier/atelierModel.ts (l. 218, `toLowerCase` sur `never`) : hors de ma voie (travail d'une autre session) ; le build s'arrête au tsc, comme pour les voies précédentes : non rejoué plus loin.
- tests/unit/carnetsAFaire*.test.ts : 2 fichiers, 42 tests verts (28 règles, 14 vue).
- carnets*, c48 à c64Regles, planning-vers-carnet, lot11Carnet, lot3CarnetOuvert, port-q4-carnet : 70 fichiers, 1626 verts, 3 ignorés, **1 rouge hors de ma voie** : lot3CarnetOuvert « la note rangée ailleurs (en critère) : la rubrique Notes reste » (région « Notes » absente de CarnetOuvert) ; CarnetOuvert.tsx, carnetOuvertTypes.ts et ouvertCalculs.ts sont modifiés non commités par la voie `probleme` en ce moment. virgule-transversale : 8 verts.
- `git status --short` : mes six fichiers commités ; le reste n'est pas à moi (probleme, .codex, missions).
- Essais : tests de la voie : 2 correctifs d'attente (compte « Fin du mois 3 », préfixe « ZZ TEST — » des titres de fixture, `act` autour du minuteur) ; captures : 2 passes (carte sans variables de thème : fond et bordures absents hors `.cn-page`, corrigé ; ligne du Planning qui répétait son titre, corrigée).

## Vision (captures ouvertes, dans cap/)
Banc Vite local (port 3058) sur la fixture « ZZ TEST — » ; Chrome 9222, onglet propre. Ouvertes : cote-afaire.png et cote-epreuve.png (390, maquette v01 à gauche), m-quand.png (feuille Quand ?), m-afaire-sombre.png, d-afaire.png (1280), m-epreuve-vague.png, m-afaire-retard.png (3 déc. : tâches de la semaine passée dans « Cette semaine », aucun rouge). Prises, non ouvertes une à une : m-afaire-cochee, m-afaire-apres-cocher, m-quand-apres, m-epreuve-aucune, m-epreuve-sombre, d-epreuve, m-afaire-660. Gestes joués au banc : cocher/décocher (retour optimiste, `onCocher` reçu), clic droit → Quand ? → Fin du mois (`{date:'2026-11-30', precision:'mois'}`), toucher une ligne (`onOuvrir`), Oui / Nouveau problème / Laisser (appels reçus). Écarts à la maquette, vus côte à côte : la maquette montre l'app entière (en-tête, onglets, filtres, barre du bas, volant) qui sont à la liste ; ici le corps seul. Rangées 52 px (maquette 58), cases 44 px touchables (dessinées à 22) ; boutons de la carte 44 px (maquette 34) : même rangée, même ordre ; la carte reste sur une seule rangée de trois boutons à 390.

## Doutes, limites et choix à relire
1. **« ouvert hier » → « dernier touché : hier »** : l'app n'enregistre pas les ouvertures, seulement les écritures (message, événement, tâche, note). Dire « ouvert » serait inventer ; la raison dit ce qu'on sait.
2. **Provenance de la carte** : la proposition est un calcul local (aucune IA ne lit la photo) ; la règle Q19 impose le picto du calcul local, pas le ✻ de la maquette. `origine="ia"` rend le ✻ si la décision A est prise.
3. **Aucun problème ouvert** : la carte dit « Aucun problème ouvert où la ranger. » avec Nouveau problème et Laisser (jamais un Oui sans cible).
4. **Devis en sous-ligne** : la maquette met « 850 CHF » en sous-ligne de « Répondre au devis… » et un jeton aux achats. La règle : le montant ferme dont le message d'origine porte un jeton « devis » du même montant va en sous-ligne. Il faut donc `messageId` sur la tâche (les tâches proposées par l'IA l'ont ; la tâche de la fixture domaine n'en a pas, je l'ajoute dans mon banc seulement). Sans lui : un jeton.
5. **Pictos de la sous-ligne** : par défaut `pictoDe(titre, chemin, phrase)` (objets dessinés) : souvent l'« étiquette d'article » pour un problème (fuite, fusible). La maquette montre des glyphes de catégorie : à la liste de les injecter par `picto`.
6. **Appui long = changer l'échéance** : geste absent de la maquette (elle est fixe), demandé par la voie ; aucun contrôle visible n'est ajouté à la ligne. Accessible au clavier : non (appui long et clic droit seulement) ; le même changement existera dans le problème (voie probleme).
7. **« Plus loin »** : groupe du domaine pour les mois suivants, absent de la maquette (sinon ces tâches datées seraient perdues).
8. Tâche lue du Planning : case grisée, non cochable, « au Planning » (se coche au Planning, `cocherTache` la refuse).
9. Le test de fuseau (00 h 30 le lundi) ne s'exécute que sur un appareil en Europe/Zurich ; les bornes en dates pures le couvrent ailleurs.
10. `npm run build` complet non rejoué (tsc en échec hors de ma voie).

DÉCISION À PRENDRE : aucune nouvelle ; reste celle du PLAN (photo seule : A, B, C ; ici B, recommandation tenue).
CONNAISSANCE : une proposition locale (sans IA) porte le picto du calcul local, jamais le ✻ ; « touché » (dernière écriture) n'est pas « ouvert » (aucune trace d'ouverture dans les données).
LEÇON PROPOSÉE : aucune
