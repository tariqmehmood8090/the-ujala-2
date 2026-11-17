import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { toStudentFeePayload, validateFeeFields } from '@/lib/admissionFees';
import { admissionFormFromStudent } from '@/lib/admissionFormState';
import type { AdmissionFormState, InformationRecord, Student } from '@/lib/schoolTypes';
import { AdmissionForm } from '@/components/AdmissionForm';
import type { InformationDraft } from '@/components/InformationRecords';

export function StudentAdmissionEditor({ student, onClose, onSaved, onToast }: { student: Student; onClose: () => void; onSaved: () => Promise<void>; onToast: (message: string) => void }) {
  const [form, setForm] = useState<AdmissionFormState>(() => admissionFormFromStudent(student));
  const [records, setRecords] = useState<InformationRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState(false);

  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);
    const { data, error } = await supabase.from('school_other_information').select('id, information_type, notes, updated_at').eq('student_id', student.id).order('updated_at', { ascending: false });
    setRecordsError(Boolean(error));
    setRecords(error ? [] : (data as InformationRecord[]));
    setRecordsLoading(false);
  }, [student.id]);

  useEffect(() => { void loadRecords(); }, [loadRecords]);

  const saveInfo = async (draft: InformationDraft) => {
    const payload = { information_type: draft.information_type, notes: draft.notes, updated_at: new Date().toISOString() };
    const { error } = draft.id
      ? await supabase.from('school_other_information').update(payload).eq('id', draft.id)
      : await supabase.from('school_other_information').insert({ ...payload, student_id: student.id });
    if (error) { onToast('The note could not be saved. Please try again.'); return false; }
    onToast('Other information saved');
    await loadRecords();
    return true;
  };

  const deleteInfo = async (id: string) => {
    const { error } = await supabase.from('school_other_information').delete().eq('id', id);
    if (error) { onToast('The note could not be deleted. Please try again.'); return false; }
    onToast('Other information deleted');
    await loadRecords();
    return true;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const feeError = validateFeeFields(form);
    if (feeError) { onToast(feeError); return; }
    const { error } = await supabase.from('school_students').update(toStudentFeePayload(form)).eq('id', student.id);
    if (error) { onToast('The changes could not be saved. Please check the admission number.'); return; }
    onToast(`${form.full_name} was updated`);
    await onSaved();
    onClose();
  };

  return (
    <div className="notice-overlay">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto">
        <AdmissionForm
          form={form}
          setForm={setForm}
          infoRecords={records}
          infoLoading={recordsLoading}
          infoLoadError={recordsError}
          onSaveInfo={saveInfo}
          onDeleteInfo={deleteInfo}
          onSubmit={submit}
          onCancel={onClose}
          onToast={onToast}
        />
      </div>
    </div>
  );
}
