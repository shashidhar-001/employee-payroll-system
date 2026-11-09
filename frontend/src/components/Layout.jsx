import { AppBar, Button, Container, Toolbar, Typography } from '@mui/material';
import { useAuth } from '../AuthContext';

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>Employee Payroll System</Typography>
                    <Typography variant="body2" sx={{ mr: 2 }}>{user.email} ({user.role})</Typography>
                    <Button color="inherit" onClick={logout}>Logout</Button>
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg" sx={{ py: 3 }}>{children}</Container>
        </>
    );
}