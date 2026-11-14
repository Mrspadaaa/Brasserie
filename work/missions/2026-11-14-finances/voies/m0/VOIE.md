# Voie m0 — captures d'aujourd'hui des 13 sous-vues

- Mission : 2026-11-14-finances
- Agent : executant
- Modèle : haiku
- Niveau : mécanique
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Capturer chaque sous-vue de Finances telle qu'elle est aujourd'hui, ouverte, pour la colonne « aujourd'hui » de la page de choix.

## Entrées
- `work/missions/2026-11-14-finances/COUVERTURE.md` — la liste des 13 vues et le bouton qui ouvre chacune.
- Banc : `http://localhost:3000/?dev-local&finance-demo=reel` (déjà lancé, ne pas relancer) ; thème `localStorage['laffinee.theme']='clair'`.
- Outil : `.claude/skills/webapp-testing/examples/_lanceur.mjs` (`ouvrir`, `calme`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/m0`

## Consignes
Écrire un seul script `work/missions/2026-11-14-finances/voies/m0/capturer.mjs` qui ouvre l'onglet Finances, puis chaque vue par son vrai bouton (texte ou rôle), attend qu'elle soit
rendue et capture la fenêtre : 390 × 844, échelle 2, clair. Fichiers `work/missions/2026-11-14-finances/voies/m0/cap/<clé>.png` avec les clés : fi (Filtres ouvert), do (Doublons),
ar (Archives, puis « Gérer les archives » dans ar2.png), ap (Apport ou prélèvement privé), fo (fiche d'une opération), pa (Payer), mo (Modifier ou
« + pièce »), pr (ajouter une prévision), pm (projet matériel), im (immobilisation), bb (budget d'un brassin), pf (profil et paramètres), ia (assistant).
Une vue introuvable ou désactivée : capturer l'écran avec le bouton visible et l'écrire dans RESULTAT.md (« fi : bouton désactivé », par exemple),
sans rien inventer. Ouvrir chaque image. Aucune donnée réelle, aucun enregistrement (fermer chaque feuille sans valider). Aucun sous-agent.

## Exigences transversales et acquis (recopiés, L05, L06)
- Local seulement, `?dev-local` ; rien d'enregistré ; une capture non ouverte ne compte pas (L12).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil : une ligne par clé (capturée, ou pourquoi pas).
- Tests : aucun Vitest ; la ligne « Tests » est `node work/missions/2026-11-14-finances/voies/m0/capturer.mjs --reporter=dot > work/missions/2026-11-14-finances/voies/m0/tests.txt` (à la place de `npx vitest run … --reporter=dot > tests.txt`).
Réponse finale au pilote : une ligne.
