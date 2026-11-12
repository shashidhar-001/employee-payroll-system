import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack,
  TableBody, TableCell, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import api, { errorMessage } from '../../api';
import { Section, TableWrap } from '../../components/common';

const emptyForm = { role: 'EMPLOYEE', employee: null, email: '', password: '' };

const ROLE_HELP = {
  EMPLOYEE: 'Checks in, applies for leave and views own payslips',
  HR: 'Manages employees, attendance, leave, holidays and payroll',
  ADMIN: 'Manages accounts, departments and payroll rules. Not linked to an employee',
};

const hasText = (q, values) => values.some((v) => v && String(v).toLowerCase().includes(q));

export default function Users({ notify }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, e] = await Promise.all([api.get('/api/users'), api.get('/api/employees')]);
      setUsers(u.data);
      setEmployees(e.data);
    } catch (err) {
      notify('error', errorMessage(err));
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  // Only active employees that do not have a login yet can be linked to a new account
  const available = useMemo(
    () => employees.filter((e) => e.active && !users.some((u) => u.employeeId === e.id)),
    [employees, users]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const e = byId.get(u.employeeId);
      return hasText(q, [u.email, u.role, e?.employeeCode, e ? e.id : null, e?.name]);
    });
  }, [users, search, byId]);

  const needsEmployee = form.role !== 'ADMIN';
  const setRole = (role) => setForm({ ...form, role, employee: role === 'ADMIN' ? null : form.employee });
  const pickEmployee = (employee) =>
    setForm({ ...form, employee, email: employee ? employee.email : form.email });

  const create = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/users', {
        email: form.email,
        password: form.password,
        role: form.role,
        employeeId: needsEmployee ? form.employee.id : null,
      });
      notify('success', 'Account created');
      setCreating(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      notify('error', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    if (u.active && !window.confirm(`Deactivate ${u.email}? They will not be able to log in.`)) return;
    try {
      if (u.active) await api.delete(`/api/users/${u.id}`);
      else await api.put(`/api/users/${u.id}/activate`);
      notify('success', u.active ? 'Account deactivated' : 'Account activated');
      await load();
    } catch (err) {
      notify('error', errorMessage(err));
    }
  };

  const resetPassword = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/users/${resetTarget.id}/password`, { newPassword });
      notify('success', `Password reset for ${resetTarget.email}`);
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      notify('error', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section title="Login accounts"
             action={<Button variant="contained" onClick={() => { setForm(emptyForm); setCreating(true); }}>
               Create account</Button>}>
      <TextField label="Search by email, role, employee ID or name" value={search}
                 onChange={(e) => setSearch(e.target.value)} fullWidth sx={{ mb: 2 }} />

      <TableWrap minWidth={700}>
        <TableHead>
          <TableRow>
            <TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Employee</TableCell>
            <TableCell>Status</TableCell><TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {visible.map((u) => {
            const e = byId.get(u.employeeId);
            return (
              <TableRow key={u.id} hover>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>
                  {e ? (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.employeeCode}</Typography>
                      <Typography variant="caption" color="text.secondary">{e.name}</Typography>
                    </>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Chip size="small" label={u.active ? 'Active' : 'Inactive'} color={u.active ? 'success' : 'default'} />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => { setResetTarget(u); setNewPassword(''); }}>Reset password</Button>
                    <Button size="small" color={u.active ? 'error' : 'primary'} onClick={() => toggleActive(u)}>
                      {u.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
          {visible.length === 0 && <TableRow><TableCell colSpan={5}>No accounts found</TableCell></TableRow>}
        </TableBody>
      </TableWrap>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        A deactivated account cannot log in. An employee deactivated by HR is also blocked until HR activates them again.
      </Typography>

      <Dialog open={creating} onClose={() => setCreating(false)} fullWidth maxWidth="sm" fullScreen={fullScreen}>
        <form onSubmit={create} style={{ display: 'contents' }}>
          <DialogTitle>Create login account</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Alert severity="info">
                HR adds the employee first. Then you create the login here and link it to that employee.
              </Alert>

              <TextField select label="Role" value={form.role} onChange={(e) => setRole(e.target.value)}
                         helperText={ROLE_HELP[form.role]}>
                <MenuItem value="EMPLOYEE">Employee</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </TextField>

              {needsEmployee && (
                <Autocomplete
                  options={available}
                  value={form.employee}
                  onChange={(_, v) => pickEmployee(v)}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  getOptionLabel={(e) => `${e.employeeCode} · ${e.name}`}
                  filterOptions={(opts, { inputValue }) => {
                    const q = inputValue.trim().toLowerCase();
                    return q ? opts.filter((e) => hasText(q, [e.employeeCode, e.id, e.name, e.email])) : opts;
                  }}
                  noOptionsText={available.length === 0
                    ? 'Every active employee already has a login. Ask HR to add the employee first.'
                    : 'No matching employee'}
                  renderOption={(props, e) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={key} {...rest}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.employeeCode} · {e.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {e.email}{e.department ? ` · ${e.department.name}` : ''}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Employee" required
                               helperText="Type an employee ID, name or email. Only employees without a login are listed." />
                  )}
                />
              )}

              <TextField label="Login email" type="email" required value={form.email}
                         onChange={(e) => setForm({ ...form, email: e.target.value })}
                         helperText={needsEmployee ? 'Filled in from the employee record. The user signs in with this email.' : ' '} />
              <TextField label="Temporary password" type="password" required value={form.password}
                         onChange={(e) => setForm({ ...form, password: e.target.value })}
                         helperText="At least 6 characters. The user can change it after signing in." />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" variant="contained"
                    disabled={saving || (needsEmployee && !form.employee) || form.password.length < 6}>
              {saving ? 'Creating...' : 'Create account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={!!resetTarget} onClose={() => setResetTarget(null)} fullWidth maxWidth="xs">
        <form onSubmit={resetPassword} style={{ display: 'contents' }}>
          <DialogTitle>Reset password</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>{resetTarget?.email}</Typography>
            <TextField label="New password" type="password" required fullWidth value={newPassword}
                       onChange={(e) => setNewPassword(e.target.value)} helperText="At least 6 characters" />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || newPassword.length < 6}>Reset</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Section>
  );
}