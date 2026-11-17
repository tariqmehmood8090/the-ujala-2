import { useEffect, useState } from 'react';
import { CalendarCheck2, FileBadge2, GraduationCap, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Student } from '@/lib/schoolTypes';

export function ParentDashboard({ onToast }: { onToast: (message: string) => void }) {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, { present: number; absent: number; late: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: links } = await supabase
        .from('parent_student_links')
        .select('student_id')
        .eq('parent_user_id', profile.id);
      if (!links || links.length === 0) { setLoading(false); return; }

      const studentIds = (links as { student_id: string }[]).map((l) => l.student_id);
      const { data: students } = await supabase
        .from('school_students')
        .select('id, admission_number, full_name, class_name, section_name, guardian_phone, fee_balance, status, photo_url')
        .in('id', studentIds)
        .order('full_name');
      setChildren(students as Student[] ?? []);

      const { data: att } = await supabase
        .from('school_attendance')
        .select('student_id, status')
        .in('student_id', studentIds);

      const map: Record<string, { present: number; absent: number; late: number }> = {};
      for (const row of (att as { student_id: string; status: string }[]) ?? []) {
        if (!map[row.student_id]) map[row.student_id] = { present: 0, absent: 0, late: 0 };
        if (row.status in map[row.student_id]) (map[row.student_id] as Record<string, number>)[row.status]++;
      }
      setAttendance(map);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <div className="page"><p className="empty-state large">Loading your children's records…</p></div>;

  if (children.length === 0) {
    return (
      <div className="page parent-page">
        <div className="module-heading">
          <div>
            <span className="eyebrow">Parent portal</span>
            <h1>Welcome, {profile?.full_name}</h1>
            <p>Your children's records will appear here once an administrator links them to your account.</p>
          </div>
        </div>
        <div className="panel" style={{ padding: '45px', textAlign: 'center' }}>
          <Users size={40} style={{ color: '#a2b2bc', margin: '0 auto 14px' }} />
          <p className="empty-state">No children are linked to your account yet. Please contact the school office to be linked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page parent-page">
      <div className="module-heading">
        <div>
          <span className="eyebrow">Parent portal</span>
          <h1>Welcome, {profile?.full_name}</h1>
          <p>Here's how your children are doing at school.</p>
        </div>
      </div>

      <div className="parent-children-grid">
        {children.map((child) => {
          const att = attendance[child.id] ?? { present: 0, absent: 0, late: 0 };
          const total = att.present + att.absent + att.late;
          const pct = total ? Math.round((att.present / total) * 100) : 0;
          return (
            <section className="panel parent-child-card" key={child.id}>
              <div className="parent-child-header">
                <div className="student-avatar" style={{ width: '48px', height: '48px', fontSize: '14px' }}>
                  {child.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3>{child.full_name}</h3>
                  <span>{child.class_name} · Section {child.section_name}</span>
                </div>
                <span className="status-pill">{child.status === 'active' ? 'Active' : child.status}</span>
              </div>

              <div className="parent-child-stats">
                <div className="parent-stat">
                  <CalendarCheck2 size={18} />
                  <div><strong>{pct}%</strong><span>Attendance</span></div>
                </div>
                <div className="parent-stat">
                  <div><strong>{att.present}</strong><span>Present</span></div>
                </div>
                <div className="parent-stat">
                  <div><strong>{att.absent}</strong><span>Absent</span></div>
                </div>
                <div className="parent-stat">
                  <div><strong>{att.late}</strong><span>Late</span></div>
                </div>
              </div>

              <div className="parent-child-details">
                <div className="parent-detail-row"><span>Admission no.</span><strong>{child.admission_number}</strong></div>
                <div className="parent-detail-row"><span>Fee balance</span><strong>Rs. {child.fee_balance.toLocaleString()}</strong></div>
                <div className="parent-detail-row"><span>Guardian phone</span><strong>{child.guardian_phone}</strong></div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function TeacherDashboard({ onNavigate }: { onNavigate: (view: string) => void }) {
  // onNavigate accepts a string key; caller maps to View
  const [studentCount, setStudentCount] = useState(0);
  const [presentToday, setPresentToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ count }, { data: att }] = await Promise.all([
        supabase.from('school_students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('school_attendance').select('student_id, status').eq('attendance_date', new Date().toISOString().slice(0, 10)).eq('status', 'present'),
      ]);
      setStudentCount(count ?? 0);
      setPresentToday(att?.length ?? 0);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="page">
      <div className="welcome-banner" style={{ background: 'linear-gradient(105deg, #6ebddd, #8ad2df)' }}>
        <div className="welcome-copy">
          <span className="eyebrow light"><GraduationCap size={14} /> Teacher workspace</span>
          <h1>Good day, teacher</h1>
          <p>Manage attendance, search student records, and send notices — all in one place.</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card blue"><div className="stat-icon"><Users size={20} /></div><div><span>Active students</span><strong>{loading ? '—' : studentCount.toString()}</strong><small>Across all classes</small></div></div>
        <div className="stat-card green"><div className="stat-icon"><CalendarCheck2 size={20} /></div><div><span>Present today</span><strong>{loading ? '—' : presentToday.toString()}</strong><small>Checked in so far</small></div></div>
        <div className="stat-card yellow"><div className="stat-icon"><FileBadge2 size={20} /></div><div><span>Quick actions</span><strong>3</strong><small>Available tools</small></div></div>
      </div>

      <div className="section-heading">
        <div><span className="eyebrow">Teacher tools</span><h2>What would you like to do?</h2></div>
      </div>
      <div className="module-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <button className="module-card sky" onClick={() => onNavigate('attendance')}><div className="module-icon"><CalendarCheck2 size={28} strokeWidth={1.8} /></div><div className="module-content"><h3>Mark attendance</h3><p>Take today's register for your class</p></div><span className="card-arrow">↗</span></button>
        <button className="module-card mint" onClick={() => onNavigate('students')}><div className="module-icon"><Users size={28} strokeWidth={1.8} /></div><div className="module-content"><h3>Search students</h3><p>Find and view student records</p></div><span className="card-arrow">↗</span></button>
        <button className="module-card sun" onClick={() => onNavigate('admission')}><div className="module-icon"><GraduationCap size={28} strokeWidth={1.8} /></div><div className="module-content"><h3>New admission</h3><p>Enroll a new student</p></div><span className="card-arrow">↗</span></button>
      </div>
    </div>
  );
}
