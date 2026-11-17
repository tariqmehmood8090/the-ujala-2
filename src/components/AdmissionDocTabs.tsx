import type { AdmissionFormState } from '@/lib/schoolTypes';

type TabKey = 'leaving' | 'submitted' | 'issued';

type FieldDef = {
  key: keyof AdmissionFormState;
  label: string;
  type: 'text' | 'date' | 'textarea';
  placeholder?: string;
};

const leavingFields: FieldDef[] = [
  { key: 'leaving_date', label: 'Leaving Date', type: 'date' },
  { key: 'leaving_reason', label: 'Reason for Leaving', type: 'text', placeholder: 'Transfer, withdrawal, graduation, etc.' },
  { key: 'leaving_remarks', label: 'Remarks', type: 'textarea', placeholder: 'Additional notes about the departure' },
];

const submittedFields: FieldDef[] = [
  { key: 'submitted_b_form', label: 'B-Form', type: 'text', placeholder: 'Submitted / Pending / N/A' },
  { key: 'submitted_previous_tc', label: 'Previous School TC', type: 'text', placeholder: 'Submitted / Pending / N/A' },
  { key: 'submitted_birth_certificate', label: 'Birth Certificate', type: 'text', placeholder: 'Submitted / Pending / N/A' },
  { key: 'submitted_photos', label: 'Photos', type: 'text', placeholder: 'e.g. 2 photos submitted' },
  { key: 'submitted_other_docs', label: 'Other Documents', type: 'textarea', placeholder: 'List any other documents submitted' },
];

const issuedFields: FieldDef[] = [
  { key: 'issued_tc_number', label: 'TC Number', type: 'text', placeholder: 'Transfer certificate number' },
  { key: 'issued_tc_date', label: 'TC Issue Date', type: 'date' },
  { key: 'issued_character_certificate', label: 'Character Certificate', type: 'text', placeholder: 'Issued / Pending / N/A' },
  { key: 'issued_migration_certificate', label: 'Migration Certificate', type: 'text', placeholder: 'Issued / Pending / N/A' },
  { key: 'issued_other_docs', label: 'Other Documents Issued', type: 'textarea', placeholder: 'List any other documents issued' },
];

const tabs: { key: TabKey; label: string; fields: FieldDef[] }[] = [
  { key: 'leaving', label: 'Leaving Info', fields: leavingFields },
  { key: 'submitted', label: 'Submitted Doc', fields: submittedFields },
  { key: 'issued', label: 'Issued Doc', fields: issuedFields },
];

const textareaClass = 'mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100';

export function AdmissionDocTabs({ form, update }: {
  form: AdmissionFormState;
  update: (key: keyof AdmissionFormState, value: string) => void;
}) {
  return (
    <div className="form-grid admission-info-grid">
      {tabs.map((tab) => (
        <div key={tab.key} className="col-span-full">
          <div className="form-section-title">{tab.label}</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {tab.fields.map((field) => (
              <label key={field.key} className={field.type === 'textarea' ? 'col-span-full' : ''}>
                {field.label}
                {field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={typeof form[field.key] === 'string' ? form[field.key] as string : ''}
                    onChange={(e) => update(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={textareaClass}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={typeof form[field.key] === 'string' ? form[field.key] as string : ''}
                    onChange={(e) => update(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
