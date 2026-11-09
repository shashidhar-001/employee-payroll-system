import { useCallback, useEffect, useState } from 'react';
import { Button, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api, { errorMessage } from '../../api';
import { Section, TableWrap } from '../../components/common';

export default function LeaveApprovals({ notify }) {
  const [rows, setRows] = useState([]);
  const [remarks, setRemarks] = useState({});

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/leaves/pending');
      setRows(data);
    } catch (e) {
      notify('error', errorMessage(e));
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const decide = async (id, action) => {
    try {
      await api.put(`/api/leaves/${id}/${action}`, null,
        { params: { remarks: remarks[id] || undefined } });
      notify('success', action === 'approve' ? 'Leave approved' : 'Leave rejected');
      await load();
    } catch (e) {
      notify('error', errorMessage(e));
    }
  };

  return (
    <Section title={`Pending leave requests (${rows.length})`}>
      <TableWrap minWidth={760}>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell><TableCell>Type</TableCell><TableCell>From</TableCell>
            <TableCell>To</TableCell><TableCell>Days</TableCell><TableCell>Reason</TableCell>
            <TableCell>Remarks</TableCell><TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((l) => (
            <TableRow key={l.id}>
              <TableCell>{l.employee?.name}</TableCell>
              <TableCell>{l.leaveType}</TableCell>
              <TableCell>{l.fromDate}</TableCell>
              <TableCell>{l.toDate}</TableCell>
              <TableCell>{l.days}</TableCell>
              <TableCell>{l.reason}</TableCell>
              <TableCell>
                <TextField size="small" placeholder="Optional" value={remarks[l.id] || ''}
                           onChange={(e) => setRemarks({ ...remarks, [l.id]: e.target.value })} />
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" color="success"
                          onClick={() => decide(l.id, 'approve')}>Approve</Button>
                  <Button size="small" variant="outlined" color="error"
                          onClick={() => decide(l.id, 'reject')}>Reject</Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <TableRow><TableCell colSpan={8}>No pending requests</TableCell></TableRow>}
        </TableBody>
      </TableWrap>
      <Typography variant="caption" color="text.secondary">
        Each employee gets 2 paid leave days per month. Approved days beyond that are unpaid.
      </Typography>
    </Section>
  );
}