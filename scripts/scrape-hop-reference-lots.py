"""Rebuild a bounded, reviewed pack of PUBLIC samples. No AI or Firestore calls.

Run with the bundled Python (pypdf). --check is offline; --refresh downloads
again but refuses changed source bytes until their transcription is reviewed.
Only sample measurements are retained, never theoretical transfer estimates.
"""
import argparse
import hashlib
import json
import re
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.codex-remote-attachments/hop-index/deep-research-2026-09-08/coa'
OUTPUT = ROOT / 'src/data/hopPublicLotBootstrap.json'
SAMPLES = [
    ('2024/12/2024-Cascade-2400-COA.pdf', '5dc608758f7b77e831a698577489998b36d50b1f34f95909d60deaf0b1fb5315', 'CAS-2400', 'Cascade', '2024-11-19', 'hoptechnic', None),
    ('2024/12/2024-Cascade-2401-COA.pdf', 'a0d71cdceb49ea8f373cdbda4e64a9bdbbe063500e505bd1e2a3271e1eff72c5', 'CAS-2401', 'Cascade', '2024-11-19', 'hoptechnic', None),
    ('2025/12/2025-Cascade-CAS-2519-COA.pdf', '5d6b7fcb36eb6ff5d8c2ef8dbdc74260ad1227226118a8faeaada6dbed514470', 'CAS-2519', 'Cascade', '2025-10-31', 'ych', None),
    ('2025/12/2025-Cascade-CAS-2520-COA.pdf', '5521a29f257e5a0c4ac2ed98911264463f261bf8ea9766df44cb2b01745f2c84', 'CAS-2520', 'Cascade', '2025-10-31', 'ych', None),
    ('2025/12/2025-Idaho-7-ID7-2573-COA.pdf', 'a70f0041bed5f363f78c92eae1f2926b6bf79a8ad35c9bf28c37bd38262e3f88', 'ID7-2573', 'Idaho-7', '2025-11-21', 'ych', None),
    ('2025/12/2025-Motueka-CH25-BH01-MKA-COA.pdf', 'b171a3f1cfcf2a24fba69d2fee26d5989a5d839e131aa9a789e7a34abd91deb2', 'CH25-BH01-MKA', 'Motueka', '2025-04-02', 'clayton', 'Battery Hill Hop Farm'),
    ('2025/12/2025-Motueka-CH25-MA02-MKA-COA.pdf', '727f88fdf1bf324407215dcdc36095c5fc28a248a3967e4ef37a6ec8bc122f16', 'CH25-MA02-MKA', 'Motueka', '2025-04-02', 'clayton', 'Mount Arthur Hop Farm'),
    ('2025/12/2025-Riwaka-CH25-MA09-RWA-COA.pdf', '4948fd37e5048b92a179cb119559f85ac26c5847feaf1ce48d089bd80f0e5472', 'CH25-MA09-RWA', 'Riwaka', '2025-04-02', 'clayton', 'Mount Arthur Hop Farm'),
    ('2025/12/2025-Nelson-Sauvin-CH25-BR05-NSN-COA.pdf', 'd0330aa759ec70fa3d12d69a36db8e96026430b04646e009b4bed9b4ce2203df', 'CH25-BR05-NSN', 'Nelson Sauvin', '2025-04-28', 'clayton', 'Blue Rock Hop Farm'),
]
XML_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=13476479&retmode=xml'
XML_SHA = 'a1f57d0384bc7c4e7daa52bbd8e5f04d04712b519892e02eba8713c56ed914d5'


def read_source(url, path, expected, options):
    if options.refresh or not path.exists():
        if options.check:
            raise ValueError(f'Cache absent pour contrôle hors ligne : {path}')
        request = urllib.request.Request(url, headers={'User-Agent': 'LAffinee-Hop-Reference-Audit/1.0'})
        with urllib.request.urlopen(request, timeout=25) as response:
            data = response.read()
        if hashlib.sha256(data).hexdigest() != expected:
            raise ValueError(f'Source modifiée : revue nécessaire avant remplacement du pack ({url})')
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        path.with_suffix(path.suffix + '.receipt.json').write_text(json.dumps({'url': url, 'retrievedAt': datetime.now(timezone.utc).isoformat(), 'sha256': expected}, indent=2), encoding='utf8')
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != expected:
        raise ValueError(f'Empreinte du cache différente : {path}')
    return data


def find_number(text, label):
    match = re.search(re.escape(label) + r'\s+([0-9]+(?:\.[0-9]+)?)', text, re.I)
    if not match:
        raise ValueError(f'Champ attendu introuvable : {label}')
    return float(match[1])


def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def point(analyte, value, unit, basis, source, method, note=''):
    return {'analyte': analyte, 'unit': unit, 'basis': basis, 'kind': 'point', 'value': value,
            'source': source, 'confidence': 'low', 'method': method,
            'note': 'Valeur publiée sans marge analytique fournie. ' + note}


def build(options):
    varieties, lots = {}, []
    for suffix, sha, lot_number, name, date, family, grower in SAMPLES:
        url = 'https://yakhops.com/wp-content/uploads/' + suffix
        path = CACHE / Path(suffix).name
        read_source(url, path, sha, options)
        reader = PdfReader(path)
        text = unicodedata.normalize('NFKC', '\n'.join(p.extract_text(extraction_mode='layout') for p in reader.pages))
        text = re.sub(r'\s+', ' ', text)
        if lot_number not in text or name not in text:
            raise ValueError(f'Identité incohérente : {lot_number}')
        form = 'unknown' if family == 'clayton' else 'pelletT90'
        author = 'Clayton Hops · Plant & Food Research' if family == 'clayton' else 'Yakima Quality Hops · ' + ('HopTechnic' if family == 'hoptechnic' else 'laboratoire YCH')
        source = {'title': f'Certificate of Analysis · {lot_number}', 'author': author, 'year': int(date[:4]), 'kind': 'coa', 'reference': url,
                  'locator': f"Certificat du {date} ; pages {'1–2' if family == 'hoptechnic' else '1'} ; données vérifiées visuellement le 8 septembre 2026. SHA-256 {sha}."}
        ident = 'public-coa-' + slug(name) + ('-clayton' if family == 'clayton' else '-yqh')
        if ident not in varieties:
            varieties[ident] = {'id': ident, 'name': name + ' · COA publics', 'aliases': [name], 'form': form,
                'descriptions': [{'text': 'Référence regroupant uniquement les échantillons publiés ci-dessous. Aucune plage variétale déduite de ces lots.', 'context': 'unspecified', 'source': source}], 'analysis': []}
        values = {}
        if family == 'hoptechnic':
            match = re.search(r'Alpha % Beta % HSI ([\d.]+) ([\d.]+) ([\d.]+)', text)
            if not match:
                raise ValueError(f'Table analytique non reconnue : {lot_number}')
            values.update(zip(['alpha', 'beta', 'hsi'], map(float, match.groups())))
            values['totalOil'] = find_number(text, 'T90 Pellet Cascade')
        else:
            for analyte, label in ( [('alpha', 'ALPHA ACIDS (%)'), ('beta', 'BETA ACIDS (%)'), ('hsi', 'HOP STORAGE INDEX'), ('totalOil', 'TOTAL OIL ML/100G')] if family == 'clayton' else [('alpha', 'Alpha-Acids'), ('beta', 'Beta-Acids'), ('hsi', 'HSI'), ('totalOil', 'Total Oils')] ):
                values[analyte] = find_number(text, label)
        measurements = []
        for analyte in ['alpha', 'beta', 'hsi', 'totalOil']:
            unit = {'alpha': 'percentMass', 'beta': 'percentMass', 'hsi': 'index', 'totalOil': 'ml100g'}[analyte]
            measurements.append(point(analyte, values[analyte], unit, 'unknown', source, 'Méthode telle que portée sur le COA ; %v/w = mL/100g pour les huiles totales.', 'Base sèche/tel quel non explicitée ; aucun recalcul supposé.'))
        for analyte, label in [('myrcene', 'Myrcene'), ('linalool', 'Linalool'), ('geraniol', 'Geraniol'), ('humulene', 'Humulene'), ('caryophyllene', 'Caryophyllene')]:
            value = find_number(text, label + (' (%)' if family == 'clayton' else ''))
            # Clayton prints % without defining its denominator or GC method on this sheet.
            unit, basis = ('unknown', 'unknown') if family == 'clayton' else ('percentOil', 'oil')
            note = f'Colonne source : {label} (%). Dénominateur non explicité sur cette fiche.' if family == 'clayton' else 'Profil d’huile ; aucune conversion en masse de composé par kg de houblon.'
            measurements.append(point(analyte, value, unit, basis, source, 'Profil GC, EBC 7.12' if family == 'ych' else 'GC-FID, ASBC Hops-17 modifiée' if family == 'hoptechnic' else 'Méthode par composé non explicitée.', note))
        lot = {'id': 'public-coa-' + slug(lot_number), 'varietyId': ident, 'name': f'{name} · {lot_number} · référence publiée', 'lotNumber': lot_number, 'referenceOnly': True, 'form': form, 'analysis': measurements,
               'notes': 'Échantillon documentaire, sans lien au stock. Aucune marge, LOD ou LOQ par composé inventée ; les valeurs ne prouvent pas la représentativité de tout le lot.'}
        if family == 'ych':
            lot['harvestYear'] = int(find_number(text, 'Crop Year:'))
        if grower:
            lot.update({'growingRegion': 'Tapawera, Nouvelle-Zélande', 'grower': grower, 'harvestYear': 2025})
            harvest = re.search(r'HARVEST WINDOW (.*?) ALPHA ACIDS', text)
            lot['notes'] += ' Récolte publiée : ' + harvest[1] + '. Forme du produit non précisée dans le certificat.'
        lots.append(lot)

    xml_path = ROOT / '.codex-remote-attachments/hop-index/public-sources' / hashlib.sha256(XML_URL.encode()).hexdigest()
    xml = ET.fromstring(read_source(XML_URL, xml_path, XML_SHA, options))
    table = xml.find(".//table-wrap[@id='t0010']")
    cells = table.findall('.//tbody/tr')[0].findall('td')
    if 'free equivalent' not in ''.join(cells[0].itertext()):
        raise ValueError('Base du tableau 2 non reconnue')
    values = [float(''.join(cell.itertext())) for cell in cells[1:]]
    if len(values) != 7:
        raise ValueError('Ordre des colonnes du tableau 2 à revoir')
    source = {'title': 'A time-course assessment of polyfunctional thiol release and yeast gene expression in dry-hopped beers', 'author': 'Samia, Chenot, Divilov, Shayevitz et Shellhammer', 'year': 2026, 'kind': 'research', 'reference': 'https://doi.org/10.1016/j.fochms.2026.100445',
              'locator': 'Publication électronique du 30 juillet 2026 ; tableau 2, première ligne seulement ; §2.3 et 2.7. XML primaire : ' + XML_URL + '. SHA-256 ' + XML_SHA + '.'}
    ident = 'cascade-t90-samia2026'
    varieties[ident] = {'id': ident, 'name': 'Cascade T90 · étude Samia 2026', 'aliases': ['Cascade'], 'form': 'pelletT90', 'descriptions': [{'text': 'Un seul lot YCH étudié ; ni numéro commercial ni récolte publiés. Les mesures sont attachées à l’échantillon, sans plage variétale supposée.', 'context': 'unspecified', 'source': source}], 'analysis': []}
    lots.append({'id': 'cascade-t90-samia2026-sample', 'varietyId': ident, 'name': 'Cascade T90 · échantillon Samia 2026', 'referenceOnly': True, 'form': 'pelletT90',
                 'analysis': [point(a, v, 'ugKgThiolEquivalent', 'unknown', source, 'Thiols liés : SIDA-UPLC-MS/MS ; texte §2.7.', 'Équivalents thiol libre ; pas masse du conjugué. Base sèche/tel quel non explicitée. La plage globale de LOD/LOQ ne permet pas d’assigner une limite à ce composé.') for a, v in zip(['3s4mpFree', '3mhFree', '3mhCys', '3mhGsh', '4mmpFree', '4mmpCys', '4mmpGsh'], values)],
                 'notes': 'Échantillon de recherche, pas lot détenu par la brasserie. Les lignes de contribution théorique supposant 100 % de transfert ne sont pas importées comme mesures de bière.'})
    return {'hopVarieties': list(varieties.values()), 'hopLots': lots}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    if args.check and args.refresh:
        parser.error('--check est hors ligne ; incompatible avec --refresh')
    pack = build(args)
    if args.check:
        if json.loads(OUTPUT.read_text(encoding='utf8')) != pack:
            raise SystemExit('Le pack diffère des transcriptions vérifiées.')
    else:
        OUTPUT.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(json.dumps({'varieties': len(pack['hopVarieties']), 'referenceLots': len(pack['hopLots']), 'measurements': sum(len(l['analysis']) for l in pack['hopLots']), 'check': args.check}))
