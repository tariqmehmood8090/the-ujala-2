import { useEffect, useState } from 'react';
import { Plus, Printer, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SCHOOL_NAME, SCHOOL_NAME_UR, renderNoticeText } from '@/lib/noticeText';
import type { NoticeTemplate, Student } from '@/lib/schoolTypes';

type NoticeType = NoticeTemplate['notice_type'];
type Language = NoticeTemplate['language'];

const noticeTypeOptions: { value: NoticeType; label: string }[] = [
  { value: 'fee_clearance_reminder', label: 'Fee clearance reminder' },
  { value: 'warning_notice', label: 'Warning notice' },
];

export function NoticeModal({ language: initialLanguage, templates, students, onClose, onPrint, onTemplateSaved, onToast }: { language: Language; templates: NoticeTemplate[]; students: Student[]; onClose: () => void; onPrint: () => void; onTemplateSaved: () => void; onToast: (message: string) => void }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [noticeType, setNoticeType] = useState<NoticeType>('fee_clearance_reminder');
  const [text, setText] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newType, setNewType] = useState<NoticeType>('fee_clearance_reminder');
  const [newLanguage, setNewLanguage] = useState<Language>('English');
  const [newText, setNewText] = useState('');
  const [saving, setSaving] = useState(false);
  const isUrdu = language === 'Urdu';
  const recipient = students.find((student) => student.id === recipientId) ?? null;

  useEffect(() => {
    const template = templates.find((item) => item.notice_type === noticeType && item.language === language);
    setText(template?.template_text ?? '');
  }, [noticeType, language, templates]);

  const heading = noticeType === 'fee_clearance_reminder'
    ? (isUrdu ? 'فیس کلیئرنس یاد دہانی' : 'Fee Clearance Reminder')
    : (isUrdu ? 'انتباہی اطلاع' : 'Warning Notice');

  const saveNewTemplate = async () => {
    if (!newText.trim()) { onToast('Please write the template text first'); return; }
    setSaving(true);
    const { error } = await supabase.from('school_notice_templates').upsert({ notice_type: newType, language: newLanguage, template_text: newText, updated_at: new Date().toISOString() }, { onConflict: 'notice_type,language' });
    setSaving(false);
    if (error) { onToast('Template could not be saved. Please try again.'); return; }
    onToast('New template saved');
    onTemplateSaved();
    setAddingNew(false);
    setNewText('');
    setNoticeType(newType);
    setLanguage(newLanguage);
  };

  return (
    <div className="notice-overlay">
      <section className="notice-modal" dir={isUrdu ? 'rtl' : 'ltr'}>
        <div className="notice-preview-top">
          <span className="eyebrow">SchoolDesk · Print notice</span>
          <button className="close-button" onClick={onClose} aria-label="Close notice"><X size={18} /></button>
        </div>
        <div className="notice-modal-body">
          <div className="notice-modal-controls">
            <label className="control-field"><span>Template</span>
              <select value={noticeType} onChange={(event) => setNoticeType(event.target.value as NoticeType)}>
                {noticeTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="control-field"><span>Language</span>
              <div className="segmented-control compact lang-toggle">
                {(['English', 'Urdu'] as const).map((lang) => <button key={lang} className={language === lang ? 'selected' : ''} onClick={() => setLanguage(lang)}>{lang}</button>)}
              </div>
            </label>
            <label className="control-field"><span>Recipient</span>
              <select value={recipientId} onChange={(event) => setRecipientId(event.target.value)}>
                <option value="">General notice (all results)</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.full_name}</option>)}
              </select>
            </label>
            <button className="add-template-button" onClick={() => setAddingNew(!addingNew)}><Plus size={15} /> {addingNew ? 'Cancel' : 'Add new template'}</button>
          </div>
          {addingNew && (
            <div className="new-template-form">
              <label className="control-field"><span>Notice type</span>
                <select value={newType} onChange={(event) => setNewType(event.target.value as NoticeType)}>
                  {noticeTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="control-field"><span>Language</span>
                <select value={newLanguage} onChange={(event) => setNewLanguage(event.target.value as Language)}><option>English</option><option>Urdu</option></select>
              </label>
              <label className="control-field full"><span>Template text</span>
                <textarea dir={newLanguage === 'Urdu' ? 'rtl' : 'ltr'} value={newText} onChange={(event) => setNewText(event.target.value)} placeholder="Write the new notice text. Use {{student_name}} and {{school_name}}." rows={4} />
              </label>
              <button className="primary-button save-new" onClick={() => void saveNewTemplate()} disabled={saving}>{saving ? 'Saving…' : 'Save template'}</button>
            </div>
          )}
          <label className="control-field edit-template"><span>Edit selected template <small>Use {'{{student_name}}'} and {'{{school_name}}'} as placeholders</small></span>
            <textarea dir={isUrdu ? 'rtl' : 'ltr'} value={text} onChange={(event) => setText(event.target.value)} rows={6} />
          </label>
          <div className="notice-paper">
            <div className="notice-school-mark"><img src="/New_LOGO_Final.PNG" alt="SchoolDesk logo" /></div>
            <h2>{heading}</h2>
            <p>{renderNoticeText(text, language, recipient?.full_name ?? null) || (isUrdu ? 'اپنا پیغام یہاں لکھیں۔' : 'Write your notice message above.')}</p>
            <div className="notice-signoff">{isUrdu ? SCHOOL_NAME_UR : SCHOOL_NAME}<small>{isUrdu ? 'پرنسپل کا دفتر' : 'Principal’s Office'}</small></div>
          </div>
        </div>
        <div className="notice-preview-actions">
          <button className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={onPrint}><Printer size={16} /> Print {language} notice</button>
        </div>
      </section>
    </div>
  );
}
