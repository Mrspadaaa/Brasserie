import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Star, Trash2 } from 'lucide-react';

/**
 * Ligne de liste que l'on fait glisser pour agir.
 *
 * ⚠️ Ce que ça règle : épingler un article ou en supprimer un demandait
 * d'ouvrir la fiche, trouver le bouton, confirmer — trois écrans pour un geste
 * qui se fait des dizaines de fois par semaine. Au pouce, un glissement le fait
 * sans quitter la liste.
 *
 *   ← vers la gauche  supprimer (toujours confirmé : c'est irréversible)
 *   → vers la droite  épingler / désépingler (réversible, donc immédiat)
 *
 * Le geste ne remplace jamais le bouton : sur ordinateur, où l'on ne glisse
 * pas, les mêmes actions restent accessibles dans la fiche et au clavier. Un
 * geste qui serait le SEUL chemin vers une action la rendrait invisible.
 */

const THRESHOLD = 88;

interface SwipeRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  /** Ce qu'on supprime, nommé — l'action de gauche l'annonce avant de partir. */
  label: string;
  disabled?: boolean;
}

export const SwipeRow: React.FC<SwipeRowProps> = ({
  children,
  onDelete,
  onToggleFavorite,
  isFavorite = false,
  label,
  disabled = false
}) => {
  const x = useMotionValue(0);
  const [armed, setArmed] = useState<'delete' | 'favorite' | null>(null);
  const fired = useRef(false);

  // Les deux fonds n'apparaissent qu'au moment où le geste part de leur côté.
  const deleteOpacity = useTransform(x, [-THRESHOLD, -20, 0], [1, 0.35, 0]);
  const favoriteOpacity = useTransform(x, [0, 20, THRESHOLD], [0, 0.35, 1]);

  const settle = () => animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 });

  if (disabled || (!onDelete && !onToggleFavorite)) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-card">
      {/* Fond gauche : suppression. */}
      {onDelete && (
        <motion.div
          style={{ opacity: deleteOpacity }}
          className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-end gap-2 pr-5
                     bg-alert/15 text-alert pointer-events-none"
          aria-hidden
        >
          <span className="text-sm font-semibold">Supprimer</span>
          <Trash2 className="w-5 h-5" />
        </motion.div>
      )}

      {/* Fond droit : épinglage. */}
      {onToggleFavorite && (
        <motion.div
          style={{ opacity: favoriteOpacity }}
          className="absolute inset-y-0 left-0 w-1/2 flex items-center gap-2 pl-5
                     bg-ebc-straw/15 text-ebc-straw pointer-events-none"
          aria-hidden
        >
          <Star className={`w-5 h-5 ${isFavorite ? 'fill-ebc-straw' : ''}`} />
          <span className="text-sm font-semibold">
            {isFavorite ? 'Retirer' : 'Épingler'}
          </span>
        </motion.div>
      )}

      <motion.div
        drag="x"
        style={{ x }}
        dragDirectionLock
        dragElastic={0.12}
        dragConstraints={{
          left: onDelete ? -THRESHOLD * 1.4 : 0,
          right: onToggleFavorite ? THRESHOLD * 1.4 : 0
        }}
        onDragStart={() => {
          fired.current = false;
        }}
        onDrag={(_, info) => {
          const next =
            info.offset.x <= -THRESHOLD && onDelete
              ? 'delete'
              : info.offset.x >= THRESHOLD && onToggleFavorite
                ? 'favorite'
                : null;
          if (next !== armed) setArmed(next);
        }}
        onDragEnd={(_, info) => {
          // On agit au relâchement, jamais au franchissement du seuil : sinon
          // un geste amorcé puis annulé déclencherait quand même l'action.
          if (fired.current) return;
          fired.current = true;

          if (info.offset.x <= -THRESHOLD && onDelete) {
            settle();
            onDelete();
          } else if (info.offset.x >= THRESHOLD && onToggleFavorite) {
            settle();
            onToggleFavorite();
          } else {
            settle();
          }
          setArmed(null);
        }}
        className={`relative touch-pan-y ${armed ? 'cursor-grabbing' : ''}`}
      >
        {children}
      </motion.div>
    </div>
  );
};
