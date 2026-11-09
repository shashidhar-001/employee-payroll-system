import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline, Typography } from '@mui/material';
import { AuthProvider, useAuth, homePath } from './AuthContext';
import RequireRole from './components/RequireRole';
import Layout from './components/Layout';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';

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
            <Route path="/hr" element={<Protected roles={['HR']}><Typography variant="h5">HR dashboard (coming next)</Typography></Protected>} />
            <Route path="/admin" element={<Protected roles={['ADMIN']}><Typography variant="h5">Admin dashboard (coming next)</Typography></Protected>} />
            <Route path="*" element={<Home />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}