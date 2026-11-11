import { Box, Chip, MenuItem, Paper, Stack, Table, TableContainer, TextField, Typography } from '@mui/material';

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const money = (v) =>
  v == null ? '-' : Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const statusColor = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error', CANCELLED: 'default' };

const CHIP_COLORS = {
  PRESENT: 'success', LATE: 'warning', HALF_DAY: 'info', ABSENT: 'error', ON_LEAVE: 'secondary',
  PENDING: 'warning', APPROVED: 'success', REJECTED: 'error', CANCELLED: 'default',
};

export function StatusChip({ status, label }) {
  return <Chip size="small" color={CHIP_COLORS[status] || 'default'}
               label={label || String(status).replace('_', ' ')} />;
}

export function Section({ title, action, children }) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction="row"
             sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

export function StatCard({ icon, label, value, color = 'primary' }) {
  return (
    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{
        width: 46, height: 46, borderRadius: 2, display: 'grid', placeItems: 'center', flexShrink: 0,
        bgcolor: `${color}.main`, color: '#fff', opacity: 0.95,
      }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
        <Typography variant="h5" sx={{ lineHeight: 1.2 }}>{value ?? '-'}</Typography>
      </Box>
    </Paper>
  );
}

export const StatGrid = ({ children }) => (
  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' } }}>
    {children}
  </Box>
);

// Tables scroll sideways on small screens instead of squashing
export function TableWrap({ children, minWidth = 560 }) {
  return (
    <TableContainer sx={{ overflowX: 'auto', border: '1px solid #eef1f6', borderRadius: 2 }}>
      <Table size="small" sx={{ minWidth, '& td, & th': { py: 1.2 } }}>{children}</Table>
    </TableContainer>
  );
}

export function PeriodPicker({ month, year, onChange }) {
  const thisYear = new Date().getFullYear();
  const years = [thisYear - 2, thisYear - 1, thisYear];
  return (
    <Stack direction="row" spacing={1}>
      <TextField select label="Month" value={month} sx={{ minWidth: 100 }}
                 onChange={(e) => onChange({ month: Number(e.target.value), year })}>
        {MONTH_NAMES.map((m, i) => <MenuItem key={m} value={i + 1}>{m}</MenuItem>)}
      </TextField>
      <TextField select label="Year" value={year} sx={{ minWidth: 100 }}
                 onChange={(e) => onChange({ month, year: Number(e.target.value) })}>
        {years.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
      </TextField>
    </Stack>
  );
}