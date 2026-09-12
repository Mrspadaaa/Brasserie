import { useEffect, useMemo, useState } from 'react';
import type { HopVariety } from '../../../functions/src/hopIndexSchema';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { loadGuideVarieties } from './guideData';

/** Same read-only catalogue in the index, recipe picker and workshop. Saved IDs win. */
export function useHopCatalogue() {
  const stored = useStorageValue(StorageService.getHopVarieties);
  const [catalogue, setCatalogue] = useState<HopVariety[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    loadGuideVarieties().then(rows => { if (active) setCatalogue(rows); })
      .catch(() => { if (active) setError('Catalogue indisponible ; les fiches enregistrées restent accessibles.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const varieties = useMemo(() => [...new Map([...catalogue, ...stored].map(v => [v.id, v])).values()], [catalogue, stored]);
  return { varieties, stored, loading, error };
}
