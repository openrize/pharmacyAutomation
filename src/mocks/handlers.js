import { http, HttpResponse, delay } from 'msw';
import { generateSyntheticData, generateEligibility, generatePrescription } from '../data/generator';

const { patients, prescribers, medications, inventory, payers } = generateSyntheticData();

export const handlers = [
  // 1. Fetch / Ingest Simulation
  http.get('/api/demo/fetch', async ({ request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get('scenario') || 'happy_path';
    const type = url.searchParams.get('type') || 'refill';

    await delay(500);

    if (scenario === 'timeout') await delay(4000);
    if (scenario === 'invalid_member') return new HttpResponse(null, { status: 404 });

    const patient = patients[Math.floor(Math.random() * patients.length)];
    const prescriber = prescribers[0];
    const medication = medications[0];

    // Data variation based on support type
    const responseData = {
      timestamp: new Date().toISOString(),
      patient,
      scenario,
      type
    };

    if (type === 'inventory') {
      responseData.inventory = inventory[0];
    } else if (type === 'eligibility') {
      responseData.eligibility = generateEligibility(patient);
    } else {
      responseData.prescriber = prescriber;
      responseData.medication = medication;
      responseData.prescription = generatePrescription(patient, prescriber, medication);
    }

    return HttpResponse.json(responseData);
  }),

  // 2. Processing / Adjudication Simulation
  http.post('/api/demo/submit', async ({ request }) => {
    const body = await request.json();
    const type = body.type || 'refill';
    const scenario = body.scenario || 'happy_path';

    await delay(1200);

    // Business Logic Simulations
    if (type === 'inventory') {
      return HttpResponse.json({
        status: 'SUCCESS',
        action: 'RESTOCK_CHECK_PASSED',
        message: 'Inventory levels verified for warehouse WH-402.',
        stock_status: 'AVAILABLE'
      });
    }

    if (type === 'eligibility') {
      return HttpResponse.json({
        status: 'VERIFIED',
        payer: body.data?.eligibility?.payer || 'Standard PPO',
        coverage: 'FULL_BENEFIT',
        copay_tier: 'TIER_1'
      });
    }

    if (type === 'patient_update') {
      return HttpResponse.json({
        status: 'UPDATED',
        timestamp: new Date().toISOString(),
        fields_changed: ['address', 'contact_phone']
      });
    }

    // Default Prescription Flow
    if (scenario === 'pa_required') {
      return HttpResponse.json({
        status: 'REJECTED',
        rejection_code: '70',
        rejection_reason: 'prior_auth_required',
        message: 'Prior Authorization required level [hhs]'
      }, { status: 200 });
    }

    return HttpResponse.json({
      status: 'PAID',
      claim_id: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      copay: '$10.00'
    });
  }),

  // 3. Report Generation Simulation
  http.get('/api/demo/report', async ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'refill';
    
    await delay(800);
    return HttpResponse.json({
      report_id: `REP-${Date.now()}`,
      generated_at: new Date().toISOString(),
      summary: `Automation Success: ${type.toUpperCase()} workflow complete.`,
      privacy_badge: 'SYNTHETIC_DATA_CERTIFIED [sdv]',
      validation_logs: 'No PHI/PII breaches detected during execution.'
    });
  })
];

