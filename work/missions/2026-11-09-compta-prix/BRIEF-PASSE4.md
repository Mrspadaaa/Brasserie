# Brief passe 4 : compta et prix

Lis `BRIEF-AUTEUR.md` (métier, fixture, obligatoire, IA au toucher, maquettes **statiques**), `BRIEF-PASSE2.md` § « Corrections
transversales » (toujours obligatoires) et `BRIEF-PASSE3.md` § « Le métier nouveau » (brassin futur, frigo 3 000 CHF).
Panel passe 3 : https://claude.ai/artifact/Du3g2PfGqwka9cLuEHcWPe ; captures `p3/<id>/`, `p2/<id>/`.
**Choisis** (langue de référence, ne pas redessiner) : g3a (Synthèse), g6 (Annuel et clôture), c3a (coût du litre), v3a (facture), p2b (impôt).

## Ses mots du 09.11 et ce qu'en fait la passe 4
| Écran | Ses mots | Ids | Ce qu'on fait |
|---|---|---|---|
| Prix | « c5b … La meilleure de loin mais fait quelques variantes en plus de ce type / Avec c5a » | `c6a`–`c6d` | 4 variantes du type c5b (bascule « par bouteille / par an » sur le chiffre de tête), qui reprennent c5a (la règle de c4a en tête, la même aiguille dans l'année) |
| Prévisions | « p4a … Mieux mais on perds l'info directement sur le graph, fait quelques variantes  et ça reste dure à lire... Fait plus de variante de cette vues » | `p5a`–`p5f` | 6 variantes, **lisibles en 3 s**, de p4a où l'info se lit **sur le graphe** (montants, dates, projets, point bas posés sur l'escalier), le frigo et le brassin futur compris |
| Rangement | « e1b … Était mieux, améliore le encore » | `e3a`–`e3c` | 3 variantes : e1b (passe 2) amélioré, pas e2a |
| Opérations | « v5a … Beaucoup mieux mais plus compact les lignes, mais quasiment parfait » | `v6a`–`v6b` | 2 variantes : v5a telle quelle, lignes plus compactes (hauteur de ligne mesurée et dite dans la NOTE), rien d'autre ne change |

## Ce que rend chaque concept (`work/missions/2026-11-09-compta-prix/p4/<id>/`)
`etat.html` statique, classes préfixées ; `NOTE.md` court ; captures `node scripts/agents/verifier-page.mjs <etat.html> --captures p4/<id>/<id>`
+ 1280 ; états utiles en plus, **ouverts** (L12). ~8 tours par concept.

## Voies
| Voie | Ids | Agent |
|---|---|---|
| c | `c6a`–`c6d`, `e3a`–`e3c` | concepteur (Opus) |
| p | `p5a`–`p5d` | concepteur (Fable) |
| v | `v6a`–`v6b` | concepteur (Opus) |

Plancher à enrichir (L07). N'écris que dans `p4/<tes ids>/` et `p4/RESULTAT-<voie>.md`. Pas de heredoc ni `node -e` pour du code, pas de
`git stash`, aucun commit, rien dans `src/`. Rends une ligne.

## Passe 5, Prix (ses mots : « Par bouteille ou par an / c5b était mieux, mais il faut un peu l'améliorer »)
Ids `c7a`–`c7c` dans `p4/` : c5b (`p3/c5b/`) reprise, **retouchée légèrement**, pas réinventée. Pistes tirées des critiques : la règle
retrouve son aiguille franche (c4a) ; le graphe à deux axes se lit sans effort (un axe nommé, valeurs posées sur la courbe) ; la bascule
« par bouteille / par an » reste sur le chiffre de tête. Corrections transversales toujours obligatoires. Une NOTE dit ce qui change.
