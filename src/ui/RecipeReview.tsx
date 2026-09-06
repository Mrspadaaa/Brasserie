import React, { useState } from 'react';
import { AiClient } from '../services/aiClient';
import { Loader2, Sparkles, AlertTriangle, Check, Info, HelpCircle } from 'lucide-react';

/**
 * La recette entière, relue par un expert.
 *
 * ⚠️ Demandé ainsi : « je veux aussi une IA qui analyse tout le truc ».
 *
 * Ce qu'elle reçoit : l'EXPORT TEXTE, exactement celui du bouton d'à côté.
 * C'est délibéré et ça vaut mieux qu'un objet JSON reconstruit pour
 * l'occasion — le modèle lit la même chose que Gaëtan, ce qui rend ses
 * remarques vérifiables ligne à ligne. Le jour où l'export gagne une section,
 * l'analyse la voit sans qu'on ait rien à recâbler ; le jour où l'export ment,
 * les deux mentent ensemble, et ça se remarque.
 *
 * ⚠️ ELLE NE MODIFIE RIEN. Aucune valeur de la recette n'est écrite depuis sa
 * réponse — c'est un avis, pas une correction automatique. La règle tenue
 * partout ailleurs — montrer d'où ça vient, laisser le dernier mot au
 * brasseur — vaut d'autant plus ici que l'analyse porte sur un jugement de
 * goût et non sur une fiche technique vérifiable.
 */

interface Finding {
  severity: 'bloquant' | 'gout' | 'detail';
  topic: string;
  observation: string;
  suggestion?: string;
}

interface Review {
  verdict: string;
  styleFit?: string;
  findings: Finding[];
  missing?: string[];
}

/**
 * Le rang de gravité décide de l'ORDRE et de la couleur.
 *
 * Un défaut bloquant et un réglage fin ne se lisent pas de la même façon : le
 * premier arrête le brassin, le second se discute. Les mélanger dans une liste
 * à plat oblige à tout lire pour trouver ce qui compte.
 */
const GRAVITE: Record<Finding['severity'], { rang: number; label: string; tone: string; Icone: typeof AlertTriangle }> = {
  bloquant: {
    rang: 0,
    label: 'Bloquant',
    tone: 'text-alert border-alert/40 bg-alert/10',
    Icone: AlertTriangle
  },
  gout: {
    rang: 1,
    label: 'Goût',
    tone: 'text-ebc-amber border-ebc-amber/40 bg-ebc-amber/10',
    Icone: Info
  },
  detail: {
    rang: 2,
    label: 'Détail',
    tone: 'text-cave-300 border-cave-700',
    Icone: Info
  }
};

interface RecipeReviewProps {
  /** Rend la recette en texte — la même que celle qu'on exporte. */
  buildText: () => string;
  className?: string;
}

export const RecipeReview: React.FC<RecipeReviewProps> = ({ buildText, className = '' }) => {
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyser = async () => {
    setBusy(true);
    setError(null);
    setReview(null);

    const res = await AiClient.run<Review>({
      task: 'reviewRecipe',
      tier: 'max',
      context: { recette: buildText() }
    });

    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Analyse impossible.');
      return;
    }
    setReview(res.data);
  };

  const findings = [...(review?.findings ?? [])].sort(
    (a, b) => GRAVITE[a.severity].rang - GRAVITE[b.severity].rang
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        type="button"
        onClick={analyser}
        disabled={busy}
        className="w-full min-h-touch-sm rounded-control border border-ebc-straw/50 text-ebc-straw
                   flex items-center justify-center gap-2 text-sm disabled:opacity-50
                   hover:bg-ebc-straw/5 transition-colors"
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Relecture de la recette…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {review ? 'Relire à nouveau' : 'Faire relire la recette'}
          </>
        )}
      </button>

      {error && (
        <p className="flex items-start gap-2 text-2xs sm:text-sm text-ebc-amber leading-snug px-1">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {review && (
        <div className="panel p-2.5 space-y-2.5">
          <p className="text-sm text-cave-100 leading-snug">{review.verdict}</p>
          {review.styleFit && (
            <p className="text-2xs sm:text-sm text-cave-400 leading-snug">{review.styleFit}</p>
          )}

          {findings.length === 0 ? (
            <p className="flex items-center gap-2 text-2xs sm:text-sm text-hop">
              <Check className="w-4 h-4 shrink-0" />
              Rien à redire sur cette recette.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {findings.map((f, i) => {
                const g = GRAVITE[f.severity] ?? GRAVITE.detail;
                return (
                  <li
                    key={`${f.topic}-${i}`}
                    className="pt-1.5 border-t border-cave-850 first:border-0 first:pt-0"
                  >
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded-full border ${g.tone}`}
                      >
                        <g.Icone className="w-3 h-3 shrink-0" />
                        {g.label}
                      </span>
                      <span className="text-2xs text-cave-500">{f.topic}</span>
                    </span>
                    <p className="text-2xs sm:text-sm text-cave-200 leading-snug mt-0.5">
                      {f.observation}
                    </p>
                    {f.suggestion && (
                      <p className="text-2xs sm:text-sm text-cave-400 leading-snug mt-0.5">
                        → {f.suggestion}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/*
            Ce que l'analyse n'a PAS pu juger. Sans cette liste, une relecture
            faite sur une recette dont les malts n'ont pas de couleur passerait
            pour un feu vert, alors qu'elle n'a simplement pas pu regarder.
          */}
          {review.missing && review.missing.length > 0 && (
            <p className="flex items-start gap-2 text-2xs text-cave-500 leading-snug pt-1.5 border-t border-cave-850">
              <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Non jugé, faute de données : {review.missing.join(' · ')}</span>
            </p>
          )}

          <p className="text-2xs text-cave-600 leading-snug">
            Avis consultatif — rien n’a été modifié dans la recette.
          </p>
        </div>
      )}
    </div>
  );
};
