# REPRISE V0 + V1 (Chasse Carnet, 21.11) — agent à 154 k, relais

Code : worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (branche claude/port-carnet-1711). Rien n'est commité. Rien n'est déployé.

## V0 banc : FAIT (à commiter par chemins, index temporaire)
Fichiers (tous dans port-carnet) :
- `scripts/parcours/fixtures/carnet.mjs` : `CHAMBRE_FROIDE` (2 articles sans prix, 10 valeurs texte dont « Épaisseur de l&apos;isolation » et « Couleur : », noms « Chambre froide - … »), doc « ZZ TEST — Chambre froide » ajouté aux génériques ; `ids.chambreFroide`.
- `scripts/parcours/carnet.mjs` : option `--seulement <motif>` (ne joue que les fichiers de carnet-etapes/ dont le nom contient le motif), chargeur de `carnet-etapes/*.mjs` (export default async (ctx) ; `_*.mjs` = aides), `ctx` (etape, ok, echec, toucher, cap, demarrer…), étape 06 : « Carnets 2 » / `/Carnets\s*2\d/` (le compte passe à 21).
- `scripts/parcours/carnet-etapes/_chambre.mjs` (ouvrirChambre, ouvrirComparer, lireComparer, lireArticles) et `00-chambre-froide.mjs` (V0-02, V0-03, V0-04 : rejouent captures 02 à 04).
Preuve : `node scripts/parcours/carnet.mjs <dossier> --seulement 00` → « PARCOURS CARNET OK » sur l'arbre ET sur `--ref en-ligne/2026-11-21-tour8` (55 s chacun). V0-03 : 2 articles, aucun CHF, 3 pastilles de rang ; V0-04 : 10 lignes, tableau 713×521, ligne prix non, entité brute « Épaisseur de l&apos;isolation », deux-points « Couleur : ». Capture `390-v0-04-comparer.png` ouverte et regardée (scratchpad `v0-arbre/`), conforme à la capture 04 du brasseur.
Limite : « la lecture simulée qui publie 4'890.00 » ne peut pas se poser côté banc sans toucher `src/domain/carnets/iaSimulee.ts` (V2) : `pageSimulee` ne connaît que PAGES_BANC / fixtureCarnets ; `PageLue.prix` est un nombre. « 4'890.00 » est donc couvert par V1 (vitest). Le contrôle CRP-1 au doigt (V2) devra coller un lien de famille du banc (hotte-140 = 1980 CHF) avec l'IA qui ne rend pas de prix ; à décider avec V2. Non rejoué en entier : le parcours complet (étapes 00 à 40) sur l'arbre, après l'ajout du 21e carnet (à confirmer : `node scripts/parcours/carnet.mjs <dossier>`).

## V1 lecture du lien : TESTS ÉCRITS, CODE À FAIRE
Fichier de test (déjà modifié) : `tests/unit/carnetsLireLien.test.ts` : import de `prixLocalise` ajouté ; blocs ajoutés en fin de fichier (prixLocalise table, lirePage prix, entités/libellés). `npm test -- …` échoue AVANT vitest (hook de lint « Use Input or NumberInput … » : état du dépôt, pas mon code) : lancer `npx vitest run tests/unit/carnetsLireLien.test.ts` depuis port-carnet. Rouge à constater d'abord (lireLien.ts == celui du tag, `git diff en-ligne/2026-11-21-tour8 -- functions/src/lireLien.ts` vide), puis coder.

### État de l'art (décision, L29) — à recopier dans RESULTAT.md et en commentaire de lireLien.ts
- Problème d'école : lire un montant écrit sans locale (« 4'890.00 », « 4 890,00 », « 4,890.00 », « CHF 1'250.– ») et décoder des entités HTML dans un JSON-LD.
- Examiné : `Intl.NumberFormat` ne lit pas ; `@internationalized/number` (NumberParser) exige une locale que la page ne donne pas et un nouveau paquet dans functions/package.json (déploiement : accord) ; schema.org dit « point décimal, aucun séparateur de milliers » mais les boutiques l'enfreignent ; la méthode standard des extracteurs de prix (price-parser) est l'heuristique du dernier séparateur. Entités : `entities` (htmlparser2) n'est pas déclaré dans functions/package.json (4.5.0 hoisté) ; cheerio, déclaré, décode déjà : `load('<i>'+t.replace(/</g,'&lt;')+'</i>').text()`.
- Décision : une fonction pure `prixLocalise(v) → {montant, devise?} | undefined` (règle écrite : groupes d'apostrophes/espaces/NBSP/U+202F de 3 chiffres ; dernier [.,] = décimal si 1 ou 2 chiffres derrière, ou si l'autre séparateur existe ; un seul séparateur suivi de 3 chiffres et entier de 1 à 3 chiffres ≠ 0 = milliers ; sinon undefined ; devise écrite : CHF/EUR/USD/GBP/Fr./SFr/€/£) ; décodage des entités UNE fois, après `JSON.parse`, sur tout le JSON-LD (cheerio) ; une seule rustine interdite : table de tests exhaustive.
### Code à écrire dans `functions/src/lireLien.ts`
1. `export function prixLocalise` (spec ci-dessus ; tests : voir le fichier).
2. `produits()` : décoder toutes les chaînes du JSON parsé (récursif, profondeur ≤ 6).
3. `lirePage` : offres = p.offers + p.hasVariant[].offers + offers.offers (AggregateOffer) ; montants : price, lowPrice, highPrice, priceSpecification.price ; devise = offre → `priceCurrency` de la spec → meta `product:price:currency`/`og:price:currency` → devise écrite avec le prix → sinon AUCUN prix ; deux devises → aucun prix ; montant ≤ 0 → aucun ; plusieurs montants distincts (ou AggregateOffer sans highPrice) → le plus bas + `prixDes: true`. Repli og:price avec `prixLocalise`. Dispo et vendeur : comme avant sur les offres non agrégées.
4. Libellés de `valeurs` : retirer `\s*[:：]\s*$`, ignorer un nom vide ensuite.
5. `functions/src/carnetIA.ts` : `PageLue.prixDes?: boolean` (« dès » : plusieurs prix publiés, le plus bas est donné). Type seul.
6. Mettre à jour le test existant « AggregateOffer ou offres de prix différents : aucun prix » (il dit l'ancien comportement) : il est remplacé par les nouveaux tests ; le retirer ou l'aligner.
### Ce qui dépend du déploiement (à noter dans RESULTAT.md, accord A1)
Le prix des offres variables, « 4'890.00 », le « dès » (`prixDes`), le décodage et « Couleur : » côté serveur n'atteignent l'app qu'après déploiement de `lireLien` (functions). Sans lui : V2 les rattrape à la lecture côté app (consigne du pilote : prix et entités côté app, à la lecture) ; V2 doit lire `PageLue.prixDes` et appliquer la même règle de prix (`prixLus` de modele.ts lit déjà « 4'900.– »).

## À faire ensuite, dans l'ordre
1. Écrire le code V1, lancer vitest (rouge puis vert), `cd functions && npx tsc --noEmit` pour le type.
2. Rejouer `npx vitest run tests/unit/carnetsLireLien.test.ts` et les tests voisins (carnets*).
3. Commit par chemins avec index temporaire (GIT_INDEX_FILE) : V0 = les 5 fichiers de scripts/parcours ; V1 = functions/src/lireLien.ts, functions/src/carnetIA.ts, tests/unit/carnetsLireLien.test.ts. Port-carnet a des changements d'autres voies (Calendrier) : jamais `git add -A`.
4. BUGS.md (dans `Brasserie/work/missions/BUGS.md`, lignes 2224-2235, 2256) : CRP-1 (maillon 1 seulement : serveur local ; ne PAS passer « corrigé » tant que V2 n'a pas fait les maillons 2 et 3 ? — à trancher par le pilote ; sinon note « maillon 1 corrigé en local, non déployé »), CRP-2, CRB-4 : état « corrigé » en colonne état, commit dans la colonne suivante. Vérifier `node scripts/agents/controle-bugs.mjs` → « BUGS OK ».
5. RESULTAT.md dans `work/missions/2026-11-21-chasse-carnet/voies/v0-v1/` (ligne 1 : OK/ECHEC).
