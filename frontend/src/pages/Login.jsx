import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Alert, Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PaymentsIcon from '@mui/icons-material/Payments';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth, homePath } from '../AuthContext';
import { errorMessage } from '../api';

const POINTS = [
  'Attendance with one-tap check-in',
  'Leave requests with HR approval',
  'Payslips calculated by a separate .NET service',
  'Role-based dashboards for Employee, HR and Admin',
];

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice] = useState(() => sessionStorage.getItem('loginNotice'));
  useEffect(() => { sessionStorage.removeItem('loginNotice'); }, []);

  if (user) return <Navigate to={homePath(user.role)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.status === 401 ? 'Invalid email or password' : errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      <Box sx={{
        flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'center',
        p: 8, color: '#fff', background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #0ea5a4 100%)',
      }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: 3, display: 'grid', placeItems: 'center',
          bgcolor: 'rgba(255,255,255,0.18)', mb: 3
        }}>
          <PaymentsIcon fontSize="large" />
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>Employee Payroll System</Typography>
        <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9, mb: 5 }}>
          Remote Java to .NET communication, built as a working payroll application.
        </Typography>
        <Stack spacing={2}>
          {POINTS.map((p) => (
            <Stack key={p} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <CheckCircleIcon sx={{ opacity: 0.9 }} />
              <Typography>{p}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: 'background.default' }}>
        <Box component="form" onSubmit={submit} sx={{ width: '100%', maxWidth: 400 }}>
          <Typography variant="h4" gutterBottom>Welcome back</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Sign in to your account to continue</Typography>
          {notice && !error && <Alert severity="info" sx={{ mb: 2 }}>{notice}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField label="Email" type="email" fullWidth required margin="normal" autoFocus
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Password" type={show ? 'text' : 'password'} fullWidth required margin="normal"
            value={password} onChange={(e) => setPassword(e.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShow(!show)} edge="end" aria-label="Show password">
                      {show ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>)
              }
            }} />
          <Button type="submit" variant="contained" fullWidth size="large" disabled={busy} sx={{ mt: 2, py: 1.3 }}>
            {busy ? 'Signing in...' : 'Sign in'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}