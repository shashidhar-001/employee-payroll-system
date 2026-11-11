import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import api, { errorMessage } from '../api';
import { useNotify } from './Notify';
import { StatusChip } from './common';

const greeting = (h) => (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');

export default function CheckInCard({ name, onChange }) {
  const notify = useNotify();
  const [record, setRecord] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    const d = new Date();
    try {
      const { data } = await api.get('/api/attendance/my', { params: { month: d.getMonth() + 1, year: d.getFullYear() } });
      setRecord(data.find((a) => a.date === d.toLocaleDateString('en-CA')) || null);
    } catch (e) {
      notify('error', errorMessage(e));
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const act = async (path, okText) => {
    try {
      await api.post(path);
      notify('success', okText);
      await load();
      onChange?.();
    } catch (e) {
      notify('error', errorMessage(e));
    }
  };

  const btn = { bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: '#eef2ff' }, '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.7)' } };

  return (
    <Box sx={{
      p: { xs: 2.5, sm: 3 }, borderRadius: 4, color: '#fff',
      background: 'linear-gradient(120deg, #4f46e5 0%, #6d5df6 55%, #0ea5a4 100%)',
    }}>
      <Stack direction={{ xs: 'column', md: 'row' }}
             sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#fff' }}>
            {greeting(now.getHours())}{name ? `, ${name.split(' ')[0]}` : ''}
          </Typography>
          <Typography sx={{ opacity: 0.9 }}>
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' | '}
            {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
            {record ? (
              <>
                <StatusChip status={record.status} />
                <Typography variant="body2">In {record.checkIn || '-'} | Out {record.checkOut || '-'}</Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {now.getDay() === 0 ? 'Today is a holiday' : 'You have not checked in today'}
              </Typography>
            )}
          </Stack>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" startIcon={<LoginIcon />} sx={btn} disabled={!!record}
                  onClick={() => act('/api/attendance/check-in', 'Checked in')}>Check In</Button>
          <Button variant="contained" startIcon={<LogoutIcon />} sx={btn}
                  disabled={!record || !!record.checkOut || !record.checkIn}
                  onClick={() => act('/api/attendance/check-out', 'Checked out')}>Check Out</Button>
        </Stack>
      </Stack>
    </Box>
  );
}