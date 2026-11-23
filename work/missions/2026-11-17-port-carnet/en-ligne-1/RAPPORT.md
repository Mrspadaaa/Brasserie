# Test en ligne du carnet, n° 1 (18.11, critique Opus)

Version testée : https://brasserie-l-affinee.web.app, tag en-ligne/2026-11-18-carnet (dfdcd6977). La page sert bien `index-BEw4Aio0.js`, et le carnet est dans `CarnetsVue-c2mNGzjW.js`. La session du brasseur est ouverte (Gaëtan). Test sur bureau, Chrome, thème clair. Carnets réels avant le test : 0.

**OK — 12 problèmes, 5 bloquants. 0 envoi IA (7 envois, tous rangés sans IA).**

## Cause racine

L'IA du carnet est éteinte dans le paquet en ligne :
- le chunk contient `function io(e,t,r,s){return"eteint"}` (modeCarnet) ;
- l'environnement du build n'a pas `VITE_CARNET_IA`, seulement `VITE_RANGER_NOTE_IA:"production"` ;
- aucun `.env.production` n'existe au tag.

Résultat : aucun appel `aiTask`, et chaque envoi affiche « IA éteinte : rangé sur l'appareil, tel quel ». Le cœur du carnet, « un chat, et ça met en forme » (D-142), n'existe donc pas en ligne. J'ai joué les gestes avec le rangement local.

| Geste | Agit | Problèmes | Gravité |
|---|---|---|---|
| Note en vrac, 3 lignes, 2 objets (liste) | oui (local) | n° 1, 3, 4, 5 | bloquant |
| Phrase sur un autre objet (réfractomètre) dans Fermenteur ouvert | oui (local) | n° 6 | moyen |
| « doit tenir 80 °C » dans Pompe ouvert | **non** | n° 2 | bloquant |
| « 1 200 m³/h au moins » dans Hotte ouvert | oui, critère juste | — | — |
| Lien d'achat avec prix en CHF (×2) | oui, prix 189 et 245 tirés de la phrase | n° 8 | moyen |
| Comparer | oui, côte à côte par le prix, compromis juste | n° 9 | faible |
| Choisir → Envoyer dans À venir → « Garder le plan sans ce carnet » | **non**, Choisir reste désactivé | n° 7 | bloquant |
| Modifier une note | oui (« Note modifiée · Annuler ») | — | — |
| Supprimer une note, puis Annuler | oui, sans dialogue | — | — |
| Supprimer un carnet (×4) | oui, sans dialogue | n° 10, 12 | bloquant |

## Problèmes

1. **IA éteinte en ligne** (bloquant, geste sans effet). Aucun envoi ne passe par l'IA : rien n'est mis en forme, typé ni rangé par elle. Correction : ajouter `VITE_CARNET_IA=production` au build de production, puis redéployer.
2. **« doit tenir 80 °C » perdu** (bloquant).
   - Envoyé dans le carnet Pompe ouvert, l'aperçu annonce « va dans ZZ TEST — Prochain brassin ».
   - Après l'envoi, la phrase n'apparaît ni dans Pompe (« Ce qui compte · rien encore ») ni dans Prochain brassin.
   - Le message existe en base (MSG-4aacdf3d), mais il n'est visible nulle part.
   - Le brasseur dirait : « J'ai écrit un critère, il a disparu. »
3. **La vanne du fermenteur est rangée sous « Prochain brassin »** (bloquant, valeur fausse).
   - « le fermenteur doit avoir une vanne en bas pour la levure » crée un carnet neuf « Prochain brassin », avec un picto de fermenteur.
   - C'est un critère du fermenteur conique. En vrai, une vanne de fond n'a rien à voir avec un brassin.
   - Deux objets donnent trois carnets.
4. **Titre coupé sur un article** (moyen). Le titre devient « Pompe de transfert magnétique pour le », et « moût chaud » est perdu. Ce titre est repris dans la liste, dans Comparer et dans la confirmation de suppression.
5. **Une phrase entière devient un critère** (moyen).
   - « Critère : Fermenteur conique inox 60 L, voir s'il existe avec double paroi » mélange l'objet, un volume et une question.
   - La phrase de la pompe, de même forme, devient une « note » : le classement n'est pas cohérent.
6. **Un autre objet reste dans le carnet ouvert** (moyen).
   - Le réfractomètre devient une note « à faire » du Fermenteur, sans autre place proposée.
   - Le menu de la note n'a pas « Déplacer ». Il n'offre que Modifier, Changer en façon, Changer en critère et Supprimer.
7. **Choisir est impossible, donc À venir et « Garder le plan sans ce carnet » sont hors d'atteinte** (bloquant).
   - Les articles restent sur « lecture… » sans fin, car la lecture de lien passe par l'IA éteinte.
   - Choisir est `disabled`, avec le message « Page non lue : ni nom, ni prix connus. Elle se choisit une fois lue. », alors que « 189 CHF » est affiché juste au-dessus.
   - « Envoyer dans À venir » n'apparaît qu'après un choix.
8. **L'état de lecture ment** (moyen). L'aperçu dit « Sans lecture ici : le lien est gardé tel quel, page non lue. ». Après l'envoi, l'article affiche « lecture… » pour toujours, et il n'est nommé que par son domaine.
9. **Source des valeurs fausse dans Comparer** (faible). L'écran dit « Valeurs annoncées par les vendeurs », alors que les prix viennent de la phrase du brasseur et qu'aucune page n'a été lue.
10. **Confirmation de suppression fausse** (bloquant, valeur fausse). « Il est vide. » s'affiche pour Hotte, qui contient le critère 1 200 m³/h, et pour Prochain brassin, qui contient le critère de la vanne. Le brasseur supprime en croyant le carnet vide.
11. **Promesse non tenue en tête de liste** (faible). La liste dit « on garde sa photo, son prix, et on le surveille », mais en ligne il n'y a ni photo, ni lecture, ni veille.
12. **Messages orphelins après suppression** (moyen). C'est voulu par le code (operations.ts, L33 : « les messages restent ») : les 7 `carnet-message` restent dans `creativeItems` une fois les carnets supprimés. Aucun écran ne les montre, et rien ne permet de les retirer.

Doutes, non comptés :
- Après la note en vrac, je n'ai pas vu le retour « ✓ 3 lignes rangées · Annuler » : l'écran est revenu au cadre « Créer ». Je n'ai lu l'écran qu'à 40 s, le bandeau a pu passer avant.
- Console : 1 seule erreur, Firestore « Detected an update time that is in the future ». C'est un écart d'horloge de 1 ms, sans lien avec le carnet.
- Dans la confirmation de suppression, « ni dans À venir, ni en commande » commence par une espace.

## Preuve du retrait

- Les 4 carnets ZZ TEST ont été supprimés par l'app (Plus › Supprimer l'idée › Supprimer).
- Après rechargement : « Carnets 0 », et aucun « ZZ TEST » à l'écran du carnet.
- Dans le cache Firestore, les 4 CARNET sont en `noDocument`, et 4 auditLogs « Carnet d'idées supprimé : ZZ TEST — … » existent.
- **Ce qui reste en base** : 7 messages dans `creativeItems` (`type: carnet-message`). Je ne les ai pas effacés hors de l'app : ce serait une suppression directe en production, à faire avec l'accord du pilote ou du brasseur. Les identifiants :
  - MSG-4583dfed-a542-4e3d-8116-de7153575333
  - MSG-429a1afe-c9f4-43dc-934b-8431386debcd
  - MSG-4aacdf3d-0b1e-4bee-be66-ed97c2aa3b19
  - MSG-e8eb5ed0-b93c-47ec-8613-a12cc7908d27
  - MSG-4c93b0b9-206a-4d74-9ff9-d6fd5df213a6
  - MSG-631b7e3a-8886-45f4-9aa1-dbbd8af73f1c
  - MSG-4c76157c-f9ee-4d90-a02c-561de00ae725
- Aucune donnée réelle n'a été touchée : À venir reste à 3 avant et après (ce sont ses plans).
- Aucun dialogue ne s'est ouvert : alert et confirm étaient interceptés, 0 appel.
- Mon onglet est fermé.

## À rejouer

Une fois `VITE_CARNET_IA=production` en ligne, refaire ce test avec l'IA réelle. Plafond restant : 30 envois, aucun utilisé.

LEÇON PROPOSÉE : avant un test « IA réelle » en ligne, lire le drapeau compilé dans le paquet servi (grep du mode dans le chunk). Un banc simulé vert ne prouve pas que l'IA est allumée en production.
