/**
 * Helper functions to transform technical JSON data into 
 * human-readable presentation summaries.
 */

export const formatClassificationSummary = (type, confidence = 0.98) => {
  const iconMap = {
    refill: '💊',
    claim: '📝',
    eligibility: '🛡️',
    inventory: '📦',
    patient_update: '👤',
    report: '📊',
    exception: '⚠️',
    unknown: '❓'
  };

  return `
    <div class="presentation-card animate-fade">
      <div class="summary-title" style="color: var(--accent-secondary)">INTENT DETECTED</div>
      <div class="intent-line" style="font-size: 1.2rem; font-weight: 800;">
        <span style="margin-right: 12px;">${iconMap[type] || '🔍'}</span>
        ${type.replace('_', ' ').toUpperCase()}
      </div>
      <div class="confidence-bar" style="margin-top: 12px; background: rgba(255,255,255,0.05); height: 4px; border-radius: 2px;">
         <div style="background: var(--accent-secondary); width: ${confidence * 100}%; height: 100%; border-radius: 2px;"></div>
      </div>
      <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Confidence: ${(confidence * 100).toFixed(1)}% | Pattern Match: Global Schema V4</p>
    </div>
  `;
};

export const formatSourceSummary = (data) => {
  const { patient, type } = data;
  
  let typeDetail = '';
  if (type === 'inventory' && data.inventory) {
    typeDetail = `<div class="med-line"><strong>Product:</strong> ${data.inventory.name}</div>`;
  } else if (data.medication) {
    typeDetail = `<div class="med-line"><strong>Medication:</strong> ${data.medication.name}</div>`;
  }

  return `
    <div class="presentation-card">
      <div class="patient-line">
        <strong>Source Identity:</strong> ${patient.first_name} ${patient.last_name} 
      </div>
      ${typeDetail}
      <div class="detail-line" style="color: var(--accent-primary); font-size: 0.8rem; margin-top: 8px;">
        ✅ Verified via Demo Data Source A
      </div>
    </div>
  `;
};

export const formatAdjudicationSummary = (data, type) => {
  if (type === 'inventory') {
    return `
      <div class="presentation-card success-pulse">
        <div class="summary-title">INVENTORY CHECK PASSED</div>
        <div class="claim-details">
          Status: <strong style="color: var(--accent-primary)">AVAILABLE</strong><br/>
          Action: <code>RESTOCK_TRIGGER_BYPASS</code>
        </div>
      </div>
    `;
  }

  if (type === 'eligibility') {
    return `
      <div class="presentation-card success-pulse">
        <div class="summary-title">ELIGIBILITY VERIFIED</div>
        <div class="claim-details">
          Payer: <strong>${data.payer}</strong><br/>
          Coverage: <span style="color: var(--accent-primary)">FULL_BENEFIT</span>
        </div>
      </div>
    `;
  }

  if (data.status === 'PAID') {
    return `
      <div class="presentation-card success-pulse">
        <div class="summary-title">CLEARED FOR DISPENSING</div>
        <div class="claim-details">
          Claim ID: <code>${data.claim_id}</code><br/>
          Patient Copay: <strong>${data.copay}</strong>
        </div>
      </div>
    `;
  }
  
  if (data.rejection_reason === 'prior_auth_required') {
    return `
      <div class="presentation-card warning">
        <div class="summary-title">PRIOR AUTHORIZATION REQUIRED</div>
        <p>Automation detected a missing PA.</p>
        <div class="next-steps" style="color: var(--accent-warning); font-weight: 800;">Redirected to Specialty Queue</div>
      </div>
    `;
  }

  return `
    <div class="presentation-card error">
      <div class="summary-title">TRANSACTION REJECTED</div>
      <p>${data.message || 'System Error'}</p>
    </div>
  `;
};

export const formatReportSummary = (data) => {
  return `
    <div class="presentation-report animate-fade">
      <div class="report-badge">${data.privacy_badge}</div>
      <h3>Automation Audit Complete</h3>
      <p style="margin-bottom: 20px;">${data.summary}</p>
      
      <div class="final-action-container">
        <button onclick="window.triggerExcelExport()" class="btn-primary pulse-button">
          <span class="icon">📥</span> Download Audit (Excel)
        </button>
      </div>

      <div class="report-id" style="margin-top: 20px; font-size: 0.7rem; color: var(--text-muted);">Ref ID: ${data.report_id}</div>
    </div>
  `;
};

