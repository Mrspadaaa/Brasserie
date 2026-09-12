import React, { useEffect, useState } from 'react';
import { Sheet } from './Sheet';
import { loadFermentationResearch } from '../services/fermentationResearch';

function InlineSources({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const links = /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g;
  let offset = 0;
  for (const match of text.matchAll(links)) {
    parts.push(text.slice(offset, match.index));
    parts.push(<a key={match.index} href={match[2]} target="_blank" rel="noreferrer" className="text-water underline underline-offset-4 break-words">{match[1]}</a>);
    offset = match.index! + match[0].length;
  }
  parts.push(text.slice(offset));
  return <>{parts}</>;
}

/** Text and HTTPS links only: no raw HTML, iframe or public download URL. */
export function FermentationResearchSheet({ onClose }: { onClose: () => void }) {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setMarkdown(null); setError('');
    loadFermentationResearch().then(
      text => { if (!cancelled) setMarkdown(text); },
      reason => {
        if (cancelled) return;
        const denied = ['functions/unauthenticated', 'functions/permission-denied'].includes(reason?.code);
        setError(denied ? 'Connecte-toi avec le compte autorisé pour lire la synthèse.' : 'La synthèse ne peut pas être chargée pour le moment.');
      }
    );
    return () => { cancelled = true; };
  }, [attempt]);
  return <Sheet open onClose={onClose} title="Recherche sur la fermentation" subtitle="Synthèse et sources" className="sm:max-w-4xl sm:mx-auto">
    {!markdown && !error && <p role="status" className="text-cave-200 py-4">Chargement de la synthèse…</p>}
    {error && <div className="space-y-3 py-4"><p role="alert" className="text-cave-200">{error}</p><button className="min-h-touch text-water underline" onClick={() => setAttempt(n => n + 1)}>Réessayer</button></div>}
    {markdown && <article aria-label="Synthèse de recherche sur la fermentation" className="mx-auto max-w-3xl pb-8 text-base leading-relaxed text-cave-200">
      {markdown.trim().split(/\r?\n\r?\n/).map((block, i) => {
        if (block.startsWith('# ')) {
          const [title, ...date] = block.split(/\r?\n/);
          return <header key={i} className="border-b border-cave-700 pb-6 mb-6"><h1 className="text-2xl sm:text-3xl font-semibold text-cave-50 leading-tight">{title.slice(2)}</h1><p className="text-sm text-cave-400 mt-3">{date.join(' ')}</p></header>;
        }
        if (block.startsWith('## ')) return <h2 key={i} className="mt-8 mb-4 text-xl font-semibold text-cave-50">{block.slice(3)}</h2>;
        return <p key={i} className="my-4"><InlineSources text={block.replace(/\r?\n/g, ' ')} /></p>;
      })}
    </article>}
  </Sheet>;
}
