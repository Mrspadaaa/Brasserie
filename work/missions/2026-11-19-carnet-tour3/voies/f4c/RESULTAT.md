OK — f4c : 6 corrigés (982f2d370), 9 écartés, 1 ouvert (vrai téléphone) ; suite carnets 681 verte

| id | verdict | commit | test | rouge→vert | écran touché |
|---|---|---|---|---|---|
| v2-neuf 1 | ecarte — banc local, pas la production | — | test dev-local retiré | — | non — firestoreRepo.ts et migration.ts remis à HEAD (copie `git show HEAD:` vers le scratchpad, CRLF rétabli ; `git status src/services` vide) |
| v2-neuf 4 | ecarte — R10/R11 : sa phrase en titre | — | test retiré | — | non |
| v2-neuf 6 | ecarte — n° 14 sans perte | — | — | — | non — « hotte murale à 1 200 m³/h au moins » remplace le critère vague de l'IA « le débit » sur le même axe (operations.ts `critereARemplacer`, critique 6 n° 3, D-53/D-113/D-122). Le débit reste écrit une fois, dans la ligne rangée « Hotte murale 1 200 m³/h au moins · de votre phrase ». Rien n'est perdu |
| PCN-22 | corrige | 982f2d370 | carnetsTour3F4a | oui (f4a/tests-rouge.txt) | oui — détail du bandeau : « À acheter : « filtre à air G4, 2 pièces » · dans … » |
| v1-neuf 1 | corrige | 982f2d370 | carnetsTour3F4a | oui | oui — « Moulin à malt 2 cylindres, 150 kg/h » : « 2 cylindres » en façon |
| v1-neuf 2 = v2-neuf 2 | corrige | 982f2d370 | carnetsTour3F4a | oui | oui — puce acceptée : critère « le débit », jamais « Comparer sur débit » |
| PCN-126 | corrige (cas « autre projet ») | 982f2d370 | carnetsTour3F4c | oui | oui — dans Ventilation, « autre projet, sans rapport : un frigo de garde pour 20 fûts » : va dans Frigo, sinon « Nouveau carnet Frigo de garde… » (`AUTRE_SUJET`, autreObjet) |
| v2-neuf 3 | ecarte — D383 | — | carnetsEnLigne2 n° 4, carnetsOrigineTitre | — | non — essai `quitte` (garder dans le carnet neuf annoncé) : il cassait 3 tests de la règle D383 (« tuyau silicone » dans Pompe : la vraie IA du test en ligne 2 l'y range en note à acheter, et c'est juste). Retiré. Le banc range un critère là où la vraie IA met une note (IA simulée) : écart du banc seul |
| PCN-20 | corrige | 982f2d370 | carnetsTour3F4c + Critique4Donnees, Critique5Donnees, Critique6Fil (mis à jour) | oui | oui — `&g35=1` ajoute « ZZ TEST — Ventilation de la salle de brassage, 2e idée » ; Supprimer Ventilation : « 1 article en veille : le déplacer dans … 2e idée · Déplacer » ; jamais la cave ni l'extracteur |
| PCN-42 | corrige | 982f2d370 | carnetsTour3F4c | oui | oui — carnet grisé derrière la carte « Supprimer » : plus de pastille « À venir · ZZ TEST — Frigo… » |
| PCN-19 | ecarte — code juste | — | carnetsTour3F4c (vert d'emblée) | — | non — la note de banc ZZ-V-N3 « il faudrait au moins 1 500 m³/h » ressemble bien à un critère et les aides du banc sont allumées. v2 avait tapé « moins de 60 dB », qui va droit en critère. En ligne, l'aide reste éteinte (R43) |
| PCN-61 | ecarte — code juste | — | carnetsTour3F4c (vert d'emblée) | — | non — pendant la frappe : « Déjà un carnet proche : ZZ TEST — Ventilation de la salle de brassage ». Le banc v2 envoyait aussitôt (`taper`, `envoyer: true`) et capturait donc l'après |
| PCN-119 | ecarte — R10/R11 (comme v2-neuf 4) | — | — | — | non — titre = sa phrase ; la coupure entre « 80 » et « °C » n'a pas été revue (v2), n° 26 corrigé |
| v1-neuf 4 | ecarte — même cause probable que v2-neuf 1 | — | — | — | non — 1 fois sur 9, jamais reproduit en 4 essais. Avec l'IA simulée (déterministe), le chemin `!depuis` se reproduirait 9 fois sur 9. Le hasard ne s'explique que par un rechargement Vite pendant que d'autres sessions écrivent dans port-carnet : banc en mémoire perdu |
| PCN-37 | ouvert | — | — | — | non — vrai téléphone 390×660, clavier ouvert ; aucun Chrome sans écran ne simule le clavier |

## Preuves
- `tests-rouge.txt` : 4 rouges sur le code d'avant (PCN-126 ×2, PCN-20, PCN-42), 5 verts. Les 3 rouges de f4a (PCN-22, v1-neuf 1, 2) sont dans `../f4a/tests-rouge.txt`.
- `tests-vert.txt` : carnetsTour3F4c et carnetsTour3F4a, 8/8 verts.
- `tests-final.txt` : `tests/unit/carnets* tests/integration/carnets*`, 681 verts, 1 todo, 0 échec.
- `tsc --noEmit` : aucune erreur dans les fichiers carnets ni dans services.
- `git show --stat HEAD` (982f2d370) : mes 10 chemins seulement.

## État à capturer (voie v4, 390 et 1280, deux thèmes)
1. PCN-22 : `?preview=carnets&ia=eteint`, ouvrir Frigo, écrire « filtre à air G4, 2 pièces » : le bandeau dit « À acheter : … ».
2. v1-neuf 1 : liste, écrire « Moulin à malt 2 cylindres, 150 kg/h » : « 2 cylindres » en façon, débit en critère.
3. v1-neuf 2 : ouvrir Pompe (`?dev-local`, 2e lien collé) et toucher la puce « ✻ Comparer sur le débit · Ajouter » : la ligne Critère dit « …, puis le débit ».
4. PCN-126 : `?preview=carnets`, ouvrir Ventilation, taper « autre projet, sans rapport : un frigo de garde pour 20 fûts » : le cadre dit « va dans ZZ TEST — Frigo… » ; après l'envoi, rien dans Ventilation.
5. PCN-20 : `?preview=carnets&g35=1`, ouvrir Ventilation, Plus › Supprimer : « 1 article en veille : le déplacer dans ZZ TEST — Ventilation de la salle de brassage, 2e idée · Déplacer ».
6. PCN-42 : ouvrir Frigo (lié à À venir), Plus › Supprimer : aucune pastille « À venir · … » sous la carte.
7. PCN-19 : `?preview=carnets`, ouvrir Ventilation, ··· sur la note « il faudrait au moins 1 500 m³/h » : « ✻ Ressemble à un critère · Passer ».
8. PCN-61 : liste, taper « Ventilation de la salle » sans envoyer : « Déjà un carnet proche : … » à 390 et 1280.

Prédiction : « La suppression est propre et G35 se voit enfin ; montre-moi le reste au vrai téléphone. »

CONNAISSANCE : `carnetsOrigineTitre` (aperçu « Tuyau silicone », compte des carnets) échoue parfois en suite parallèle chargée et passe seul : test sensible au temps.
LEÇON PROPOSÉE : un constat de vision qui contredit une décision du pilote (D383) se vérifie d'abord contre les tests de cette décision, avant d'écrire un correctif.
