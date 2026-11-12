import { Navigate, useParams } from 'react-router-dom';
import { useNotify } from '../components/Notify';
import Overview from './admin/Overview';
import Users from './admin/Users';
import Departments from './admin/Departments';
import Payroll from './hr/Payroll';
import PayrollRules from './admin/PayrollRules';

const SECTIONS = { users: Users, departments: Departments, payroll: Payroll, rules: PayrollRules };

export default function AdminDashboard() {
  const { section } = useParams();
  const notify = useNotify();
  if (!section) return <Overview notify={notify} />;
  const Page = SECTIONS[section];
  return Page ? <Page notify={notify} /> : <Navigate to="/admin" replace />;
}