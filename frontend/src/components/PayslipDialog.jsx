import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableRow, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import { MONTH_NAMES, money } from './common';
import { downloadPayslipPdf } from '../utils/payslipPdf';

export default function PayslipDialog({ payslip, onClose }) {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const p = payslip;
  const rows = p && [
    ['Basic', p.basic], ['HRA', p.hra], ['DA', p.da], ['Gross salary', p.gross, true],
    ['PF', p.pf], ['Professional tax', p.professionalTax], ['Income tax', p.incomeTax],
    ['Loss of pay', p.lossOfPay], ['Total deductions', p.totalDeductions, true],
    ['Net salary', p.netSalary, true],
  ];

  return (
    <Dialog open={!!p} onClose={onClose} fullWidth maxWidth="xs" fullScreen={fullScreen}>
      {p && (
        <>
          <DialogTitle>Payslip: {MONTH_NAMES[p.month - 1]} {p.year}</DialogTitle>
          <DialogContent>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip size="small" label={`Working days ${p.workingDays}`} />
              <Chip size="small" label={`Absent ${Number(p.absentDays ?? 0)}`} color="error" variant="outlined" />
              <Chip size="small" label={`Paid leave ${p.paidLeaveDays ?? 0}`} color="success" variant="outlined" />
              <Chip size="small" label={`Unpaid leave ${p.unpaidLeaveDays ?? 0}`} color="warning" variant="outlined" />
            </Stack>
            <Table size="small">
              <TableBody>
                {rows.map(([label, value, strong]) => (
                  <TableRow key={label} sx={strong ? { bgcolor: '#f5f7ff' } : undefined}>
                    <TableCell sx={{ fontWeight: strong ? 700 : 400 }}>{label}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: strong ? 700 : 400 }}>{money(value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={onClose}>Close</Button>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => downloadPayslipPdf(p)}>
              Download PDF
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}