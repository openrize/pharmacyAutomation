/**
 * Universal Document Processor
 * 
 * Simulates high-precision extraction for various file types.
 * Distinguishes between structured data (CSV/Excel) and 
 * unstructured data (Images/Scanned PDFs) using mocked OCR delays.
 */

export const EXTRACTOR_MODES = {
  STRUCTURED: 'structured',
  OCR: 'ocr',
  NLP: 'nlp',
  UNCERTAIN: 'uncertain'
};

/**
 * Simulates extraction of pharmacy data from files.
 * Returns a promise that resolves with extracted data and mode used.
 */
export async function processFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  
  let mode = EXTRACTOR_MODES.STRUCTURED;
  let delay = 500;

  // Decide mode and simulation delay
  if (['png', 'jpg', 'jpeg', 'tif', 'tiff'].includes(extension)) {
    mode = EXTRACTOR_MODES.OCR;
    delay = 2500; // OCR takes longer to simulate scanning
  } else if (['pdf', 'docx', 'doc'].includes(extension)) {
    // Check if it's a scan or text (simulated)
    mode = EXTRACTOR_MODES.NLP;
    delay = 1500;
  } else if (['csv', 'xlsx', 'xls'].includes(extension)) {
    mode = EXTRACTOR_MODES.STRUCTURED;
    delay = 800;
  }

  // Artificial processing delay
  await new Promise(r => setTimeout(r, delay));

  // Determine success based on extension (mocking "Broken" or "Unknown")
  if (extension === 'bin' || extension === 'exe') {
    throw new Error('UNSUPPORTED_FORMAT: The file header does not match any recognized medical data schema.');
  }

  if (file.size > 5000000) { // 5MB limit simulation
      throw new Error('FILE_TOO_LARGE: Please compress source for high-speed transformation.');
  }

  // Return a "Mock Extraction" result
  // In a real demo, we'd pull from the actual file content if possible, 
  // but here we generate a "Successful Extraction Result".
  return {
    success: true,
    mode,
    fileName: file.name,
    fileSize: `${(file.size / 1024).toFixed(1)} KB`,
    confidence: mode === EXTRACTOR_MODES.OCR ? 0.92 : 0.99,
    extracted_at: new Date().toISOString()
  };
}
