import { http, HttpResponse, delay } from 'msw';
import { generateSyntheticData } from '../data/generator';

const { patients, prescribers, medications } = generateSyntheticData();

export const handlers = [
  // 1. Fetch Simulation [synthea] [wiremock]
  http.get('/api/demo/fetch', async ({ request }) => {
    const url = new URL(request.url);
    const scenario = url.searchParams.get('scenario') || 'happy_path';

    // Inject Timeout scenario
    if (scenario === 'timeout') {
      await delay(4000); // 4s delay to trigger 3s timeout
    }

    // Invalid Member scenario
    if (scenario === 'invalid_member') {
      return new HttpResponse(null, { status: 404 });
    }

    // Default Success
    const patientIndex = scenario === 'large_qty' ? 0 : Math.floor(Math.random() * patients.length);
    const patient = patients[patientIndex];
    const prescriber = prescribers[0];
    const medication = medications[0];

    return HttpResponse.json({
      timestamp: new Date().toISOString(),
      patient,
      prescriber,
      medication,
      scenario
    });
  }),

  // 2. Form Submission / Adjudication Simulation [hhs]
  http.post('/api/demo/submit', async ({ request }) => {
    const body = await request.json();
    const scenario = body.scenario || 'happy_path';

    await delay(800); // Realistic network delay

    // Prior-Auth required logic
    if (scenario === 'pa_required') {
      return HttpResponse.json({
        status: 'REJECTED',
        rejection_code: '70',
        rejection_reason: 'prior_auth_required',
        message: 'Prior Authorization required for this medication level [hhs]'
      }, { status: 200 });
    }

    // Refill-too-soon logic
    if (scenario === 'refill_too_soon') {
      return HttpResponse.json({
        status: 'REJECTED',
        rejection_code: '79',
        rejection_reason: 'refill_too_soon',
        next_fill_date: '2026-04-12'
      }, { status: 200 });
    }

    // Large-Quantity logic
    if (scenario === 'large_qty') {
      return HttpResponse.json({
        status: 'PENDED',
        rejection_code: '88',
        rejection_reason: 'quantity_limit_exceeded',
        threshold: 30,
        submitted: 300
      }, { status: 200 });
    }

    // Happy Path
    return HttpResponse.json({
      status: 'PAID',
      claim_id: `DEMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      copay: '$10.00'
    });
  }),

  // 3. Report Generation Simulation [sdv]
  http.get('/api/demo/report', async () => {
    await delay(1200);
    return HttpResponse.json({
      report_id: `REP-${Date.now()}`,
      generated_at: new Date().toISOString(),
      summary: 'Automation Success: Fetch -> Auto-fill -> Adjudication complete.',
      privacy_badge: 'SYNTHETIC_DATA_CERTIFIED [sdv]'
    });
  })
];
