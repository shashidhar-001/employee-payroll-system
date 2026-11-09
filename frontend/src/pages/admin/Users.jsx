import { useCallback, useEffect, useState } from 'react';
import {
  Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack,
  TableBody, TableCell, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import api, { errorMessage } from '../../api';
import { Section, TableWrap } from '../../components/common';

const emptyForm = { email: '', password: '', role: 'EMPLOYEE', employeeId: '' };

export default function Users({ notify }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
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

  const employeeName = (id) => employees.find((e) => e.id === id)?.name || '-';
  // Only employees without a login yet can be linked to a new account
  const available = employees.filter((e) => e.active && !users.some((u) => u.employeeId === e.id));

  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const create = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/users', {
        email: form.email,
        password: form.password,
        role: form.role,
        employeeId: form.role === 'ADMIN' || !form.employeeId ? null : Number(form.employeeId),
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

  const needsEmployee = form.role !== 'ADMIN';

  return (
    <Section title="Login accounts"
             action={<Button variant="contained" onClick={() => { setForm(emptyForm); setCreating(true); }}>
               Create account</Button>}>
      <TableWrap minWidth={640}>
        <TableHead>
          <TableRow>
            <TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Employee</TableCell>
            <TableCell>Status</TableCell><TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>{u.employeeId ? employeeName(u.employeeId) : '-'}</TableCell>
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
          ))}
          {users.length === 0 && <TableRow><TableCell colSpan={5}>No accounts</TableCell></TableRow>}
        </TableBody>
      </TableWrap>
      <Typography variant="caption" color="text.secondary">
        A deactivated account cannot log in. Employees need an HR-created employee record before they can get an account.
      </Typography>

      <Dialog open={creating} onClose={() => setCreating(false)} fullWidth maxWidth="sm" fullScreen={fullScreen}>
        <form onSubmit={create} style={{ display: 'contents' }}>
          <DialogTitle>Create login account</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Email" type="email" required value={form.email} onChange={setField('email')} />
              <TextField label="Password" type="password" required value={form.password}
                         onChange={setField('password')} helperText="At least 6 characters" />
              <TextField select label="Role" value={form.role} onChange={setField('role')}>
                <MenuItem value="EMPLOYEE">Employee</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </TextField>
              {needsEmployee && (
                <TextField select label="Employee record" required value={form.employeeId}
                           onChange={setField('employeeId')}
                           helperText={available.length === 0 ? 'Every active employee already has an account' : ''}>
                  {available.map((e) => <MenuItem key={e.id} value={e.id}>{e.name} ({e.email})</MenuItem>)}
                </TextField>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || (needsEmployee && !form.employeeId)}>
              {saving ? 'Creating...' : 'Create'}
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
          <DialogActions>
            <Button onClick={() => setResetTarget(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || newPassword.length < 6}>Reset</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Section>
  );
}