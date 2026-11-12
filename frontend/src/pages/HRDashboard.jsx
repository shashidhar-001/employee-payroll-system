import { useEffect, useState } from 'react';
import { Link as RouterLink, Navigate, useParams } from 'react-router-dom';
import { Button, Stack } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import api from '../api';
import { useNotify } from '../components/Notify';
import CheckInCard from '../components/CheckInCard';
import { Section, StatCard, StatGrid } from '../components/common';
import LeaveApprovals from './hr/LeaveApprovals';
import Employees from './hr/Employees';
import AttendanceView from './hr/AttendanceView';
import Payroll from './hr/Payroll';
import PayrollCharts from '../components/PayrollCharts';
import Holidays from './Holidays';

function Overview() {
  const [stats, setStats] = useState({});
  const [name, setName] = useState('');

  useEffect(() => {
    Promise.all([api.get('/api/employees'), api.get('/api/departments'), api.get('/api/leaves/pending'), api.get('/api/auth/me')])
      .then(([e, d, l, me]) => {
        setStats({ employees: e.data.filter((x) => x.active).length, departments: d.data.length, pending: l.data.length });
        setName(me.data.employee?.name || '');
      })
      .catch(() => {});
  }, []);

  return (
    <Stack spacing={3}>
      <CheckInCard name={name} />
      <StatGrid>
        <StatCard icon={<PeopleIcon />} color="primary" label="Active employees" value={stats.employees} />
        <StatCard icon={<ApartmentIcon />} color="secondary" label="Departments" value={stats.departments} />
        <StatCard icon={<FactCheckIcon />} color="warning" label="Pending leave requests" value={stats.pending} />
      </StatGrid>
      <Section title="Quick actions">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button variant="contained" component={RouterLink} to="/hr/leaves">Review leave requests</Button>
          <Button variant="outlined" component={RouterLink} to="/hr/employees">Manage employees</Button>
          <Button variant="outlined" component={RouterLink} to="/hr/attendance">Correct attendance</Button>
          <Button variant="outlined" component={RouterLink} to="/hr/payroll">Run payroll</Button>
        </Stack>
      </Section>
      <PayrollCharts />
    </Stack>
  );
}

const SECTIONS = { leaves: LeaveApprovals, employees: Employees, attendance: AttendanceView, payroll: Payroll , holidays: Holidays };

export default function HRDashboard() {
  const { section } = useParams();
  const notify = useNotify();
  if (!section) return <Overview />;
  const Page = SECTIONS[section];
  return Page ? <Page notify={notify} /> : <Navigate to="/hr" replace />;
}