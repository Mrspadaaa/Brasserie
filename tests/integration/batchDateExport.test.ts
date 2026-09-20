import { expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { ExcelService } from '../../src/services/excelService';

vi.mock('xlsx', async importOriginal => ({ ...await importOriginal<typeof import('xlsx')>(), writeFile: vi.fn() }));
vi.mock('../../src/services/storage', () => ({ StorageService: {
  getTransactions: () => [], getClients: () => [], getTarifs: () => [], getStocks: () => ({ rawMaterials: [], kegs: [] }),
  getBatches: () => [
    { id: 'UNDATED', status: 'planifie', plannedBrewDate: '', brewDate: '' },
    { id: 'PLANNED', status: 'planifie', plannedBrewDate: '27.09.2026', brewDate: '' },
    { id: 'STARTED', status: 'planifie', plannedBrewDate: '27.09.2026', brewDate: '20.09.2026' },
    { id: 'LEGACY-PLAN', status: 'planifie', brewDate: '2026-09-28' },
    { id: 'LEGACY-DONE', status: 'termine', brewDate: '18.09.2026' }
  ]
} }));

it('serializes planned and actual dates separately in a real Excel workbook', () => {
  ExcelService.exportToExcel();
  const [workbook] = vi.mocked(XLSX.writeFile).mock.calls[0];
  const roundTrip = XLSX.read(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }), { type: 'array' });
  const dates = XLSX.utils.sheet_to_json<Record<string, string>>(roundTrip.Sheets.Production)
    .map(row => [row['N° Lot'], row['Date prévue'], row['Date brassage']]);
  expect(dates).toEqual([
    ['UNDATED', '', ''], ['PLANNED', '27.09.2026', ''], ['STARTED', '27.09.2026', '20.09.2026'],
    ['LEGACY-PLAN', '28.09.2026', ''], ['LEGACY-DONE', '', '18.09.2026']
  ]);
});
