import { AppBar, Button, Chip, Container, Toolbar, Typography } from '@mui/material';
import { useAuth } from '../AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap', py: { xs: 0.5, sm: 0 } }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Employee Payroll System
          </Typography>
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>{user.email}</Typography>
          <Chip size="small" label={user.role} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }} />
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 } }}>
        {children}
      </Container>
    </>
  );
}