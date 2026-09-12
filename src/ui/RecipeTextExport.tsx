import { Textarea } from './Input';
import React, { useMemo, useState } from 'react';
import { Check, ClipboardCopy, Download } from 'lucide-react';

export function RecipeTextExport({ buildText }: { buildText: () => string }) {
  const [state, setState] = useState<'ready' | 'copying' | 'copied'>('ready');
  const [error, setError] = useState('');
  const [showText, setShowText] = useState(false);
  const preview = useMemo(() => {
    if (!showText) return { text: '', error: '' };
    try { return { text: buildText(), error: '' }; }
    catch (error) { return { text: '', error: error instanceof Error ? error.message : 'Impossible de préparer la recette.' }; }
  }, [buildText, showText]);
  const copy = async () => {
    setError(''); setState('copying');
    try {
      const text = buildText();
      if (!navigator.clipboard?.writeText) throw new Error('Presse-papier indisponible. Copie le texte ci-dessous ou télécharge le fichier.');
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch (error) {
      setError(error instanceof Error && error.name !== 'NotAllowedError' ? error.message : 'Copie refusée. Le texte complet et le fichier restent disponibles ci-dessous.');
      setState('ready'); setShowText(true);
    }
  };
  const download = () => {
    if (!preview.text) return;
    const url = URL.createObjectURL(new Blob([preview.text], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'recette-laffinee.txt';
    document.body.append(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="space-y-1">
    <button type="button" disabled={state === 'copying'} onClick={copy}
      className="w-full min-h-touch rounded-control border border-cave-700 text-cave-200 hover:border-ebc-straw hover:text-ebc-straw flex items-center justify-center gap-2 text-sm disabled:opacity-50">
      {state === 'copied' ? <><Check className="w-4 h-4"/>Recette copiée — collez-la où vous voulez</>
        : <><ClipboardCopy className="w-4 h-4"/>{state === 'copying' ? 'Copie en cours…' : 'Copier la recette en texte'}</>}
    </button>
    {error && <p role="alert" className="text-xs text-alert-strong">{error}</p>}
    <details open={showText} onToggle={event => setShowText(event.currentTarget.open)}>
      <summary className="min-h-touch cursor-pointer text-xs text-cave-200">Texte complet et fichier .txt</summary>
      {preview.error ? <p role="alert" className="text-xs text-alert-strong">{preview.error}</p> : showText && <div className="space-y-1">
        <Textarea aria-label="Texte complet de la recette" readOnly value={preview.text} rows={6}
          className="w-full min-w-0 rounded-control border border-cave-700 bg-cave-850 p-2 text-base text-cave-200"/>
        <button type="button" className="min-h-touch inline-flex items-center gap-1 rounded-control border border-cave-700 px-2 text-xs text-cave-200" onClick={download}><Download className="w-3.5 h-3.5"/>Télécharger .txt</button>
      </div>}
    </details>
  </div>;
}
