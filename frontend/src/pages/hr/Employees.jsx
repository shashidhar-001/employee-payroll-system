import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack,
  TableBody, TableCell, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import api, { errorMessage } from '../../api';
import { Section, TableWrap, money } from '../../components/common';

const emptyForm = {
  name: '', email: '', phone: '', designation: '', joiningDate: '', basicSalary: '', departmentId: '',
};

export default function Employees({ notify }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [editing, setEditing] = useState(null);    // null = closed, 'new' or an employee
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [e, d] = await Promise.all([api.get('/api/employees'), api.get('/api/departments')]);
      setEmployees(e.data);
      setDepartments(d.data);
    } catch (err) {
      notify('error', errorMessage(err));
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) =>
      (!deptFilter || e.department?.id === Number(deptFilter)) &&
      (!q || [e.name, e.email, e.designation].some((v) => v && v.toLowerCase().includes(q))));
  }, [employees, search, deptFilter]);

  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openNew = () => { setForm(emptyForm); setEditing('new'); };
  const openEdit = (e) => {
    setForm({
      name: e.name, email: e.email, phone: e.phone || '', designation: e.designation || '',
      joiningDate: e.joiningDate || '', basicSalary: e.basicSalary, departmentId: e.department?.id || '',
    });
    setEditing(e);
  };

  const save = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      basicSalary: Number(form.basicSalary),
      departmentId: Number(form.departmentId),
      joiningDate: form.joiningDate || null,
    };
    try {
      if (editing === 'new') await api.post('/api/employees', payload);
      else await api.put(`/api/employees/${editing.id}`, payload);
      notify('success', editing === 'new' ? 'Employee added' : 'Employee updated');
      setEditing(null);
      await load();
    } catch (err) {
      notify('error', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (e) => {
    if (!window.confirm(`Deactivate ${e.name}? They will no longer be able to log in.`)) return;
    try {
      await api.delete(`/api/employees/${e.id}`);
      notify('success', `${e.name} deactivated`);
      await load();
    } catch (err) {
      notify('error', errorMessage(err));
    }
  };

  return (
    <Section title="Employees" action={<Button variant="contained" onClick={openNew}>Add employee</Button>}>
      {departments.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No departments exist yet. Ask the Admin to create one before adding employees.
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField size="small" label="Search name, email, designation" value={search}
                   onChange={(e) => setSearch(e.target.value)} sx={{ flexGrow: 1 }} />
        <TextField select size="small" label="Department" value={deptFilter}
                   onChange={(e) => setDeptFilter(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All departments</MenuItem>
          {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
        </TextField>
      </Stack>

      <TableWrap minWidth={720}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell><TableCell>Department</TableCell><TableCell>Designation</TableCell>
            <TableCell align="right">Basic salary</TableCell><TableCell>Status</TableCell><TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {visible.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                {e.name}
                <Typography variant="caption" display="block" color="text.secondary">{e.email}</Typography>
              </TableCell>
              <TableCell>{e.department?.name || '-'}</TableCell>
              <TableCell>{e.designation || '-'}</TableCell>
              <TableCell align="right">{money(e.basicSalary)}</TableCell>
              <TableCell>
                <Chip size="small" label={e.active ? 'Active' : 'Inactive'} color={e.active ? 'success' : 'default'} />
              </TableCell>
              <TableCell>
                {e.active && (
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => openEdit(e)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => deactivate(e)}>Deactivate</Button>
                  </Stack>
                )}
              </TableCell>
            </TableRow>
          ))}
          {visible.length === 0 && <TableRow><TableCell colSpan={6}>No employees found</TableCell></TableRow>}
        </TableBody>
      </TableWrap>

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="sm" fullScreen={fullScreen}>
        <form onSubmit={save} style={{ display: 'contents' }}>
          <DialogTitle>{editing === 'new' ? 'Add employee' : 'Edit employee'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Name" required value={form.name} onChange={setField('name')} />
              <TextField label="Email" type="email" required value={form.email} onChange={setField('email')} />
              <TextField label="Phone" value={form.phone} onChange={setField('phone')} />
              <TextField label="Designation" value={form.designation} onChange={setField('designation')} />
              <TextField select label="Department" required value={form.departmentId}
                         onChange={setField('departmentId')}>
                {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
              <TextField label="Joining date" type="date" value={form.joiningDate} onChange={setField('joiningDate')}
                         slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Basic salary" type="number" required value={form.basicSalary}
                         onChange={setField('basicSalary')} slotProps={{ htmlInput: { min: 1, step: '0.01' } }} />
              <Typography variant="caption" color="text.secondary">
                Login accounts for employees are created by the Admin.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Section>
  );
}