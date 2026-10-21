import zipfile
import xml.etree.ElementTree as ET
import os

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

    sheet_xml = z.read('xl/worksheets/sheet3.xml') # Dept_Names
    sheet_tree = ET.fromstring(sheet_xml)
    rows = sheet_tree.findall('.//main:sheetData/main:row', ns)
    
    depts = []
    for r in rows[1:]:
        c_list = r.findall('main:c', ns)
        if len(c_list) >= 2:
            sno_c = c_list[0]
            name_c = c_list[1]
            t = name_c.attrib.get('t', 'n')
            v = name_c.find('main:v', ns)
            if v is not None:
                val = shared_strings[int(v.text)] if t == 's' else v.text
                if val:
                    depts.append(val.strip())
    print(f"Total departments in Dept_Names: {len(depts)}")
    for i, d in enumerate(depts):
        print(f"  {i+1}. {d}")
