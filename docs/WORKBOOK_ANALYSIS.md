# MP Manifesto Workbook Analysis Report

**File Inspected:** `data/MP Manifesto Analysis.xlsx` (and `C:\Users\visha\Downloads\MP Manifesto Analysis.xlsx`)  
**File Size:** 3,151,179 bytes (~3.00 MB)  
**Date of Inspection:** October 21, 2026  
**Total Shared Strings:** 1,414  
**Total Worksheets:** 8  

---

## 1. Executive Summary & Worksheet Inventory

The workbook contains 8 worksheets. Our inspection identified which worksheets contain primary operational records, reference master lists, cohort management assignments, or empty/redundant data:

| # | Sheet Name | XML Path | XML Rows | Non-Empty Rows | Purpose & Classification | Action for Data Pipeline |
|---|------------|----------|----------|----------------|--------------------------|--------------------------|
| 1 | **All Promises** | `xl/worksheets/sheet1.xml` | 1,000 | **415** (1 header + 414 data rows) | **Primary Record Sheet**: Contains the complete master list of all 414 MP election manifesto promises, status, categories, departments, remarks, and links. | **Core Import Target** |
| 2 | **Sheet14** | `xl/worksheets/sheet2.xml` | 1,000 | 0 | **Unused / Empty**: Sheet contains no cell data. | **Ignore during import** |
| 3 | **Dept_Names** | `xl/worksheets/sheet3.xml` | 1,000 | **46** (1 header + 45 data rows) | **Reference Master Data**: Canonical reference list of 45 Madhya Pradesh government departments in Hindi with serial numbers (Col B: S.no, Col C: Name of Department). | **Master Reference Table** |
| 4 | **Work_Distribution** | `xl/worksheets/sheet4.xml` | 1,000 | **5** (Header at row 2 + 3 POC assignment rows) | **Internal Workflow Tracking**: Internal project management allocation linking internal reviewers (Suyash Sir, Arunoday, Somant) to categories/cohorts. | **Internal Reference / Audit metadata** (do not import as promises) |
| 5 | **Pivot Table 1** | `xl/worksheets/sheet5.xml` | 1,000 | 0 | **Empty / Pivot Cache Stub**: Cleared or unpopulated pivot table definition. | **Ignore during import** |
| 6 | **Sheet5** | `xl/worksheets/sheet6.xml` | 1,000 | **21** (1 header + 20 data rows) | **Subset Sheet**: Subset containing promises 27.0 through 46.0 belonging specifically to the **"जनजातीय कल्याण"** (Tribal Welfare) category. | **Redundant Subset** (Do not duplicate import; already present in "All Promises") |
| 7 | **Sheet3** | `xl/worksheets/sheet7.xml` | 1,000 | **34** (1 header + 33 data rows) | **Subset Sheet**: Subset containing promises 14.0 through 46.0 belonging specifically to the **"समृद्ध किसान"** (Prosperous Farmer) category. | **Redundant Subset** (Do not duplicate import; already present in "All Promises") |
| 8 | **Sheet4** | `xl/worksheets/sheet8.xml` | 1,000 | **22** (1 header + 21 data rows) | **Subset Sheet**: Subset containing promises 1.0 through 21.0 belonging specifically to the **"सशक्त नारी"** (Empowered Women) category. | **Redundant Subset** (Do not duplicate import; already present in "All Promises") |

> **Critical Rule:** Only worksheet **`All Promises`** should be imported as promise entities. Sheets 3, 4, 5 are partial cohort-working subsets; importing them would cause duplicate records and distorted metrics.

---

## 2. Primary Record Analysis: `All Promises`

### 2.1 Dimensions & Counts
- **Total Data Rows:** 414 promises
- **Total Columns:** 19 columns (Columns A through S)
- **Header Row:** Row 1
- **Primary Key Candidate:** Column A (`क्रमांक` / Serial No.) spans from `1.0` through `414.0` with 0 missing values and 100% uniqueness.

### 2.2 Column Schema, Actual Names & Data Quality

| Col | Actual Header in Excel (Row 1) | Translated English Meaning | Data Type | Present Count | Missing Count | Fill Rate | Observations & Quality Notes |
|:---:|--------------------------------|----------------------------|-----------|:-------------:|:-------------:|:---------:|------------------------------|
| **A** | `क्रमांक` | Serial Number / ID | Numeric (stored as float/string) | 414 | 0 | **100.0%** | Stable sequence `1.0` to `414.0`. Normalizable to integer ID `1`..`414`. |
| **B** | `घोषणा / वादा` | Promise Title / Commitment | String (Hindi) | 414 | 0 | **100.0%** | Primary promise title. Contains Hindi Unicode text. |
| **C** | `संक्षिप्त विवरण` | Brief Description | String (Hindi) | 414 | 0 | **100.0%** | Detailed explanation of the manifesto promise, targets, figures, or welfare criteria. |
| **D** | `संबंधित मंत्रालय / विभाग ` | Ministry / Department | String (Hindi) | 414 | 0 | **100.0%** | **Notice trailing space in header!** 78 records contain multiple departments delimited by commas, slashes, or linebreaks. |
| **E** | `श्रेणी / क्षेत्र` | Category / Sector | String (Hindi) | 414 | 0 | **100.0%** | Exactly 10 distinct thematic categories. 0 nulls. |
| **F** | `कार्य प्रारंभ होने की स्थिति` | Work Started Status | String (Hindi) | 414 | 0 | **100.0%** | Binary flag: `'हाँ'` (353 records, 85.3%) or `'नहीं'` (61 records, 14.7%). Exactly correlates with whether status is not started. |
| **G** | `वर्तमान क्रियान्वयन की स्थिति` | Current Implementation Status | String (Hindi) | 414 | 0 | **100.0%** | The core status indicator. Exactly 4 distinct values: `प्रगति पर`, `प्रारंभिक चरण`, `प्रारंभ नहीं`, `पूर्ण`. |
| **H** | `राजनीतिक महत्व` | Political Importance | String (Hindi) | 414 | 0 | **100.0%** | Priority grading: `'मध्यम'` (Medium, 170), `'उच्च'` (High, 137), `'सीमित'` (Limited/Low, 107). |
| **I** | `टिप्पणी` | Notes / Remarks 1 | String (Hindi) | 340 | 74 | 82.1% | Implementation notes, Cabinet decisions, launch dates, budget allocations. |
| **J** | `ज़मीनी क्रियान्वयन एवं प्रभाव` | Ground Implementation & Impact | String (Hindi) | 0 | 414 | 0.0% | Column header exists, but values are currently empty. Reserved for field tracking. |
| **K** | `जन-प्रतिक्रिया / सार्वजनिक धारणा` | Public Sentiment / Perception | String (Hindi) | 0 | 414 | 0.0% | Column header exists, but values are currently empty. Reserved for sentiment tracking. |
| **L** | `यदि कार्य लंबित है तो प्रमुख कारण` | Reason If Pending / Delayed | String (Hindi) | 1 | 413 | 0.2% | Explanations for delays or bottlenecks (e.g. budgetary constraints or inter-state clearances). |
| **M** | `प्रमुख उपलब्धियाँ` | Key Achievements | String (Hindi) | 0 | 414 | 0.0% | Column header exists, but values are currently empty. |
| **N** | `Reference Link` | Reference Link 1 | URL / Text (`'लिंक'`) | 372 | 42 | 89.9% | News or portal reference hyperlink. Duplicate column header with Col O. |
| **O** | `Reference Link` | Reference Link 2 | URL / Text (`'लिंक'`) | 231 | 183 | 55.8% | Secondary reference link. Duplicate header. |
| **P** | `News Image` | News Clipping / Image | URL / Text | 51 | 363 | 12.3% | Supporting media image link. |
| **Q** | `चुनावी/राजनीतिक मुद्दा` | Electoral / Political Issue | String (Hindi) | 7 | 407 | 1.7% | Flagging promises that became active election or debate controversies. |
| **R** | `अधिकारिक पुष्टि लिंक` | Official Confirmation Link | URL / Text | 8 | 406 | 1.9% | Link to official government gazette, press release, or departmental portal. |
| **S** | `टिप्पणी` | Notes / Remarks 2 (Update Note) | String (Hindi) | 3 | 411 | 0.7% | Secondary remark column with updated tracking notes. Duplicate column header with Col I. |

---

## 3. Detailed Data Value Distributions

### 3.1 Implementation Status (`वर्तमान क्रियान्वयन की स्थिति` - Col G)
All 414 promises have one of the following 4 canonical statuses:

| Status (Hindi) | Canonical English Code | Record Count | Percentage | Definition & Rule |
|----------------|------------------------|:------------:|:----------:|-------------------|
| **प्रगति पर** | `IN_PROGRESS` | **244** | 58.94% | Active implementation underway across districts/departments. |
| **प्रारंभिक चरण** | `INITIAL_STAGE` | **62** | 14.98% | Policy formulated, committee constituted, or budget sanctioned; execution beginning. |
| **प्रारंभ नहीं** | `NOT_STARTED` | **61** | 14.73% | No operational activity or cabinet sanction recorded yet. |
| **पूर्ण** | `COMPLETED` | **47** | 11.35% | 100% fulfilled manifesto commitment. |
| **Total** | | **414** | **100.00%** | |

**Completion Formula Compliance:**
$$\text{Completion Rate} = \frac{\text{Completed Promises}}{\text{Total Promises}} \times 100 = \frac{47}{414} \times 100 \approx 11.35\%$$

### 3.2 Political Importance (`राजनीतिक महत्व` - Col H)
| Importance Level (Hindi) | English Key | Count | Percentage |
|--------------------------|-------------|:-----:|:----------:|
| **मध्यम** | `MEDIUM` | 170 | 41.06% |
| **उच्च** | `HIGH` | 137 | 33.09% |
| **सीमित** | `LIMITED` | 107 | 25.85% |
| **Total** | | **414** | **100.00%** |

### 3.3 Thematic Categories (`श्रेणी / क्षेत्र` - Col E)
There are exactly 10 categories:

| # | Category Name (Hindi) | English Translation | Promise Count | Share |
|---|----------------------|---------------------|:-------------:|:-----:|
| 1 | समृद्ध किसान | Prosperous Farmer | 83 | 20.05% |
| 2 | सांस्कृतिक धरोहर एवं विकसित पर्यटन | Cultural Heritage & Tourism | 60 | 14.49% |
| 3 | सबका साथ सबका विकास | Inclusive Development | 52 | 12.56% |
| 4 | उत्तम शिक्षा एवं सक्षम युवा | Quality Education & Capable Youth | 43 | 10.39% |
| 5 | प्रगतिशील अर्थव्यवस्था व उद्योग | Progressive Economy & Industry | 42 | 10.14% |
| 6 | सुदृढ़ आधारभूत संरचना | Robust Infrastructure | 36 | 8.70% |
| 7 | जनजातीय कल्याण | Tribal Welfare | 30 | 7.25% |
| 8 | सशक्त नारी | Empowered Women | 29 | 7.00% |
| 9 | सुशासन एवं कानून व्यवस्था | Good Governance & Law and Order | 23 | 5.56% |
| 10 | स्वस्थ प्रदेश | Healthy State | 16 | 3.86% |
| | **Total** | | **414** | **100.00%** |

---

## 4. Multi-Department Relationships (Col D)

### 4.1 Relationship Architecture
- In the Excel sheet, Column D is titled `'संबंधित मंत्रालय / विभाग '` (notice trailing whitespace).
- **78 promises** are linked to **multiple departments**, e.g.:
  - `"किसान कल्याण एवं कृषि विकास विभाग, खाद्य व नागरिक आपूर्ति एवं उपभोक्ता संरक्षण विभाग"`
  - `"जनजातीय कार्य विभाग, पंचायत एवं ग्रामीण विकास विभाग"`
  - `"खाद्य, नागरिक आपूर्ति एवं उपभोक्ता संरक्षण विभाग,\n महिला एवं बाल विकास विभाग"`
- **Architecture Mandate:** The relational schema must NOT assume a 1:1 foreign key between a promise and a department. A Many-to-Many junction table (`promise_departments`) or normalized string array is required to support accurate departmental performance aggregation and filtering.

---

## 5. Duplicate Headers & Structural Anomalies

1. **Duplicate Header 1: `Reference Link` (Columns N & O)**
   - Both Col N and Col O are titled `Reference Link`.
   - Resolution: Parse into `referenceLink1` (Col N) and `referenceLink2` (Col O), or combine into a typed array `referenceLinks: string[]`.
2. **Duplicate Header 2: `टिप्पणी` (Columns I & S)**
   - Col I contains primary remarks for 340 promises.
   - Col S contains updated remarks (`अद्यतन स्थिति`) for 3 promises.
   - Resolution: Parse Col I as `notes` / `remarks` and Col S as `updateNotes` / `additionalRemarks`.
3. **Trailing Whitespace in Column D:**
   - Col D header has a trailing space: `'संबंधित मंत्रालय / विभाग '`. Parsers must trim header strings before mapping.
4. **Number Formatting in Serial No (Col A):**
   - Stored in Excel XML as floats like `1.0`, `2.0`. Must be converted cleanly to integers `1`, `2` to prevent displaying `1.0` in the UI.

---

## 6. Proposed Schema & Field Mappings

```typescript
export interface PromiseRecord {
  id: number;                          // Col A (क्रमांक, parsed as int)
  title: string;                       // Col B (घोषणा / वादा)
  description: string;                 // Col C (संक्षिप्त विवरण)
  departments: string[];               // Col D parsed & trimmed (multi-dept array)
  primaryDepartment?: string;          // First listed department
  category: string;                    // Col E (श्रेणी / क्षेत्र)
  workStarted: boolean;                // Col F (हाँ -> true, नहीं -> false)
  status: PromiseStatus;               // Col G (पूर्ण | प्रगति पर | प्रारंभिक चरण | प्रारंभ नहीं)
  statusRaw: string;                   // Original Hindi status
  politicalImportance: PoliticalImportance; // Col H (उच्च | मध्यम | सीमित)
  notes?: string;                      // Col I (टिप्पणी 1)
  groundImpact?: string;               // Col J (ज़मीनी क्रियान्वयन एवं प्रभाव)
  publicPerception?: string;           // Col K (जन-प्रतिक्रिया / सार्वजनिक धारणा)
  delayReason?: string;                // Col L (यदि कार्य लंबित है तो प्रमुख कारण)
  keyAchievements?: string;            // Col M (प्रमुख उपलब्धियाँ)
  referenceLink1?: string;             // Col N (Reference Link 1)
  referenceLink2?: string;             // Col O (Reference Link 2)
  newsImage?: string;                  // Col P (News Image)
  politicalIssue?: string;             // Col Q (चुनावी/राजनीतिक मुद्दा)
  officialConfirmationLink?: string;   // Col R (अधिकारिक पुष्टि लिंक)
  updateNotes?: string;                // Col S (टिप्पणी 2)
  sourceSheet: string;                 // "All Promises"
  sourceRow: number;                   // Excel row number (e.g. 2..415)
  updatedAt?: string;                  // Timestamp for audit
}
```

---

## 7. Import Risks & Mitigations

1. **Risk of Duplicate Imports from Category Sheets:**
   - *Risk:* Importing `Sheet3`, `Sheet4`, `Sheet5` would duplicate 74 promises.
   - *Mitigation:* The workbook loader and UI importer must default to importing `All Promises` only, validating sheet identity before processing.
2. **Hindi UTF-8 Encoding Corruption:**
   - *Risk:* CSV or naive binary parsers often garble Devanagari characters (e.g. `म` turning into `à¤®`).
   - *Mitigation:* Read directly using OpenXML / ExcelJS streaming with native UTF-8 decoding. Verified in our Python/Node inspection scripts that characters render with 100% fidelity.
3. **Multi-Department Counting Bias:**
   - *Risk:* When filtering by department, promises belonging to two departments could either be missed or double-counted if not handled cleanly.
   - *Mitigation:* Implement standard multi-tag filtering: selecting Department $X$ displays all promises where $X \in \text{departments}$. Department-level KPI rollups document whether totals reflect unique promises or department assignments.

---

## 8. Questions for Explicit Resolution (Future Stages)
1. **Empty Fields Expansion:** Columns J, K, and M (`ज़मीनी क्रियान्वयन एवं प्रभाव`, `जन-प्रतिक्रिया`, `प्रमुख उपलब्धियाँ`) are 100% empty in the current baseline. In Stage 2 inline editing, will field officers populate these directly in the web app? (Yes, the schema accommodates them fully).
2. **Department Standardizer:** The 90 raw departmental variations in Col D can be mapped to the 45 canonical names in `Dept_Names`. An alias mapping table will be introduced to handle minor syntax variations (e.g. `एवं` vs `तथा`).
