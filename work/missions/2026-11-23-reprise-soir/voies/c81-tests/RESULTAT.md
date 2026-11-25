OK — 38 tests rouges sur 65 (R116 à R121), sur les vrais documents c79 et c75, avant tout correctif

# RESULTAT c81-tests

Fichiers écrits : `tests/unit/c81Regles.test.tsx`, `voies/c81-tests/tests-rouge.log`, ce fichier. Aucun fichier de `src/` ni `functions/` touché par cette voie (les `M src/ui/carnets/*` du `git status` viennent d'autres voies). Pas de dossier `tests/fixtures/c81/` : les documents réels de c79 et c75 suffisent. Le `.skip` du cas R4 de c48 n'est pas touché (aucune consigne de le lever).

Sortie : `npx vitest run tests/unit/c81Regles* --reporter=dot` : 38 rouges | 27 verts (65). `tsc --noEmit` : aucune erreur sur le fichier.

| Règle | rouges | ce qui est rouge, et pourquoi |
|---|---|---|
| R116 | 18 | 9 carnets « problème » x (état « note » et « cherche » + option retenue) : ni Décidé, ni proposition « Décidé » hors de la barre d'état |
| R117 | 4 | CO2, écoulement, inspection électrique, vapeur : la 1re bulle redit le titre (`<p class="cnp-texte-court">`) |
| R118 | 1 | rang `?` seul, ligne « ?Citra 13.6%Brau13,6à relire » sans « prix à relire » |
| R119 | 6 | Citra carnet, Comparer, fiche ; fête, inspection, vapeur : `cn-mono` / `.cnp-heure` en `var(--c-mono)` sur « ≈73,8 », « 13,6 », « 16:45 », comptes |
| R120 | 5 | 3 « ? » + 1 hachure dans la colonne Brau ; en-tête sans « à relire » ; « · variété » ; `hyphens: auto` ; `-webkit-line-clamp: 3` sur les noms |
| R121 | 4 | aucune carte « Ranger ce fil ? » sur le vrai CO2 ; donc ni étiquettes, ni 3 options, ni cause, ni tâche |

## Honnêteté : ce qui est vert, et pourquoi
- R116 « document tel que relevé » : vert. Le CO2 relevé dit déjà `decide` (écrit à 12:16, avant la capture de 16:42 : la capture montre « Noté »). Les tests rouges rejouent donc la donnée de la capture : même document réel, SEUL `suivi.etat` remis à `note`/`cherche`, et une option « retenue » ajoutée quand le carnet n'en a pas. C'est SIMULÉ et dit dans le test. Les carnets non « problème » (fête, assurance, ranger la cave) n'ont pas de barre d'état : la règle n'y a pas d'objet.
- R117 : verts pour 8 carnets sur 12 : leur 1re bulle n'est pas rendue comme redite (je n'ai pas cherché pourquoi : le test lit le rendu).
- R120 « note ≈ rendu chez toi » : vert. Elle est dans `.cn-defile`, après le tableau ; le champ est un frère `sticky` hors de la zone qui défile : jsdom ne mesure rien. Sa visibilité sous le champ se juge au contrôle Chrome de c80 (390 px, défilé jusqu'en bas).
- R121 : R95 (c74b) était vert parce que son fil de test est « brut, sans genre ni option » ; le vrai CO2 a déjà genre, suivi et UNE option (la phrase des pistes entière) : `propositionFilAncien` rend `null` (`if (d.genre || d.suivi || d.facons.length …) return null`). Le correctif devra donc aussi traiter un fil déjà étiqueté « problème » avec une mauvaise option, pas seulement le fil brut.

## Doutes et limites
- R119 lit le style calculé après injection des CSS de `src/ui/carnets/*.css` ; jsdom ignore `@media` et ne remonte pas l'héritage (le test le fait). Il vise la police, pas l'espacement en pixels : la mesure visuelle (« ≈73,8 » espacé) reste au contrôle Chrome de c80. Choix de lecture : « chasse fixe » = police `mono`/`monospace` (donc aussi les heures du fil et les comptes, qui sont dans la plainte « aucun chiffre »). Si le brasseur ne vise que les prix et α, retirer les cas heures/comptes.
- R120 « noms lisibles » : la capture montre les noms coupés en HAUT (défilement), non mesurable ici ; le test vise la cause visible dans le code, `-webkit-line-clamp` et `hyphens: auto` sur les noms. Interprétation, à confirmer par la capture Chrome.
- R121 : l'étiquette « cause » est lue soit sur un jeton `cause` portant `optionId` du raccord, soit sur le raccord `retenue` ; la date de la tâche : 2026-12-01 ou 12-02 (24.11 + 7 j, ou 25.11 + 7 j). Les jetons sont lus à l'écran (`[data-message=…] .cnp-jeton`) : constat, piste, essai ou cause, fait, tâche ou à faire.
- R116 : le test accepte « Décidé » affiché (dérivé, sans écriture) OU un bouton hors de `.cnp-etat` contenant « décid… » dont le toucher écrit `decide`.
- Essais : 1 lancement final (un premier essai de sonde pour lire le rendu réel, supprimé).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `etatDe` lit `suivi.etat` écrit avant `etatContenu` : un carnet dont l'état écrit est resté « note » montre « Noté » même avec une option retenue ; seul le contenu sans état écrit dérive Décidé (suivi.ts l.55-65).
LEÇON PROPOSÉE : un test de « fil ancien » doit partir du document réel du carnet de la plainte : R95 passait sur un fil brut inventé, alors que le vrai document avait déjà genre, suivi et une option (L28).
