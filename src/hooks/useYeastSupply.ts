import { useMemo } from 'react';
import { readYeastProductDocument, readYeastSupply, type YeastProductDocument, type YeastSupply } from '../../functions/src/yeastSupplySchema';
import bootstrap from '../data/yeastSupplyBootstrap.json';
import { mergeYeastSupply } from '../domain/yeastPitching';
import { useStorageValue } from './useLiveData';
import { StorageService } from '../services/storage';

const BOOTSTRAP: YeastSupply = readYeastSupply(bootstrap) ?? { version: 1, products: [], offers: [] };
const NO_DOCUMENTS: YeastProductDocument[] = [];

/** Merge only canonical documents that pass the product/offer reader. */
export function useYeastSupply(): YeastSupply {
  const stored: unknown = useStorageValue(StorageService.getYeastProducts);
  const documents = useMemo(() => Array.isArray(stored)
    ? stored.flatMap(row => {
      const document = readYeastProductDocument(row);
      return document ? [document] : [];
    })
    : NO_DOCUMENTS, [stored]);
  return useMemo(() => mergeYeastSupply(BOOTSTRAP, documents), [documents]);
}
