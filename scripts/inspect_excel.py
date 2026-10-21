import zipfile
import xml.etree.ElementTree as ET
import os
import sys
import json
import re

excel_path = os.path.join("data", "MP Manifesto Analysis.xlsx")

with zipfile.ZipFile(excel_path, 'r') as z:
    ns = {
        'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        'pkg': 'http://schemas.openxmlformats.org/package/2006/relationships'
    }

    # Read shared strings
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        ss_xml = z.read('xl/sharedStrings.xml')
        ss_tree = ET.fromstring(ss_xml)
        for si in ss_tree.findall('.//main:si', ns):
            texts = [t.text or '' for t in si.findall('.//main:t', ns)]
            shared_strings.append("".join(texts))

    # Read sheet relationships
    wb_rels_xml = z.read('xl/_rels/workbook.xml.rels')
    wb_rels_tree = ET.fromstring(wb_rels_xml)
    rel_map = {}
    for rel in wb_rels_tree.findall('.//pkg:Relationship', ns):
        rel_map[rel.attrib['Id']] = rel.attrib['Target']

    # Read workbook.xml to get sheets in order
    wb_xml = z.read('xl/workbook.xml')
    wb_tree = ET.fromstring(wb_xml)
    
    sheet_info = []
    for sheet in wb_tree.findall('.//main:sheet', ns):
        name = sheet.attrib.get('name')
        sheet_id = sheet.attrib.get('sheetId')
        rel_id = sheet.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        target = rel_map.get(rel_id)
        if not target.startswith('xl/'):
            target = 'xl/' + target
        sheet_info.append((name, sheet_id, target))

    def col_to_num(col_str):
        num = 0
        for c in col_str:
            num = num * 26 + (ord(c.upper()) - ord('A')) + 1
        return num

    def parse_cell_ref(ref):
        match = re.match(r"([A-Z]+)([0-9]+)", ref)
        if match:
            return match.group(1), int(match.group(2))
        return None, None

    for name, s_id, target in sheet_info:
        print(f"\n==========================================")
        print(f"SHEET: {name} (path: {target})")
        print(f"==========================================")
        
        sheet_xml = z.read(target)
        sheet_tree = ET.fromstring(sheet_xml)
        
        rows = sheet_tree.findall('.//main:sheetData/main:row', ns)
        print(f"Total XML Rows: {len(rows)}")
        
        row_data = []
        for r in rows[:15]:  # first 15 rows
            r_num = int(r.attrib.get('r', 0))
            cells = {}
            for c in r.findall('main:c', ns):
                c_ref = c.attrib.get('r')
                col_letter, row_idx = parse_cell_ref(c_ref)
                c_type = c.attrib.get('t', 'n')
                v_tag = c.find('main:v', ns)
                f_tag = c.find('main:f', ns)
                val = v_tag.text if v_tag is not None else None
                formula = f_tag.text if f_tag is not None else None
                
                if c_type == 's' and val is not None:
                    val = shared_strings[int(val)] if int(val) < len(shared_strings) else val
                elif c_type == 'inlineStr':
                    is_tag = c.find('main:is/main:t', ns)
                    val = is_tag.text if is_tag is not None else ''
                
                cells[col_letter] = {
                    'val': val,
                    'type': c_type,
                    'formula': formula
                }
            row_data.append((r_num, cells))
            
        # Print first 3 rows as header/sample
        for r_num, cells in row_data[:5]:
            cols_summary = {k: v['val'] for k, v in sorted(cells.items(), key=lambda x: col_to_num(x[0])) if v['val'] is not None}
            print(f"Row {r_num} ({len(cells)} cells): {cols_summary}")
