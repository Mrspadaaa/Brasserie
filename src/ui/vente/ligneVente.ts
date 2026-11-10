/**
 * Une ligne de vente porte son brassin, son format et les litres d'UNE unité dans `FinanceLine.sourceReference` : `vente:<brassin|->:<format>:<litres>`.
 * Aucune règle de finance ne lit ce champ (grep, revue B) ; pas de schéma neuf. Les litres sont écrits dans la ligne : un fût de 30 L compte 30 L.
 */
export function encoderLigneVente(batchId: string | undefined, formatId: string, litresUnite: number): string {
  return `vente:${batchId && !batchId.includes(':') ? batchId : '-'}:${formatId}:${Number(litresUnite.toFixed(3))}`;
}

export interface LigneVenteLue { batchId: string | undefined; formatId: string; litresUnite: number }

export function decoderLigneVente(texte: string | undefined): LigneVenteLue | null {
  const m = /^vente:([^:]+):([^:]+):(\d+(?:\.\d+)?)$/.exec(texte ?? '');
  if (!m) return null;
  const litres = Number(m[3]);
  return Number.isFinite(litres) && litres > 0 ? { batchId: m[1] === '-' ? undefined : m[1], formatId: m[2], litresUnite: litres } : null;
}
