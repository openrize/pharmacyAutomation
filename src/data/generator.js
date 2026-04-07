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

const PAYERS = ['Commercial', 'Medicare', 'Medicaid', 'Cash'];
const REJECTION_REASONS = ['prior_auth_required', 'refill_too_soon', 'quantity_limit', 'invalid_member_id'];

export function generateSyntheticData() {
  const patients = [];
  const prescribers = [];
  
  // Generate 800 Prescribers
  for (let i = 0; i < 800; i++) {
    prescribers.push({
      prescriber_id: faker.string.uuid(),
      display_name: `Dr. ${faker.person.lastName()}`,
      npi: `10${faker.string.numeric(8)}`, // Obviously synthetic NPI
      specialty: faker.helpers.arrayElement(['family', 'internal', 'endocrinology', 'psychiatry'])
    });
  }

  // Generate 2500 Patients
  for (let i = 0; i < 2500; i++) {
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

  return { patients, prescribers, medications: MEDICATION_SAMPLES };
}

export function generatePrescription(patient, prescriber, medication) {
  const daysSupply = faker.helpers.weightedArrayElement([
    { value: 7, weight: 0.05 },
    { value: 14, weight: 0.10 },
    { value: 30, weight: 0.65 },
    { value: 90, weight: 0.20 }
  ]);

  return {
    rx_id: faker.string.uuid(),
    patient_id: patient.patient_id,
    prescriber_id: prescriber.prescriber_id,
    medication_id: medication.ndc,
    rx_name: medication.name,
    days_supply: daysSupply,
    quantity: daysSupply * 1, // simplified daily dose
    written_date: faker.date.recent({ days: 120 }).toISOString().split('T')[0],
    refills_authorized: faker.number.int({ min: 0, max: 2 })
  };
}
