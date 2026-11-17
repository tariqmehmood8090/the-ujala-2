import { useEffect, useState, type FormEvent } from 'react';
import { Bell, Download, FileText, Languages, Printer, RotateCcw, Search, Send, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { renderNoticeText, SCHOOL_NAME } from '@/lib/noticeText';
import type { NoticeTemplate, Student } from '@/lib/schoolTypes';
import { FeeModal } from '@/components/FeeModal';
import { FeeDetailsModal } from '@/components/FeeDetailsModal';
import { NoticeModal } from '@/components/NoticeModal';
import { StudentRecordModal } from '@/components/StudentRecordModal';
import { StudentResultsTable, type RowAction } from '@/components/StudentResultsTable';
import { StudentAdmissionEditor } from '@/components/StudentAdmissionEditor';

type SearchFilters = {
  admission_number: string;
  full_name: string;
  fathers_name: string;
  class_name: string;
  section_name: string;
  fathers_cnic: string;
  roll_number: string;
  mother_number: string;
  guardian_name: string;
  religion: string;
  area: string;
  nationality: string;
  source: 'current' | 'archive' | 'all';
  status: 'active' | 'inactive' | 'pass_out' | 'all';
  clearance: 'cleared' | 'not_clear' | 'all';
  unassignedSection: boolean;
  admissionDateRange: boolean;
  admissionDateFrom: string;
  admissionDateTo: string;
};

type TextFilterKey = Exclude<keyof SearchFilters, 'source' | 'status' | 'clearance' | 'unassignedSection' | 'admissionDateRange' | 'admissionDateFrom' | 'admissionDateTo'>;

const emptySearchFilters: SearchFilters = {
  admission_number: '', full_name: '', fathers_name: '', class_name: '', section_name: '', fathers_cnic: '', roll_number: '', mother_number: '', guardian_name: '', religion: '', area: '', nationality: '', source: 'current', status: 'active', clearance: 'all', unassignedSection: false, admissionDateRange: false, admissionDateFrom: '', admissionDateTo: '',
};

const topFields: { key: TextFilterKey; label: string }[] = [
  { key: 'admission_number', label: 'Admission No.' },
  { key: 'full_name', label: 'Student Name' },
  { key: 'fathers_name', label: 'Father Name' },
  { key: 'class_name', label: 'Class' },
  { key: 'section_name', label: 'Section' },
];

const advancedFields: { key: TextFilterKey; label: string }[] = [
  { key: 'fathers_cnic', label: 'Fathers CNIC' }, { key: 'roll_number', label: 'Roll Number' }, { key: 'mother_number', label: 'Mother Number' }, { key: 'guardian_name', label: 'Guardian Name' }, { key: 'religion', label: 'Religion' }, { key: 'area', label: 'Area' }, { key: 'nationality', label: 'Nationality' },
];

type ActiveModal =
  | { kind: 'feeDetails'; student: Student }
  | { kind: 'fee'; student: Student; mode: 'payment' | 'charge' }
  | { kind: 'record'; student: Student; autoPrint: boolean }
  | { kind: 'delete'; student: Student }
  | null;

export function StudentSearch({ students, onToast, onRefresh }: { students: Student[]; onToast: (message: string) => void; onRefresh: () => Promise<void> }) {
  const [draft, setDraft] = useState<SearchFilters>(emptySearchFilters);
  const [applied, setApplied] = useState<SearchFilters>(emptySearchFilters);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [noticeLanguage, setNoticeLanguage] = useState<'English' | 'Urdu'>('English');
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [templates, setTemplates] = useState<NoticeTemplate[]>([]);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reloadTemplates = () => { void supabase.from('school_notice_templates').select('id, notice_type, language, template_text, updated_at').then(({ data }) => { if (data) setTemplates(data as NoticeTemplate[]); }); };
  useEffect(reloadTemplates, []);

  const results = students.filter((student) => {
    const textMatches = [...topFields, ...advancedFields].every(({ key }) => {
      const query = applied[key].trim().toLowerCase();
      if (!query) return true;
      const values = key === 'fathers_name' ? [student.fathers_name, student.guardian_name] : [student[key as keyof Student]];
      return values.some((value) => String(value ?? '').toLowerCase().includes(query));
    });
    const sourceMatches = applied.source === 'all' || (applied.source === 'current' ? student.data_source !== 'archive' : student.data_source === 'archive');
    const statusMatches = applied.status === 'all' || (applied.status === 'active' ? student.status === 'active' : applied.status === 'inactive' ? student.status === 'withdrawn' : student.status === 'promoted');
    const clearanceMatches = applied.clearance === 'all' || (applied.clearance === 'cleared' ? student.clearance_status !== 'not_clear' : student.clearance_status === 'not_clear');
    const unassignedSectionMatches = !applied.unassignedSection || (student.status === 'active' && !student.section_name.trim());
    const admissionDateMatches = !applied.admissionDateRange || ((!applied.admissionDateFrom || student.admission_date >= applied.admissionDateFrom) && (!applied.admissionDateTo || student.admission_date <= applied.admissionDateTo));
    return textMatches && sourceMatches && statusMatches && clearanceMatches && unassignedSectionMatches && admissionDateMatches;
  }).sort((a, b) => (Number(a.admission_number.match(/(\d+)$/)?.[1] ?? 0) - Number(b.admission_number.match(/(\d+)$/)?.[1] ?? 0)));

  const runSearch = (event: FormEvent) => {
    event.preventDefault();
    setApplied(draft);
    onToast('Student search updated');
  };

  const clearSearch = () => { setDraft(emptySearchFilters); setApplied(emptySearchFilters); onToast('Search filters cleared'); };

  const handleRowAction = (action: RowAction, student: Student) => {
    if (action === 'fee') setActiveModal({ kind: 'feeDetails', student });
    if (action === 'add') setActiveModal({ kind: 'fee', student, mode: 'charge' });
    if (action === 'view') setEditingStudent(student);
    if (action === 'print') setActiveModal({ kind: 'record', student, autoPrint: true });
    if (action === 'delete') setActiveModal({ kind: 'delete', student });
  };

  const deleteStudent = async (student: Student) => {
    setDeleting(true);
    const { error } = await supabase.from('school_students').delete().eq('id', student.id);
    setDeleting(false);
    setActiveModal(null);
    if (error) { onToast(`${student.full_name} could not be deleted. Please try again.`); return; }
    onToast(`${student.full_name} was removed from the records`);
    await onRefresh();
  };

  const notClearStudents = results.filter((student) => student.clearance_status === 'not_clear');

  const sendClearanceNotices = async (noticeType: NoticeTemplate['notice_type']) => {
    if (!notClearStudents.length) { onToast('No students marked Not Clear in these results'); return; }
    const isReminder = noticeType === 'fee_clearance_reminder';
    const template = templates.find((item) => item.notice_type === noticeType && item.language === noticeLanguage)?.template_text;
    if (!template) { onToast('No template is saved for this notice in this language'); return; }
    const { error } = await supabase.from('school_student_notices').insert(notClearStudents.map((student) => ({ student_id: student.id, notice_type: noticeType, language: noticeLanguage, message: renderNoticeText(template, noticeLanguage, student.full_name) })));
    if (error) { onToast('The notices could not be sent. Please try again.'); return; }
    onToast(`${isReminder ? 'Fee clearance reminders' : 'Warning notices'} sent to ${notClearStudents.length} ${notClearStudents.length === 1 ? 'student' : 'students'}`);
  };

  const exportData = () => {
    const headers = ['Admission No.', 'Admission Date', 'Student Name', 'Father Name', 'Class', 'Section', 'Contact No.', 'Fee Balance'];
    const rows = results.map((student) => [student.admission_number, student.admission_date, student.full_name, student.fathers_name ?? '', student.class_name, student.section_name, student.guardian_phone, student.fee_balance]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'schooldesk-student-list.csv'; link.click(); URL.revokeObjectURL(url);
    onToast(`${results.length} student records exported`);
  };

  const updateDraft = (key: keyof SearchFilters, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="student-search-workspace">
      <form className="panel search-panel" onSubmit={runSearch}>
        <div className="search-panel-heading">
          <div>
            <span className="eyebrow">Student records</span>
            <h2>Find exactly who you need</h2>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {topFields.map(({ key, label }) => (
            <label key={key} className="control-field">{label}
              <input value={draft[key]} onChange={(event) => updateDraft(key, event.target.value)} />
            </label>
          ))}
          <div className="flex items-end gap-2">
            <button type="submit" className="primary-button w-full justify-center"><Search size={17} /> Search</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button type="button" className="secondary-button" onClick={clearSearch}><RotateCcw size={16} /> Clear</button>
          <button type="button" className="filter-toggle" onClick={() => setShowAdvanced(!showAdvanced)} aria-expanded={showAdvanced}><SlidersHorizontal size={16} /> {showAdvanced ? 'Hide more filters' : 'More filters'}</button>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={draft.unassignedSection}
              onChange={(event) => setDraft((current) => ({ ...current, unassignedSection: event.target.checked }))}
              className="h-4 w-4 accent-sky-600"
            />
            Filter active students whose section is not assigned
          </label>
        </div>
        {showAdvanced && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {advancedFields.map(({ key, label }) => (
                <label key={key} className="control-field">{label}
                  <input value={draft[key]} onChange={(event) => updateDraft(key, event.target.value)} />
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-5">
              <div>
                <span className="mb-2 block text-xs font-bold text-slate-600">Session</span>
                <div className="segmented-control">{[['current', 'Current'], ['archive', 'Archive'], ['all', 'All Data']].map(([value, label]) => <button type="button" key={value} className={draft.source === value ? 'selected' : ''} onClick={() => updateDraft('source', value)}>{label}</button>)}</div>
              </div>
              <div>
                <span className="mb-2 block text-xs font-bold text-slate-600">Student status</span>
                <div className="segmented-control">{[['active', 'Active'], ['inactive', 'InActive'], ['pass_out', 'Pass Out']].map(([value, label]) => <button type="button" key={value} className={draft.status === value ? 'selected' : ''} onClick={() => updateDraft('status', value)}>{label}</button>)}</div>
              </div>
              <div>
                <span className="mb-2 block text-xs font-bold text-slate-600">Fee clearance</span>
                <div className="segmented-control compact">{[['all', 'All'], ['not_clear', 'Not Cleared'], ['cleared', 'Clear']].map(([value, label]) => <button type="button" key={value} className={draft.clearance === value ? 'selected' : ''} onClick={() => updateDraft('clearance', value)}>{label}</button>)}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={draft.admissionDateRange}
                  onChange={(event) => setDraft((current) => ({ ...current, admissionDateRange: event.target.checked }))}
                  className="h-4 w-4 accent-sky-600"
                />
                Filter by admission date range
              </label>
              {draft.admissionDateRange && (
                <>
                  <label className="control-field min-w-44">Admission date from
                    <input type="date" value={draft.admissionDateFrom} onChange={(event) => updateDraft('admissionDateFrom', event.target.value)} />
                  </label>
                  <label className="control-field min-w-44">Admission date to
                    <input type="date" value={draft.admissionDateTo} onChange={(event) => updateDraft('admissionDateTo', event.target.value)} />
                  </label>
                </>
              )}
            </div>
          </div>
        )}
      </form>

      <div className="search-results-heading">
        <div><span className="eyebrow">Search results</span><h2>{results.length} students found</h2></div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="secondary-button" onClick={() => window.print()}><Printer size={16} /> Print List</button>
          <button type="button" className="secondary-button" onClick={exportData}><Download size={16} /> Export Data</button>
          <div className="notice-actions">
            <Languages size={16} />
            <select value={noticeLanguage} onChange={(event) => setNoticeLanguage(event.target.value as 'English' | 'Urdu')} aria-label="Notice language"><option>English</option><option>Urdu</option></select>
            <button type="button" className="secondary-button" onClick={() => setNoticeOpen(true)}><FileText size={16} /> Print Notice</button>
          </div>
        </div>
      </div>

      <div className="quick-notice-bar">
        <div><span className="eyebrow">Not clear students</span><strong>{notClearStudents.length} eligible {notClearStudents.length === 1 ? 'student' : 'students'}</strong><small>Quick actions use the current search results</small></div>
        <div className="quick-notice-buttons">
          <button className="reminder-button" onClick={() => void sendClearanceNotices('fee_clearance_reminder')}><Send size={15} /> Send fee clearance reminder</button>
          <button className="warning-button" onClick={() => void sendClearanceNotices('warning_notice')}><Bell size={15} /> Send warning notice</button>
        </div>
      </div>

      <div className="panel roster-panel"><StudentResultsTable students={results} onAction={handleRowAction} /></div>

      {noticeOpen && <NoticeModal language={noticeLanguage} templates={templates} students={results} onClose={() => setNoticeOpen(false)} onTemplateSaved={reloadTemplates} onToast={onToast} onPrint={() => { window.print(); onToast(`${noticeLanguage} notice sent to print`); }} />}
      {editingStudent && <StudentAdmissionEditor key={editingStudent.id} student={editingStudent} onClose={() => setEditingStudent(null)} onSaved={onRefresh} onToast={onToast} />}
      {activeModal?.kind === 'feeDetails' && <FeeDetailsModal student={activeModal.student} onClose={() => setActiveModal(null)} onRecord={(mode) => setActiveModal({ kind: 'fee', student: activeModal.student, mode })} />}
      {activeModal?.kind === 'fee' && <FeeModal student={activeModal.student} initialMode={activeModal.mode} onClose={() => setActiveModal(null)} onSaved={async (message) => { onToast(message); await onRefresh(); }} />}
      {activeModal?.kind === 'record' && <StudentRecordModal student={activeModal.student} autoPrint={activeModal.autoPrint} onClose={() => setActiveModal(null)} />}
      {activeModal?.kind === 'delete' && (
        <div className="notice-overlay">
          <section className="notice-preview">
            <div className="notice-preview-top">
              <span className="eyebrow">Delete student</span>
              <button className="close-button" onClick={() => setActiveModal(null)} aria-label="Cancel delete"><X size={18} /></button>
            </div>
            <h2 className="mt-3 text-lg font-bold text-slate-800">Remove {activeModal.student.full_name}?</h2>
            <p className="mt-2 text-sm text-slate-600">This permanently deletes the student from {SCHOOL_NAME}, along with their attendance and notice history. This cannot be undone.</p>
            <div className="notice-preview-actions">
              <button className="secondary-button" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="primary-button bg-rose-600 hover:bg-rose-700" onClick={() => void deleteStudent(activeModal.student)} disabled={deleting}><Trash2 size={16} /> {deleting ? 'Deleting…' : 'Delete student'}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
