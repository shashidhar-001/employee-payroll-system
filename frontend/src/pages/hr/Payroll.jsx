import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, MenuItem, Paper, Stack, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import api, { errorMessage } from '../../api';
import { MONTH_NAMES, PeriodPicker, Section, TableWrap, money } from '../../components/common';
import { downloadPayslipPdf } from '../../utils/payslipPdf';

function previousMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function Stat({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6">{value}</Typography>
    </Paper>
  );
}

export default function Payroll({ notify }) {
  const [period, setPeriod] = useState(previousMonth);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/api/employees')
      .then(({ data }) => setEmployees(data.filter((e) => e.active)))
      .catch((e) => notify('error', errorMessage(e)));
  }, [notify]);

  const changePeriod = (p) => { setPeriod(p); setResults([]); setSummary(null); };
  const label = `${MONTH_NAMES[period.month - 1]} ${period.year}`;

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/api/reports/payroll-summary', { params: period });
      setSummary(data);
    } catch (e) {
      setSummary(null);
      notify('error', errorMessage(e));
    }
  }, [period, notify]);

  const generate = async (emp) => {
    const { data } = await api.post('/api/payslips/generate', null,
      { params: { employeeId: emp.id, month: period.month, year: period.year } });
    return data;
  };

  const generateSingle = async () => {
    const emp = employees.find((e) => e.id === Number(employeeId));
    if (!emp) return;
    setBusy(true);
    try {
      const payslip = await generate(emp);
      setResults([{ id: emp.id, name: emp.name, ok: true, payslip }]);
      notify('success', `Payslip generated for ${emp.name}`);
      await loadSummary();
    } catch (e) {
      setResults([{ id: emp.id, name: emp.name, ok: false, text: errorMessage(e) }]);
      notify('error', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const generateAll = async () => {
    if (employees.length === 0) return;
    if (!window.confirm(
      `Generate payslips for all ${employees.length} active employees for ${label}? ` +
      'Existing payslips for this month will be recalculated.')) return;

    setBusy(true);
    const out = [];
    let stopped = false;
    for (const emp of employees) {
      try {
        out.push({ id: emp.id, name: emp.name, ok: true, payslip: await generate(emp) });
      } catch (e) {
        out.push({ id: emp.id, name: emp.name, ok: false, text: errorMessage(e) });
        if (e.response?.status === 503) { stopped = true; break; }   // .NET is down: stop early
      }
      setResults([...out]);
    }
    setResults(out);
    setBusy(false);

    const failed = out.filter((r) => !r.ok).length;
    if (stopped) {
      notify('warning', 'Stopped: the payroll service (.NET) is not reachable');
    } else {
      notify(failed ? 'warning' : 'success', `Done: ${out.length - failed} generated, ${failed} failed`);
      await loadSummary();
    }
  };

  return (
    <Stack spacing={3}>
      <Section title="Generate payslips">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
          <PeriodPicker {...period} onChange={changePeriod} />
          <TextField select size="small" label="Employee" value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)} sx={{ minWidth: 220 }}>
            {employees.map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
          </TextField>
          <Button variant="contained" disabled={!employeeId || busy} onClick={generateSingle}>
            Generate for employee
          </Button>
          <Button variant="outlined" disabled={busy || employees.length === 0} onClick={generateAll}>
            Generate for all
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Working days are Monday to Saturday, excluding declared holidays. Missing attendance counts as absent; approved leave counts
          as paid for up to 2 days per month. The salary calculation is done by the .NET payroll service.
        </Typography>

        {results.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <TableWrap minWidth={680}>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell><TableCell>Result</TableCell>
                  <TableCell align="right">Gross</TableCell><TableCell align="right">Deductions</TableCell>
                  <TableCell align="right">Net salary</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>
                      {r.ok ? <Chip size="small" color="success" label="Generated" />
                        : <Chip size="small" color="error" label={r.text} />}
                    </TableCell>
                    <TableCell align="right">{r.ok ? money(r.payslip.gross) : '-'}</TableCell>
                    <TableCell align="right">{r.ok ? money(r.payslip.totalDeductions) : '-'}</TableCell>
                    <TableCell align="right">{r.ok ? money(r.payslip.netSalary) : '-'}</TableCell>
                    <TableCell align="right">
                      {r.ok && <Button size="small" onClick={() => downloadPayslipPdf(r.payslip)}>PDF</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableWrap>
          </Box>
        )}
      </Section>

      <Section title={`Payroll summary: ${label}`}
        action={<Button size="small" onClick={loadSummary}>Load summary</Button>}>
        {!summary && (
          <Typography color="text.secondary">
            Click "Load summary" to see totals for payslips already generated for {label}.
          </Typography>
        )}
        {summary && (
          <>
            <Box sx={{
              display: 'grid', gap: 2, mb: 2,
              gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }
            }}>
              <Stat label="Employees paid" value={summary.employees} />
              <Stat label="Total gross" value={money(summary.totalGross)} />
              <Stat label="Total deductions" value={money(summary.totalDeductions)} />
              <Stat label="Total net payout" value={money(summary.totalNet)} />
            </Box>
            <TableWrap minWidth={520}>
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell><TableCell align="right">Employees</TableCell>
                  <TableCell align="right">Gross</TableCell><TableCell align="right">Deductions</TableCell>
                  <TableCell align="right">Net</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.departments.map((d) => (
                  <TableRow key={d.department}>
                    <TableCell>{d.department}</TableCell>
                    <TableCell align="right">{d.employees}</TableCell>
                    <TableCell align="right">{money(d.totalGross)}</TableCell>
                    <TableCell align="right">{money(d.totalDeductions)}</TableCell>
                    <TableCell align="right">{money(d.totalNet)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableWrap>
            <Typography variant="caption" color="text.secondary">
              Calculated by the .NET service from payslip data it fetched from the Java service.
            </Typography>
          </>
        )}
      </Section>
    </Stack>
  );
}