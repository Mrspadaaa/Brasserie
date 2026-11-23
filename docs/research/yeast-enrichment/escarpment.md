# Escarpment : caractéristiques et conditions de fermentation

Le 12 septembre 2026, 184 références commerciales existantes ont été examinées. Le supplément `escarpment.json` fournit des observations pour **171 références**. Il inclut les formats professionnels et homebrew distincts ainsi que des cultures mixtes ; ce nombre n’est pas celui de souches génétiquement distinctes.

Les pages consultées exposent désormais leurs caractéristiques structurées : températures, atténuation, floculation, tolérance déclarée, caractère phénolique/diastatique, vitesse relative, descripteurs et styles. Les anciennes références étaient souvent limitées au nom et à une description. Chaque page est rapprochée du **titre exact et de l’identifiant produit Shopify**, afin qu’une redirection ou une carte de produit apparenté ne fournisse pas les faits d’une autre culture.

La [fiche Cali Ale](https://escarpmentlabs.com/products/cali-ale) illustre l’apport : 16–22 °C, atténuation de 73–85 %, floculation moyenne, caractère non phénolique et non diastatique. L’atténuation reste dépendante du moût ; les qualificatifs aromatiques et de vitesse ne deviennent pas des coefficients de simulation. Les « biotransformations » Escarpment décrivent la conversion du géraniol en β-citronellol, sans renseigner un rendement de libération des thiols.

Le tableau primaire [Standard Pitch Rates](https://knowledge.escarpmentlabs.com/article/70-standard-pitch-rate) fournit également une dose cellulaire pour les titres qui concordent exactement avec une ligne professionnelle. Pour Cali Ale, elle vaut 0,9 × 10¹² cellules/hL. Ces doses restent en texte avec leur unité, sans conversion en grammes ou en volume de suspension. Elles ne sont pas recopiées dans les sachets homebrew. La forme liquide n’est renseignée que lorsque ce tableau primaire la documente.

## Conservation des limites

- Les lignes dépourvues de caractéristiques restent dans le catalogue et sont listées dans `gaps` du supplément ; aucune valeur n’est déduite d’une culture voisine.
- Deux produits distribués d’autres fabricants, WLP079 et WildBrew Philly Sour, sont exclus de cette collecte primaire Escarpment. Le nutriment Yeast Lightning ne reçoit aucun paramètre de levure.
- Les descriptions et blocs de caractéristiques d’une même page peuvent différer. Les deux observations sont conservées. Les températures Celsius/Fahrenheit incohérentes de Kölsch [HB] et Ebbegarden [HB] restent documentaires et ne produisent pas de plage numérique exploitable.
- Wild Thing publie une borne ouverte, et son format homebrew expose aussi une plage. Aucune borne supérieure commune n’est inventée.
- La santé de la levure, la nutrition, le calcium, le pH et le moût influencent les résultats. Une tolérance qualitative élevée ne devient pas une valeur numérique calculée.

## Vérification et reproductibilité

Le collecteur `scripts/yeast-catalogue/collect-escarpment-enrichment.mjs` n’écrit que le supplément documentaire. Il conserve HTML et reçus dans `.codex-remote-attachments/yeast-enrichment/escarpment/`, limite ses requêtes par hôte et s’arrête sur un refus ou une limitation explicite. L’option `--cached` relit les contenus reçus et vérifie leur empreinte sans nouvelle collecte. Les dates de publication inconnues restent nulles.

Revue effectuée : contenu réel des caractéristiques et de leurs définitions, identité des pages, séparation des cultures et formats, contrôle des unités et contextes, conservation des contradictions et traçabilité de chaque fait. Le schéma partagé valide chaque catalogue proposé. L’intégration et ses comptes finaux sont décrits dans [README.md](README.md).
