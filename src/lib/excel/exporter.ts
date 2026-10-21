import ExcelJS from 'exceljs';
import { PromiseRecord, Department } from '@/types';
import { calculateDashboardMetrics, STATUS_CONFIG, IMPORTANCE_CONFIG } from '@/lib/analytics/metrics';

interface ExportOptions {
  title?: string;
  filterDescription?: string;
  departments?: Department[];
}

export async function exportPromisesToExcel(
  promises: PromiseRecord[],
  options: ExportOptions = {}
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'मध्य प्रदेश संकल्प पत्र मॉनिटरिंग सिस्टम (MP Government)';
  workbook.lastModifiedBy = 'सीएम डैशबोर्ड सेल';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ==========================================
  // Sheet 1: All Promises (Primary Dataset)
  // ==========================================
  const sheet = workbook.addWorksheet('All Promises', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // Base Column Definitions matching original workbook structure
  const columns = [
    { header: 'क्रमांक', key: 'id', width: 12 },
    { header: 'घोषणा / वादा', key: 'title', width: 36 },
    { header: 'संक्षिप्त विवरण', key: 'description', width: 50 },
    { header: 'संबंधित मंत्रालय / विभाग', key: 'departments', width: 34 },
    { header: 'श्रेणी / क्षेत्र', key: 'category', width: 26 },
    { header: 'कार्य प्रारंभ होने की स्थिति', key: 'workStarted', width: 18 },
    { header: 'वर्तमान क्रियान्वयन की स्थिति', key: 'status', width: 22 },
    { header: 'राजनीतिक महत्व', key: 'politicalImportance', width: 18 },
    { header: 'टिप्पणी', key: 'notes', width: 45 },
    { header: 'ज़मीनी क्रियान्वयन एवं प्रभाव', key: 'groundImpact', width: 30 },
    { header: 'जन-प्रतिक्रिया / सार्वजनिक धारणा', key: 'publicPerception', width: 30 },
    { header: 'यदि कार्य लंबित है तो प्रमुख कारण', key: 'delayReason', width: 35 },
    { header: 'प्रमुख उपलब्धियाँ', key: 'keyAchievements', width: 30 },
    { header: 'Reference Link 1', key: 'referenceLink1', width: 28 },
    { header: 'Reference Link 2', key: 'referenceLink2', width: 28 },
    { header: 'अधिकारिक पुष्टि लिंक', key: 'officialConfirmationLink', width: 30 },
    { header: 'टिप्पणी (अद्यतन)', key: 'updateNotes', width: 35 },
  ];

  // Discover any unknown/custom fields across records
  const unknownKeySet = new Set<string>();
  promises.forEach((p) => {
    if (p.unknownFields) {
      Object.keys(p.unknownFields).forEach(k => unknownKeySet.add(k));
    }
  });

  unknownKeySet.forEach((key) => {
    columns.push({
      header: key,
      key: `custom_${key}`,
      width: 25,
    });
  });

  sheet.columns = columns;

  // Header Styling: Government Dark Teal branding (#0f766e)
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F766E' },
    };
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF042F2E' } },
      bottom: { style: 'medium', color: { argb: 'FF042F2E' } },
      left: { style: 'thin', color: { argb: 'FF115E59' } },
      right: { style: 'thin', color: { argb: 'FF115E59' } },
    };
  });

  // Populate data rows
  promises.forEach((p) => {
    const statusCfg = STATUS_CONFIG[p.status];
    const impCfg = IMPORTANCE_CONFIG[p.politicalImportance];

    const rowData: Record<string, unknown> = {
      id: p.id,
      title: p.title,
      description: p.description,
      departments: p.departments.join(', '),
      category: p.category,
      workStarted: p.workStarted ? 'हाँ' : 'नहीं',
      status: statusCfg?.labelHi || p.statusRaw,
      politicalImportance: impCfg?.labelHi || p.politicalImportanceRaw,
      notes: p.notes || '',
      groundImpact: p.groundImpact || '',
      publicPerception: p.publicPerception || '',
      delayReason: p.delayReason || '',
      keyAchievements: p.keyAchievements || '',
      referenceLink1: p.referenceLink1 || (p.referenceLinks[0] || ''),
      referenceLink2: p.referenceLink2 || (p.referenceLinks[1] || ''),
      officialConfirmationLink: p.officialConfirmationLink || '',
      updateNotes: p.updateNotes || '',
    };

    if (p.unknownFields) {
      Object.entries(p.unknownFields).forEach(([k, v]) => {
        rowData[`custom_${k}`] = v;
      });
    }

    const row = sheet.addRow(rowData);
    row.height = 24;

    // Center ID and status columns
    row.getCell('id').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('workStarted').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('status').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('politicalImportance').alignment = { vertical: 'middle', horizontal: 'center' };

    // Format status background
    const statusCell = row.getCell('status');
    if (p.status === 'COMPLETED') {
      statusCell.font = { bold: true, color: { argb: 'FF047857' } };
    } else if (p.status === 'IN_PROGRESS') {
      statusCell.font = { bold: true, color: { argb: 'FF0369A1' } };
    } else if (p.status === 'INITIAL_STAGE') {
      statusCell.font = { bold: true, color: { argb: 'FFB45309' } };
    }
  });

  // ==========================================
  // Sheet 2: Master Department Reference
  // ==========================================
  if (options.departments && options.departments.length > 0) {
    const deptSheet = workbook.addWorksheet('Dept_Names');
    deptSheet.columns = [
      { header: 'S.no', key: 'sno', width: 10 },
      { header: 'Name of Department', key: 'name', width: 45 },
      { header: 'संबद्ध वादों की संख्या', key: 'promiseCount', width: 22 },
    ];

    const deptHeader = deptSheet.getRow(1);
    deptHeader.height = 26;
    deptHeader.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF115E59' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    options.departments.forEach((d) => {
      deptSheet.addRow({
        sno: d.sno,
        name: d.name,
        promiseCount: d.promiseCount || 0,
      });
    });
  }

  // ==========================================
  // Sheet 3: Export Metadata & Summary
  // ==========================================
  const metaSheet = workbook.addWorksheet('Metadata_Summary');
  const metrics = calculateDashboardMetrics(promises);

  metaSheet.columns = [
    { header: 'मीट्रिक / विवरण', key: 'metric', width: 35 },
    { header: 'मान', key: 'value', width: 40 },
  ];

  const metaHeader = metaSheet.getRow(1);
  metaHeader.height = 26;
  metaHeader.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF042F2E' } };
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  });

  metaSheet.addRow({ metric: 'दस्तावेज़ शीर्षक', value: options.title || 'मध्य प्रदेश संकल्प पत्र 2023 - क्रियान्वयन स्थिति' });
  metaSheet.addRow({ metric: 'निर्यात तिथि व समय', value: new Date().toLocaleString('hi-IN') });
  metaSheet.addRow({ metric: 'लागू फ़िल्टर मानदंड', value: options.filterDescription || 'समस्त 414 रिकॉर्ड्स' });
  metaSheet.addRow({ metric: 'कुल वादे (Total Promises)', value: metrics.totalPromises });
  metaSheet.addRow({ metric: 'पूर्ण (Completed)', value: metrics.completed });
  metaSheet.addRow({ metric: 'प्रगति पर (In Progress)', value: metrics.inProgress });
  metaSheet.addRow({ metric: 'प्रारंभिक चरण (Initial Stage)', value: metrics.initialStage });
  metaSheet.addRow({ metric: 'प्रारंभ नहीं (Not Started)', value: metrics.notStarted });
  metaSheet.addRow({ metric: 'आधिकारिक पूर्णता दर (Completion Rate)', value: `${metrics.completionRate}%` });
  metaSheet.addRow({ metric: 'सॉफ्टवेयर संस्करण', value: 'MP Manifesto Dashboard v2.0' });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
