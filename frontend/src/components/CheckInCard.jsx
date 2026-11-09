import { useCallback, useEffect, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import api, { errorMessage } from '../api';
import { Section } from './common';

export default function CheckInCard({ notify }) {
    const [record, setRecord] = useState(null);

    const load = useCallback(async () => {
        const now = new Date();
        const today = now.toLocaleDateString('en-CA');
        try {
            const { data } = await api.get('/api/attendance/my',
                { params: { month: now.getMonth() + 1, year: now.getFullYear() } });
            setRecord(data.find((a) => a.date === today) || null);
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
        } catch (e) {
            notify('error', errorMessage(e));
        }
    };

    return (
        <Section title="My attendance today">
            <Stack direction="row" sx={{ gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button variant="contained" disabled={!!record}
                    onClick={() => act('/api/attendance/check-in', 'Checked in')}>Check In</Button>
                <Button variant="outlined" disabled={!record || !!record.checkOut}
                    onClick={() => act('/api/attendance/check-out', 'Checked out')}>Check Out</Button>
                <Typography>
                    {record ? `In: ${record.checkIn || '-'} | Out: ${record.checkOut || '-'} | ${record.status}`
                        : 'Not checked in today'}
                </Typography>
            </Stack>
        </Section>
    );
}