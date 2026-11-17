import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle, Ban, Check, KeyRound, Loader2, Plus, Search, Shield, Trash2, UserPlus, Users, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth, type UserProfile, type UserRole } from '@/lib/auth';
import type { Student } from '@/lib/schoolTypes';

export function AdminPanel({ onToast }: { onToast: (message: string) => void }) {
  const { profile, createUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [links, setLinks] = useState<Record<string, string[]>>({});

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, full_name, role, status, created_at')
      .order('created_at', { ascending: false });
    if (!error && data) setUsers(data as UserProfile[]);
    setLoading(false);
  };

  const loadStudents = async () => {
    const { data } = await supabase
      .from('school_students')
      .select('id, admission_number, full_name, class_name, section_name')
      .order('full_name');
    if (data) setStudents(data as Student[]);
  };

  const loadLinks = async () => {
    const { data } = await supabase
      .from('parent_student_links')
      .select('parent_user_id, student_id');
    if (data) {
      const map: Record<string, string[]> = {};
      for (const row of data as { parent_user_id: string; student_id: string }[]) {
        if (!map[row.parent_user_id]) map[row.parent_user_id] = [];
        map[row.parent_user_id].push(row.student_id);
      }
      setLinks(map);
    }
  };

  useEffect(() => { void loadUsers(); void loadStudents(); void loadLinks(); }, []);

  const filtered = users.filter((u) =>
    `${u.full_name} ${u.role}`.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleSuspend = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const { error } = await supabase
      .from('user_profiles')
      .update({ status: newStatus })
      .eq('id', user.id);
    if (error) { onToast('Could not update account status.'); return; }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
    onToast(`${user.full_name} has been ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}.`);
  };

  const removeUser = async (user: UserProfile) => {
    const { error } = await supabase.rpc('admin_remove_user', { p_user_id: user.id });
    if (error) { onToast(error.message || 'Could not remove this account.'); return; }
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    onToast(`${user.full_name}'s account was removed.`);
  };

  const roleBadge = (role: UserRole) => {
    const labels: Record<UserRole, string> = { admin: 'Admin', teacher: 'Teacher', parent: 'Parent' };
    return labels[role];
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Administration</span>
          <h2>User accounts</h2>
          <p>Create, suspend, or remove Admin, Teacher, and Parent accounts. Link parents to their children.</p>
        </div>
        <div className="admin-header-actions">
          <button className="secondary-button" onClick={() => setShowLink(true)}>
            <Plus size={16} /> Link parent to student
          </button>
          <button className="secondary-button" onClick={() => setShowPassword(true)}>
            <KeyRound size={16} /> Change password
          </button>
          <button className="primary-button" onClick={() => setShowCreate(true)}>
            <UserPlus size={17} /> New account
          </button>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat"><Users size={20} /><strong>{users.length}</strong><span>Total accounts</span></div>
        <div className="admin-stat admin-stat-admin"><Shield size={20} /><strong>{users.filter((u) => u.role === 'admin').length}</strong><span>Administrators</span></div>
        <div className="admin-stat admin-stat-teacher"><strong>{users.filter((u) => u.role === 'teacher').length}</strong><span>Teachers</span></div>
        <div className="admin-stat admin-stat-parent"><strong>{users.filter((u) => u.role === 'parent').length}</strong><span>Parents</span></div>
        <div className="admin-stat admin-stat-suspended"><Ban size={20} /><strong>{users.filter((u) => u.status === 'suspended').length}</strong><span>Suspended</span></div>
      </div>

      <div className="panel roster-panel">
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or role" />
          </div>
          <span className="result-count">{filtered.length} accounts</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Linked children</th><th /></tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="table-student">
                      <div className="student-avatar">{u.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2)}</div>
                      <strong>{u.full_name}</strong>
                    </div>
                  </td>
                  <td className="muted-cell">{u.username}</td>
                  <td><span className={`role-badge role-${u.role}`}>{roleBadge(u.role)}</span></td>
                  <td>
                    <span className={`status-pill ${u.status === 'suspended' ? 'status-suspended' : ''}`}>
                      {u.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="muted-cell">
                    {u.role === 'parent' ? `${(links[u.id] ?? []).length} linked` : '—'}
                  </td>
                  <td>
                    <div className="row-actions">
                      {u.id !== profile?.id && (
                        <>
                          <button
                            className="row-action-btn"
                            onClick={() => void toggleSuspend(u)}
                            title={u.status === 'active' ? 'Suspend' : 'Reactivate'}
                          >
                            {u.status === 'active' ? <Ban size={15} /> : <Check size={15} />}
                          </button>
                          <button
                            className="row-action-btn row-action-danger"
                            onClick={() => void removeUser(u)}
                            title="Remove account"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                      {u.id === profile?.id && (
                        <button
                          className="row-action-btn"
                          onClick={() => setShowPassword(true)}
                          title="Change your password"
                        >
                          <KeyRound size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="empty-state large">{loading ? 'Loading accounts…' : 'No accounts match your search.'}</div>}
        </div>
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); void loadUsers(); }}
          onToast={onToast}
        />
      )}
      {showPassword && (
        <ChangePasswordModal
          onClose={() => setShowPassword(false)}
          onToast={onToast}
        />
      )}
      {showLink && (
        <LinkParentModal
          users={users}
          students={students}
          existingLinks={links}
          onClose={() => setShowLink(false)}
          onLinked={() => { setShowLink(false); void loadLinks(); }}
          onToast={onToast}
        />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated, onToast }: {
  onClose: () => void;
  onCreated: () => void;
  onToast: (message: string) => void;
}) {
  const { createUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('teacher');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (username.trim().length < 3) { setError('Username must be at least 3 characters.'); return; }
    setBusy(true);

    const { error: createError } = await createUser(
      username.trim().toLowerCase(),
      password,
      fullName.trim(),
      role,
    );

    if (createError) {
      setError(createError);
      setBusy(false);
      return;
    }

    onToast(`${fullName.trim()} was created as ${role}. They can sign in with username "${username.trim().toLowerCase()}".`);
    onCreated();
  };

  return (
    <div className="notice-overlay" onClick={onClose}>
      <section className="notice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notice-preview-top">
          <span className="eyebrow"><UserPlus size={14} /> New account</span>
          <button className="close-button" onClick={onClose}><X size={18} /></button>
        </div>
        <h2 className="mt-3 text-lg font-bold text-slate-800">Create a new account</h2>
        <p className="mt-1 text-sm text-slate-500">The new user will sign in with the username and password below.</p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
          <label className="control-field">Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Enter full name" />
          </label>
          <label className="control-field">Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="e.g. teacher1, parent.john" />
          </label>
          <label className="control-field">Temporary password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 6 characters" />
          </label>
          <label className="control-field">Account type
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="admin">Administrator</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </label>
          {error && <div className="auth-error"><AlertCircle size={16} /><span>{error}</span></div>}
          <div className="notice-preview-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={busy}>
              {busy ? <Loader2 size={16} className="auth-spinner" /> : <UserPlus size={16} />} Create account
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function LinkParentModal({ users, students, existingLinks, onClose, onLinked, onToast }: {
  users: UserProfile[];
  students: Student[];
  existingLinks: Record<string, string[]>;
  onClose: () => void;
  onLinked: () => void;
  onToast: (message: string) => void;
}) {
  const parents = users.filter((u) => u.role === 'parent');
  const [parentId, setParentId] = useState(parents[0]?.id ?? '');
  const [selected, setSelected] = useState<string[]>(existingLinks[parentId] ?? []);
  const [busy, setBusy] = useState(false);

  const onSelectParent = (id: string) => {
    setParentId(id);
    setSelected(existingLinks[id] ?? []);
  };

  const toggleStudent = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const save = async () => {
    if (!parentId) { onToast('Select a parent first.'); return; }
    setBusy(true);
    const existing = existingLinks[parentId] ?? [];
    const toAdd = selected.filter((id) => !existing.includes(id));
    const toRemove = existing.filter((id) => !selected.includes(id));

    if (toAdd.length) {
      await supabase.from('parent_student_links').insert(toAdd.map((student_id) => ({ parent_user_id: parentId, student_id })));
    }
    if (toRemove.length) {
      await supabase.from('parent_student_links').delete().eq('parent_user_id', parentId).in('student_id', toRemove);
    }

    setBusy(false);
    onToast(`Parent links updated — ${selected.length} student${selected.length === 1 ? '' : 's'} linked.`);
    onLinked();
  };

  return (
    <div className="notice-overlay" onClick={onClose}>
      <section className="notice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notice-preview-top">
          <span className="eyebrow"><Plus size={14} /> Link parent to student</span>
          <button className="close-button" onClick={onClose}><X size={18} /></button>
        </div>
        <h2 className="mt-3 text-lg font-bold text-slate-800">Manage parent-student links</h2>
        <p className="mt-1 text-sm text-slate-500">Select a parent, then check which students are their children. Parents will only see linked students.</p>

        {parents.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No parent accounts exist yet. Create one first.</p>
        ) : (
          <>
            <label className="control-field mt-4">Parent account
              <select value={parentId} onChange={(e) => onSelectParent(e.target.value)}>
                {parents.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </label>
            <div className="link-student-list">
              {students.map((s) => (
                <button
                  key={s.id}
                  className={`selectable-row ${selected.includes(s.id) ? 'selected' : ''}`}
                  onClick={() => toggleStudent(s.id)}
                  type="button"
                >
                  <span className="check-box">{selected.includes(s.id) && <Check size={15} />}</span>
                  <div className="selectable-name">
                    <strong>{s.full_name}</strong>
                    <span>{s.admission_number} · {s.class_name} · Section {s.section_name}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="notice-preview-actions mt-4">
          <button className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={() => void save()} disabled={busy || parents.length === 0}>
            {busy ? <Loader2 size={16} className="auth-spinner" /> : <Check size={16} />} Save links
          </button>
        </div>
      </section>
    </div>
  );
}

function ChangePasswordModal({ onClose, onToast }: {
  onClose: () => void;
  onToast: (message: string) => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) { setError(updateError.message); setBusy(false); return; }

    onToast('Your password has been updated.');
    onClose();
  };

  return (
    <div className="notice-overlay" onClick={onClose}>
      <section className="notice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notice-preview-top">
          <span className="eyebrow"><KeyRound size={14} /> Change password</span>
          <button className="close-button" onClick={onClose}><X size={18} /></button>
        </div>
        <h2 className="mt-3 text-lg font-bold text-slate-800">Change your password</h2>
        <p className="mt-1 text-sm text-slate-500">Choose a new password to replace the temporary one.</p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
          <label className="control-field">New password
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="At least 6 characters" autoComplete="new-password" />
          </label>
          <label className="control-field">Confirm new password
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Re-enter the new password" autoComplete="new-password" />
          </label>
          {error && <div className="auth-error"><AlertCircle size={16} /><span>{error}</span></div>}
          <div className="notice-preview-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={busy}>
              {busy ? <Loader2 size={16} className="auth-spinner" /> : <KeyRound size={16} />} Update password
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
