import { useEffect, useState } from 'react';
import { MenuItem, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api, { errorMessage } from '../../api';
import { PeriodPicker, Section, TableWrap } from '../../components/common';

export default function AttendanceView({ notify }) {
  const now = new Date();
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/api/employees')
      .then(({ data }) => setEmployees(data.filter((e) => e.active)))
      .catch((e) => notify('error', errorMessage(e)));
  }, [notify]);

  useEffect(() => {
    if (!employeeId) { setRows([]); return; }
    api.get(`/api/attendance/employee/${employeeId}`, { params: period })
      .then(({ data }) => setRows([...data].sort((a, b) => b.date.localeCompare(a.date))))
      .catch((e) => notify('error', errorMessage(e)));
  }, [employeeId, period, notify]);

  const count = (...s) => rows.filter((r) => s.includes(r.status)).length;

  return (
    <Section title="Employee attendance">
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField select size="small" label="Employee" value={employeeId}
                   onChange={(e) => setEmployeeId(e.target.value)} sx={{ minWidth: 220 }}>
          {employees.map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
        </TextField>
        <PeriodPicker {...period} onChange={setPeriod} />
      </Stack>

      {employeeId && (
        <Typography sx={{ mb: 1 }}>
          Present: {count('PRESENT', 'LATE')} | Late: {count('LATE')} | Half days: {count('HALF_DAY')} | Records: {rows.length}
        </Typography>
      )}

      <TableWrap minWidth={420}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell><TableCell>Check in</TableCell>
            <TableCell>Check out</TableCell><TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.date}</TableCell><TableCell>{a.checkIn || '-'}</TableCell>
              <TableCell>{a.checkOut || '-'}</TableCell><TableCell>{a.status}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>{employeeId ? 'No records for this month' : 'Select an employee'}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableWrap>
      <Typography variant="caption" color="text.secondary">
        Days with no record count as absent when the payslip is generated.
      </Typography>
    </Section>
  );
}