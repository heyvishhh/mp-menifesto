import zipfile
import xml.etree.ElementTree as ET
import os
import json
import re
from collections import Counter

excel_path = os.path.join("data", "MP Manifesto Analysis.xlsx")

with zipfile.ZipFile(excel_path, 'r') as z:
    ns = {
        'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        'pkg': 'http://schemas.openxmlformats.org/package/2006/relationships'
    }

    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        ss_xml = z.read('xl/sharedStrings.xml')
        ss_tree = ET.fromstring(ss_xml)
        for si in ss_tree.findall('.//main:si', ns):
            texts = [t.text or '' for t in si.findall('.//main:t', ns)]
            shared_strings.append("".join(texts))

    wb_rels_xml = z.read('xl/_rels/workbook.xml.rels')
    wb_rels_tree = ET.fromstring(wb_rels_xml)
    rel_map = {}
    for rel in wb_rels_tree.findall('.//pkg:Relationship', ns):
        rel_map[rel.attrib['Id']] = rel.attrib['Target']

    wb_xml = z.read('xl/workbook.xml')
    wb_tree = ET.fromstring(wb_xml)
    
    sheet_info = {}
    for sheet in wb_tree.findall('.//main:sheet', ns):
        name = sheet.attrib.get('name')
        sheet_id = sheet.attrib.get('sheetId')
        rel_id = sheet.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        target = rel_map.get(rel_id)
        if not target.startswith('xl/'):
            target = 'xl/' + target
        sheet_info[name] = target

    def parse_cell_ref(ref):
        match = re.match(r"([A-Z]+)([0-9]+)", ref)
        if match:
            return match.group(1), int(match.group(2))
        return None, None

    # Let's inspect All Promises
    target = sheet_info["All Promises"]
    sheet_xml = z.read(target)
    sheet_tree = ET.fromstring(sheet_xml)
    rows = sheet_tree.findall('.//main:sheetData/main:row', ns)
    
    headers = {}
    data_rows = []
    
    for r in rows:
        r_num = int(r.attrib.get('r', 0))
        cells = {}
        for c in r.findall('main:c', ns):
            c_ref = c.attrib.get('r')
            col_letter, row_idx = parse_cell_ref(c_ref)
            c_type = c.attrib.get('t', 'n')
            v_tag = c.find('main:v', ns)
            val = v_tag.text if v_tag is not None else None
            
            if c_type == 's' and val is not None:
                val = shared_strings[int(val)] if int(val) < len(shared_strings) else val
            elif c_type == 'inlineStr':
                is_tag = c.find('main:is/main:t', ns)
                val = is_tag.text if is_tag is not None else ''
            
            if val is not None and str(val).strip() != "":
                cells[col_letter] = str(val).strip()
        
        if r_num == 1:
            headers = cells
        elif cells:
            data_rows.append((r_num, cells))

    print(f"Total Header Columns in Row 1: {len(headers)}")
    for col, h in headers.items():
        print(f"  Col {col}: '{h}'")

    print(f"\nTotal Data Rows in All Promises: {len(data_rows)}")

    # Analysis of fields
    col_a_vals = [r[1].get('A') for r in data_rows if r[1].get('A')]
    print(f"\nCol A (ID/क्रमांक) count: {len(col_a_vals)}")
    print(f"Sample IDs: {col_a_vals[:10]}")
    print(f"Last 10 IDs: {col_a_vals[-10:]}")

    # Check statuses Col G
    statuses = Counter([r[1].get('G', '<EMPTY>') for r in data_rows])
    print(f"\nCol G (वर्तमान क्रियान्वयन की स्थिति - Implementation Status):")
    for s, count in statuses.most_common():
        print(f"  '{s}': {count}")

    # Check work started Col F
    started = Counter([r[1].get('F', '<EMPTY>') for r in data_rows])
    print(f"\nCol F (कार्य प्रारंभ होने की स्थिति - Work Started):")
    for s, count in started.most_common():
        print(f"  '{s}': {count}")

    # Check political importance Col H
    importance = Counter([r[1].get('H', '<EMPTY>') for r in data_rows])
    print(f"\nCol H (राजनीतिक महत्व - Political Importance):")
    for s, count in importance.most_common():
        print(f"  '{s}': {count}")

    # Check categories Col E
    categories = Counter([r[1].get('E', '<EMPTY>') for r in data_rows])
    print(f"\nCol E (श्रेणी / क्षेत्र - Category/Sector):")
    for c, count in categories.most_common():
        print(f"  '{c}': {count}")

    # Check departments Col D
    departments = Counter()
    multi_dept_count = 0
    empty_dept_count = 0
    for r in data_rows:
        dept_str = r[1].get('D')
        if not dept_str:
            empty_dept_count += 1
            departments['<EMPTY>'] += 1
        else:
            # Check if multi
            depts = [d.strip() for d in re.split(r'[,/\n]+', dept_str) if d.strip()]
            if len(depts) > 1:
                multi_dept_count += 1
            for d in depts:
                departments[d] += 1

    print(f"\nCol D (Department analysis):")
    print(f"  Total promises with multi departments: {multi_dept_count}")
    print(f"  Total promises with empty department: {empty_dept_count}")
    print(f"  Total distinct department references: {len(departments)}")
    print(f"  Top 10 departments:")
    for d, count in departments.most_common(10):
        print(f"    '{d}': {count}")

    # Missing value analysis per column
    print("\nMissing values per column in All Promises:")
    for col, h in headers.items():
        present = sum(1 for r in data_rows if r[1].get(col))
        missing = len(data_rows) - present
        print(f"  Col {col} ({h}): {present} present, {missing} missing ({missing/len(data_rows)*100:.1f}%)")

