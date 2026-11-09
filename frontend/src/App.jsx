import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline, Typography } from '@mui/material';
import { AuthProvider, useAuth, homePath } from './AuthContext';
import RequireRole from './components/RequireRole';
import Layout from './components/Layout';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HRDashboard from './pages/hr/HRDashboard';
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
    <>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/employee" element={<Protected roles={['EMPLOYEE']}><EmployeeDashboard /></Protected>} />
            <Route path="/hr" element={<Protected roles={['HR']}><HRDashboard /></Protected>} />
            <Route path="/admin" element={<Protected roles={['ADMIN']}><AdminDashboard /></Protected>} />
            <Route path="*" element={<Home />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}