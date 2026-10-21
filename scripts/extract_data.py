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

    def parse_cell_ref(ref):
        match = re.match(r"([A-Z]+)([0-9]+)", ref)
        if match:
            return match.group(1), int(match.group(2))
        return None, None

    # 1. Read Dept_Names
    canonical_depts = []
    dept_target = sheet_info.get("Dept_Names")
    if dept_target:
        sheet_xml = z.read(dept_target)
        sheet_tree = ET.fromstring(sheet_xml)
        rows = sheet_tree.findall('.//main:sheetData/main:row', ns)
        for r in rows[1:]:
            c_list = r.findall('main:c', ns)
            if len(c_list) >= 2:
                sno_c = c_list[0]
                name_c = c_list[1]
                t = name_c.attrib.get('t', 'n')
                v = name_c.find('main:v', ns)
                if v is not None:
                    val = shared_strings[int(v.text)] if t == 's' else v.text
                    if val and val.strip():
                        canonical_depts.append(val.strip())

    # 2. Read All Promises
    promises_target = sheet_info.get("All Promises")
    sheet_xml = z.read(promises_target)
    sheet_tree = ET.fromstring(sheet_xml)
    rows = sheet_tree.findall('.//main:sheetData/main:row', ns)

    promises = []
    for r in rows[1:]:
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
        
        if not cells.get('A'):
            continue

        raw_id = cells.get('A', '0')
        try:
            p_id = int(float(raw_id))
        except:
            p_id = len(promises) + 1

        title = cells.get('B', '')
        desc = cells.get('C', '')
        dept_str = cells.get('D', '')
        category = cells.get('E', '')
        work_started_raw = cells.get('F', 'नहीं')
        status_raw = cells.get('G', 'प्रारंभ नहीं')
        pol_imp_raw = cells.get('H', 'सीमित')
        notes = cells.get('I')
        ground_impact = cells.get('J')
        public_perception = cells.get('K')
        delay_reason = cells.get('L')
        key_achievements = cells.get('M')
        ref_link_1 = cells.get('N')
        ref_link_2 = cells.get('O')
        news_image = cells.get('P')
        political_issue = cells.get('Q')
        official_link = cells.get('R')
        update_notes = cells.get('S')

        # Split departments
        dept_list = [d.strip() for d in re.split(r'[,/\n]+', dept_str) if d.strip()]

        # Map canonical status key
        status_key = 'NOT_STARTED'
        if status_raw == 'पूर्ण':
            status_key = 'COMPLETED'
        elif status_raw == 'प्रगति पर':
            status_key = 'IN_PROGRESS'
        elif status_raw == 'प्रारंभिक चरण':
            status_key = 'INITIAL_STAGE'
        elif status_raw == 'प्रारंभ नहीं':
            status_key = 'NOT_STARTED'

        # Map political importance key
        imp_key = 'LIMITED'
        if pol_imp_raw == 'उच्च':
            imp_key = 'HIGH'
        elif pol_imp_raw == 'मध्यम':
            imp_key = 'MEDIUM'
        elif pol_imp_raw == 'सीमित':
            imp_key = 'LIMITED'

        promise_item = {
            "id": p_id,
            "title": title,
            "description": desc,
            "departments": dept_list,
            "primaryDepartment": dept_list[0] if dept_list else "अनिर्दिष्ट विभाग",
            "category": category,
            "workStarted": work_started_raw == 'हाँ',
            "status": status_key,
            "statusRaw": status_raw,
            "politicalImportance": imp_key,
            "politicalImportanceRaw": pol_imp_raw,
            "notes": notes,
            "groundImpact": ground_impact,
            "publicPerception": public_perception,
            "delayReason": delay_reason,
            "keyAchievements": key_achievements,
            "referenceLinks": [l for l in [ref_link_1, ref_link_2] if l],
            "referenceLink1": ref_link_1,
            "referenceLink2": ref_link_2,
            "newsImage": news_image,
            "politicalIssue": political_issue,
            "officialConfirmationLink": official_link,
            "updateNotes": update_notes,
            "sourceSheet": "All Promises",
            "sourceRow": r_num,
            "updatedAt": "2026-08-20T10:00:00Z"
        }
        promises.append(promise_item)

    dataset = {
        "metadata": {
            "sourceWorkbook": "MP Manifesto Analysis.xlsx",
            "extractedAt": "2026-10-21T23:45:00Z",
            "totalPromises": len(promises),
            "statusDistribution": {
                "COMPLETED": sum(1 for p in promises if p["status"] == "COMPLETED"),
                "IN_PROGRESS": sum(1 for p in promises if p["status"] == "IN_PROGRESS"),
                "INITIAL_STAGE": sum(1 for p in promises if p["status"] == "INITIAL_STAGE"),
                "NOT_STARTED": sum(1 for p in promises if p["status"] == "NOT_STARTED")
            },
            "canonicalDepartmentsCount": len(canonical_depts)
        },
        "canonicalDepartments": canonical_depts,
        "promises": promises
    }

    out_path = os.path.join("data", "manifesto_data.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"Extracted {len(promises)} promises and {len(canonical_depts)} canonical departments to {out_path}")
