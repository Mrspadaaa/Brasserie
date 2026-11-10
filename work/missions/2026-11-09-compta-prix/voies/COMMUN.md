# Commun aux voies de code d1, d3, f1

- Lis `PLAN-METIER.md` (§ de ta voie, § 3.6 tests, § 4 état de l'art) et `INVENTAIRE-CODE.md` (problèmes cités).
- Décisions du pilote (09.11) : P1 prévision dérivée à la lecture ; P2 usure linéaire sur durée, défaut = 100 ÷ taux linéaire AFC de
  la catégorie, l'Annuel garde l'AFC ; P3 ventes nécessaires sur la marge, le prix en second ; P4 QR en PNG (canvas) dans jsPDF, aucune
  dépendance neuve ; P6 numéro max + 1 local par année, doublon signalé à la synchro ; P7 adresse structurée de la brasserie obligatoire
  pour émettre un QR.
- **Étape 1, seule pour l'instant** : écris `voies/<id>/PLAN.md` (gabarit `.claude/skills/voies/references/sans-memoire.md` § 2 : défauts
  visés, changements fichier/fonction, tests qui échouent d'abord, appelants hors Possède par grep sur `src/` `tests/` `scripts/` rejoués
  sur HEAD, risques données existantes / hors ligne / arrondis, hors périmètre). Puis **arrête-toi** et rends une ligne. Le code vient
  après la revue.
- Aucun code, aucun commit, pas de `git stash`. Gemini jamais appelé. L'IBAN n'est jamais recopié.

**Remplacer, jamais fusionner** (ses mots du 09.11 : « Bien replacé ce qui est déjà en place par les mini maquettes, par un merge ou portage à moitié ») : l'écran choisi remplace entièrement l'écran actuel ; aucun bloc de l'ancien ne reste à côté. Une fonction de l'ancien absente de la maquette va au second plan dans la langue de la maquette, ou est listée dans RESULTAT.md pour le pilote. « 99 % mini maquettes » : un compromis rare se justifie et se liste.
