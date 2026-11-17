import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Bell,
  BookOpenCheck,
  CalendarCheck2,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileBadge2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Shield,
  FileText,
  Settings,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  UserRoundX,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SCHOOL_NAME } from '@/lib/noticeText';
import { StudentSearch } from '@/components/StudentSearch';
import { OtherInformation } from '@/components/OtherInformation';
import type { AdmissionFormState, InformationRecord, NoticeTemplate, Student } from '@/lib/schoolTypes';
import { toStudentFeePayload, validateFeeFields } from '@/lib/admissionFees';
import { AdmissionForm } from '@/components/AdmissionForm';
import type { InformationDraft } from '@/components/InformationRecords';
import { createAdmissionForm } from '@/lib/admissionFormState';
import { AuthProvider, useAuth } from '@/lib/auth';
import { AuthPage } from '@/components/AuthPage';
import { AdminPanel } from '@/components/AdminPanel';
import { ParentDashboard, TeacherDashboard } from '@/components/RoleDashboards';

type Attendance = { student_id: string; status: 'present' | 'absent' | 'late' | 'excused' };
type View = 'dashboard' | 'students' | 'admission' | 'sections' | 'attendance' | 'sms' | 'promotions' | 'withdrawals' | 'certificates' | 'other' | 'reports' | 'settings' | 'users';

const adminNavItems: { label: string; icon: typeof LayoutDashboard; view: View }[] = [
  { label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  { label: 'User Accounts', icon: Shield, view: 'users' },
  { label: 'Search Student', icon: Search, view: 'students' },
  { label: 'New Admission', icon: UserPlus, view: 'admission' },
  { label: 'Search Section', icon: Users, view: 'sections' },
  { label: 'Daily Attendance', icon: CalendarCheck2, view: 'attendance' },
  { label: 'Send Absentee SMS', icon: MessageCircle, view: 'sms' },
  { label: 'Promote Students', icon: GraduationCap, view: 'promotions' },
  { label: 'Withdraw Students', icon: UserRoundX, view: 'withdrawals' },
  { label: 'Issue Certificate', icon: FileBadge2, view: 'certificates' },
  { label: 'Other Information', icon: BookOpenCheck, view: 'other' },
  { label: 'Reports', icon: ClipboardCheck, view: 'reports' },
  { label: 'Settings', icon: Settings, view: 'settings' },
];

const teacherNavItems: { label: string; icon: typeof LayoutDashboard; view: View }[] = [
  { label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  { label: 'Search Student', icon: Search, view: 'students' },
  { label: 'New Admission', icon: UserPlus, view: 'admission' },
  { label: 'Daily Attendance', icon: CalendarCheck2, view: 'attendance' },
  { label: 'Send Absentee SMS', icon: MessageCircle, view: 'sms' },
  { label: 'Other Information', icon: BookOpenCheck, view: 'other' },
];

const navItems = adminNavItems;

const moduleCards: { title: string; description: string; icon: typeof UserPlus; tone: string; view: View }[] = [
  { title: 'Admissions', description: '7 new applications', icon: UserPlus, tone: 'sky', view: 'admission' },
  { title: 'Attendance', description: '94% present today', icon: CalendarCheck2, tone: 'mint', view: 'attendance' },
  { title: 'Absentee SMS', description: '3 alerts to send', icon: MessageCircle, tone: 'sun', view: 'sms' },
  { title: 'Promotions', description: 'Review next year classes', icon: GraduationCap, tone: 'peach', view: 'promotions' },
  { title: 'Certificates', description: '9 pending requests', icon: FileBadge2, tone: 'lilac', view: 'certificates' },
];

function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}

function AppInner() {
  const { profile, loading: authLoading, signOut } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  const loadSchoolData = async () => {
    setLoading(true);
    const [{ data: studentRows, error: studentError }, { data: attendanceRows, error: attendanceError }] = await Promise.all([
      supabase.from('school_students').select('id, admission_number, admission_date, date_of_birth, admitted_in_class, full_name, student_name_prefix, father_name_prefix, mother_name, gender, class_name, section_name, guardian_name, guardian_phone, fathers_name, fathers_cnic, student_form_b, last_school, last_class, subject_group, place_of_birth, photo_url, roll_number, mother_number, religion, house, student_group, area, mother_tongue, nationality, data_source, clearance_status, fee_balance, status, current_address, permanent_address, father_contact_number, messaging_number, father_profession, guardian_relationship, guardian_cnic, tuition_fee, fee_concession_percentage, fee_concession_amount, fine_exempt, full_name_urdu, fathers_name_urdu, mother_name_urdu').order('full_name'),
      supabase.from('school_attendance').select('student_id, status').eq('attendance_date', new Date().toISOString().slice(0, 10)),
    ]);
    if (!studentError && studentRows) setStudents(studentRows as Student[]);
    if (!attendanceError && attendanceRows) setAttendance(attendanceRows as Attendance[]);
    setLoading(false);
  };

  useEffect(() => { void loadSchoolData(); }, []);
  useEffect(() => { if (toast) { const timer = window.setTimeout(() => setToast(''), 3000); return () => window.clearTimeout(timer); } }, [toast]);

  const counts = useMemo(() => ({
    present: attendance.filter((item) => item.status === 'present').length,
    absent: attendance.filter((item) => item.status === 'absent').length,
    late: attendance.filter((item) => item.status === 'late').length,
    active: students.filter((student) => student.status === 'active').length,
  }), [attendance, students]);

  const filteredStudents = students.filter((student) => `${student.full_name} ${student.admission_number} ${student.class_name} ${student.section_name}`.toLowerCase().includes(searchTerm.toLowerCase()));

  const navigate = (nextView: View) => { setView(nextView); setSearchTerm(''); };

  if (authLoading) {
    return <div className="auth-loading"><div className="brand-mark"><img src="/New_LOGO_Final.PNG" alt="SchoolDesk" /></div><span>Loading…</span></div>;
  }

  if (!profile) {
    return <AuthPage />;
  }

  if (profile.status === 'suspended') {
    return (
      <div className="auth-loading">
        <ShieldCheck size={32} />
        <h2>Your account has been suspended</h2>
        <p>Please contact the school administrator to reactivate your account.</p>
        <button className="primary-button" onClick={() => void signOut()}>Sign out</button>
      </div>
    );
  }

  const roleNavItems = profile.role === 'admin' ? adminNavItems : profile.role === 'teacher' ? teacherNavItems : [];
  const title = roleNavItems.find((item) => item.view === view)?.label ?? 'Dashboard';

  const initials = profile.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2);
  const roleLabel = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);

  const addStudent = async (student: AdmissionFormState, records: InformationRecord[]) => {
    const { data, error } = await supabase.from('school_students').insert({ ...toStudentFeePayload(student), admission_date: student.admission_date || new Date().toISOString().slice(0, 10) }).select().maybeSingle();
    if (error || !data) { setToast('The student could not be saved. Please check the admission number.'); return false; }
    const savedStudent = data as Student;
    const { error: recordError } = records.length
      ? await supabase.from('school_other_information').insert(records.map((record) => ({ student_id: savedStudent.id, information_type: record.information_type, notes: record.notes })))
      : { error: null };
    setStudents((current) => [...current, savedStudent].sort((a, b) => a.full_name.localeCompare(b.full_name)));
    setToast(recordError ? 'Student saved, but their other information could not be saved' : 'New student added to the roster');
    navigate('students');
    return true;
  };

  if (profile.role === 'parent') {
    return (
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand"><div className="brand-mark"><img src="/New_LOGO_Final.PNG" alt="SchoolDesk" /></div><span>School<span className="brand-accent">Desk</span></span></div>
          <div className="school-switcher"><div className="school-avatar">{initials}</div><div><strong>{profile.full_name}</strong><span>{roleLabel} account</span></div></div>
          <p className="nav-label">Parent portal</p>
          <nav><NavButton item={{ label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' }} active={view === 'dashboard'} onClick={navigate} /></nav>
          <div className="sidebar-footer"><button className="settings-link" onClick={() => void signOut()}><LogOut size={17} /> Sign out</button></div>
        </aside>
        <main className="main-content">
          <header className="topbar"><div className="breadcrumb"><span>SchoolDesk</span><span className="crumb-separator">/</span><strong>{title}</strong></div><div className="topbar-actions"><div className="profile-wrap"><button className="profile-button" onClick={() => setShowProfile(!showProfile)}><div className="profile-avatar">{initials}</div><span><small>Welcome</small><strong>{profile.full_name}</strong></span><ChevronDown size={16} /></button>{showProfile && <div className="profile-menu"><strong>{roleLabel} account</strong><button onClick={() => void signOut()}><LogOut size={14} /> Sign out</button></div>}</div></div></header>
          <ParentDashboard onToast={setToast} />
          {toast && <div className="toast"><Check size={17} /> {toast}</div>}
        </main>
      </div>
    );
  }

  const isTeacher = profile.role === 'teacher';
  const showAdminUsers = view === 'users' && profile.role === 'admin';
  const splitPoint = isTeacher ? 4 : 6;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><img src="/New_LOGO_Final.PNG" alt="SchoolDesk" /></div><span>School<span className="brand-accent">Desk</span></span></div>
        <div className="school-switcher"><div className="school-avatar">{initials}</div><div><strong>{profile.full_name}</strong><span>{roleLabel} account</span></div></div>
        <p className="nav-label">Workspace</p>
        <nav>{roleNavItems.slice(0, splitPoint).map((item) => <NavButton key={item.view} item={item} active={view === item.view} onClick={navigate} />)}</nav>
        {!isTeacher && <><p className="nav-label nav-label-spaced">Student records</p><nav>{roleNavItems.slice(splitPoint).map((item) => <NavButton key={item.view} item={item} active={view === item.view} onClick={navigate} />)}</nav></>}
        <div className="sidebar-footer"><button className="settings-link" onClick={() => void signOut()}><LogOut size={17} /> Sign out</button></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb"><span>SchoolDesk</span><span className="crumb-separator">/</span><strong>{title}</strong></div><div className="topbar-actions"><button className="icon-button" aria-label="Search" onClick={() => navigate('students')}><Search size={20} /></button><button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><i /></button><div className="profile-wrap"><button className="profile-button" onClick={() => setShowProfile(!showProfile)}><div className="profile-avatar">{initials}</div><span><small>{roleLabel} account</small><strong>{profile.full_name}</strong></span><ChevronDown size={16} /></button>{showProfile && <div className="profile-menu"><strong>{roleLabel} account</strong><span>{profile.full_name}</span><button onClick={() => void signOut()}><LogOut size={14} /> Sign out</button></div>}</div></div></header>
        {view === 'dashboard' && isTeacher ? <TeacherDashboard onNavigate={(v) => navigate(v as View)} /> : view === 'dashboard' ? <Dashboard students={students} counts={counts} loading={loading} onNavigate={navigate} /> : showAdminUsers ? <AdminPanel onToast={setToast} /> : <ModuleView view={view} title={title} students={students} filteredStudents={filteredStudents} attendance={attendance} searchTerm={searchTerm} setSearchTerm={setSearchTerm} onAddStudent={addStudent} onRefresh={loadSchoolData} onToast={setToast} />}
        {toast && <div className="toast"><Check size={17} /> {toast}</div>}
      </main>
    </div>
  );
}

function NavButton({ item, active, onClick }: { item: typeof navItems[number]; active: boolean; onClick: (view: View) => void }) {
  const Icon = item.icon;
  return <button className={`nav-button ${active ? 'active' : ''}`} onClick={() => onClick(item.view)}><Icon size={18} /><span>{item.label}</span>{item.view === 'sms' && <span className="nav-count">3</span>}</button>;
}

function Dashboard({ students, counts, loading, onNavigate }: { students: Student[]; counts: { present: number; absent: number; late: number; active: number }; loading: boolean; onNavigate: (view: View) => void }) {
  const totalMarked = counts.present + counts.absent + counts.late;
  const presentPercent = totalMarked ? Math.round((counts.present / totalMarked) * 100) : 0;
  const recent = students.slice(0, 4);
  return <div className="page dashboard-page"><section className="welcome-banner"><div className="welcome-copy"><span className="eyebrow light"><Sparkles size={14} /> Wednesday, 25 October 2023</span><h1>Hello, {SCHOOL_NAME}</h1><p>Here’s what’s happening across your school today.</p></div><div className="school-illustration"><div className="sun" /><div className="cloud cloud-one" /><div className="cloud cloud-two" /><div className="school-building"><div className="roof" /><div className="building-body"><span /><span /><span /><span /><span /><span /></div></div><div className="tree tree-one" /><div className="tree tree-two" /><div className="student-figures"><i /><i /><i /><i /><i /></div></div></section>
    <div className="stats-row"><StatCard label="Total students" value={loading ? '—' : counts.active.toString()} detail="Across 12 sections" tone="blue" icon={<Users size={20} />} /><StatCard label="Present today" value={loading ? '—' : `${presentPercent}%`} detail={`${counts.present} students checked in`} tone="green" icon={<ShieldCheck size={20} />} /><StatCard label="New applications" value="07" detail="4 awaiting review" tone="yellow" icon={<UserPlus size={20} />} /><StatCard label="Need attention" value={counts.absent.toString().padStart(2, '0')} detail="Absentees to follow up" tone="coral" icon={<Bell size={20} />} /></div>
    <div className="section-heading"><div><span className="eyebrow">Quick actions</span><h2>Make today a little easier</h2></div><button className="text-button" onClick={() => onNavigate('other')}>View all tools <span>→</span></button></div>
    <div className="module-grid">{moduleCards.map((card) => <button className={`module-card ${card.tone}`} key={card.title} onClick={() => onNavigate(card.view)}><div className="module-icon"><card.icon size={28} strokeWidth={1.8} /></div><div className="module-content"><h3>{card.title}</h3><p>{card.description}</p></div><span className="card-arrow">↗</span></button>)}</div>
    <div className="overview-grid"><section className="panel attendance-panel"><div className="panel-header"><div><span className="eyebrow">Today’s overview</span><h2>Attendance snapshot</h2></div><button className="more-button" onClick={() => onNavigate('attendance')}><MoreHorizontal size={21} /></button></div><div className="attendance-content"><div className="donut-wrap"><div className="donut" style={{ '--present': `${totalMarked ? (counts.present / totalMarked) * 100 : 0}%`, '--absent': `${totalMarked ? (counts.absent / totalMarked) * 100 : 0}%` } as React.CSSProperties}><div className="donut-center"><strong>{presentPercent}%</strong><span>present</span></div></div></div><div className="attendance-copy"><div className="class-select"><span>Class 5-B</span><ChevronDown size={15} /></div><p className="attendance-intro">A bright start to the day. Keep it up!</p><div className="legend"><LegendDot color="mint" label="Present" value={counts.present} /><LegendDot color="coral" label="Absent" value={counts.absent} /><LegendDot color="yellow" label="Late" value={counts.late} /></div></div></div><button className="panel-link" onClick={() => onNavigate('attendance')}>Open attendance register <span>→</span></button></section><section className="panel activity-panel"><div className="panel-header"><div><span className="eyebrow">Roster pulse</span><h2>Recently added</h2></div><button className="text-button" onClick={() => onNavigate('students')}>View roster <span>→</span></button></div><div className="recent-list">{recent.length ? recent.map((student, index) => <div className="recent-item" key={student.id}><div className={`student-avatar avatar-${index % 4}`}>{student.full_name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</div><div><strong>{student.full_name}</strong><span>{student.class_name} · Section {student.section_name}</span></div><span className="status-pill">Active</span></div>) : <p className="empty-state">Your newest students will appear here.</p>}</div><button className="add-student-button" onClick={() => onNavigate('admission')}><Plus size={17} /> Add a new student</button></section></div>
  </div>;
}

function StatCard({ label, value, detail, tone, icon }: { label: string; value: string; detail: string; tone: string; icon: ReactNode }) { return <div className={`stat-card ${tone}`}><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>; }
function LegendDot({ color, label, value }: { color: string; label: string; value: number }) { return <div className="legend-item"><i className={color} /><span>{label}</span><strong>{value}</strong></div>; }

function ModuleView({ view, title, students, filteredStudents, attendance, searchTerm, setSearchTerm, onAddStudent, onRefresh, onToast }: { view: View; title: string; students: Student[]; filteredStudents: Student[]; attendance: Attendance[]; searchTerm: string; setSearchTerm: (value: string) => void; onAddStudent: (student: AdmissionFormState, records: InformationRecord[]) => Promise<boolean>; onRefresh: () => Promise<void>; onToast: (message: string) => void }) {
  const [formOpen, setFormOpen] = useState(view === 'admission');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState<AdmissionFormState>(() => createAdmissionForm(students));
  const [infoRecords, setInfoRecords] = useState<InformationRecord[]>([]);
  const saveInfoRecord = async (draft: InformationDraft) => {
    const now = new Date().toISOString();
    setInfoRecords((current) => draft.id
      ? current.map((record) => (record.id === draft.id ? { ...record, information_type: draft.information_type, notes: draft.notes, updated_at: now } : record))
      : [{ id: crypto.randomUUID(), information_type: draft.information_type, notes: draft.notes, updated_at: now }, ...current]);
    return true;
  };
  const deleteInfoRecord = async (id: string) => {
    setInfoRecords((current) => current.filter((record) => record.id !== id));
    return true;
  };
  const clearAdmission = () => { setInfoRecords([]); setForm(createAdmissionForm(students)); };
  const markAttendance = async (studentId: string, status: Attendance['status']) => { const { error } = await supabase.from('school_attendance').upsert({ student_id: studentId, attendance_date: new Date().toISOString().slice(0, 10), status }, { onConflict: 'student_id,attendance_date' }); if (!error) onToast('Attendance updated'); await onRefresh(); };
  const saveAdmission = async (record: AdmissionFormState) => { const feeError = validateFeeFields(record); if (feeError) { onToast(feeError); return; } if (!await onAddStudent(record, infoRecords)) return; setForm(createAdmissionForm(students)); setInfoRecords([]); setFormOpen(false); };
  const submitAdmission = async (event: FormEvent) => { event.preventDefault(); await saveAdmission(form); };
  const addToSession = async () => { await saveAdmission({ ...form, data_source: 'current_session' }); };
  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const attendanceMap = new Map(attendance.map((item) => [item.student_id, item.status]));
  const actionLabel = view === 'sms' ? 'Send absentee SMS' : view === 'promotions' ? 'Promote selected' : view === 'withdrawals' ? 'Withdraw selected' : view === 'certificates' ? 'Issue certificate' : '';
  const pageDescription: Record<View, string> = { dashboard: 'Your school overview for a happy, organized day.', users: 'Create, suspend, or remove user accounts.', settings: 'Manage the default wording used for fee and warning notices.', students: 'Find a student, check their details, or open their record.', admission: 'Add a new learner to your school roster in a few simple steps.', sections: 'Browse class groups and see who is learning together.', attendance: 'Mark today’s attendance and keep your register up to date.', sms: 'Send a kind, timely note to guardians of absent students.', promotions: 'Prepare next year’s class lists with confidence.', withdrawals: 'Keep your roster tidy when a student leaves the school.', certificates: 'Create school certificates for the moments that matter.', other: 'Helpful school details and everyday administration tools.', reports: 'See clear summaries for attendance and student records.' };
  return <div className="page module-page"><div className="module-heading"><div><span className="eyebrow">School workspace</span><h1>{title}</h1><p>{pageDescription[view]}</p></div>{view === 'students' && <button className="primary-button" onClick={() => setFormOpen(true)}><Plus size={18} /> New admission</button>}{actionLabel && <button className="primary-button" onClick={() => onToast(`${selectedIds.length || 'No'} students selected — ready for the next step`)}><Send size={17} /> {actionLabel}</button>}</div>
    {view === 'admission' || (view === 'students' && formOpen) ? <AdmissionForm form={form} setForm={setForm} infoRecords={infoRecords} onSaveInfo={saveInfoRecord} onDeleteInfo={deleteInfoRecord} onClear={clearAdmission} onSubmit={submitAdmission} onAddToSession={addToSession} onCancel={() => setFormOpen(false)} onToast={onToast} onAutoGenerate={() => { const highestNumber = students.reduce((highest, student) => Math.max(highest, Number(student.admission_number.match(/(\d+)$/)?.[1] ?? 0)), 0); setForm({ ...form, admission_number: `SD-${highestNumber + 1}` }); onToast('Admission number generated'); }} /> : null}
    {view === 'settings' ? <NoticeTemplateSettings onToast={onToast} /> : view === 'students' ? <StudentSearch students={students} onToast={onToast} onRefresh={onRefresh} /> : view === 'attendance' ? <AttendanceTable students={students} attendanceMap={attendanceMap} onMark={markAttendance} /> : view === 'sections' ? <SectionGrid students={students} onSelect={(className) => setSearchTerm(className)} /> : view === 'reports' ? <Reports students={students} attendance={attendance} /> : ['sms', 'promotions', 'withdrawals', 'certificates'].includes(view) ? <SelectableList students={filteredStudents} selectedIds={selectedIds} onToggle={toggleSelected} view={view} /> : view === 'other' ? <OtherInformation onToast={onToast} /> : <div className="panel roster-panel"><div className="table-toolbar"><div className="search-field"><Search size={18} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by name, admission number or class" /></div><span className="result-count">{filteredStudents.length} students</span></div><StudentTable students={filteredStudents} /></div>}
  </div>;
}

function NoticeTemplateSettings({ onToast }: { onToast: (message: string) => void }) {
  const [templates, setTemplates] = useState<NoticeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => { void supabase.from('school_notice_templates').select('id, notice_type, language, template_text, updated_at').order('notice_type').order('language').then(({ data }) => { if (data) setTemplates(data as NoticeTemplate[]); setLoading(false); }); }, []);
  const templateFor = (noticeType: NoticeTemplate['notice_type'], language: NoticeTemplate['language']) => templates.find((template) => template.notice_type === noticeType && template.language === language);
  const updateTemplate = (noticeType: NoticeTemplate['notice_type'], language: NoticeTemplate['language'], value: string) => setTemplates((current) => current.map((template) => template.notice_type === noticeType && template.language === language ? { ...template, template_text: value } : template));
  const saveTemplates = async () => { setSaving(true); const { error } = await supabase.from('school_notice_templates').upsert(templates.map(({ notice_type, language, template_text }) => ({ notice_type, language, template_text, updated_at: new Date().toISOString() })), { onConflict: 'notice_type,language' }); setSaving(false); if (error) { onToast('Templates could not be saved. Please try again.'); return; } onToast('Notice templates saved'); };
  const cards: { type: NoticeTemplate['notice_type']; title: string; description: string; tone: string }[] = [
    { type: 'fee_clearance_reminder', title: 'Fee clearance reminder', description: 'A friendly first reminder for students who still need to clear their fees.', tone: 'yellow' },
    { type: 'warning_notice', title: 'Warning notice', description: 'A firmer message for important follow-up and pending clearance.', tone: 'coral' },
  ];
  return <div className="template-settings"><div className="settings-intro panel"><div className="settings-intro-icon"><Settings size={23} /></div><div><span className="eyebrow">Notice settings</span><h2>Make every message sound like your school</h2><p>Update the default wording used by quick actions and printed notices. Choose the language tab you want to edit.</p></div><button className="primary-button" onClick={() => void saveTemplates()} disabled={saving || loading}>{saving ? 'Saving…' : 'Save all templates'}</button></div><div className="placeholder-note"><FileText size={16} /><span>Available placeholders: <code>{'{{student_name}}'}</code> and <code>{'{{school_name}}'}</code>. They are filled automatically when a notice is sent.</span></div><div className="template-card-grid">{cards.map((card) => <section className={`panel template-card ${card.tone}`} key={card.type}><div className="template-card-heading"><div><span className="template-badge">{card.type === 'fee_clearance_reminder' ? 'Reminder' : 'Warning'}</span><h2>{card.title}</h2><p>{card.description}</p></div><div className="template-card-icon">{card.type === 'fee_clearance_reminder' ? <Bell size={21} /> : <ShieldCheck size={21} />}</div></div><div className="template-language-grid">{(['English', 'Urdu'] as const).map((language) => { const template = templateFor(card.type, language); return <label key={language}><span>{language}</span><textarea dir={language === 'Urdu' ? 'rtl' : 'ltr'} value={template?.template_text ?? ''} disabled={loading} onChange={(event) => updateTemplate(card.type, language, event.target.value)} placeholder={`Write the ${language} notice text`} rows={5} /></label>; })}</div><small className="template-updated">{templateFor(card.type, 'English')?.updated_at ? `Last saved ${new Date(templateFor(card.type, 'English')?.updated_at as string).toLocaleDateString()}` : 'New template'}</small></section>)}</div></div>;
}


function StudentTable({ students }: { students: Student[] }) { return <div className="table-wrap"><table><thead><tr><th>Student</th><th>Admission no.</th><th>Class</th><th>Father / Guardian</th><th>Roll no.</th><th>Status</th><th /></tr></thead><tbody>{students.map((student, index) => <tr key={student.id}><td><div className="table-student"><div className={`student-avatar avatar-${index % 4}`}>{student.full_name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</div><strong>{student.full_name}</strong></div></td><td className="muted-cell">{student.admission_number}</td><td>{student.class_name} · {student.section_name}</td><td><span>{student.fathers_name || student.guardian_name}</span><small>{student.guardian_phone}</small></td><td className="muted-cell">{student.roll_number || '—'}</td><td><span className="status-pill">{student.status === 'promoted' ? 'Pass Out' : student.status === 'withdrawn' ? 'Inactive' : 'Active'}</span></td><td><button className="row-more"><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table>{students.length === 0 && <div className="empty-state large">No students match these filters. Try clearing one or two fields.</div>}</div>; }
function AttendanceTable({ students, attendanceMap, onMark }: { students: Student[]; attendanceMap: Map<string, string>; onMark: (id: string, status: Attendance['status']) => Promise<void> }) { return <div className="panel roster-panel"><div className="attendance-toolbar"><div><strong>Class 5 · Section B</strong><span>Today, 25 October 2023 · {students.length} students</span></div><span className="register-status"><Check size={15} /> Register open</span></div><div className="table-wrap"><table className="attendance-table"><thead><tr><th>Student</th><th>Admission no.</th><th>Mark attendance</th><th>Current status</th></tr></thead><tbody>{students.map((student, index) => <tr key={student.id}><td><div className="table-student"><div className={`student-avatar avatar-${index % 4}`}>{student.full_name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</div><strong>{student.full_name}</strong></div></td><td className="muted-cell">{student.admission_number}</td><td><div className="attendance-actions"><button className={attendanceMap.get(student.id) === 'present' ? 'chosen present' : ''} onClick={() => void onMark(student.id, 'present')}>Present</button><button className={attendanceMap.get(student.id) === 'absent' ? 'chosen absent' : ''} onClick={() => void onMark(student.id, 'absent')}>Absent</button><button className={attendanceMap.get(student.id) === 'late' ? 'chosen late' : ''} onClick={() => void onMark(student.id, 'late')}>Late</button></div></td><td><span className={`attendance-status ${attendanceMap.get(student.id) || 'unmarked'}`}>{attendanceMap.get(student.id) || 'Not marked'}</span></td></tr>)}</tbody></table></div></div>; }

function SectionGrid({ students, onSelect }: { students: Student[]; onSelect: (className: string) => void }) { const sections = Array.from(new Set(students.map((student) => `${student.class_name} · Section ${student.section_name}`))); return <div className="section-cards">{sections.length ? sections.map((section, index) => { const className = section.split(' · ')[0]; const count = students.filter((student) => `${student.class_name} · Section ${student.section_name}` === section).length; return <button className={`section-card tone-${index % 4}`} key={section} onClick={() => onSelect(className)}><div className="section-icon"><Users size={23} /></div><div><h3>{section}</h3><p>{count} students enrolled</p></div><span>→</span></button>; }) : <div className="empty-state large">No sections yet.</div>}</div>; }
function SelectableList({ students, selectedIds, onToggle, view }: { students: Student[]; selectedIds: string[]; onToggle: (id: string) => void; view: View }) { return <div className="panel selectable-panel"><div className="list-note"><Sparkles size={18} /><span>Select one or more students to continue. Their family details are ready when you are.</span></div>{students.map((student, index) => <button className={`selectable-row ${selectedIds.includes(student.id) ? 'selected' : ''}`} key={student.id} onClick={() => onToggle(student.id)}><span className="check-box">{selectedIds.includes(student.id) && <Check size={15} />}</span><div className={`student-avatar avatar-${index % 4}`}>{student.full_name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</div><div className="selectable-name"><strong>{student.full_name}</strong><span>{student.class_name} · {student.section_name} · Guardian: {student.guardian_name}</span></div><span className={`context-tag ${view}`}>{view === 'sms' ? student.guardian_phone : view === 'certificates' ? 'Request ready' : view === 'promotions' ? 'Class 6 next year' : 'Active record'}</span></button>)}</div>; }
function Reports({ students, attendance }: { students: Student[]; attendance: Attendance[] }) { const present = attendance.filter((item) => item.status === 'present').length; return <div className="page module-page"><div className="report-doc-header"><img src="/New_LOGO_Final.PNG" alt="SchoolDesk" /><div><strong>SchoolDesk</strong><span>Official school report</span></div></div><div className="report-grid"><div className="report-card report-highlight"><span className="eyebrow light">Attendance report</span><h2>A healthy rhythm, day by day.</h2><p>Your school is building a strong attendance habit this term.</p><div className="report-number">{attendance.length ? Math.round((present / attendance.length) * 100) : 0}<small>% overall</small></div></div><div className="report-card"><span className="eyebrow">Student records</span><h2>Enrolment at a glance</h2><div className="bar-stat"><span><b>{students.filter((student) => student.gender === 'Girl').length}</b> Girls</span><i><em style={{ width: `${students.length ? students.filter((student) => student.gender === 'Girl').length / students.length * 100 : 0}%` }} /></i></div><div className="bar-stat"><span><b>{students.filter((student) => student.gender === 'Boy').length}</b> Boys</span><i><em className="coral-bar" style={{ width: `${students.length ? students.filter((student) => student.gender === 'Boy').length / students.length * 100 : 0}%` }} /></i></div><div className="report-foot">{students.length} active students across the school</div></div></div></div>; }

export default App;
