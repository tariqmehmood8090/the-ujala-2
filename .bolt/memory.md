# Project memory

## Product intent & audience

- School management application (domain inferred: "schooldesk")
- Core modules: admissions, fees, student records, notices
- Three user roles: **Admin**, **Teacher**, **Parent**
- Admin has exclusive control over account lifecycle: create, suspend, reactivate, remove (Teacher & Parent accounts only; admin cannot remove own account)
- No self-registration — all accounts created by Admin

## Brand personality & voice

- TBD — no voice/brand signals yet from user interactions

## Visual design & UX direction

- Stack: Vite + React + Supabase + Tailwind CSS + lucide-react icons
- Login page: username + password fields only (no email shown to users)
- One-time "Create the first admin" bootstrap link on login page — disabled after first admin exists
- Admin panel includes User Accounts table with columns: Username, Full Name, Role, Actions (suspend/reactivate/remove)
- CreateUserModal fields: username, full name, password, role
- Refer to `.bolt/prompt` for global UI conventions (Tailwind, lucide-react, `@/` path alias)

## Decisions, constraints & rationale

- Supabase Auth requires an email, so usernames are mapped to internal pseudo-emails (`username@schooldesk.local`); users only see/enter usernames
- Account creation uses a SECURITY DEFINER RPC function server-side instead of `supabase.auth.signUp` — `signUp` would create a new session and log the admin out
- Account removal also uses an RPC function
- All existing accounts were cleared after the auth schema change; fresh start required
- Project files live at working-directory root (moved out of `project/` subdirectory)

## Open questions & assumptions

- RPC function names and full Supabase schema details not fully documented here
- Supabase env var names and config location still unconfirmed
- Build target, Node version, and package manager unknown
- Whether app has existing production data beyond cleared accounts unknown
- Module-level role permissions (what Teachers vs Parents can access) not yet specified