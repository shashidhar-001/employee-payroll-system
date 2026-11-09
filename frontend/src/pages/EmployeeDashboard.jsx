import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Button, Chip, Dialog, DialogContent, DialogTitle, MenuItem, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import api, { errorMessage } from '../api';
import { MONTH_NAMES, Section, TableWrap, money, statusColor } from '../components/common';

const emptyForm = { leaveType: 'CASUAL', fromDate: '', toDate: '', reason: '' };

export default function EmployeeDashboard() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const today = now.toLocaleDateString('en-CA');   // YYYY-MM-DD in local time

  const [attendance, setAttendance] = useState([]);
  const [balance, setBalance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const [a, b, l, p] = await Promise.all([
        api.get('/api/attendance/my', { params: { month, year } }),
        api.get('/api/leaves/balance', { params: { month, year } }),
        api.get('/api/leaves/my'),
        api.get('/api/payslips/my'),
      ]);
      setAttendance(a.data);
      setBalance(b.data);
      setLeaves(l.data);
      setPayslips(p.data);
    } catch (e) {
      setMsg({ severity: 'error', text: errorMessage(e) });
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  // Runs an action, shows the result, then refreshes everything
  const run = async (fn, okText) => {
    try {
      await fn();
      setMsg({ severity: 'success', text: okText });
      await load();
    } catch (e) {
      setMsg({ severity: 'error', text: errorMessage(e) });
    }
  };

  const todayRecord = attendance.find((a) => a.date === today);
  const sortedAttendance = [...attendance].sort((a, b) => b.date.localeCompare(a.date));
  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const breakdown = selected && [
    ['Basic', selected.basic], ['HRA', selected.hra], ['DA', selected.da],
    ['Gross salary', selected.gross], ['PF', selected.pf],
    ['Professional tax', selected.professionalTax], ['Income tax', selected.incomeTax],
    ['Loss of pay', selected.lossOfPay], ['Total deductions', selected.totalDeductions],
    ['Net salary', selected.netSalary],
  ];

  return (
    <Stack spacing={3}>
      {msg && <Alert severity={msg.severity} onClose={() => setMsg(null)}>{msg.text}</Alert>}

      <Section title="Today's attendance">
        <Stack direction="row" sx={{ gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" disabled={!!todayRecord}
                  onClick={() => run(() => api.post('/api/attendance/check-in'), 'Checked in')}>
            Check In
          </Button>
          <Button variant="outlined" disabled={!todayRecord || !!todayRecord.checkOut}
                  onClick={() => run(() => api.post('/api/attendance/check-out'), 'Checked out')}>
            Check Out
          </Button>
          <Typography>
            {todayRecord
              ? `In: ${todayRecord.checkIn || '-'} | Out: ${todayRecord.checkOut || '-'} | ${todayRecord.status}`
              : 'Not checked in today'}
          </Typography>
        </Stack>
      </Section>

      <Section title={`Paid leave balance (${MONTH_NAMES[month - 1]} ${year})`}>
        {balance && (
          <Typography>
            {balance.approvedDays} of {balance.paidQuota} paid days used | {balance.paidRemaining} remaining |{' '}
            {balance.pendingDays} pending approval | {balance.unpaidDays} unpaid
          </Typography>
        )}
      </Section>

      <Section title="Apply for leave">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField select label="Type" value={form.leaveType} onChange={setField('leaveType')} sx={{ minWidth: 130 }}>
            <MenuItem value="CASUAL">Casual</MenuItem>
            <MenuItem value="SICK">Sick</MenuItem>
          </TextField>
          <TextField label="From" type="date" value={form.fromDate} onChange={setField('fromDate')}
                     slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }} />
          <TextField label="To" type="date" value={form.toDate} onChange={setField('toDate')}
                     slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: form.fromDate || today } }} />
          <TextField label="Reason" value={form.reason} onChange={setField('reason')} sx={{ flexGrow: 1 }} />
          <Button variant="contained"
                  disabled={!form.fromDate || !form.toDate || !form.reason.trim()}
                  onClick={() => run(async () => { await api.post('/api/leaves', form); setForm(emptyForm); },
                                     'Leave request submitted')}>
            Submit
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Sundays are holidays and are not counted. A request must stay within one month.
          Approved days beyond the monthly paid quota are unpaid.
        </Typography>
      </Section>

      <Section title="My leave requests">
        <TableWrap minWidth={640}>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell><TableCell>From</TableCell><TableCell>To</TableCell>
              <TableCell>Days</TableCell><TableCell>Status</TableCell><TableCell>Remarks</TableCell><TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{l.leaveType}</TableCell><TableCell>{l.fromDate}</TableCell>
                <TableCell>{l.toDate}</TableCell><TableCell>{l.days}</TableCell>
                <TableCell><Chip size="small" label={l.status} color={statusColor[l.status]} /></TableCell>
                <TableCell>{l.remarks || '-'}</TableCell>
                <TableCell>
                  {l.status === 'PENDING' && (
                    <Button size="small" color="error"
                            onClick={() => run(() => api.put(`/api/leaves/${l.id}/cancel`), 'Request cancelled')}>
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {leaves.length === 0 && <TableRow><TableCell colSpan={7}>No leave requests yet</TableCell></TableRow>}
          </TableBody>
        </TableWrap>
      </Section>

      <Section title="My payslips">
        <TableWrap minWidth={520}>
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell><TableCell align="right">Gross</TableCell>
              <TableCell align="right">Deductions</TableCell><TableCell align="right">Net salary</TableCell><TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {payslips.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{MONTH_NAMES[p.month - 1]} {p.year}</TableCell>
                <TableCell align="right">{money(p.gross)}</TableCell>
                <TableCell align="right">{money(p.totalDeductions)}</TableCell>
                <TableCell align="right">{money(p.netSalary)}</TableCell>
                <TableCell><Button size="small" onClick={() => setSelected(p)}>View</Button></TableCell>
              </TableRow>
            ))}
            {payslips.length === 0 && <TableRow><TableCell colSpan={5}>No payslips yet</TableCell></TableRow>}
          </TableBody>
        </TableWrap>
      </Section>

      <Section title={`Attendance (${MONTH_NAMES[month - 1]} ${year})`}>
        <TableWrap minWidth={420}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell><TableCell>Check in</TableCell>
              <TableCell>Check out</TableCell><TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAttendance.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.date}</TableCell><TableCell>{a.checkIn || '-'}</TableCell>
                <TableCell>{a.checkOut || '-'}</TableCell><TableCell>{a.status}</TableCell>
              </TableRow>
            ))}
            {sortedAttendance.length === 0 && <TableRow><TableCell colSpan={4}>No records this month</TableCell></TableRow>}
          </TableBody>
        </TableWrap>
      </Section>

      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="xs">
        {selected && (
          <>
            <DialogTitle>Payslip: {MONTH_NAMES[selected.month - 1]} {selected.year}</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Working days: {selected.workingDays} | Absent: {selected.absentDays} |
                Paid leave: {selected.paidLeaveDays ?? 0} | Unpaid leave: {selected.unpaidLeaveDays ?? 0}
              </Typography>
              <Table size="small">
                <TableBody>
                  {breakdown.map(([label, value]) => (
                    <TableRow key={label}>
                      <TableCell>{label}</TableCell>
                      <TableCell align="right">{money(value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Stack>
  );
}