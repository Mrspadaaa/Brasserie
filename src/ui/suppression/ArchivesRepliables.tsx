/** « Archivés · n » repliable, sous la liste (maquette suppression/v2) : chaque rangée garde son nom et dit « archivé · liens gardés » ; « Ressortir » la remet en service. */
import React, { useId, useState } from 'react';
import { Archive, Beer, ChevronDown, Cylinder, Users } from 'lucide-react';
import './suppression-liee.css';

export interface RangeeArchivee { id: string; nom: string; sous: string }

const ICONE = { fut: Cylinder, client: Users, brassin: Beer } as const;
const TEINTE = { fut: 'stocks', client: 'agenda', brassin: 'production' } as const;

export const ArchivesRepliables: React.FC<{
  sorte: keyof typeof ICONE; rangees: RangeeArchivee[]; onRessortir: (id: string) => void; className?: string;
}> = ({ sorte, rangees, onRessortir, className = '' }) => {
  const [ouvert, setOuvert] = useState(false);
  const liste = useId();
  if (rangees.length === 0) return null;
  const Icone = ICONE[sorte];
  return (
    <section className={`su su-arch ${className}`} aria-label="Archivés">
      <button type="button" className="su-arch-h" aria-expanded={ouvert} aria-controls={liste} onClick={() => setOuvert((o) => !o)}>
        <Archive size={22} aria-hidden="true" /><span>Archivés · <span className="tabular-nums">{rangees.length}</span></span><ChevronDown size={22} aria-hidden="true" />
      </button>
      {ouvert && (
        <div id={liste} className="su-arch-l">
          {rangees.map((r) => (
            <div key={r.id} className="su-arch-r">
              <span className="su-tuile" data-teinte={TEINTE[sorte]} aria-hidden="true"><Icone size={22} /></span>
              <div className="su-tx"><b>{r.nom}</b><span>{r.sous}</span></div>
              <button type="button" className="su-ress" aria-label={`Ressortir ${r.nom}`} onClick={() => onRessortir(r.id)}>Ressortir</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
