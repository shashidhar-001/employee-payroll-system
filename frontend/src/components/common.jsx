import { MenuItem, Paper, Stack, Table, TableContainer, TextField, Typography } from '@mui/material';

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const money = (v) =>
  v == null ? '-' : Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const statusColor = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error', CANCELLED: 'default' };

export function Section({ title, action, children }) {
  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Stack direction="row"
             sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
        <Typography variant="h6">{title}</Typography>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

// Tables scroll sideways on small screens instead of squashing
export function TableWrap({ children, minWidth = 560 }) {
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth }}>{children}</Table>
    </TableContainer>
  );
}

export function PeriodPicker({ month, year, onChange }) {
  const thisYear = new Date().getFullYear();
  const years = [thisYear - 2, thisYear - 1, thisYear];
  return (
    <Stack direction="row" spacing={1}>
      <TextField select size="small" label="Month" value={month} sx={{ minWidth: 100 }}
                 onChange={(e) => onChange({ month: Number(e.target.value), year })}>
        {MONTH_NAMES.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
      </TextField>
      <TextField select size="small" label="Year" value={year} sx={{ minWidth: 100 }}
                 onChange={(e) => onChange({ month, year: Number(e.target.value) })}>
        {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
      </TextField>
    </Stack>
  );
}