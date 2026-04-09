/**
 * Intelligent Classification & Field Mapping Engine
 * 
 * Simulates an NLP/Classification service that identifies 
 * pharmacy support intents and normalizes varied input schemas.
 */

export const SUPPORT_TYPES = {
  REFILL: 'refill',
  CLAIM: 'claim',
  ELIGIBILITY: 'eligibility',
  INVENTORY: 'inventory',
  PATIENT_UPDATE: 'patient_update',
  REPORT: 'report',
  EXCEPTION: 'exception',
  DOCUMENT_SUPPORT: 'document_support',
  UNKNOWN: 'unknown'
};

export const FILE_EXTENSIONS = {
  STRUCTURED: ['csv', 'xlsx', 'xls', 'json', 'xml'],
  UNSTRUCTURED: ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'tif']
};


const KEYWORDS = {
  [SUPPORT_TYPES.REFILL]: ['refill', 'renew', 'script', 'rx_id', 'rx_number'],
  [SUPPORT_TYPES.CLAIM]: ['claim', 'rejected', 'denied', 'rejection', 'payer', 'adjudication'],
  [SUPPORT_TYPES.ELIGIBILITY]: ['eligibility', 'eligible', 'coverage', 'insurance', 'member_id', 'bin', 'pcn'],
  [SUPPORT_TYPES.INVENTORY]: ['stock', 'inventory', 'on_hand', 'shelf', 'warehouse', 'ndc'],
  [SUPPORT_TYPES.PATIENT_UPDATE]: ['address', 'update', 'contact', 'phone', 'email', 'move'],
  [SUPPORT_TYPES.REPORT]: ['report', 'audit', 'summary', 'analytics', 'data_export'],
  [SUPPORT_TYPES.EXCEPTION]: ['error', 'flag', 'manual', 'override', 'discrepancy']
};

const FIELD_MAPS = {
  patient_name: ['pt_name', 'person', 'full_name', 'patient', 'name'],
  rx_id: ['rx_number', 'script_id', 'rx_no', 'script'],
  member_id: ['ins_id', 'policy_no', 'member_no', 'eligibility_id'],
  medication: ['drug', 'product', 'drug_name', 'item'],
  quantity: ['qty', 'amount', 'units', 'count']
};

/**
 * Classifies raw string or object input into a Support Type.
 */
export function classifyRequest(input) {
  const content = typeof input === 'string' ? input.toLowerCase() : JSON.stringify(input).toLowerCase();
  
  for (const [type, keys] of Object.entries(KEYWORDS)) {
    if (keys.some(key => content.includes(key))) {
        return type;
    }
  }
  return SUPPORT_TYPES.UNKNOWN;
}

/**
 * Normalizes field names based on the detected type.
 */
export function normalizeFields(input) {
  if (typeof input !== 'object' || input === null) return input;
  
  const normalized = {};
  const entries = Object.entries(input);
  
  for (const [key, value] of entries) {
    const lowKey = key.toLowerCase();
    let found = false;
    
    for (const [canonical, aliases] of Object.entries(FIELD_MAPS)) {
      if (aliases.includes(lowKey) || canonical === lowKey) {
        normalized[canonical] = value;
        found = true;
        break;
      }
    }
    
    if (!found) {
      normalized[key] = value;
    }
  }
  
  return normalized;
}

/**
 * Intelligent Parser for varied input formats (JSON, CSV row string, Plain text)
 */
export function parseUniversalInput(input) {
  // 1. Try JSON
  try {
    const data = JSON.parse(input);
    return normalizeFields(data);
  } catch (e) {
    // Not JSON
  }

  // 2. Try CSV-like (comma or tab separated)
  if (input.includes(',') || input.includes('\t')) {
    const parts = input.split(/[,\t]/).map(s => s.trim());
    if (parts.length > 1) {
      // Very simple heuristic: try to map common columns if they exist
      // In a real demo, we'd have a header-detection row, but here we just map index to common fields
      return {
          raw_parts: parts,
          message: "Structured CSV Row detected."
      };
    }
  }

  // 3. Plain Text
  return { message: input };
}
