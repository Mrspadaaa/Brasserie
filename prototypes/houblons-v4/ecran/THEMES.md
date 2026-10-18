# Thèmes de l'écran houblons (prototype)

Proposition du prototype (18.10.2026), **pas une modification de DESIGN.md**. Elle applique
la recherche G (`work/refonte-frontend/v4/recherche/G-clair-sombre.md`) : clair par défaut,
le « cave » actuel devient le thème sombre. Le brasseur tranche ; l'app n'est pas touchée.

## Mécanisme

- Les noms de jetons de l'app ne changent pas (`cave-*`, `ebc-straw`, `hop`, `water`,
  `alert`…). `tailwind.config.js` étend la configuration racine et remplace leurs valeurs
  par des variables en canaux RGB (`rgb(var(--cave-900) / <alpha-value>)`) : les opacités
  (`bg-water/50`) restent valides, et les composants importés de `src/ui` suivent le thème
  sans modification.
- Valeurs par thème dans `src/themes.css`, sous `[data-theme='cave']` et
  `[data-theme='clair']`, posé sur `<html>` par l'option de build `--theme`.
- **Texte et aplat sont séparés** (`textColor`) : chaque accent a une variante texte. Piège
  des noms : en clair, `bg-cave-950` est le papier mais `text-cave-950` reste une encre
  sombre, car l'app ne l'emploie que pour un texte posé sur la paille.
- Deux jetons propres au prototype : `marque` (bande du style, piste) et `repere` (cible),
  marques porteuses de sens à 3:1 au moins.

## Cave (sombre)

Valeurs de `tailwind.config.js`, rendu de l'app à l'identique. Écarts hérités, non corrigés
ici : `text-alert` 4,09:1 sur `cave-900` (3,80 sur `cave-850`), `text-water` 4,48:1 sur
`cave-850`. L'app emploie déjà `alert-strong` pour le texte d'erreur.

## Clair (proposé)

Papier chaud, encre charbon, ni `#000` ni `#fff`. La profondeur vient du fond, comme en
sombre : la page est le papier le plus soutenu, le panneau et la surface surélevée
s'éclaircissent. Contrastes WCAG mesurés sur la page (`cave-950`) et le panneau (`cave-900`).

| Rôle | Jeton | Valeur | Page | Panneau | Seuil |
|---|---|---|---|---|---|
| Page | `cave-950` | `#F2ECE4` | | | |
| Panneau | `cave-900` | `#FAF6F0` | | | |
| Surface surélevée | `cave-850` | `#FFFCF7` | | | |
| Séparateur, bordure | `cave-800`, `cave-700` | `#DDD3C7`, `#BFB2A3` | décor | | |
| Valeur lue, titre | `text-cave-50` | `#1A1613` | 15,32 | 16,70 | 7 |
| Texte courant | `text-cave-200` | `#3A302A` | 10,94 | 11,92 | 7 |
| Texte secondaire | `text-cave-400` | `#655850` | 5,84 | 6,36 | 4,5 |
| Texte sur paille | `text-cave-950` sur `ebc-straw` | `#1A1613` | 10,71 | | 7 |
| Paille en texte | `text-ebc-straw` | `#7A5A12` | 5,42 | 5,91 | 4,5 |
| Houblon : aplat, texte | `hop`, `text-hop` | `#567F45`, `#3F6B2E` | 3,96 ; 5,34 | 4,32 ; 5,82 | 3 ; 4,5 |
| Eau : aplat, texte | `water`, `text-water` | `#4F7E9B`, `#2F5F7D` | 3,74 ; 5,86 | 4,07 ; 6,39 | 3 ; 4,5 |
| Alerte : aplat, texte | `alert`, `text-alert` | `#C8382F`, `#A8291F` | 4,40 ; 5,96 | 4,80 ; 6,50 | 3 ; 4,5 |
| Attention : aplat, texte | `attention`, `text-attention` | `#9C7020`, `#7F5B10` | 3,77 ; 5,25 | 4,10 ; 5,73 | 3 ; 4,5 |
| Marque (bande) | `marque` | `#8A7B6E` | 3,48 | 3,80 | 3 |
| Repère (cible) ; en texte | `repere` ; `text-repere` | `#8A6512` ; `#7A5A12` | 4,53 ; 5,42 | 4,94 ; 5,91 | 3 ; 4,5 |

Repères de rubrique (`area-*`), une valeur pour l'aplat et le texte : production `#9A4F1E`,
finances `#1F64A3`, stocks `#4C6B2A`, agenda `#6A4FB0` (5,10 à 5,33:1 sur la page). L'échelle
EBC décrit la bière et garde ses valeurs ; la paille reste l'aplat de l'action principale.

Trois règles propres au clair (`src/themes.css`) :

- la paille sur papier ne fait que 1,43:1 : chaque aplat `bg-ebc-straw` reçoit un filet
  intérieur `#8A6512` (4,53:1 sur la page), composé avec l'anneau de focus ;
- le focus paille de l'app passe à `#8A6512` ;
- le chevron dessiné en dur par `src/index.css` (`#9A8A7E`, 2,9:1) passe à `#655850`.

## Construire et contrôler

Depuis `prototypes/houblons-v4` :

- `npm run ecran:build -- --version=version-a --theme=clair` (défauts : `version-a`, `clair`,
  variante `essai`) → `maquettes/<version>/` : `index.html`, `etat-b.html`, `radar.html`,
  `assets/`. Pages ouvrables en `file://`. `?theme=cave` et `?etat=b` changent l'affichage
  sans reconstruire.
- `npm run ecran:dev` : serveur Vite de l'écran.
- `npm run ecran:contraste` : seuils ci-dessus, bloquant pour le clair. Témoin négatif :
  `CONTRASTE_TEMOIN=1` doit imprimer `CONTRASTE ECHEC`.

## Limites

- Seules les classes Tailwind suivent le thème. Les hex isolés de l'app (781 dans 31 fichiers
  CSS selon la recherche G) et les ombres noires ne sont pas repris : un composant qui en porte
  reste sombre en clair.
- Pas de réglage Auto (`prefers-color-scheme`) ni d'interrupteur dans l'écran : le thème est
  fixé à la construction.
- Valeurs non vérifiées sur le téléphone du brasseur, en brasserie (preuve locale demandée par
  la recherche G).
