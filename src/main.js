import './style.css';
import { worker } from './mocks/browser';
import { 
  classifyRequest, 
  normalizeFields, 
  parseUniversalInput,
  SUPPORT_TYPES 
} from './data/classifier';
import { 
  processFile, 
  EXTRACTOR_MODES 
} from './data/documentProcessor';
import { 
  formatClassificationSummary, 
  formatSourceSummary, 
  formatAdjudicationSummary, 
  formatReportSummary 
} from './components/presentation';
import { generatePDFReport } from './components/pdfGenerator';

// 1. Initialize Mock Service Virtualization
const initMSW = async () => {
  try {
    await worker.start({ onUnhandledRequest: 'bypass', serviceWorker: { url: '/mockServiceWorker.js' } });
    addLog('Service Virtualization Layer Active [sdv]', 'success');
  } catch (err) {
    console.error('Safe Error: Virtualization initialization failed.');
  }
};

// 2. Demo State
let isRunning = false;
let isPresentationMode = true; 
let isStepByStep = false;
let currentScenario = 'refill_success';
let lastWorkflowResult = null;
let currentSessionLogs = [];
let selectedFile = null;

const SCENARIO_DATA = {
    refill_success: { rx_number: 'RX-99201', patient: 'Maverick Kessler' },
    claim_issue: { claim_id: 'CL-8822', status: 'REJECTED', payer: 'Blue Shield' },
    eligibility_verify: { member_id: 'MBR-77291', check: 'eligibility' },
    inventory_check: { product: 'Lisinopril 10mg', action: 'stock_lookup' },
    ocr_case: "Simulating Image OCR: Please upload a .png or .jpg to trigger scanning logic.",
    word_doc: "Simulating Unstructured Doc: Please upload a .docx or .pdf for pattern extraction.",
    patient_update: { pt_id: 'PT-402', update: 'address_change', new_val: '123 Fake St' },
    pa_required: { rx_id: 'RX-1122', note: 'PA needed for level 2' }
};

// 3. UI Helpers
const addLog = (message, type = 'info') => {
  const logsWindow = document.getElementById('logs-window');
  const timestamp = new Date().toLocaleTimeString([], { hour12: false });
  currentSessionLogs.push({ timestamp, message, type });
  
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<span>[${timestamp}]</span> ${message}`;
  logsWindow.appendChild(entry);
  logsWindow.scrollTop = logsWindow.scrollHeight;
};

const updateStatus = (status, type) => {
  const badge = document.getElementById('workflow-status');
  badge.textContent = status.toUpperCase();
  badge.className = `status-badge ${type}`;
};

const resetWorkflow = () => {
  document.querySelectorAll('.flow-step').forEach(step => step.classList.remove('active'));
  document.querySelectorAll('.presentation-box, .preview-box, .source-file-preview').forEach(box => {
    box.style.display = 'none';
  });
  document.getElementById('scan-overlay').style.display = 'none';
  document.getElementById('dual-export-container').style.display = 'none';
  updateStatus('SYSTEM_READY', 'success');
  document.getElementById('detected-type').textContent = 'PENDING';
};

const waitForAdvance = () => {
  const advanceBtn = document.getElementById('advance-step');
  advanceBtn.style.display = 'block';
  advanceBtn.classList.add('pulse-button');
  
  return new Promise(resolve => {
    const handler = () => {
      advanceBtn.style.display = 'none';
      advanceBtn.classList.remove('pulse-button');
      advanceBtn.removeEventListener('click', handler);
      resolve();
    };
    advanceBtn.addEventListener('click', handler);
  });
};

// 4. Core Intelligent Pipeline
const executeAutomation = async () => {
  if (isRunning) return;
  isRunning = true;
  document.getElementById('run-automation').disabled = true;
  resetWorkflow();
  
  const textareaValue = document.getElementById('universal-input').value;
  addLog('Initializing Universal Ingestion Loop...', 'info');

  try {
    // --- STEP 1: INGEST ---
    const stepIngest = document.getElementById('step-ingest');
    stepIngest.classList.add('active');
    
    let parsedData = {};
    
    if (selectedFile) {
        addLog(`File detected: ${selectedFile.name}. Starting multi-mode extraction...`, 'info');
        document.getElementById('source-file-preview').style.display = 'block';
        document.getElementById('preview-content').innerHTML = `
            <div style="font-size: 0.8rem; opacity: 0.7;">
                <strong>Local File ID:</strong> ${Math.random().toString(36).substr(2, 9)}<br/>
                <strong>MIME:</strong> ${selectedFile.type || 'application/octet-stream'}
            </div>
        `;
        
        // Simulate extraction logic
        const extraction = await processFile(selectedFile);
        
        if (extraction.mode === EXTRACTOR_MODES.OCR) {
            document.getElementById('scan-overlay').style.display = 'flex';
            addLog('Activating OCR Neural Engine [tesseract-sim]...', 'info');
            await delay(2500); // Simulate scanning duration
            document.getElementById('scan-overlay').style.display = 'none';
        }

        addLog(`Extraction complete via ${extraction.mode.toUpperCase()} layer. Confidence: ${extraction.confidence * 100}%`, 'success');
        
        // Mock data mapping from scenarios for demo reliability
        parsedData = SCENARIO_DATA[currentScenario] || { message: "Extracted content from file." };
        if (typeof parsedData === 'string') parsedData = { message: parsedData };

    } else {
        addLog('Ingesting raw input from interface...', 'info');
        parsedData = typeof textareaValue === 'string' ? parseUniversalInput(textareaValue) : normalizeFields(textareaValue);
        const ingestPreview = document.getElementById('ingest-preview');
        ingestPreview.style.display = 'block';
        ingestPreview.textContent = JSON.stringify(parsedData, null, 2);
    }
    
    if (isStepByStep) await waitForAdvance(); else await delay(800);

    // --- STEP 2: CLASSIFY ---
    const stepClassify = document.getElementById('step-classify');
    stepClassify.classList.add('active');
    addLog('Analyzing intent and structural markers...', 'info');
    
    const detectedType = selectedFile ? SUPPORT_TYPES.DOCUMENT_SUPPORT : classifyRequest(parsedData);
    document.getElementById('detected-type').textContent = detectedType.replace('_', ' ').toUpperCase();
    
    const displayType = selectedFile ? (currentScenario.includes('ocr') ? 'REFILL' : 'CLAIM') : detectedType;

    const classifyPresentation = document.getElementById('classify-presentation');
    classifyPresentation.style.display = 'block';
    classifyPresentation.innerHTML = formatClassificationSummary(displayType);
    
    if (isStepByStep) await waitForAdvance(); else await delay(1000);

    // --- STEP 3: ENRICH & AUTO-FILL ---
    const stepForm = document.getElementById('step-form');
    stepForm.classList.add('active');
    addLog(`Resolving extracted entities against Synthetic Data Source A...`, 'info');
    
    const apiType = selectedFile ? (currentScenario.includes('ocr') ? 'refill' : 'claim') : detectedType;
    const fetchResponse = await fetch(`/api/demo/fetch?type=${apiType}&scenario=${currentScenario}`);
    const enrichedData = await fetchResponse.json();
    
    const submitResponse = await fetch('/api/demo/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: apiType, scenario: currentScenario, data: enrichedData })
    });
    const resultData = await submitResponse.json();
    
    const formPresentation = document.getElementById('form-presentation');
    formPresentation.style.display = 'block';
    formPresentation.innerHTML = `
        ${formatSourceSummary(enrichedData)}
        <div style="margin-top: 12px;"></div>
        ${formatAdjudicationSummary(resultData, apiType)}
    `;
    
    addLog('Intelligent Entity Enrichment complete.', 'success');
    if (isStepByStep) await waitForAdvance(); else await delay(1200);

    // --- STEP 4: REPORT ---
    const stepReport = document.getElementById('step-report');
    stepReport.classList.add('active');
    
    const reportResponse = await fetch(`/api/demo/report?type=${apiType}`);
    const reportData = await reportResponse.json();
    lastWorkflowResult = { ...enrichedData, ...resultData, ...reportData };
    
    const reportPresentation = document.getElementById('report-presentation');
    reportPresentation.style.display = 'block';
    reportPresentation.innerHTML = formatReportSummary(reportData);
    
    addLog('Workflow synchronized. Multi-format artifacts ready.', 'success');
    updateStatus('SUCCESS', 'success');
    document.getElementById('dual-export-container').style.display = 'flex';

  } catch (err) {
    addLog(`Workflow Interrupted: ${err.message}`, 'error');
    updateStatus('EXCEPTION', 'error');
  } finally {
    isRunning = false;
    document.getElementById('run-automation').disabled = false;
  }
};

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// 5. Initialization
initMSW().then(() => {
  // Scenario Selection
  const scenarioButtons = document.querySelectorAll('.scenario-btn');
  scenarioButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isRunning) return;
      scenarioButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentScenario = btn.dataset.scenario;
      document.getElementById('current-scenario-title').textContent = btn.textContent;
      
      selectedFile = null;
      document.getElementById('source-upload').value = '';
      
      const data = SCENARIO_DATA[currentScenario];
      document.getElementById('universal-input').value = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      
      document.getElementById('run-automation').disabled = false;
      resetWorkflow();
    });
  });

  // File Upload Handler
  document.getElementById('trigger-upload').addEventListener('click', () => {
    document.getElementById('source-upload').click();
  });

  const updateStagingUI = (file) => {
      const card = document.getElementById('file-staging-card');
      const name = document.getElementById('staging-name');
      const meta = document.getElementById('staging-meta');
      const runBtn = document.getElementById('run-automation');

      if (file) {
          card.style.display = 'flex';
          name.textContent = file.name;
          meta.textContent = `${(file.size / 1024).toFixed(1)} KB | ${file.type || 'Binary'}`;
          runBtn.disabled = false;
          addLog(`Source staged and validated: ${file.name}`, 'info');
      } else {
          card.style.display = 'none';
          runBtn.disabled = true;
      }
  };

  document.getElementById('source-upload').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        updateStagingUI(selectedFile);
        document.getElementById('universal-input').value = `FILE_SOURCE: ${selectedFile.name}`;
    }
  });

  // Handle manual text entry to unlock button
  document.getElementById('universal-input').addEventListener('input', (e) => {
      if (!selectedFile) {
          document.getElementById('run-automation').disabled = e.target.value.trim().length === 0;
      }
  });

  // Run Button
  document.getElementById('run-automation').addEventListener('click', executeAutomation);

  // Download Handlers
  document.getElementById('download-excel').addEventListener('click', () => {
      window.triggerExcelExport();
  });

  document.getElementById('download-pdf').addEventListener('click', () => {
      if (!lastWorkflowResult) return;
      addLog('Drafting professional PDF audit certificate...', 'info');
      generatePDFReport(lastWorkflowResult, currentSessionLogs);
      addLog('PDF certificate generated and downloaded.', 'success');
  });

  // Toggles & Modal (Existing)
  document.getElementById('presentation-toggle').addEventListener('change', (e) => {
    isPresentationMode = e.target.checked;
  });
  document.getElementById('step-by-step-toggle').addEventListener('change', (e) => {
    isStepByStep = e.target.checked;
  });
  document.getElementById('close-modal').addEventListener('click', () => {
    const modal = document.getElementById('welcome-modal');
    modal.style.opacity = '0';
    setTimeout(() => modal.style.display = 'none', 300);
  });
  document.getElementById('clear-logs').addEventListener('click', () => {
      document.getElementById('logs-window').innerHTML = '';
      currentSessionLogs = [];
  });

  // Excel Export Logic (Data-Centric Update)
  window.triggerExcelExport = () => {
      if (!lastWorkflowResult) return;
      addLog('Drafting multi-sheet Business Audit package...', 'info');
      
      const patient = lastWorkflowResult.patient || {};
      const med = lastWorkflowResult.medication || lastWorkflowResult.inventory || {};

      // 1. Processed Data Sheet
      const dataReport = [
          ["BUSINESS DATA REPORT - INTELLIGENT WORKFLOW RESULT"],
          ["Source Metadata:", lastWorkflowResult.fileName || "Staged Artifact"],
          ["Detected Category:", (lastWorkflowResult.type || 'Standard').toUpperCase()],
          [""],
          ["Extracted Field", "Processed Value", "Validation Status"],
          ["Patient Name", `${patient.first_name} ${patient.last_name}`, "PASS"],
          ["Date of Birth", patient.dob || "N/A", "PASS"],
          ["Medical Product", med.name || "N/A", "MAPPED"],
          ["Product NDC", med.ndc || "N/A", "VERIFIED"],
          ["Resulting Status", lastWorkflowResult.status || "PAID", "FINALIZED"],
          ["Patient Copay", lastWorkflowResult.copay || "$0.00", "CALCULATED"]
      ];

      // 2. Technical Audit Sheet
      const auditLog = [
          ["TECHNICAL AUDIT TRAIL - COMPLIANCE LOGS"],
          ["Report ID:", lastWorkflowResult.report_id],
          [""],
          ["Timestamp", "Event", "Execution Level"],
          ...currentSessionLogs.map(l => [l.timestamp, l.message, l.type.toUpperCase()])
      ];

      const wb = XLSX.utils.book_new();
      
      const wsData = XLSX.utils.aoa_to_sheet(dataReport);
      XLSX.utils.book_append_sheet(wb, wsData, "Processed Data");
      
      const wsAudit = XLSX.utils.aoa_to_sheet(auditLog);
      XLSX.utils.book_append_sheet(wb, wsAudit, "Technical Appendix");

      XLSX.writeFile(wb, `Business_Report_${lastWorkflowResult.report_id}.xlsx`);
      addLog('Excel package downloaded with 2 worksheets.', 'success');
  };

  // Pre-load
  document.getElementById('universal-input').value = JSON.stringify(SCENARIO_DATA[currentScenario], null, 2);
});
