REPRISE de la voie d (agent arrêté à 200 k de contexte, 41 appels utilisés sur 100).

Fait : `TRI.json` écrit, 51 entrées (PCN-105 à PCN-155), valide dans sa forme ; le contrôle d'ids (`node -e`) n'a pas pu être lancé (plus d'outil Bash).
Méthode : critiques 7 et 8, rapports en-ligne 1 à 4, chir7 et chir8 RESULTAT, diff `359d88200..HEAD` (base de la critique 8) sur les fichiers du carnet, lecture de Comparer.tsx, CadreArrivee.tsx, CarnetOuvert.tsx, UpgradeWorkspace.tsx, CarnetsVue.tsx (diff), carnets.css, carnets-fil.css.

À refaire par l'agent neuf (en `en-ligne` ou non prouvé dans TRI.json) :
1. PCN-155 : relire `src/domain/carnets/modele.ts` autour de la ligne 298 (la commande de relecture a été bloquée) pour confirmer `status` « research » dès le 1er article, lu ou non.
2. PCN-141 : `git grep -n -i "brassage\|brassin" -- src/domain/carnets src/ui/carnets` : existe-t-il une règle de rangement hors Matériel ? Sinon passer en `present`.
3. PCN-134 et 135 : lire `src/domain/carnets/rattacher.ts` et `doublons.ts` (seuils de proximité) : « hotte murale à 1 200 m³/h au moins » avec la Ventilation (titre « Ventilation de la salle de brassage ») rattache-t-il ? Voir `tests/unit/carnetsDoublons.test.ts`.
4. PCN-112 : chemin local (sans IA) de la phrase citée d'un carnet neuf de note en vrac (`planVrac`, `CarnetsVue.tsx` ~l.1060-1090).
5. PCN-146 : confirmer que l'écriture locale précède la confirmation de la découpe (CarnetsVue.tsx `ecrire` / `planVrac`).
6. PCN-105, 114, 119, 122 : verdict `corrige` fondé sur CRITIQUE-8.md l.15 ; chercher le commit exact (`git -C port-carnet log -S"<chaîne>"`), ancêtre du tag.

Doutes à signaler : PCN-126 (lexique fermé OBJETS_A_PART, PCN-187/190 ouverts) ; PCN-128 (IA réelle).
Gravité « m » du LOT a été notée « D » (détail).

LEÇON PROPOSÉE : un tri de 51 lignes qui lit des fichiers de 1 000 lignes dépasse 200 k ; lancer un agent par moitié du lot, et lire par `git diff <base de la critique>..HEAD` plutôt que fichier entier.
