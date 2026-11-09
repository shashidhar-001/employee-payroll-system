import { useCallback, useEffect, useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack,
  TableBody, TableCell, TableHead, TableRow, TextField,
} from '@mui/material';
import api, { errorMessage } from '../../api';
import { Section, TableWrap } from '../../components/common';

export default function Departments({ notify }) {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [editing, setEditing] = useState(null);   // null = closed, 'new' or a department
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, e] = await Promise.all([api.get('/api/departments'), api.get('/api/employees')]);
      setDepartments(d.data);
      setEmployees(e.data);
    } catch (err) {
      notify('error', errorMessage(err));
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const count = (id) => employees.filter((e) => e.department?.id === id).length;

  const open = (d) => { setEditing(d); setName(d === 'new' ? '' : d.name); };

  const save = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    try {
      if (editing === 'new') await api.post('/api/departments', { name });
      else await api.put(`/api/departments/${editing.id}`, { name });
      notify('success', editing === 'new' ? 'Department added' : 'Department renamed');
      setEditing(null);
      await load();
    } catch (err) {
      notify('error', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete department "${d.name}"?`)) return;
    try {
      await api.delete(`/api/departments/${d.id}`);
      notify('success', 'Department deleted');
      await load();
    } catch (err) {
      notify('error', errorMessage(err));
    }
  };

  return (
    <Section title="Departments" action={<Button variant="contained" onClick={() => open('new')}>Add department</Button>}>
      <TableWrap minWidth={420}>
        <TableHead>
          <TableRow><TableCell>Name</TableCell><TableCell align="right">Employees</TableCell><TableCell /></TableRow>
        </TableHead>
        <TableBody>
          {departments.map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.name}</TableCell>
              <TableCell align="right">{count(d.id)}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => open(d)}>Rename</Button>
                  <Button size="small" color="error" onClick={() => remove(d)}>Delete</Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {departments.length === 0 && <TableRow><TableCell colSpan={3}>No departments yet</TableCell></TableRow>}
        </TableBody>
      </TableWrap>

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <form onSubmit={save} style={{ display: 'contents' }}>
          <DialogTitle>{editing === 'new' ? 'Add department' : 'Rename department'}</DialogTitle>
          <DialogContent>
            <TextField label="Name" required fullWidth autoFocus value={name} sx={{ mt: 1 }}
                       onChange={(e) => setName(e.target.value)} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || !name.trim()}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Section>
  );
}