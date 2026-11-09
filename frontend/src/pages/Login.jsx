import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useAuth, homePath } from '../AuthContext';
import { errorMessage } from '../api';

export default function Login() {
    const { user, login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    if (user) return <Navigate to={homePath(user.role)} replace />;

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            await login(email, password);   // the redirect happens above once the user is set
        } catch (err) {
            setError(err.response?.status === 401 ? 'Invalid email or password' : errorMessage(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
            <Paper component="form" onSubmit={submit} sx={{ p: 4, width: 380 }}>
                <Typography variant="h5" gutterBottom>Employee Payroll System</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Sign in to continue</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <TextField label="Email" type="email" fullWidth required margin="normal"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                <TextField label="Password" type="password" fullWidth required margin="normal"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button type="submit" variant="contained" fullWidth disabled={busy} sx={{ mt: 2 }}>
                    {busy ? 'Signing in...' : 'Sign in'}
                </Button>
            </Paper>
        </Box>
    );
}