/**
 * Helper functions to transform technical JSON data into 
 * human-readable presentation summaries.
 */

export const formatPatientSummary = (data) => {
  const { patient, medication } = data;
  return `
    <div class="presentation-card">
      <div class="patient-line">
        <strong>Patient:</strong> ${patient.first_name} ${patient.last_name} 
        <span class="dob">(${patient.dob})</span>
      </div>
      <div class="med-line">
        <strong>Medication:</strong> ${medication.name}
      </div>
      <div class="detail-line">
        <strong>Prescriber:</strong> ${data.prescriber.display_name}
      </div>
    </div>
  `;
};

export const formatAdjudicationSummary = (data) => {
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
        <p>Automation detected a missing PA for this insurance level.</p>
        <div class="next-steps">Workflow redirected to PA Specialist queue.</div>
      </div>
    `;
  }

  return `
    <div class="presentation-card error">
      <div class="summary-title">TRANSACTION REJECTED</div>
      <p>${data.message || data.rejection_reason}</p>
    </div>
  `;
};

export const formatReportSummary = (data) => {
  return `
    <div class="presentation-report">
      <div class="report-badge">${data.privacy_badge}</div>
      <h3>Automation Audit Complete</h3>
      <p>${data.summary}</p>
      
      <div class="final-action-container">
        <button onclick="window.triggerExcelExport()" class="btn-primary pulse-button">
          <span class="icon">📥</span> Download Audit (Excel)
        </button>
      </div>

      <div class="report-id">Ref ID: ${data.report_id}</div>
    </div>
  `;
};
