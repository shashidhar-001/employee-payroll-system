import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, MenuItem, Stack, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import api, { errorMessage } from '../api';
import { useAuth } from '../AuthContext';
import { Section, TableWrap } from '../components/common';

const parse = (iso) => new Date(`${iso}T00:00:00`);
const pretty = (iso) => parse(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const dayName = (iso) => parse(iso).toLocaleDateString('en-IN', { weekday: 'long' });

export default function Holidays({ notify }) {
  const { user } = useAuth();
  const canEdit = user.role !== 'EMPLOYEE';
  const thisYear = new Date().getFullYear();

  const [year, setYear] = useState(thisYear);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ date: '', name: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/holidays', { params: { year } });
      setRows(data);
    } catch (e) {
      notify('error', errorMessage(e));
    }
  }, [year, notify]);

  useEffect(() => { load(); }, [load]);

  const add = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/holidays', form);
      notify('success', 'Holiday added');
      setForm({ date: '', name: '' });
      await load();
    } catch (e) {
      notify('error', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (h) => {
    if (!window.confirm(`Remove "${h.name}" (${pretty(h.date)})? Payslips already generated for that month keep their old working days until they are regenerated.`)) return;
    try {
      await api.delete(`/api/holidays/${h.id}`);
      notify('success', 'Holiday removed');
      await load();
    } catch (e) {
      notify('error', errorMessage(e));
    }
  };

  return (
    <Stack spacing={3}>
      {canEdit && (
        <Section title="Declare a holiday">
          <Stack component="form" onSubmit={add} direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="Date" type="date" required value={form.date}
                       onChange={(e) => setForm({ ...form, date: e.target.value })}
                       slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: `${year}-01-01`, max: `${year}-12-31` } }} />
            <TextField label="Holiday name" required value={form.name} sx={{ flexGrow: 1 }}
                       onChange={(e) => setForm({ ...form, name: e.target.value })}
                       slotProps={{ htmlInput: { maxLength: 100 } }} />
            <Button type="submit" variant="contained" disabled={saving || !form.date || !form.name.trim()}>
              Add holiday
            </Button>
          </Stack>
          <Alert severity="info" sx={{ mt: 2 }}>
            Sundays are always holidays. A declared holiday is not counted as a working day, cannot be
            used for check-in or leave, and is not marked absent. After changing a month that already has
            payslips, regenerate them.
          </Alert>
        </Section>
      )}

      <Section title={`Holidays in ${year}`}
               action={
                 <TextField select label="Year" value={year} sx={{ minWidth: 110 }}
                            onChange={(e) => setYear(Number(e.target.value))}>
                   {[thisYear - 1, thisYear, thisYear + 1].map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                 </TextField>
               }>
        <TableWrap minWidth={460}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell><TableCell>Day</TableCell><TableCell>Holiday</TableCell>
              {canEdit && <TableCell />}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((h) => (
              <TableRow key={h.id} hover>
                <TableCell>{pretty(h.date)}</TableCell>
                <TableCell>{dayName(h.date)}</TableCell>
                <TableCell>{h.name}</TableCell>
                {canEdit && (
                  <TableCell align="right">
                    <Button size="small" color="error" onClick={() => remove(h)}>Remove</Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={canEdit ? 4 : 3} sx={{ color: 'text.secondary', py: 3 }}>
                No holidays declared for {year}. Sundays are always off.
              </TableCell></TableRow>
            )}
          </TableBody>
        </TableWrap>
      </Section>
    </Stack>
  );
}