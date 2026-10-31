OK — 79 candidats sourcés, mots vérifiés dans la SPEC

Fichiers écrits :
- `C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie\work\missions\2026-10-31-systeme-ecrans\voies\e3-glossaire\candidats.md`
- `C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie\work\missions\2026-10-31-systeme-ecrans\voies\e3-glossaire\RESULTAT.md`

Critères (VOIE.md ; GATES.md absent du dossier, voir plus bas) :
- Lignes de données : 79 (plage 30 à 80). Sortie : `awk -F'|' 'NR>3 && NF>3' candidats.md | wc -l` → 79.
- Forme : 79 lignes à 3 colonnes, une source non vide chacune. Sortie : 0 ligne mal formée, 0 sans source.
- Mots tels quels dans SPEC-BRASSEUR.md : `grep -cF` par mot, 0 absent sur 79.
- Sens « non établi » : 5 lignes (pallier 60', le truc noir, ces pastilles sont pas super clair, la partie « ce que la chaleur mesure » de "température", et le sigle AA, dont le sens n'est pas développé dans la SPEC). Ce dernier cas est traité comme établi partiellement, pas comme non établi.

Essais utilisés : 2 contrôles mécaniques (1er : 85 lignes, dépassement de 80 → 6 lignes retirées ; 2e : 79 lignes, OK).

Ce qui reste douteux :
- GATES.md est absent du dossier de la voie (le contrat le nomme). J'ai appliqué les critères de VOIE.md. Le pilote doit le fournir ou confirmer qu'il n'existe pas.
- L'exemple « le + pas centré » du VOIE.md n'est pas dans la SPEC telle quelle. La forme exacte relevée est « le + toujours pas centré » (cmc2g). C'est elle qui figure dans candidats.md.
- Les numéros de décisions (D…) sont ceux que la SPEC cite à côté de chaque propos ; je ne les ai pas recoupés avec `decisions.md`.
- Les lignes « Ma bière » et « un + qui ajoute le houblon » citent une source à la date du propos, sans numéro de décision.

CONNAISSANCE : aucune

LEÇON PROPOSÉE : Un VOIE.md qui cite des exemples (« le + pas centré ») sans les copier de la source les rend faux au contrôle de présence. Cause : le pilote a reformulé de mémoire. Règle : chaque exemple cité dans un VOIE.md est recopié depuis la source, et le pilote vérifie sa présence par grep avant de rendre la voie. Et : GATES.md doit exister dans le dossier de la voie avant son lancement.
