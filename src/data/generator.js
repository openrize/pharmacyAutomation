import { faker } from '@faker-js/faker';

// Set deterministic seed
faker.seed(20260407);

const MEDICATION_SAMPLES = [
  { ndc: '00603-3888-21', rxnorm: '309362', name: 'Lisinopril 10 MG Oral Tablet', form: 'tablet' },
  { ndc: '00378-0208-01', rxnorm: '197361', name: 'Atorvastatin 20 MG Oral Tablet', form: 'tablet' },
  { ndc: '50458-0579-30', rxnorm: '1114195', name: 'Xarelto 20 MG Oral Tablet', form: 'tablet' },
  { ndc: '00006-0277-31', rxnorm: '312961', name: 'Singulair 10 MG Oral Tablet', form: 'tablet' },
  { ndc: '68382-0137-01', rxnorm: '312450', name: 'Metformin 500 MG Oral Tablet', form: 'tablet' },
];

const PAYERS = ['Blue Shield Pharmacy Care', 'Medi-Health Solutions', 'Global Wellness Rx', 'Standard PPO'];

export function generateSyntheticData() {
  const patients = [];
  const prescribers = [];
  
  // Generate 100 Prescribers
  for (let i = 0; i < 100; i++) {
    prescribers.push({
      prescriber_id: faker.string.uuid(),
      display_name: `Dr. ${faker.person.lastName()}`,
      npi: `10${faker.string.numeric(8)}`,
      specialty: faker.helpers.arrayElement(['family', 'internal', 'endocrinology', 'psychiatry'])
    });
  }

  // Generate 500 Patients
  for (let i = 0; i < 500; i++) {
    const ageRange = faker.helpers.weightedArrayElement([
      { value: [0, 17], weight: 0.18 },
      { value: [18, 64], weight: 0.62 },
      { value: [65, 89], weight: 0.18 },
      { value: [90, 102], weight: 0.02 }
    ]);
    
    const dob = faker.date.birthdate({ min: ageRange[0], max: ageRange[1], mode: 'age' });
    
    patients.push({
      patient_id: faker.string.uuid(),
      first_name: i % 20 === 0 ? `Demo${faker.person.firstName()}` : faker.person.firstName(),
      last_name: faker.person.lastName(),
      dob: dob.toISOString().split('T')[0],
      sex: faker.helpers.arrayElement(['female', 'male', 'unknown']),
      zip5: faker.location.zipCode(),
      state: faker.location.state({ abbreviated: true }),
      contact: {
        phone: faker.phone.number(),
        email: faker.internet.email({ provider: 'example.com' })
      }
    });
  }

  // Generate Inventory Status
  const inventory = MEDICATION_SAMPLES.map(m => ({
    ndc: m.ndc,
    name: m.name,
    on_hand: faker.number.int({ min: 0, max: 250 }),
    warehouse_id: `WH-${faker.string.numeric(3)}`,
    last_restock: faker.date.recent({ days: 15 }).toISOString().split('T')[0]
  }));

  return { patients, prescribers, medications: MEDICATION_SAMPLES, inventory, payers: PAYERS };
}

export function generateEligibility(patient) {
  return {
    patient_id: patient.patient_id,
    member_id: `MBR-${faker.string.alphanumeric(8).toUpperCase()}`,
    payer: faker.helpers.arrayElement(PAYERS),
    status: faker.helpers.weightedArrayElement([
      { value: 'ACTIVE', weight: 0.85 },
      { value: 'LENTED/EXPIRED', weight: 0.10 },
      { value: 'NOT_FOUND', weight: 0.05 }
    ]),
    verification_id: `VER-${Date.now()}`
  };
}

export function generatePrescription(patient, prescriber, medication) {
  const daysSupply = faker.helpers.weightedArrayElement([
    { value: 7, weight: 0.05 },
    { value: 14, weight: 0.10 },
    { value: 30, weight: 0.65 },
    { value: 90, weight: 0.20 }
  ]);

  return {
    rx_id: `RX-${faker.string.numeric(6)}`,
    patient_id: patient.patient_id,
    prescriber_id: prescriber.prescriber_id,
    medication_id: medication.ndc,
    rx_name: medication.name,
    days_supply: daysSupply,
    quantity: daysSupply * 1,
    written_date: faker.date.recent({ days: 120 }).toISOString().split('T')[0],
    refills_authorized: faker.number.int({ min: 0, max: 2 })
  };
}

