import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack,
  TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import api, { errorMessage } from '../../api';
import { PeriodPicker, Section, StatusChip, TableWrap } from '../../components/common';

const STATUSES = ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT'];
const hhmm = (t) => (t ? t.slice(0, 5) : '');
const pad = (n) => String(n).padStart(2, '0');

// One row per working day up to today. Days with no record are shown as absent.
function buildRows(records, { month, year }, holidays) {
  const todayStr = new Date().toLocaleDateString('en-CA');
  const byDate = new Map(records.map((r) => [r.date, r]));
  const last = new Date(year, month, 0).getDate();
  const rows = [];
  for (let d = 1; d <= last; d++) {
    const date = `${year}-${pad(month)}-${pad(d)}`;
    if (date > todayStr) break;
    const isSunday = new Date(year, month - 1, d).getDay() === 0;
    if ((isSunday || holidays.has(date)) && !byDate.has(date)) continue;
    rows.push(byDate.get(date) || { id: `missing-${date}`, date, status: 'ABSENT', missing: true });
  }
  return rows.reverse();
}

export default function AttendanceView({ notify }) {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const now = new Date();
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [records, setRecords] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ status: 'PRESENT', checkIn: '', checkOut: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const [holidays, setHolidays] = useState(new Set());

  useEffect(() => {
    api.get('/api/holidays', { params: { year: period.year } })
      .then(({ data }) => setHolidays(new Set(data.map((h) => h.date))))
      .catch(() => setHolidays(new Set()));
  }, [period.year]);

  useEffect(() => {
    api.get('/api/employees')
      .then(({ data }) => setEmployees(data.filter((e) => e.active)))
      .catch((e) => notify('error', errorMessage(e)));
  }, [notify]);

  const load = useCallback(async () => {
    if (!employeeId) { setRecords([]); return; }
    try {
      const { data } = await api.get(`/api/attendance/employee/${employeeId}`, { params: period });
      setRecords(data);
    } catch (e) {
      notify('error', errorMessage(e));
    }
  }, [employeeId, period, notify]);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => (employeeId ? buildRows(records, period, holidays) : []),
    [records, period, employeeId, holidays]);
  const count = (fn) => rows.filter(fn).length;

  const openEdit = (row) => {
    setForm({
      status: row.missing ? 'PRESENT' : row.status,
      checkIn: hhmm(row.checkIn) || '09:00',
      checkOut: hhmm(row.checkOut),
      reason: '',
    });
    setEditing(row);
  };

  const save = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    const absent = form.status === 'ABSENT';
    try {
      await api.put(`/api/attendance/employee/${employeeId}/correct`, {
        date: editing.date,
        status: form.status,
        checkIn: absent ? null : form.checkIn || null,
        checkOut: absent ? null : form.checkOut || null,
        reason: form.reason,
      });
      notify('success', 'Attendance updated. Regenerate the payslip for this month if it already exists.');
      setEditing(null);
      await load();
    } catch (e) {
      notify('error', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const absent = form.status === 'ABSENT';

  return (
    <Section title="Employee attendance">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField select label="Employee" value={employeeId} sx={{ minWidth: 240 }}
          onChange={(e) => setEmployeeId(e.target.value)}>
          {employees.map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
        </TextField>
        <PeriodPicker {...period} onChange={setPeriod} />
      </Stack>

      {employeeId && (
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          Present {count((r) => ['PRESENT', 'LATE'].includes(r.status))} | Late {count((r) => r.status === 'LATE')} |
          Half days {count((r) => r.status === 'HALF_DAY')} | Absent {count((r) => r.status === 'ABSENT')}
        </Typography>
      )}

      <TableWrap minWidth={620}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell><TableCell>Check in</TableCell><TableCell>Check out</TableCell>
            <TableCell>Status</TableCell><TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((a) => (
            <TableRow key={a.id} hover>
              <TableCell>{a.date}</TableCell>
              <TableCell>{a.checkIn || '-'}</TableCell>
              <TableCell>{a.checkOut || '-'}</TableCell>
              <TableCell>
                <StatusChip status={a.status} label={a.missing ? 'ABSENT (no record)' : undefined} />
                {a.correctedBy && (
                  <Tooltip title={`${a.correctedBy}: ${a.correctionReason}`}>
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, cursor: 'help' }}>corrected</Typography>
                  </Tooltip>
                )}
              </TableCell>
              <TableCell align="right"><Button size="small" onClick={() => openEdit(a)}>{a.missing ? 'Add' : 'Correct'}</Button></TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={5} sx={{ color: 'text.secondary', py: 3 }}>
              {employeeId ? 'No working days to show yet' : 'Select an employee'}</TableCell></TableRow>
          )}
        </TableBody>
      </TableWrap>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Days with no record count as absent in the payslip. Every correction is saved with your name and reason.
      </Typography>

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="xs" fullScreen={fullScreen}>
        <form onSubmit={save} style={{ display: 'contents' }}>
          <DialogTitle>{editing?.missing ? 'Add attendance' : 'Correct attendance'}: {editing?.date}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField select label="Status" value={form.status} onChange={setField('status')}>
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
              </TextField>
              {!absent && (
                <>
                  <TextField label="Check in" type="time" required value={form.checkIn} onChange={setField('checkIn')}
                    slotProps={{ inputLabel: { shrink: true } }} />
                  <TextField label="Check out (optional)" type="time" value={form.checkOut} onChange={setField('checkOut')}
                    slotProps={{ inputLabel: { shrink: true } }} />
                </>
              )}
              <TextField label="Reason for correction" required multiline minRows={2} value={form.reason}
                onChange={setField('reason')} slotProps={{ htmlInput: { maxLength: 255 } }} />
              <Alert severity="info">The employee will see that this day was corrected, with your reason.</Alert>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving || !form.reason.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Section>
  );
}