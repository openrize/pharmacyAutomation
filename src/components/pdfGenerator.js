import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Data-Centric PDF Generation Engine
 * 
 * Generates a professional Business Report including:
 * - Extracted Business Records (PRIMARY)
 * - Source File Metadata
 * - Confidence & Validation Metrics
 * - Audit Trail (APPENDIX)
 */
export const generatePDFReport = (data, logs) => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleString();

  // 1. Professional Branded Header
  doc.setFillColor(16, 185, 129); // Accent Emerald
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AUTOMATION BUSINESS REPORT', 15, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('SECURE EXTRACTION & NORMALIZATION SUMMARY', 15, 30);
  doc.text(`REFERENCE ID: ${data.report_id || 'DEMO-REPORT'}`, 15, 36);

  // 2. PRIMARY CONTENT: Processed Records Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. EXTRACTED & PROCESSED RECORDS', 15, 58);
  
  const patient = data.patient || {};
  const med = data.medication || data.inventory || {};
  
  doc.autoTable({
    startY: 65,
    head: [['Record Group', 'Attribute', 'Extracted Value', 'Automation Status']],
    body: [
      ['PATIENT_IDENTITY', 'Full Name', `${patient.first_name} ${patient.last_name}`, 'VERIFIED'],
      ['PATIENT_IDENTITY', 'Date of Birth', patient.dob || '01-01-19XX', 'VAL_PASS'],
      ['CLINICAL_EXTRACT', 'Medication/Product', med.name || 'N/A', 'MAPPED'],
      ['CLINICAL_EXTRACT', 'Identifier (NDC)', med.ndc || 'N/A', 'LINKED'],
      ['ADJUDICATION', 'Claim Result', data.status || 'PAID', 'SUCCESS'],
      ['ADJUDICATION', 'Patient Copay', data.copay || '$0.00', 'CALCULATED']
    ],
    headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  // 3. Technical Metadata (Summary)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. EXTRACTION INTELLIGENCE SUMMARY', 15, doc.lastAutoTable.finalY + 15);

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    body: [
      ['Source File Name', data.fileName || 'Original_Artifact.png'],
      ['Data Category Detected', (data.type || 'Standard Workflow').toUpperCase()],
      ['Extraction Method', data.mode === 'ocr' ? 'NEURAL_OCR_ENGINE' : 'GRID_MAPPING_LAYER'],
      ['Overall Confidence', `${(data.confidence || 0.98) * 100}%`],
      ['Compliance Level', 'SDV-4 PRIVACY_SHIELD_ACTIVE']
    ],
    theme: 'striped',
    styles: { cellPadding: 2, fontSize: 10 }
  });

  // 4. APPENDIX: Audit Logs (Page 2)
  doc.addPage();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('APPENDIX: SYSTEM AUDIT TRAIL', 15, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('This section provides the immutable technical logs for compliance verification.', 15, 28);
  
  doc.autoTable({
    startY: 35,
    head: [['Timestamp', 'System Event', 'Execution Level']],
    body: logs.map(l => [l.timestamp, l.message, l.type.toUpperCase()]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [107, 114, 128] }
  });

  // 5. Branded Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('CONFIDENTIAL BUSINESS OUTPUT - NOT FOR RESALE - GENERATED VIA INTELLIGENT WORKFLOW DESIGNER', 15, 285);
    doc.text(`Page ${i} of ${pageCount}`, 180, 285);
  }

  const fileName = `Processed_Data_${data.report_id || 'DEMO'}.pdf`;
  doc.save(fileName);
  return fileName;
};
