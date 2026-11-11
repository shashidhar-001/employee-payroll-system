import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar, Avatar, Box, Button, Chip, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaymentsIcon from '@mui/icons-material/Payments';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../AuthContext';
import { NotifyProvider } from './Notify';

const NAV = {
  EMPLOYEE: [
    { label: 'Dashboard', to: '/employee', icon: <DashboardIcon /> },
    { label: 'Attendance', to: '/employee/attendance', icon: <EventAvailableIcon /> },
    { label: 'Leave', to: '/employee/leave', icon: <BeachAccessIcon /> },
    { label: 'Payslips', to: '/employee/payslips', icon: <ReceiptLongIcon /> },
  ],
  HR: [
    { label: 'Overview', to: '/hr', icon: <DashboardIcon /> },
    { label: 'Leave approvals', to: '/hr/leaves', icon: <FactCheckIcon /> },
    { label: 'Employees', to: '/hr/employees', icon: <PeopleIcon /> },
    { label: 'Attendance', to: '/hr/attendance', icon: <AccessTimeIcon /> },
    { label: 'Payroll', to: '/hr/payroll', icon: <PaymentsIcon /> },
  ],
  ADMIN: [
    { label: 'Overview', to: '/admin', icon: <DashboardIcon /> },
    { label: 'Users', to: '/admin/users', icon: <ManageAccountsIcon /> },
    { label: 'Departments', to: '/admin/departments', icon: <ApartmentIcon /> },
    { label: 'Payroll', to: '/admin/payroll', icon: <PaymentsIcon /> },
  ],
};

const DRAWER = 250;

function Sidebar({ items, pathname, user, logout, onNavigate }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: '#fff',
          background: 'linear-gradient(135deg, #4f46e5, #0ea5a4)',
        }}>
          <PaymentsIcon fontSize="small" />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>Payroll System</Typography>
          <Typography variant="caption" color="text.secondary">Java and .NET services</Typography>
        </Box>
      </Box>

      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {items.map((it) => (
          <ListItemButton key={it.to} component={RouterLink} to={it.to} onClick={onNavigate}
                          selected={pathname === it.to}
                          sx={{
                            borderRadius: 2, mb: 0.5, color: 'text.secondary',
                            '& .MuiListItemIcon-root': { minWidth: 38, color: 'inherit' },
                            '&.Mui-selected': {
                              bgcolor: 'primary.main', color: '#fff',
                              '&:hover': { bgcolor: 'primary.dark' },
                            },
                          }}>
            <ListItemIcon>{it.icon}</ListItemIcon>
            <ListItemText primary={it.label} slotProps={{ primary: { fontWeight: 600, fontSize: 14 } }} />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid #eef1f6' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            {user.email.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{user.email}</Typography>
            <Chip size="small" label={user.role} sx={{ height: 20, fontSize: 11 }} />
          </Box>
        </Box>
        <Button fullWidth variant="outlined" color="inherit" startIcon={<LogoutIcon />} onClick={logout}
                sx={{ color: 'text.secondary', borderColor: '#e5e9f2' }}>
          Logout
        </Button>
      </Box>
    </Box>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const items = NAV[user.role] || [];
  const current = items.find((i) => i.to === pathname)?.label || 'Dashboard';
  const side = <Sidebar items={items} pathname={pathname} user={user} logout={logout}
                        onNavigate={() => setOpen(false)} />;

  return (
    <NotifyProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {desktop ? (
          <Drawer variant="permanent" sx={{ width: DRAWER, flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER, border: 0, borderRight: '1px solid #e5e9f2' } }}>
            {side}
          </Drawer>
        ) : (
          <Drawer variant="temporary" open={open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }}
                  sx={{ '& .MuiDrawer-paper': { width: DRAWER, border: 0 } }}>
            {side}
          </Drawer>
        )}

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <AppBar position="sticky" color="inherit"
                  sx={{ bgcolor: 'rgba(244,246,251,0.85)', backdropFilter: 'blur(8px)', border: 0,
                        borderBottom: '1px solid #e5e9f2' }}>
            <Toolbar>
              {!desktop && (
                <IconButton edge="start" onClick={() => setOpen(true)} sx={{ mr: 1 }} aria-label="Open menu">
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" sx={{ flexGrow: 1 }}>{current}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              </Typography>
            </Toolbar>
          </AppBar>
          <Box component="main" sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 1240, mx: 'auto' }}>{children}</Box>
        </Box>
      </Box>
    </NotifyProvider>
  );
}