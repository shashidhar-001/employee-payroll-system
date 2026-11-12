import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, Navigate, useParams } from 'react-router-dom';
import { Box, Button, MenuItem, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PaymentsIcon from '@mui/icons-material/Payments';
import DownloadIcon from '@mui/icons-material/Download';
import api, { errorMessage } from '../api';
import { useNotify } from '../components/Notify';
import CheckInCard from '../components/CheckInCard';
import PayslipDialog from '../components/PayslipDialog';
import { downloadPayslipPdf } from '../utils/payslipPdf';
import { MONTH_NAMES, PeriodPicker, Section, StatCard, StatGrid, StatusChip, TableWrap, money } from '../components/common';
import Holidays from './Holidays';

const emptyForm = { leaveType: 'CASUAL', fromDate: '', toDate: '', reason: '' };
const empty = (cols, text) => <TableRow><TableCell colSpan={cols} sx={{ color: 'text.secondary', py: 3 }}>{text}</TableCell></TableRow>;

export default function EmployeeDashboard() {
  const { section } = useParams();
  const notify = useNotify();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const today = now.toLocaleDateString('en-CA');

  const [name, setName] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [balance, setBalance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const [me, a, b, l, p] = await Promise.all([
        api.get('/api/auth/me'),
        api.get('/api/attendance/my', { params: { month, year } }),
        api.get('/api/leaves/balance', { params: { month, year } }),
        api.get('/api/leaves/my'),
        api.get('/api/payslips/my'),
      ]);
      setName(me.data.employee?.name || '');
      setAttendance(a.data);
      setBalance(b.data);
      setLeaves(l.data);
      setPayslips(p.data);
    } catch (e) {
      notify('error', errorMessage(e));
    }
  }, [month, year, notify]);

  useEffect(() => { load(); }, [load]);

  const run = async (fn, okText) => {
    try {
      await fn();
      notify('success', okText);
      await load();
    } catch (e) {
      notify('error', errorMessage(e));
    }
  };

  const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const daysPresent = attendance.reduce((n, a) => n + (a.status === 'HALF_DAY' ? 0.5 : ['PRESENT', 'LATE'].includes(a.status) ? 1 : 0), 0);
  const latest = payslips[0];

  // ---------- Overview ----------
  if (!section) {
    return (
      <Stack spacing={3}>
        <CheckInCard name={name} onChange={load} />
        <StatGrid>
          <StatCard icon={<BeachAccessIcon />} color="success" label="Paid leave remaining" value={balance?.paidRemaining} />
          <StatCard icon={<HourglassTopIcon />} color="warning" label="Leave pending approval" value={balance?.pendingDays} />
          <StatCard icon={<EventAvailableIcon />} color="primary" label="Days present this month" value={daysPresent} />
          <StatCard icon={<PaymentsIcon />} color="secondary" label="Latest net salary" value={latest ? money(latest.netSalary) : '-'} />
        </StatGrid>
        <Section title="Latest payslip"
          action={<Button size="small" component={RouterLink} to="/employee/payslips">All payslips</Button>}>
          {latest ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{MONTH_NAMES[latest.month - 1]} {latest.year}</Typography>
                <Typography color="text.secondary">
                  Gross {money(latest.gross)} | Deductions {money(latest.totalDeductions)} | Net {money(latest.netSalary)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => setSelected(latest)}>View</Button>
                <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => downloadPayslipPdf(latest)}>PDF</Button>
              </Stack>
            </Stack>
          ) : <Typography color="text.secondary">No payslips yet. HR generates them after month end.</Typography>}
        </Section>
        <PayslipDialog payslip={selected} onClose={() => setSelected(null)} />
      </Stack>
    );
  }

  // ---------- Attendance ----------
  if (section === 'attendance') return <MyAttendance notify={notify} />;

  // ---------- Leave ----------
  if (section === 'leave') {
    return (
      <Stack spacing={3}>
        <StatGrid>
          <StatCard icon={<BeachAccessIcon />} color="primary" label="Paid days per month" value={balance?.paidQuota} />
          <StatCard icon={<EventAvailableIcon />} color="success" label="Remaining" value={balance?.paidRemaining} />
          <StatCard icon={<HourglassTopIcon />} color="warning" label="Pending approval" value={balance?.pendingDays} />
          <StatCard icon={<PaymentsIcon />} color="error" label="Unpaid this month" value={balance?.unpaidDays} />
        </StatGrid>

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
            <Button variant="contained" disabled={!form.fromDate || !form.toDate || !form.reason.trim()}
              onClick={() => run(async () => { await api.post('/api/leaves', form); setForm(emptyForm); }, 'Leave request submitted')}>
              Submit
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            Sundays and declared holidays and are not counted. A request must stay within one month.
            Approved days beyond the monthly paid quota are unpaid.
          </Typography>
        </Section>

        <Section title="My leave requests">
          <TableWrap minWidth={660}>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell><TableCell>From</TableCell><TableCell>To</TableCell>
                <TableCell>Days</TableCell><TableCell>Status</TableCell><TableCell>Remarks</TableCell><TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.map((l) => (
                <TableRow key={l.id} hover>
                  <TableCell>{l.leaveType}</TableCell><TableCell>{l.fromDate}</TableCell>
                  <TableCell>{l.toDate}</TableCell><TableCell>{l.days}</TableCell>
                  <TableCell><StatusChip status={l.status} /></TableCell>
                  <TableCell>{l.remarks || '-'}</TableCell>
                  <TableCell>
                    {l.status === 'PENDING' && (
                      <Button size="small" color="error"
                        onClick={() => run(() => api.put(`/api/leaves/${l.id}/cancel`), 'Request cancelled')}>Cancel</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {leaves.length === 0 && empty(7, 'No leave requests yet')}
            </TableBody>
          </TableWrap>
        </Section>
      </Stack>
    );
  }

  // ---------- Payslips ----------
  if (section === 'payslips') {
    return (
      <Section title="My payslips">
        <TableWrap minWidth={560}>
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell><TableCell align="right">Gross</TableCell>
              <TableCell align="right">Deductions</TableCell><TableCell align="right">Net salary</TableCell><TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {payslips.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{MONTH_NAMES[p.month - 1]} {p.year}</TableCell>
                <TableCell align="right">{money(p.gross)}</TableCell>
                <TableCell align="right">{money(p.totalDeductions)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{money(p.netSalary)}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => setSelected(p)}>View</Button>
                  <Button size="small" startIcon={<DownloadIcon />} onClick={() => downloadPayslipPdf(p)}>PDF</Button>
                </TableCell>
              </TableRow>
            ))}
            {payslips.length === 0 && empty(5, 'No payslips yet')}
          </TableBody>
        </TableWrap>
        <PayslipDialog payslip={selected} onClose={() => setSelected(null)} />
      </Section>
    );
  }
  if (section === 'holidays') return <Holidays notify={notify} />;

  return <Navigate to="/employee" replace />;
}

function MyAttendance({ notify }) {
  const d = new Date();
  const [period, setPeriod] = useState({ month: d.getMonth() + 1, year: d.getFullYear() });
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/api/attendance/my', { params: period })
      .then(({ data }) => setRows([...data].sort((a, b) => b.date.localeCompare(a.date))))
      .catch((e) => notify('error', errorMessage(e)));
  }, [period, notify]);

  const count = (...s) => rows.filter((r) => s.includes(r.status)).length;

  return (
    <Stack spacing={3}>
      <StatGrid>
        <StatCard icon={<EventAvailableIcon />} color="success" label="Present" value={count('PRESENT', 'LATE')} />
        <StatCard icon={<HourglassTopIcon />} color="warning" label="Late" value={count('LATE')} />
        <StatCard icon={<BeachAccessIcon />} color="secondary" label="Half days" value={count('HALF_DAY')} />
        <StatCard icon={<PaymentsIcon />} color="primary" label="Records" value={rows.length} />
      </StatGrid>
      <Section title="Attendance history" action={<PeriodPicker {...period} onChange={setPeriod} />}>
        <TableWrap minWidth={480}>
          <TableHead>
            <TableRow><TableCell>Date</TableCell><TableCell>Check in</TableCell><TableCell>Check out</TableCell><TableCell>Status</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell>{a.date}</TableCell><TableCell>{a.checkIn || '-'}</TableCell><TableCell>{a.checkOut || '-'}</TableCell>
                <TableCell>
                  <StatusChip status={a.status} />
                  {a.correctedBy && (
                    <Tooltip title={`Corrected by HR: ${a.correctionReason}`}>
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, cursor: 'help' }}>corrected</Typography>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && empty(4, 'No records for this month')}
          </TableBody>
        </TableWrap>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Working days with no record count as absent. If a record is wrong, ask HR to correct it.
        </Typography>
      </Section>
    </Stack>
  );
}