import { Plus, Wallet, X } from 'lucide-react';
import { FeeHistory } from '@/components/FeeHistory';
import { useFeeTransactions } from '@/lib/useFeeTransactions';
import type { Student } from '@/lib/schoolTypes';

type FeeMode = 'payment' | 'charge';

const formatAmount = (value: number) => `Rs ${Number(value).toLocaleString()}`;

export function FeeDetailsModal({ student, onClose, onRecord }: { student: Student; onClose: () => void; onRecord: (mode: FeeMode) => void }) {
  const { entries, loading, error } = useFeeTransactions(student.id);
  const pending = Number(student.fee_balance);
  const totalCharged = entries.filter((entry) => entry.kind === 'charge').reduce((sum, entry) => sum + Number(entry.amount), 0);
  const totalPaid = entries.filter((entry) => entry.kind === 'payment').reduce((sum, entry) => sum + Number(entry.amount), 0);
  const summaryReady = !loading && !error;

  const summaryCards: { label: string; value: string; tone: string }[] = [
    { label: 'Pending amount', value: formatAmount(pending), tone: pending > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700' },
    { label: 'Total charged', value: summaryReady ? formatAmount(totalCharged) : '—', tone: 'bg-amber-50 text-amber-700' },
    { label: 'Total paid', value: summaryReady ? formatAmount(totalPaid) : '—', tone: 'bg-sky-50 text-sky-700' },
  ];

  return (
    <div className="notice-overlay">
      <section className="notice-modal">
        <div className="notice-preview-top">
          <div>
            <span className="eyebrow">Fee details</span>
            <h2 className="mt-1 text-xl font-bold text-slate-800">{student.full_name}</h2>
            <p className="mt-1 text-sm text-slate-500">{student.admission_number} · {student.class_name} · Section {student.section_name}</p>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close fee details"><X size={18} /></button>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className={`rounded-xl px-4 py-3 ${card.tone}`}>
              <dt className="text-xs font-semibold uppercase tracking-wide opacity-80">{card.label}</dt>
              <dd className="mt-1 text-lg font-bold">{card.value}</dd>
            </div>
          ))}
        </dl>

        <FeeHistory student={student} entries={entries} loading={loading} error={error} />

        <div className="notice-preview-actions mt-6">
          <button type="button" className="secondary-button" onClick={() => onRecord('charge')}><Plus size={16} /> Add charge</button>
          <button type="button" className="primary-button" onClick={() => onRecord('payment')}><Wallet size={16} /> Collect payment</button>
        </div>
      </section>
    </div>
  );
}
