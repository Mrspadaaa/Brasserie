"""Read-only extraction. Run with Python containing pdfplumber; no paid AI."""
import json
from pathlib import Path
import pdfplumber

base = Path('.codex-remote-attachments/yeast-catalogue/pdf')
for file in base.glob('*.pdf'):
    with pdfplumber.open(file) as doc:
        pages = [page.extract_text(layout=False) or '' for page in doc.pages]
        (base / (file.stem + '.text.json')).write_text(json.dumps(pages, ensure_ascii=False), encoding='utf8')
        tables = [page.extract_tables() for page in doc.pages]
        (base / (file.stem + '.tables.json')).write_text(json.dumps(tables, ensure_ascii=False), encoding='utf8')
        # The official Omega directory has six independent columns on each page.
        # Reading across them assigns one strain's measurements to its neighbour.
        if file.stem == 'omega':
            columns = []
            for number, page in enumerate(doc.pages, start=1):
                clean = page.dedupe_chars()
                for column in range(6):
                    region = clean.crop((column * page.width / 6, 0,
                                         (column + 1) * page.width / 6, page.height))
                    columns.append({'page': number, 'column': column,
                                    'text': region.extract_text(x_tolerance=1) or ''})
            (base / 'omega.columns.json').write_text(json.dumps(columns, ensure_ascii=False), encoding='utf8')
        print(file.stem, len(pages), 'pages', sum(map(len, pages)), 'characters')
