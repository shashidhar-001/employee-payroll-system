import { useCallback, useState } from 'react';
import { Alert, Stack, Tab, Tabs } from '@mui/material';
import Overview from './admin/Overview';
import Users from './admin/Users';
import Departments from './admin/Departments';
import Payroll from './hr/Payroll';

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [msg, setMsg] = useState(null);
  const notify = useCallback((severity, text) => setMsg({ severity, text }), []);

  return (
    <Stack spacing={2}>
      {msg && <Alert severity={msg.severity} onClose={() => setMsg(null)}>{msg.text}</Alert>}
      <Tabs value={tab} onChange={(_, v) => setTab(v)}
            variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
        <Tab label="Overview" />
        <Tab label="Users" />
        <Tab label="Departments" />
        <Tab label="Payroll" />
      </Tabs>
      {tab === 0 && <Overview notify={notify} />}
      {tab === 1 && <Users notify={notify} />}
      {tab === 2 && <Departments notify={notify} />}
      {tab === 3 && <Payroll notify={notify} />}
    </Stack>
  );
}