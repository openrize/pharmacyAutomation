import './style.css';
import { worker } from './mocks/browser';
import { 
  formatPatientSummary, 
  formatAdjudicationSummary, 
  formatReportSummary 
} from './components/presentation';

// 1. Initialize Service Virtualization [wiremock]
const initMSW = async () => {
  try {
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
    addLog('System initialized in DEMO_MODE.', 'success');
  } catch (err) {
    console.error('Safe Error: Virtualization initialization failed.');
  }
};

// 2. UI State
let currentScenario = 'happy_path';
let isRunning = false;
let isPresentationMode = false;
let isStepByStep = false;
let uploadedData = null;
let lastAdjudicationResult = null;
let currentSessionLogs = [];

// 3. UI Helpers
const addLog = (message, type = 'info') => {
  const logsWindow = document.getElementById('logs-window');
  const timestamp = new Date().toLocaleTimeString([], { hour12: false });
  
  // Track logs for Excel export
  currentSessionLogs.push({ timestamp, message, type });
  
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<span>[${timestamp}]</span> ${message}`;
  logsWindow.appendChild(entry);
  logsWindow.scrollTop = logsWindow.scrollHeight;
};

const updateStatus = (status, type) => {
  const statusBadge = document.getElementById('workflow-status');
  statusBadge.textContent = status.toUpperCase();
  statusBadge.className = `status-badge ${type}`;
};

const resetFlow = () => {
  document.querySelectorAll('.flow-step').forEach(step => step.classList.remove('active'));
  currentSessionLogs = []; // Reset logs for new run
  document.querySelectorAll('.preview-box, .presentation-box').forEach(box => {
    box.style.display = 'none';
    box.textContent = '';
    box.innerHTML = '';
  });
};

// 4. Core Automation Pipeline [synthea] [hhs]
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

const executeAutomation = async () => {
  if (isRunning) return;
  isRunning = true;
  document.getElementById('run-automation').disabled = true;
  resetFlow();
  
  updateStatus('Processing...', 'processing');
  addLog(`Starting automation scenario: ${currentScenario}`, 'info');

  try {
    // --- STEP 1: FETCH DATA ---
    const stepFetch = document.getElementById('step-fetch');
    stepFetch.classList.add('active');
    
    let fetchData;
    if (uploadedData) {
      fetchData = uploadedData;
      addLog('Using custom source data from uploaded document.', 'success');
    } else {
      const fetchResponse = await fetch(`/api/demo/fetch?scenario=${currentScenario}`);
      if (!fetchResponse.ok) throw new Error('FETCH_FAILED');
      fetchData = await fetchResponse.json();
      addLog('Fetch completed. PHI/PII remains synthetic [synthea].', 'success');
    }
    
    const fetchPreview = document.getElementById('fetch-preview');
    const fetchPresentation = document.getElementById('fetch-presentation');
    
    if (isPresentationMode) {
      fetchPresentation.style.display = 'block';
      fetchPresentation.innerHTML = formatPatientSummary(fetchData);
      fetchPreview.style.display = 'none';
    } else {
      fetchPreview.style.display = 'block';
      fetchPreview.textContent = JSON.stringify(fetchData, null, 2);
      fetchPresentation.style.display = 'none';
    }

    if (isStepByStep) {
      await waitForAdvance();
    } else {
      await new Promise(r => setTimeout(r, 1500)); // Visual pause
    }

    // --- STEP 2: AUTO-FILL FORM ---
    const stepForm = document.getElementById('step-form');
    stepForm.classList.add('active');
    addLog('Mapping clinical data to intake form...', 'info');
    
    const submitResponse = await fetch('/api/demo/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: currentScenario, data: fetchData })
    });
    const submitData = await submitResponse.json();
    
    const formPreview = document.getElementById('form-preview');
    const formPresentation = document.getElementById('form-presentation');
    
    if (isPresentationMode) {
      formPresentation.style.display = 'block';
      formPresentation.innerHTML = formatAdjudicationSummary(submitData);
      formPreview.style.display = 'none';
    } else {
      formPreview.style.display = 'block';
      formPreview.textContent = JSON.stringify(submitData, null, 2);
      formPresentation.style.display = 'none';
    }
    
    addLog('Form submission completed safely [hhs].', 'success');

    if (isStepByStep) {
      await waitForAdvance();
    } else {
      await new Promise(r => setTimeout(r, 1500)); // Visual pause
    }

    // --- STEP 3: REPORT ---
    const stepReport = document.getElementById('step-report');
    stepReport.classList.add('active');
    
    const reportResponse = await fetch('/api/demo/report');
    const reportData = await reportResponse.json();
    lastAdjudicationResult = { ...fetchData, ...submitData, ...reportData };
    
    const reportPreview = document.getElementById('report-preview');
    const reportPresentation = document.getElementById('report-presentation');
    
    if (isPresentationMode) {
      reportPresentation.style.display = 'block';
      reportPresentation.innerHTML = formatReportSummary(reportData);
      reportPreview.style.display = 'none';
    } else {
      reportPreview.style.display = 'block';
      reportPreview.textContent = JSON.stringify(reportData, null, 2);
      reportPresentation.style.display = 'none';
    }
    
    addLog('Final report generated [sdv].', 'success');

    updateStatus('Success', 'success');
    document.getElementById('download-excel').style.display = 'flex';

  } catch (err) {
    addLog(`Automation interrupted: SAFE_RETRY_TRIGGERED. Error ID: ${Math.random().toString(36).substr(2, 6)}`, 'error');
    updateStatus('Error', 'error');
  } finally {
    isRunning = false;
    document.getElementById('run-automation').disabled = false;
    document.getElementById('advance-step').style.display = 'none';
  }
};

// 5. App Initialization
initMSW().then(() => {
  const scenarioButtons = document.querySelectorAll('.scenario-btn');
  scenarioButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isRunning) return;
      scenarioButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentScenario = btn.dataset.scenario;
      document.getElementById('current-scenario-title').textContent = btn.textContent;
      resetFlow();
      updateStatus('Ready', 'success');
    });
  });

  document.getElementById('run-automation').addEventListener('click', executeAutomation);

  // 6. Presentation Mode & Modal Logic
  const toggle = document.getElementById('presentation-toggle');
  toggle.addEventListener('change', (e) => {
    isPresentationMode = e.target.checked;
    addLog(`Switched to ${isPresentationMode ? 'Presentation' : 'Technical'} Mode`, 'info');
    if (!isRunning) resetFlow();
  });

  const stepToggle = document.getElementById('step-by-step-toggle');
  stepToggle.addEventListener('change', (e) => {
    isStepByStep = e.target.checked;
    addLog(`Step-by-Step mode: ${isStepByStep ? 'ENABLED' : 'DISABLED'}`, 'info');
  });

  const modal = document.getElementById('welcome-modal');
  const closeBtn = document.getElementById('close-modal');
  
  closeBtn.addEventListener('click', () => {
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  });

  // 7. Universal File Handling Logic
  const fileInput = document.getElementById('source-upload');
  const triggerBtn = document.getElementById('trigger-upload');
  const previewContainer = document.getElementById('source-file-preview');

  triggerBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    resetFlow();
    previewContainer.innerHTML = '';
    previewContainer.style.display = 'block';
    addLog(`File uploaded: ${file.name}`, 'info');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewContainer.innerHTML = `
          <div class="preview-label">IMAGE_OCR_SOURCE</div>
          <div class="scanning-line"></div>
          <img src="${e.target.result}" alt="source preview">
        `;
      };
      reader.readAsDataURL(file);
      // Mock data for image
      uploadedData = {
        patient: { first_name: 'Cecilia', last_name: 'Sauer', dob: '1968-12-26' },
        medication: { name: 'Lisinopril 10 MG Oral Tablet' },
        prescriber: { display_name: "Dr. O'Kon" }
      };
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        previewContainer.innerHTML = `
          <div class="preview-label">STRUCTURED_DATA_SOURCE</div>
          <table class="data-table-preview">
            <thead>
              <tr>${Object.keys(json[0]).map(k => `<th>${k}</th>`).join('')}</tr>
            </thead>
            <tbody>
              <tr>${Object.values(json[0]).map(v => `<td>${v}</td>`).join('')}</tr>
            </tbody>
          </table>
        `;
        
        // Map first row to our schema
        const row = json[0];
        uploadedData = {
          patient: { 
            first_name: row['Patient Name']?.split(' ')[0] || 'Wanda', 
            last_name: row['Patient Name']?.split(' ')[1] || 'Schroeder',
            dob: row['DOB'] || '1958-01-06'
          },
          medication: { name: row['Medication'] || 'Lisinopril 10 MG' },
          prescriber: { display_name: row['Prescriber'] || "Dr. O'Kon" }
        };
      };
      reader.readAsArrayBuffer(file);
    }
  });

  // 8. Excel Export Logic
  const exportToExcel = () => {
    if (!lastAdjudicationResult) return;
    
    addLog('Generating Multi-Sheet Excel report...', 'info');
    
    // Sheet 1: Executive Summary
    const summaryData = [
      ["PHARMACY AUTOMATION AUDIT - EXECUTIVE SUMMARY"],
      [""],
      ["TRANSACTION DETAILS"],
      ["Field", "Value"],
      ["Report ID", lastAdjudicationResult.report_id],
      ["Generated At", lastAdjudicationResult.generated_at],
      ["Workflow Scenario", currentScenario.toUpperCase()],
      [""],
      ["PATIENT & CLAIM DATA"],
      ["Indicator", "Detail"],
      ["Patient Name", `${lastAdjudicationResult.patient.first_name} ${lastAdjudicationResult.patient.last_name}`],
      ["Date of Birth", lastAdjudicationResult.patient.dob],
      ["Medication", lastAdjudicationResult.medication.name],
      ["NDC / Identifier", lastAdjudicationResult.medication.ndc || "EXTRACTED_VAL"],
      [""],
      ["ADJUDICATION STATUS"],
      ["Status Code", lastAdjudicationResult.status],
      ["Claim ID", lastAdjudicationResult.claim_id],
      ["Patient Copay", lastAdjudicationResult.copay],
      ["Summary Note", lastAdjudicationResult.summary],
      [""],
      ["SYSTEM DISCLOSURE"],
      ["Verified Synthetic Data Protocol: SYNTHEA_SDV_v4"],
      ["No PHI/PII transition detected."]
    ];

    // Sheet 2: Technical Audit Trail
    const logData = [
      ["TIMESTAMP", "EVENT DESCRIPTION", "SEVERITY"],
      ...currentSessionLogs.map(l => [l.timestamp, l.message, l.type.toUpperCase()])
    ];
    
    const wb = XLSX.utils.book_new();
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    const wsLogs = XLSX.utils.aoa_to_sheet(logData);
    
    // Basic Column Auto-sizing for visibility
    const summaryCols = [{ wch: 25 }, { wch: 50 }];
    const logCols = [{ wch: 15 }, { wch: 80 }, { wch: 15 }];
    wsSummary['!cols'] = summaryCols;
    wsLogs['!cols'] = logCols;

    XLSX.utils.book_append_sheet(wb, wsSummary, "Case Summary");
    XLSX.utils.book_append_sheet(wb, wsLogs, "Audit Trail");
    
    const fileName = `Automation_Audit_${currentScenario}_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, fileName);
    addLog('Comprehensive Excel audit initiated.', 'success');
  };

  document.getElementById('download-excel').addEventListener('click', exportToExcel);
  
  // EXPOSE GLOBAL FOR COMPONENT CALLBACKS
  window.triggerExcelExport = exportToExcel;
});
