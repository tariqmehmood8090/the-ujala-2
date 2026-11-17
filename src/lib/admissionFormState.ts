import type { AdmissionFormState, Student } from '@/lib/schoolTypes';

export function createAdmissionForm(students: Student[]): AdmissionFormState {
  const highestNumber = students.reduce((highest, student) => Math.max(highest, Number(student.admission_number.match(/(\d+)$/)?.[1] ?? 0)), 2414);
  return { admission_number: `SD-${highestNumber + 1}`, admission_date: new Date().toISOString().slice(0, 10), date_of_birth: '', admitted_in_class: 'Class 5', student_name_prefix: '', full_name: '', father_name_prefix: '', fathers_name: '', mother_name: '', fathers_cnic: '', student_form_b: '', class_name: 'Class 5', section_name: 'B', last_school: '', last_class: '', gender: 'Girl', status: 'active', religion: '', nationality: 'Indian', student_group: '', subject_group: '', house: '', place_of_birth: '', guardian_name: '', guardian_phone: '', photo_url: '', data_source: 'current_session', full_name_urdu: '', fathers_name_urdu: '', mother_name_urdu: '', current_address: '', permanent_address: '', father_contact_number: '', messaging_number: '', father_profession: '', mother_tongue: '', guardian_relationship: '', guardian_cnic: '', tuition_fee: '', fee_concession_percentage: '', fee_concession_amount: '', fine_exempt: false, leaving_date: '', leaving_reason: '', leaving_remarks: '', submitted_b_form: '', submitted_previous_tc: '', submitted_birth_certificate: '', submitted_photos: '', submitted_other_docs: '', issued_tc_number: '', issued_tc_date: '', issued_character_certificate: '', issued_migration_certificate: '', issued_other_docs: '' };
}

export function admissionFormFromStudent(student: Student): AdmissionFormState {
  const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));
  return {
    admission_number: student.admission_number,
    admission_date: student.admission_date,
    date_of_birth: text(student.date_of_birth),
    student_name_prefix: text(student.student_name_prefix),
    full_name: student.full_name,
    full_name_urdu: text(student.full_name_urdu),
    father_name_prefix: text(student.father_name_prefix),
    fathers_name: text(student.fathers_name),
    fathers_name_urdu: text(student.fathers_name_urdu),
    mother_name: text(student.mother_name),
    mother_name_urdu: text(student.mother_name_urdu),
    fathers_cnic: text(student.fathers_cnic),
    student_form_b: text(student.student_form_b),
    admitted_in_class: text(student.admitted_in_class),
    class_name: student.class_name,
    section_name: student.section_name,
    last_school: text(student.last_school),
    last_class: text(student.last_class),
    gender: student.gender,
    status: student.status,
    religion: text(student.religion),
    nationality: text(student.nationality),
    student_group: text(student.student_group),
    subject_group: text(student.subject_group),
    house: text(student.house),
    place_of_birth: text(student.place_of_birth),
    guardian_name: student.guardian_name,
    guardian_phone: student.guardian_phone,
    photo_url: text(student.photo_url),
    data_source: student.data_source ?? 'current_session',
    current_address: text(student.current_address),
    permanent_address: text(student.permanent_address),
    father_contact_number: text(student.father_contact_number),
    messaging_number: text(student.messaging_number),
    father_profession: text(student.father_profession),
    mother_tongue: text(student.mother_tongue),
    guardian_relationship: text(student.guardian_relationship),
    guardian_cnic: text(student.guardian_cnic),
    tuition_fee: text(student.tuition_fee),
    fee_concession_percentage: text(student.fee_concession_percentage),
    fee_concession_amount: text(student.fee_concession_amount),
    fine_exempt: student.fine_exempt ?? false,
    leaving_date: text(student.leaving_date),
    leaving_reason: text(student.leaving_reason),
    leaving_remarks: text(student.leaving_remarks),
    submitted_b_form: text(student.submitted_b_form),
    submitted_previous_tc: text(student.submitted_previous_tc),
    submitted_birth_certificate: text(student.submitted_birth_certificate),
    submitted_photos: text(student.submitted_photos),
    submitted_other_docs: text(student.submitted_other_docs),
    issued_tc_number: text(student.issued_tc_number),
    issued_tc_date: text(student.issued_tc_date),
    issued_character_certificate: text(student.issued_character_certificate),
    issued_migration_certificate: text(student.issued_migration_certificate),
    issued_other_docs: text(student.issued_other_docs),
  };
}

export function buildAdmissionCsv(form: AdmissionFormState) {
  const rows = [['Field', 'Value'], ...Object.entries(form).map(([key, value]) => [key.replace(/_/g, ' '), String(value)])];
  return '\uFEFF' + rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
}
