import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth, homePath } from './AuthContext';
import RequireRole from './components/RequireRole';
import Layout from './components/Layout';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HRDashboard from './pages/HRDashboard';
import AdminDashboard from './pages/AdminDashboard';

function Protected({ roles, children }) {
  return (
    <RequireRole roles={roles}>
      <Layout>{children}</Layout>
    </RequireRole>
  );
}

function Home() {
  const { user } = useAuth();
  return <Navigate to={user ? homePath(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/employee/:section?" element={<Protected roles={['EMPLOYEE']}><EmployeeDashboard /></Protected>} />
            <Route path="/hr/:section?" element={<Protected roles={['HR']}><HRDashboard /></Protected>} />
            <Route path="/admin/:section?" element={<Protected roles={['ADMIN']}><AdminDashboard /></Protected>} />
            <Route path="*" element={<Home />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}