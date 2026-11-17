import type { AdmissionFormState } from '@/lib/schoolTypes';
import { concessionAmountFor, concessionPercentageFor, netTuitionFor } from '@/lib/admissionFees';
import { DropdownWithAdd } from '@/components/DropdownWithAdd';

type TextField = 'current_address' | 'permanent_address' | 'father_contact_number' | 'messaging_number' | 'guardian_relationship' | 'guardian_cnic';

const textareaClass = 'mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100';

const formatRupees = (value: number) => `Rs ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export function AdmissionOtherInfoFields({ form, update, patch, dropdownOptions, onOptionsChanged, onToast }: {
  form: AdmissionFormState;
  update: (key: keyof AdmissionFormState, value: string) => void;
  patch: (changes: Partial<AdmissionFormState>) => void;
  dropdownOptions: Record<string, string[]>;
  onOptionsChanged: () => void;
  onToast: (message: string) => void;
}) {
  const text = (key: TextField, label: string) => (
    <label key={key}>{label}<input value={form[key]} onChange={(event) => update(key, event.target.value)} /></label>
  );
  const net = netTuitionFor(form.tuition_fee, form.fee_concession_amount);

  return (
    <div className="form-grid admission-info-grid">
      <div className="form-section-title">Addresses</div>
      <label className="col-span-full">Current Address
        <textarea rows={3} value={form.current_address} onChange={(event) => update('current_address', event.target.value)} className={textareaClass} />
      </label>
      <label className="col-span-full">Permanent Address
        <textarea rows={3} value={form.permanent_address} onChange={(event) => update('permanent_address', event.target.value)} className={textareaClass} />
      </label>

      <div className="form-section-title">Parent and messaging contacts</div>
      {text('father_contact_number', 'Father Contact No.')}
      {text('messaging_number', 'Messaging Number')}

      <div className="form-section-title">Parent profile</div>
      <DropdownWithAdd category="father_profession" label="Father’s Profession" value={form.father_profession} options={dropdownOptions.father_profession} onChange={(value) => update('father_profession', value)} onOptionsChanged={onOptionsChanged} onToast={onToast} />
      <DropdownWithAdd category="mother_tongue" label="Mother Tongue" value={form.mother_tongue} options={dropdownOptions.mother_tongue} onChange={(value) => update('mother_tongue', value)} onOptionsChanged={onOptionsChanged} onToast={onToast} />

      <div className="form-section-title">Guardian details</div>
      {text('guardian_relationship', 'Relationship to Student')}
      {text('guardian_cnic', 'Guardian CNIC')}

      <div className="form-section-title">Fees and concessions</div>
      <label>Monthly Tuition Fee (Rs)
        <input type="number" min="0" step="0.01" value={form.tuition_fee} onChange={(event) => patch({ tuition_fee: event.target.value, fee_concession_amount: concessionAmountFor(event.target.value, form.fee_concession_percentage) })} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label>Concession (%)
          <input type="number" min="0" max="100" step="0.01" value={form.fee_concession_percentage} onChange={(event) => patch({ fee_concession_percentage: event.target.value, fee_concession_amount: concessionAmountFor(form.tuition_fee, event.target.value) })} />
        </label>
        <label>Concession (Rs)
          <input type="number" min="0" step="0.01" value={form.fee_concession_amount} onChange={(event) => patch({ fee_concession_amount: event.target.value, fee_concession_percentage: concessionPercentageFor(form.tuition_fee, event.target.value) })} />
        </label>
      </div>
      <div className="col-span-full grid grid-cols-1 gap-4 rounded-xl border border-sky-100 bg-sky-50/60 p-4 sm:grid-cols-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tuition fee</span>
          <strong className="mt-1 block text-base text-slate-800">{form.tuition_fee ? formatRupees(Number(form.tuition_fee)) : '—'}</strong>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Concession</span>
          <strong className="mt-1 block text-base text-slate-800">{form.fee_concession_amount ? formatRupees(Number(form.fee_concession_amount)) : 'None'}</strong>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payable each month</span>
          <strong className="mt-1 block text-base text-sky-700">{net === null ? 'Enter a tuition fee' : formatRupees(net)}</strong>
        </div>
      </div>
      <div className="col-span-full flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
        <div>
          <strong className="block text-sm text-slate-800">Fine exemption</strong>
          <span className="text-xs text-slate-500">{form.fine_exempt ? 'Late fines are waived for this student' : 'Late fines apply to this student'}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.fine_exempt}
          aria-label="Fine exemption"
          onClick={() => patch({ fine_exempt: !form.fine_exempt })}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form.fine_exempt ? 'bg-sky-600' : 'bg-slate-300'}`}
        >
          <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.fine_exempt ? 'translate-x-5' : ''}`} />
        </button>
      </div>
    </div>
  );
}
