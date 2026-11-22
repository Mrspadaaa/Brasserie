import { describe, expect, it } from 'vitest';
import { lireTelephone } from '../../src/services/clientPhone';

// TE-2 : « abc » acceptée, `tel:abc`, `wa.me/` vide ; un numéro suisse en 0… donnait un lien WhatsApp qui n'existe pas.

describe('Téléphone d’un client', () => {
  it('refuse « abc » et ce qui n’est pas un numéro', () => {
    for (const mauvais of ['abc', '12', '026 abc 33', '+', '1234567890123456', '026-408-33-33 poste 12']) {
      expect(lireTelephone(mauvais).ok, mauvais).toBe(false);
    }
  });
  it('un numéro suisse en 0… devient un lien d’appel et un lien WhatsApp avec l’indicatif', () => {
    expect(lireTelephone('026 408 33 33')).toEqual({ ok: true, tel: '+41264083333', whatsapp: '41264083333' });
    expect(lireTelephone('079.123.45.67')).toEqual({ ok: true, tel: '+41791234567', whatsapp: '41791234567' });
  });
  it('un numéro international garde son indicatif, « 00 », « + » et « (0) » compris', () => {
    expect(lireTelephone('+41 26 408 33 33')).toEqual({ ok: true, tel: '+41264083333', whatsapp: '41264083333' });
    expect(lireTelephone('0041 26 408 33 33')).toEqual({ ok: true, tel: '+41264083333', whatsapp: '41264083333' });
    expect(lireTelephone('+41 (0)26 408 33 33')).toEqual({ ok: true, tel: '+41264083333', whatsapp: '41264083333' });
    expect(lireTelephone('+33 1 42 68 53 00')).toEqual({ ok: true, tel: '+33142685300', whatsapp: '33142685300' });
  });
  it('sans indicatif ni 0 de tête, on peut appeler mais WhatsApp ne se devine pas', () => {
    expect(lireTelephone('408 33 33')).toEqual({ ok: true, tel: '4083333', whatsapp: null });
  });
});
