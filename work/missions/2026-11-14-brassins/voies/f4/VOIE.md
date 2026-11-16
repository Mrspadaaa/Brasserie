# Voie f4 — Aligner les volumes des maquettes sur les données communes

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 30 tours · Dépend de : f3a1 à f3c · Décideur : pilote

## Objectif
Ses mots (14.11) : « J'ai l'impression que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? ». Avant de montrer
les 44 maquettes e1 à e11, leurs volumes doivent concorder : `work/missions/2026-11-14-brassins/DONNEES-COMMUNES.md` (24 L brassés par brassin, pertes 2 L environ,
Stout 21,9 L conditionnés dont fût F-01 à 12 L, Saison 21 L, Pils F-02). Les séries e5 à e11 ont été faites avant ce fichier.

## Entrées
- `work/missions/2026-11-14-brassins/DONNEES-COMMUNES.md` et `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Les chiffres.
- Variantes à reprendre : celles dont `etat.html` contient un volume hors de ces données (ex. e7 : « 31,5 → 29,9 L », totaux 102,5 L,
  51,9 L, 54,5 L, 55,5 L, 47 L) ; cherche par `grep -n -E "[0-9]+(,[0-9])? L" work/missions/2026-11-14-brassins/voies/e*/e*/etat.html`. Exception : e10 (adapter un
  volume : les volumes cibles et le refus « 40 L ne tiennent pas » sont le sujet) ; garde 24 L comme volume source.
- Les totaux et rendements qui en découlent se recalculent (5 brassins × 24 L = 120 L brassés ; conditionné = somme des volumes
  conditionnés connus ; inconnu « — »).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/e5/` à `work/missions/2026-11-14-brassins/voies/e11/` (etat.html, NOTE.md et PNG des variantes touchées), `work/missions/2026-11-14-brassins/voies/f4/`. Rien dans `src/`. Ni commit ni stash.

## Consignes
- Changer seulement les volumes et ce qui en découle ; l'idée et la mise en page restent. Régénérer toutes les images d'une variante
  touchée par le `capture.mjs` de sa série et ouvrir chacune (Read).
- `RESULTAT.md` : une ligne `- [x] <id> : <volumes changés>` par variante touchée.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Chiffres à la virgule ; inconnu « — » ; deux thèmes ; 390 et 1280 ; aucun chiffre neuf hors des deux fichiers de données.

## Critères
`work/missions/2026-11-14-brassins/voies/f4/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures des variantes touchées, toutes ouvertes.
Réponse finale au pilote : une ligne.
