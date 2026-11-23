# Fixtures de compatibilité et de catalogue

Ces fichiers rendent les tests reproductibles sans les dossiers de travail locaux.
Ils ne contiennent pas de données de production et ne constituent pas une validation
physique des modèles de brassage.

- `hop-strategy-*.synthetic.json` : projection exacte des entrées des scénarios
  synthétiques de planification et de conditionnement. Les déclarations de
  co-culture, l’identité de la matière et les valeurs inconnues sont conservées,
  sans inclure les réponses proposées ou les métadonnées de modèle.
- `yeast-lookup-*.json` : extraits documentaires minimaux utilisés par les tests
  Fermentis et Mangrove Jack’s, ainsi que leurs contre-exemples. Les plages, unités
  et sources sont conservées; les métadonnées de session et de modèle sont exclues.
  Les liens fournisseur datent du relevé du 25 septembre 2026 et ne sont pas une
  vérification en ligne actuelle.
- `legacy-measurement-01.json` et `historique-metric-v3-06.json` : archives
  synthétiques créées par les anciens binaires de compatibilité, conservées octet
  pour octet avec leurs sceaux d’origine. Les numéros V2/V3 désignent des formats
  historiques de données lus par V5.5, pas des interfaces alternatives à livrer.
  Les chemins de provenance inscrits dans ces archives ne sont pas chargés par
  les tests.

Empreintes des deux archives historiques :

| Fichier | SHA-256 |
| --- | --- |
| `legacy-measurement-01.json` | `d93179e46733134c4e066781e3a275586d62d3b7ed7f45516a2a100afafd9247` |
| `historique-metric-v3-06.json` | `2fa06db851bb407a55c6bd4e4774ec14ce206d935c88f69017d2f3962a476d3e` |

Les fins de ligne de ces fixtures JSON ne sont pas converties par Git. Ne pas
recalculer les sceaux historiques pour adapter une assertion au lecteur courant.
