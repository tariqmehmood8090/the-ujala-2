import type { Student } from '@/lib/schoolTypes';
import { Eye, Plus, Printer, Trash2, Wallet } from 'lucide-react';
import { StudentPhoto } from '@/components/StudentPhoto';

export type RowAction = 'fee' | 'view' | 'print' | 'delete' | 'add';

const rowActions: { action: RowAction; label: string; icon: typeof Eye; tone: string }[] = [
  { action: 'fee', label: 'Fee', icon: Wallet, tone: 'text-sky-700 hover:bg-sky-50' },
  { action: 'view', label: 'View', icon: Eye, tone: 'text-slate-700 hover:bg-slate-100' },
  { action: 'print', label: 'Print', icon: Printer, tone: 'text-slate-700 hover:bg-slate-100' },
  { action: 'delete', label: 'Delete', icon: Trash2, tone: 'text-rose-600 hover:bg-rose-50' },
  { action: 'add', label: 'Add', icon: Plus, tone: 'text-emerald-700 hover:bg-emerald-50' },
];

export function StudentResultsTable({ students, onAction }: { students: Student[]; onAction: (action: RowAction, student: Student) => void }) {
  if (students.length === 0) {
    return <div className="empty-state large">No students match these filters. Try clearing one or two fields.</div>;
  }
  return (
    <div className="table-wrap">
      <table className="min-w-[1100px]">
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="transition-colors hover:bg-sky-50/40">
              <td>
                <StudentPhoto src={student.photo_url} name={student.full_name} className="student-photo-thumb h-10 w-10 rounded-lg" />
              </td>
              <td className="muted-cell">{student.admission_number}</td>
              <td className="muted-cell">{new Date(student.admission_date).toLocaleDateString()}</td>
              <td><strong>{student.full_name}</strong></td>
              <td>{student.fathers_name || student.guardian_name}</td>
              <td>{student.class_name} · {student.section_name}</td>
              <td className="muted-cell">{student.guardian_phone}</td>
              <td className={`text-right font-semibold tabular-nums ${Number(student.fee_balance) > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>Rs {Number(student.fee_balance).toLocaleString()}</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {rowActions.map(({ action, label, icon: Icon, tone }) => (
                    <button key={action} type="button" onClick={() => onAction(action, student)} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${tone}`}>
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
