import { useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import type { Student } from '@/lib/schoolTypes';
import { FeeHistory } from '@/components/FeeHistory';
import { useFeeTransactions } from '@/lib/useFeeTransactions';
import { StudentPhoto } from '@/components/StudentPhoto';

export function StudentRecordModal({ student, autoPrint, onClose }: { student: Student; autoPrint: boolean; onClose: () => void }) {
  const { entries, loading, error } = useFeeTransactions(student.id);
  useEffect(() => {
    if (autoPrint) window.print();
  }, [autoPrint]);

  const details: { label: string; value: string | null | undefined }[] = [
    { label: 'Admission no.', value: student.admission_number },
    { label: 'Admission date', value: new Date(student.admission_date).toLocaleDateString() },
    { label: 'Class', value: `${student.class_name} · Section ${student.section_name}` },
    { label: 'Roll number', value: student.roll_number },
    { label: 'Gender', value: student.gender },
    { label: 'Student name (Urdu)', value: student.full_name_urdu },
    { label: 'Father’s name', value: student.fathers_name },
    { label: 'Father’s name (Urdu)', value: student.fathers_name_urdu },
    { label: 'Mother’s name (Urdu)', value: student.mother_name_urdu },
    { label: 'Father’s CNIC', value: student.fathers_cnic },
    { label: 'Guardian name', value: student.guardian_name },
    { label: 'Contact no.', value: student.guardian_phone },
    { label: 'Mother’s number', value: student.mother_number },
    { label: 'Religion', value: student.religion },
    { label: 'Nationality', value: student.nationality },
    { label: 'Area', value: student.area },
    { label: 'Fee balance', value: `Rs ${Number(student.fee_balance).toLocaleString()}` },
  ];

  return (
    <div className="notice-overlay">
      <section className="notice-modal print-sheet">
        <div className="notice-preview-top">
          <div>
            <span className="eyebrow">Student record</span>
            <h2 className="mt-1 text-xl font-bold text-slate-800">{student.full_name}</h2>
          </div>
          <button className="close-button no-print" onClick={onClose} aria-label="Close record"><X size={18} /></button>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <StudentPhoto src={student.photo_url} name={student.full_name} className="h-24 w-24 rounded-xl border border-slate-200" />
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-800">{student.admission_number}</p>
            <p>{student.class_name} · Section {student.section_name}</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {details.map((detail) => (
            <div key={detail.label} className="border-b border-slate-100 pb-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{detail.label}</dt>
              <dd className="mt-1 text-sm text-slate-800">{detail.value || '—'}</dd>
            </div>
          ))}
        </dl>
        <FeeHistory student={student} entries={entries} loading={loading} error={error} />
        <div className="notice-preview-actions no-print">
          <button className="secondary-button" onClick={onClose}>Close</button>
          <button className="primary-button" onClick={() => window.print()}><Printer size={16} /> Print record</button>
        </div>
      </section>
    </div>
  );
}
