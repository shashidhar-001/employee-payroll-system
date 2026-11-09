import { useCallback, useState } from 'react';
import { Alert, Stack, Tab, Tabs } from '@mui/material';
import CheckInCard from '../../components/CheckInCard';
import LeaveApprovals from './LeaveApprovals';
import Employees from './Employees';
import AttendanceView from './AttendanceView';
import Payroll from './Payroll';

export default function HRDashboard() {
    const [tab, setTab] = useState(0);
    const [msg, setMsg] = useState(null);
    const notify = useCallback((severity, text) => setMsg({ severity, text }), []);

    return (
        <Stack spacing={2}>
            {msg && <Alert severity={msg.severity} onClose={() => setMsg(null)}>{msg.text}</Alert>}
            <CheckInCard notify={notify} />
            <Tabs value={tab} onChange={(_, v) => setTab(v)}
                variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
                <Tab label="Leave approvals" />
                <Tab label="Employees" />
                <Tab label="Attendance" />
                <Tab label="Payroll" />
            </Tabs>
            {tab === 0 && <LeaveApprovals notify={notify} />}
            {tab === 1 && <Employees notify={notify} />}
            {tab === 2 && <AttendanceView notify={notify} />}
            {tab === 3 && <Payroll notify={notify} />}
        </Stack>
    );
}