import { createTheme } from '@mui/material/styles';

export default createTheme({
  palette: {
    primary: { main: '#4f46e5' },
    secondary: { main: '#0ea5a4' },
    background: { default: '#f4f6fb', paper: '#ffffff' },
    text: { primary: '#1e293b', secondary: '#64748b' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700 }, h5: { fontWeight: 700 }, h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: '1px solid #e5e9f2' } } },
    MuiAlert: { styleOverrides: { root: { border: 'none' } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 10 } } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600, color: '#64748b', backgroundColor: '#f8fafc', whiteSpace: 'nowrap' } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
  },
});