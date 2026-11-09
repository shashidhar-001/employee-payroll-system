import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import api, { errorMessage } from '../../api';
import { Section } from '../../components/common';

function Stat({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5">{value ?? '-'}</Typography>
    </Paper>
  );
}

function ServiceRow({ name, info }) {
  const up = info?.status === 'UP';
  return (
    <Stack direction="row" sx={{ gap: 2, alignItems: 'center', py: 0.5 }}>
      <Typography sx={{ minWidth: 160 }}>{name}</Typography>
      {info ? (
        <Chip size="small" label={up ? 'UP' : 'DOWN'} color={up ? 'success' : 'error'} />
      ) : (
        <Chip size="small" label="Checking..." />
      )}
      {up && info.responseMs != null && (
        <Typography variant="caption" color="text.secondary">{info.responseMs} ms</Typography>
      )}
    </Stack>
  );
}

export default function Overview({ notify }) {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const [e, d, u, l] = await Promise.all([
        api.get('/api/employees'),
        api.get('/api/departments'),
        api.get('/api/users'),
        api.get('/api/leaves/pending'),
      ]);
      setStats({
        employees: e.data.filter((x) => x.active).length,
        departments: d.data.length,
        users: u.data.filter((x) => x.active).length,
        pendingLeaves: l.data.length,
      });
    } catch (err) {
      notify('error', errorMessage(err));
    }
  }, [notify]);

  const loadStatus = useCallback(async () => {
    setStatus(null);
    try {
      const { data } = await api.get('/api/admin/system-status');
      setStatus(data);
    } catch (err) {
      notify('error', errorMessage(err));
    }
  }, [notify]);

  useEffect(() => { loadStats(); loadStatus(); }, [loadStats, loadStatus]);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
        <Stat label="Active employees" value={stats?.employees} />
        <Stat label="Departments" value={stats?.departments} />
        <Stat label="Active login accounts" value={stats?.users} />
        <Stat label="Pending leave requests" value={stats?.pendingLeaves} />
      </Box>

      <Section title="Service status" action={<Button size="small" onClick={loadStatus}>Refresh</Button>}>
        <ServiceRow name="Java service (employees)" info={status?.java} />
        <ServiceRow name=".NET service (payroll)" info={status?.dotnet} />
        {status && (
          <Typography variant="caption" color="text.secondary">Checked at {status.checkedAt}</Typography>
        )}
      </Section>
    </Stack>
  );
}