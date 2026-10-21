import zipfile
import xml.etree.ElementTree as ET
import os
import json
import re

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

    for sheet_name in ["All Promises", "Dept_Names", "Work_Distribution", "Sheet14", "Pivot Table 1", "Sheet5", "Sheet3", "Sheet4"]:
        target = sheet_info.get(sheet_name)
        if not target:
            continue
        sheet_xml = z.read(target)
        sheet_tree = ET.fromstring(sheet_xml)
        rows = sheet_tree.findall('.//main:sheetData/main:row', ns)
        
        # Analyze non-empty rows
        non_empty_rows = 0
        all_rows_data = []
        for r in rows:
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
                
                if val is not None and str(val).strip() != "":
                    cells[col_letter] = {
                        'val': val,
                        'formula': formula
                    }
            if cells:
                non_empty_rows += 1
                r_num = int(r.attrib.get('r', 0))
                all_rows_data.append((r_num, cells))

        print(f"\n=======================================================")
        print(f"SHEET: {sheet_name}")
        print(f"Total XML Rows: {len(rows)}, Non-empty rows: {non_empty_rows}")
        if all_rows_data:
            # First row (header)
            r1_num, r1_cells = all_rows_data[0]
            print(f"First row (row {r1_num}):")
            for col in sorted(r1_cells.keys(), key=col_to_num):
                print(f"  Col {col} ({col_to_num(col)}): '{r1_cells[col]['val']}'")
            
            # Print sample row (row 2)
            if len(all_rows_data) > 1:
                r2_num, r2_cells = all_rows_data[1]
                print(f"\nSample row 2 (row {r2_num}):")
                for col in sorted(r2_cells.keys(), key=col_to_num):
                    val_str = str(r2_cells[col]['val'])
                    if len(val_str) > 60:
                        val_str = val_str[:60] + "..."
                    print(f"  Col {col}: '{val_str}'")

