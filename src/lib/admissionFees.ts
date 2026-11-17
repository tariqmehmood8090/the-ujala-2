import type { AdmissionFormState } from '@/lib/schoolTypes';

const parseAmount = (value: string) => {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function concessionAmountFor(tuitionFee: string, percentage: string) {
  const tuition = parseAmount(tuitionFee);
  const percent = parseAmount(percentage);
  if (tuition === null || percent === null) return '';
  return ((tuition * percent) / 100).toFixed(2);
}

export function concessionPercentageFor(tuitionFee: string, amount: string) {
  const tuition = parseAmount(tuitionFee);
  const value = parseAmount(amount);
  if (tuition === null || value === null || tuition <= 0) return '';
  return ((value / tuition) * 100).toFixed(2);
}

export function netTuitionFor(tuitionFee: string, amount: string) {
  const tuition = parseAmount(tuitionFee);
  if (tuition === null) return null;
  return tuition - (parseAmount(amount) ?? 0);
}

export function validateFeeFields(form: AdmissionFormState) {
  const tuition = parseAmount(form.tuition_fee);
  const percentage = parseAmount(form.fee_concession_percentage);
  const amount = parseAmount(form.fee_concession_amount);
  if ([tuition, percentage, amount].some((value) => value !== null && value < 0)) return 'Fee amounts cannot be negative';
  if (percentage !== null && percentage > 100) return 'Fee concession percentage cannot be more than 100';
  if (tuition !== null && amount !== null && amount > tuition) return 'Fee concession cannot be more than the tuition fee';
  return null;
}

export function toStudentFeePayload(form: AdmissionFormState) {
  return {
    ...form,
    tuition_fee: parseAmount(form.tuition_fee),
    fee_concession_percentage: parseAmount(form.fee_concession_percentage),
    fee_concession_amount: parseAmount(form.fee_concession_amount),
  };
}
