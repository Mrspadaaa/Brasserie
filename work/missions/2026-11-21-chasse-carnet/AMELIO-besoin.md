# AMELIO-besoin (regard Brasseur, conseiller Opus, 21.11)

## Regard du brasseur : un mois d'équipement (chambre froide, moulin, pompe, fermenteur)

**Ce que je vis.** Quatre achats en un mois, le carnet ouvert chaque semaine. Je ne quitte l'app pour aucune décision, mais je la quitte pour trois choses : savoir combien ça me coûte vraiment rendu chez moi, demander un devis, et savoir quand je peux payer. Pour le reste (comparer, garder pourquoi), mes mots du 16.11 suffisent : « pas revenir en arrière » (SPEC l. 1784).

**Ce que le code dit déjà**
- Un article en EUR choisi part dans À venir avec un budget de 0 et `budgetKnown: false` (`port-carnet/src/domain/carnets/operations.ts` l. 595-600). Mes achats allemands disparaissent donc de la courbe de caisse.
- Comparer ne classe pas le prix quand deux devises se mélangent (`comparer.ts` l. 269).
- Toutes les réponses IA simulées sont en CHF (`iaSimulee.ts` l. 29-69) : le cas EUR n'est jamais joué.
- L'entretien daté au calendrier (L18), je l'ai retiré le 16.11 (SPEC l. 1828).
- La caisse dans le carnet, je l'ai refusée (s2a2 : « Ça correspond pas du tout à mes besoins ?? », l. 1782 ; `Choisir.tsx` l. 8 : « Aucune caisse ni trésorerie ici »).

**Fiche par idée.** Format : geste aujourd'hui → geste visé ; gain ; fréquence ; coût ; donnée ; classe ; mini maquettes ou non.

1. **Prix rendu en CHF (piste 1).** Aujourd'hui : calculatrice hors de l'app, puis rien dans la caisse. Visé : sous le prix EUR, « ≈ CHF rendu », estimé et marqué comme tel. Le taux est posé par moi ou repris d'une facture EUR passée. On ajoute le port et la TVA d'import (8,1 %, estimé, à vérifier), et on retire la TVA allemande. Gain : une erreur d'argent évitée, et un plan qui garde son montant. Fréquence : chaque achat UE. Coût : moyen. Donnée : taux et frais. Vrai gain. Mini maquettes oui (où se place la ligne).
2. **Le devis devient le prix (piste neuve).** C'est mon flux à moi : « je cherche prix ou demande devis. Je scane devis… et l'ai fait le lien » (l. 1716). Le matériel lourd est souvent « sur demande ». Aujourd'hui : rien ne relie le devis au carnet (`devis` n'apparaît qu'en mot-clé, `analyseLocale.ts` l. 290). Visé : le devis scanné remplit le prix de l'article. Gain : une ressaisie supprimée. Fréquence : chaque gros achat. Coût : moyen. Vrai gain. Mini maquettes non, c'est un lien.
3. **Une ligne de Comparer devient « ce qui compte » (pistes 3, 4 et 9).** Je touche « Largeur de porte » ou « 400 V » et la ligne classe, sans attendre l'IA. C'est une caractéristique lue, pas un gabarit par objet (C2, `modele.ts` l. 10). Gain : le rang ne sort plus de nulle part (CRB-5), en un geste. Coût : petit. Vrai gain. « Est-ce que ça entre ? » se résout ici, sans données de la pièce.
4. **Délai de livraison vers la date du plan (pistes 2 et 5).** Le plan naît avec `date: ''` (l. 597). Visé : la date du plan reprend la dispo ou le délai lus (horizon R2) : la caisse le voit sans un geste de plus (R1). Coût : petit. Vrai gain. La caisse reste dans À venir, pas dans le carnet.
5. **Le bien reçu entre au Parc (piste 7).** Seulement si la facture liée au plan ne le crée pas déjà (à vérifier). Garantie : nice to have. Entretien : écarté (L18 retiré).
6. **Occasion (Ricardo, Anibis) (piste 6).** Nice to have : je n'en ai jamais parlé. La date de fin d'enchère au calendrier serait la seule vraie suite. Le cas « plusieurs vendeurs pour le même article » existe déjà : deux articles.
7. **Doublon avec le parc (piste 8).** Écarté : seul, je sais ce que j'ai. Contre le stock (consommables notés « à acheter ») : nice to have.
8. **Coût d'usage en kWh (piste 9).** Écarté : rarement décisif. La tension (230 ou 400 V) passe par l'idée 3.

**Liste classée**
1. Prix rendu en CHF, et le plan qui garde son montant (vrai gain).
2. Une ligne de Comparer devient critère en un toucher (vrai gain, petit).
3. Le devis scanné nourrit l'article (vrai gain, ses mots).
4. Délai vers la date du plan (vrai gain, petit).
5. Entrée au Parc (à vérifier).
6. Occasion et doublon avec le stock (nice to have).
7. Entretien, kWh, doublon avec le parc (écartés).

Seuil GAIN.md : la fréquence « au moins mensuelle » ne tient que pendant la phase d'équipement. Le pilote doit le dire, pas le cacher.

Deux décisions ne sont pas à moi : un taux de change récupéré en ligne est un appel externe, à l'utilisateur de l'accepter. La forme de la ligne « ≈ CHF rendu » revient au brasseur, en mini maquettes.

Position : autre voie : pas de caisse dans le carnet ; corriger d'abord le prix (rendu en CHF, devis), le reste suit par À venir.

LEÇON PROPOSÉE : une fixture d'achat couvre chaque devise et chaque prix absent (EUR, « sur demande »). Sinon, la perte du montant entre le carnet et la caisse reste invisible.
