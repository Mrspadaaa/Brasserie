# u4 — 100 bières possibles

**L'idée.** L'incertitude ×100 devient un nuage de 100 bières tirées dans les plages publiées : un point par bière, Citra au-dessus de l'axe, Cascade en dessous. Chaque ligne compte combien de bières passent le seuil, et l'on peut fixer un facteur pour voir d'où vient l'écart.

## Pourquoi ça aide à comprendre et à choisir

- Le brasseur : « Si il y a des écart x100 justement il faut que ça se voit pas que ce soit effacé ». Ici, « ×0,24–295 » n'est plus une plage abstraite : c'est un nuage qui s'étale sur trois décades, et un compte qu'on lit d'un coup d'œil.
  - Tropical (4MMP) : 100/100 avec Citra, 85/100 avec Cascade.
  - Floral (linalol) : 78 contre 53.
- « D'où vient l'écart ? » répond à une question que personne ne posait : la moitié de l'incertitude vient du **seuil choisi**.
  - Pour le linalol de Citra : seuil seul ×205, part retrouvée seule ×11, huile du lot seule ×2,6.
  - Fixer le seuil puis la part retrouvée resserre le nuage sous le doigt : 78/100 devient 100/100, 38–865 µg/L devient 81–342.
  - C'est la carte de ce qu'il faudrait mesurer pour savoir.
- Vraies valeurs dans le même dessin : les losanges sont les mesures publiées en bière (Citra 144 µg/L E06, Cascade 56,9 µg/L à 2 g/L H12, 4MMP de Cascade 5,8 ng/L H20…), avec leur source au toucher. La zone claire porte les seuils publiés.
- Une borne non publiée ne se tire pas. La page montre seulement ce qui est sûr, en hachures :
  - Galaxy 4MMP : « au moins 28 → ? », donc 100/100 même au plus bas ;
  - Idaho 7 4MMP : « ? ← au plus 28 », compte « inconnu » ;
  - Galaxy géraniol : « inconnu : teneur inconnue ».

## Ce qu'elle casse

- **Premier écran : 215 mots** (règle des 60 dépassée) : graduations et comptes.
- Le tirage log-uniforme dans des enveloppes de sources est une **convention de la maquette** : « 78 sur 100 » n'est pas une probabilité mesurée. La page le dit en tête et au plan 3, mais le chiffre a l'air plus solide qu'il n'est.
- C'est un rapport au seuil, pas une intensité perçue, et aucun seuil n'est mesuré en bière noire.
- Le compte « 4MMP » de Cascade utilise l'enveloppe de la littérature (0,8–16,8 µg/kg), pas la base commune (2,4–3,8) : c'est plus prudent et plus large. Un réglage « base commune » manque.

## Captures (`captures/u4/`)

- `nuage-01-avant-citra-cascade` → `02-apres-seuil-fixe` → `03-apres-seuil-et-part-fixes` → `04-feuille-linalol` ;
- `galaxy-01-galaxy-idaho7` (bornes inconnues en hachures) → `02-galaxy-idaho7-whirlpool`.

## Contrôle d'honnêteté

```
u4 · 10 pictos · 7 mesurées · 811 simulées · 0 faute(s)
LISIBLE OK
```

Premier passage : un échec L2 (4MMP et linalol sans picto dans la réponse). Corrigé.
