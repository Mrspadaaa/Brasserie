import { useEffect, useRef, useState, type ReactNode } from "react";

/** w1b : une valeur que le geste vient de changer prend une pastille bleue pendant 2,5 s (jamais au premier affichage). */
function useNeuf(valeur: unknown): boolean {
  const avant = useRef(valeur);
  const [neuf, setNeuf] = useState(false);
  useEffect(() => {
    if (Object.is(avant.current, valeur)) return;
    avant.current = valeur;
    setNeuf(true);
    const t = setTimeout(() => setNeuf(false), 2500);
    return () => clearTimeout(t);
  }, [valeur]);
  return neuf;
}

/** Le chiffre en gras, avec sa pastille « neuf » quand `v` change. `className` s'ajoute (couleur dans / hors repère). */
export function Neuf({ v, className, children }: { v: unknown; className?: string; children: ReactNode }) {
  const neuf = useNeuf(v);
  const classes = [className, neuf ? "ew-neuf" : ""].filter(Boolean).join(" ");
  return <b className={classes || undefined}>{children}</b>;
}
