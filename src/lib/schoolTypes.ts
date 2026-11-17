export type Student = {
  id: string;
  admission_number: string;
  admission_date: string;
  date_of_birth?: string | null;
  full_name: string;
  full_name_urdu?: string | null;
  fathers_name_urdu?: string | null;
  mother_name_urdu?: string | null;
  student_name_prefix?: string | null;
  father_name_prefix?: string | null;
  mother_name?: string | null;
  gender: string;
  class_name: string;
  admitted_in_class?: string | null;
  section_name: string;
  guardian_name: string;
  guardian_phone: string;
  last_school?: string | null;
  last_class?: string | null;
  subject_group?: string | null;
  place_of_birth?: string | null;
  student_form_b?: string | null;
  photo_url?: string | null;
  fathers_name?: string | null;
  fathers_cnic?: string | null;
  roll_number?: string | null;
  mother_number?: string | null;
  religion?: string | null;
  house?: string | null;
  student_group?: string | null;
  area?: string | null;
  mother_tongue?: string | null;
  nationality?: string | null;
  current_address?: string | null;
  permanent_address?: string | null;
  father_contact_number?: string | null;
  messaging_number?: string | null;
  father_profession?: string | null;
  guardian_relationship?: string | null;
  guardian_cnic?: string | null;
  tuition_fee?: number | null;
  fee_concession_percentage?: number | null;
  fee_concession_amount?: number | null;
  fine_exempt?: boolean | null;
  // Leaving Info
  leaving_date?: string | null;
  leaving_reason?: string | null;
  leaving_remarks?: string | null;
  // Submitted Documents
  submitted_b_form?: string | null;
  submitted_previous_tc?: string | null;
  submitted_birth_certificate?: string | null;
  submitted_photos?: string | null;
  submitted_other_docs?: string | null;
  // Issued Documents
  issued_tc_number?: string | null;
  issued_tc_date?: string | null;
  issued_character_certificate?: string | null;
  issued_migration_certificate?: string | null;
  issued_other_docs?: string | null;
  data_source?: 'current_session' | 'archive' | null;
  clearance_status?: 'cleared' | 'not_clear' | null;
  fee_balance: number;
  status: 'active' | 'pending' | 'withdrawn' | 'promoted';
};

export type FeeTransaction = {
  id: string;
  kind: 'payment' | 'charge';
  amount: number;
  balance_after: number;
  created_at: string;
};

export type NoticeTemplate = {
  id?: string;
  notice_type: 'fee_clearance_reminder' | 'warning_notice';
  language: 'English' | 'Urdu';
  template_text: string;
  updated_at?: string;
};

export type InformationRecord = {
  id: string;
  information_type: string;
  notes: string;
  updated_at: string;
};

export type AdmissionFormState = {
  admission_number: string;
  admission_date: string;
  date_of_birth: string;
  student_name_prefix: string;
  full_name: string;
  full_name_urdu: string;
  father_name_prefix: string;
  fathers_name: string;
  fathers_name_urdu: string;
  mother_name: string;
  mother_name_urdu: string;
  fathers_cnic: string;
  student_form_b: string;
  admitted_in_class: string;
  class_name: string;
  section_name: string;
  last_school: string;
  last_class: string;
  gender: string;
  status: Student['status'];
  religion: string;
  nationality: string;
  student_group: string;
  subject_group: string;
  house: string;
  place_of_birth: string;
  guardian_name: string;
  guardian_phone: string;
  photo_url: string;
  data_source: 'current_session' | 'archive';
  current_address: string;
  permanent_address: string;
  father_contact_number: string;
  messaging_number: string;
  father_profession: string;
  mother_tongue: string;
  guardian_relationship: string;
  guardian_cnic: string;
  tuition_fee: string;
  fee_concession_percentage: string;
  fee_concession_amount: string;
  fine_exempt: boolean;
  // Leaving Info
  leaving_date: string;
  leaving_reason: string;
  leaving_remarks: string;
  // Submitted Documents
  submitted_b_form: string;
  submitted_previous_tc: string;
  submitted_birth_certificate: string;
  submitted_photos: string;
  submitted_other_docs: string;
  // Issued Documents
  issued_tc_number: string;
  issued_tc_date: string;
  issued_character_certificate: string;
  issued_migration_certificate: string;
  issued_other_docs: string;
};
