import React, { useEffect, useRef, useState } from 'react';
import { AiClient } from '../services/aiClient';
import { Sparkles, Check, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Remplissage assisté : chercher, proposer, sourcer — jamais bloquer.
 *
 * ⚠️ Ce que ça règle, mot pour mot : « par exemple j'ai une SafAle US-05, toutes
 * les infos sont trouvables, donc Gemini doit trouver sans me bloquer à la fin
 * puis remplir ».
 *
 * L'application demandait l'atténuation, la plage de température et la
 * floculation d'une levure dont Fermentis publie tout depuis vingt ans. Sans
 * ces valeurs, la densité finale restait « incalculable » et Gaëtan était
 * arrêté à la dernière étape.
 *
 * Le motif, appliqué partout :
 *   1. un bouton à côté du groupe de champs incomplet ;
 *   2. la recherche est **ancrée sur Google** côté serveur — les valeurs
 *      viennent de la fiche du fabricant, pas de la mémoire du modèle ;
 *   3. la **source est affichée** et reste visible jusqu'à validation ;
 *   4. rien n'est écrit sans que Gaëtan ait vu ce qui va l'être.
 *
 * C'est la règle « ne rien inventer » tenue autrement : au lieu de laisser vide
 * et d'arrêter, on va chercher, on montre d'où ça vient, et on laisse le
 * dernier mot au brasseur.
 */

import {
  IngredientFacts,
  IngredientKind,
  sanitizeFacts,
  fillsGap,
  ingredientKey
} from '../domain/ingredientFacts';
export type { IngredientFacts, IngredientKind } from '../domain/ingredientFacts';

/** Ce qu'on affiche d'une fiche retrouvée, selon le type d'ingrédient. */
const SHOWN: Record<
  IngredientKind,
  Array<{ key: keyof IngredientFacts; label: string; unit?: string }>
> = {
  levure: [
    { key: 'lab', label: 'Laboratoire' },
    { key: 'strain', label: 'Souche' },
    { key: 'form', label: 'Forme' },
    { key: 'attenuationPct', label: 'Atténuation', unit: '%' },
    { key: 'tempMinC', label: 'Temp. mini', unit: '°C' },
    { key: 'tempMaxC', label: 'Temp. maxi', unit: '°C' },
    { key: 'flocculation', label: 'Floculation' },
    { key: 'alcoholTolerancePct', label: 'Tolérance alcool', unit: '%' }
  ],
  malt: [
    { key: 'grainType', label: 'Type' },
    { key: 'colorEbc', label: 'Couleur', unit: 'EBC' },
    { key: 'potentialPpg', label: 'Potentiel', unit: 'PPG' },
    { key: 'diastaticPower', label: 'Pouvoir diastasique', unit: '°L' }
  ],
  houblon: [
    { key: 'alphaPct', label: 'Acides alpha', unit: '%' },
    { key: 'betaPct', label: 'Acides bêta', unit: '%' },
    { key: 'usage', label: 'Usage' },
    { key: 'aroma', label: 'Arômes' }
  ]
};

interface AiAssistProps {
  kind: IngredientKind;
  /** Nom de l'ingrédient à rechercher. Le bouton reste inactif sans lui. */
  name: string;
  /** Ce qui manque encore — c'est ce qui justifie le bouton. */
  missing: string[];
  onApply: (facts: IngredientFacts) => void;
  className?: string;
}

export const AiAssist: React.FC<AiAssistProps> = ({
  kind,
  name,
  missing,
  onApply,
  className = ''
}) => {
  const [busy, setBusy] = useState(false);
  const [facts, setFacts] = useState<IngredientFacts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  useEffect(() => {
    request.current += 1;
    setFacts(null);
    setError(null);
    setBusy(false);
    return () => {
      request.current += 1;
    };
  }, [kind, name]);

  const search = async () => {
    const id = ++request.current;
    setBusy(true);
    setError(null);
    setFacts(null);

    try {
      const res = await AiClient.run<IngredientFacts>({
        task: 'lookupIngredient',
        tier: 'fast',
        instruction: `${kind} : ${name.trim()}`,
        context: { kind, name: name.trim(), manquant: missing }
      });

      if (request.current !== id) return;
      if (!res.ok || !res.data) {
        setError(res.error ?? 'Recherche impossible.');
        return;
      }
      if (!res.data.found) {
        setError(res.data.note || `Rien de publié trouvé pour « ${name} ».`);
        return;
      }
      const clean = sanitizeFacts(res.data);
      if (!fillsGap({ kind, name, key: ingredientKey(kind, name), missing }, clean)) {
        setError('Aucune caractéristique exploitable retrouvée.');
        return;
      }
      setFacts(clean);
    } catch {
      if (request.current === id) setError('Recherche interrompue. Tu peux réessayer.');
    } finally {
      if (request.current === id) setBusy(false);
    }
  };

  const rows = facts
    ? SHOWN[kind].filter((f) => facts[f.key] !== undefined && facts[f.key] !== null)
    : [];

  if (!name.trim() || missing.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {!facts && (
        <button
          type="button"
          onClick={search}
          disabled={busy}
          className="w-full min-h-touch rounded-control border border-ebc-straw/50
                     text-ebc-straw flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Recherche de la fiche…
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Compléter avec l’IA
            </>
          )}
        </button>
      )}

      {missing.length > 0 && !facts && !busy && (
        <p className="text-sm text-cave-500 leading-snug">
          Manque : {missing.join(', ')}. Ces valeurs sont publiées par le fabricant.
        </p>
      )}

      {error && (
        <p className="flex items-start gap-2 text-sm text-ebc-amber leading-snug">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error} — à saisir à la main.</span>
        </p>
      )}

      {facts && (
        <div className="panel p-4 space-y-3 border-ebc-straw/40">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-ebc-straw shrink-0 mt-1" />
            <div className="min-w-0">
              <p className="text-base text-cave-100">{facts.name}</p>
              {/* La source est le cœur du dispositif : sans elle, on ne saurait
                  pas distinguer une donnée retrouvée d'une donnée inventée. */}
              <p className="text-sm text-cave-500 leading-snug">{facts.source}</p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            {rows.map((f) => (
              <div key={String(f.key)}>
                <dt className="text-sm text-cave-500">{f.label}</dt>
                <dd className="reading text-base text-cave-100">
                  {String(facts[f.key])}
                  {f.unit ? ` ${f.unit}` : ''}
                </dd>
              </div>
            ))}
          </dl>

          {facts.note && <p className="text-sm text-cave-400 leading-snug">{facts.note}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setFacts(null)}
              className="flex-1 min-h-touch rounded-control border border-cave-700 text-cave-200"
            >
              Ignorer
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(facts);
                setFacts(null);
              }}
              className="flex-1 min-h-touch rounded-control bg-ebc-straw text-cave-950
                         font-semibold flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Reprendre ces valeurs
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
