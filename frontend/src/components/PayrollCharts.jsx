import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Stack, TableBody, TableCell, TableHead, TableRow,
  ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import api, { errorMessage } from '../api';
import { MONTH_NAMES, PeriodPicker, Section, TableWrap, money } from './common';

const MUTED_BAR = '#c3cadb';   // context columns
const GRID = '#eef1f6';        // gridlines
const BASELINE = '#cfd5e3';    // axes and baselines

const rupees = (v) => Number(v ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const compact = (v) => new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

function niceMax(v) {
  if (!(v > 0)) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function previousMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

// The six months ending at the selected one, oldest first
function lastMonths({ month, year }, count = 6) {
  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    out.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return out;
}

function Tip({ title, rows }) {
  return (
    <Box sx={{ py: 0.5, minWidth: 150 }}>
      <Typography variant="caption" sx={{ display: 'block', opacity: 0.85, mb: 0.5 }}>{title}</Typography>
      {rows.map(([label, value, strong]) => (
        <Stack key={label} direction="row" sx={{ justifyContent: 'space-between', gap: 3 }}>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>{label}</Typography>
          <Typography variant="caption" sx={{ fontWeight: strong ? 700 : 500 }}>{value}</Typography>
        </Stack>
      ))}
    </Box>
  );
}

function DepartmentBars({ departments }) {
  const sorted = [...departments].sort((a, b) => b.totalNet - a.totalNet);
  const max = Math.max(...sorted.map((d) => d.totalNet), 0);

  return (
    <Box role="list" aria-label="Net payout by department">
      {sorted.map((d) => {
        const ratio = max > 0 ? d.totalNet / max : 0;
        const summary = `${d.department}: net payout ${rupees(d.totalNet)}, ${d.employees} employees`;
        return (
          <Tooltip key={d.department} arrow placement="top-start"
                   title={<Tip title={d.department} rows={[
                     ['Net payout', rupees(d.totalNet), true],
                     ['Gross', rupees(d.totalGross)],
                     ['Deductions', rupees(d.totalDeductions)],
                     ['Employees', d.employees],
                   ]} />}>
            <Box role="listitem" tabIndex={0} aria-label={summary}
                 sx={{
                   display: 'grid', gridTemplateColumns: { xs: '84px 1fr', sm: '140px 1fr' },
                   alignItems: 'center', gap: 1.5, minHeight: 40, px: 0.5, borderRadius: 1, outline: 'none',
                   '&:hover, &:focus-visible': { bgcolor: 'action.hover' },
                   '&:hover .bar, &:focus-visible .bar': { filter: 'brightness(1.12)' },
                 }}>
              <Typography variant="body2" color="text.secondary" noWrap title={d.department}>
                {d.department}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, height: 28,
                         borderLeft: `1px solid ${BASELINE}` }}>
                <Box className="bar" sx={{
                  flex: `0 0 calc((100% - 110px) * ${ratio})`, height: 20, bgcolor: 'primary.main',
                  borderRadius: '0 4px 4px 0', minWidth: ratio > 0 ? '2px' : 0,
                }} />
                <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {rupees(d.totalNet)}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
}

function MonthColumns({ months }) {
  const PLOT = 180;
  const top = niceMax(Math.max(...months.map((m) => m.totalNet), 0));
  const ticks = [top, top / 2, 0];
  const last = months.length - 1;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '44px 1fr', columnGap: 1, pt: '22px' }}>
      <Box sx={{ position: 'relative', height: PLOT }}>
        {ticks.map((t) => (
          <Typography key={t} variant="caption" color="text.secondary"
                      sx={{ position: 'absolute', right: 0, top: `${(1 - t / top) * 100}%`,
                            transform: 'translateY(-50%)', lineHeight: 1 }}>
            {compact(t)}
          </Typography>
        ))}
      </Box>

      <Box>
        <Box role="list" aria-label="Net payout by month"
             sx={{ position: 'relative', height: PLOT, borderBottom: `1px solid ${BASELINE}` }}>
          {[top, top / 2].map((t) => (
            <Box key={t} sx={{ position: 'absolute', left: 0, right: 0,
                               top: `${(1 - t / top) * 100}%`, borderTop: `1px solid ${GRID}` }} />
          ))}
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', gap: 1 }}>
            {months.map((m, i) => {
              const ratio = m.totalNet / top;
              const isLast = i === last;
              const name = `${MONTH_NAMES[m.month - 1]} ${m.year}`;
              return (
                <Tooltip key={`${m.year}-${m.month}`} arrow placement="top"
                         title={m.employees > 0
                           ? <Tip title={name} rows={[
                               ['Net payout', rupees(m.totalNet), true],
                               ['Gross', rupees(m.totalGross)],
                               ['Deductions', rupees(m.totalDeductions)],
                               ['Employees', m.employees],
                             ]} />
                           : <Tip title={name} rows={[['Payslips', 'none generated']]} />}>
                  <Box role="listitem" tabIndex={0}
                       aria-label={m.employees > 0 ? `${name}: net payout ${rupees(m.totalNet)}` : `${name}: no payslips`}
                       sx={{
                         flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end',
                         justifyContent: 'center', outline: 'none',
                         '&:hover, &:focus-visible': { bgcolor: 'action.hover' },
                         '&:hover .bar, &:focus-visible .bar': { filter: 'brightness(0.92)' },
                       }}>
                    {isLast && m.totalNet > 0 && (
                      <Typography variant="caption"
                                  sx={{ position: 'absolute', left: '50%', bottom: `calc(${ratio * 100}% + 4px)`,
                                        transform: 'translateX(-50%)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {compact(m.totalNet)}
                      </Typography>
                    )}
                    <Box className="bar" sx={{
                      width: 'min(100%, 24px)', height: `${ratio * 100}%`,
                      bgcolor: isLast ? 'primary.main' : MUTED_BAR, borderRadius: '4px 4px 0 0',
                    }} />
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 0.75 }}>
          {months.map((m, i) => (
            <Typography key={`${m.year}-${m.month}`} variant="caption"
                        color={i === last ? 'text.primary' : 'text.secondary'}
                        sx={{ flex: 1, textAlign: 'center', fontWeight: i === last ? 700 : 400 }}>
              {MONTH_NAMES[m.month - 1]}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function PayrollCharts() {
  const [period, setPeriod] = useState(previousMonth);
  const [view, setView] = useState('chart');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);

  const load = useCallback(async () => {
    const id = ++latest.current;
    setLoading(true);
    setError('');
    const months = lastMonths(period);
    const results = await Promise.allSettled(
      months.map((m) => api.get('/api/reports/payroll-summary', { params: m })));
    if (id !== latest.current) return;   // a newer request replaced this one

    const failed = results.find((r) => r.status === 'rejected');
    if (failed) {
      setData(null);
      setError(errorMessage(failed.reason));
    } else {
      const rows = months.map((m, i) => ({ ...m, ...results[i].value.data }));
      setData({ months: rows, selected: rows[rows.length - 1] });
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const label = `${MONTH_NAMES[period.month - 1]} ${period.year}`;
  const sel = data?.selected;

  return (
    <Stack spacing={2}>
      {/* One filter row above everything it scopes */}
      <Stack direction={{ xs: 'column', sm: 'row' }}
             sx={{ gap: 2, justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <PeriodPicker {...period} onChange={setPeriod} />
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="chart">Chart</ToggleButton>
          <ToggleButton value="table">Table</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {error && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>
          {error}
        </Alert>
      )}
      {!data && !error && <Typography color="text.secondary">Loading payroll figures...</Typography>}

      {data && (
        <Box sx={{
          display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          opacity: loading ? 0.5 : 1, transition: 'opacity .15s',
        }}>
          <Section title={`Net payout by department: ${label}`}>
            {sel.employees === 0 ? (
              <Typography color="text.secondary">
                No payslips generated for {label}. HR can generate them from the Payroll page.
              </Typography>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Total net payout {rupees(sel.totalNet)} for {sel.employees} employees
                </Typography>
                {view === 'chart' ? <DepartmentBars departments={sel.departments} /> : (
                  <TableWrap minWidth={480}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Department</TableCell><TableCell align="right">Employees</TableCell>
                        <TableCell align="right">Gross</TableCell><TableCell align="right">Deductions</TableCell>
                        <TableCell align="right">Net</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sel.departments.map((d) => (
                        <TableRow key={d.department} hover>
                          <TableCell>{d.department}</TableCell>
                          <TableCell align="right">{d.employees}</TableCell>
                          <TableCell align="right">{money(d.totalGross)}</TableCell>
                          <TableCell align="right">{money(d.totalDeductions)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{money(d.totalNet)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </TableWrap>
                )}
              </>
            )}
          </Section>

          <Section title={`Net payout, last 6 months to ${label}`}>
            {view === 'chart' ? <MonthColumns months={data.months} /> : (
              <TableWrap minWidth={420}>
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell><TableCell align="right">Employees</TableCell>
                    <TableCell align="right">Gross</TableCell><TableCell align="right">Net</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...data.months].reverse().map((m) => (
                    <TableRow key={`${m.year}-${m.month}`} hover>
                      <TableCell>{MONTH_NAMES[m.month - 1]} {m.year}</TableCell>
                      <TableCell align="right">{m.employees || '-'}</TableCell>
                      <TableCell align="right">{m.employees ? money(m.totalGross) : '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: m.employees ? 700 : 400 }}>
                        {m.employees ? money(m.totalNet) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableWrap>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              Months with no payslips show no bar. Figures come from the .NET payroll service.
            </Typography>
          </Section>
        </Box>
      )}
    </Stack>
  );
}