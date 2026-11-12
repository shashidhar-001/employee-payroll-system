import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import api, { errorMessage } from '../api';
import { useNotify } from './Notify';

const EMPTY = { oldPassword: '', newPassword: '', confirm: '' };

export default function ChangePasswordDialog({ open, onClose }) {
  const notify = useNotify();
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [f, setF] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const tooShort = f.newPassword !== '' && f.newPassword.length < 6;
  const mismatch = f.confirm !== '' && f.newPassword !== f.confirm;
  const incomplete = !f.oldPassword || !f.newPassword || !f.confirm;

  const close = () => { setF(EMPTY); onClose(); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/auth/change-password', { oldPassword: f.oldPassword, newPassword: f.newPassword });
      notify('success', 'Password changed');
      close();
    } catch (err) {
      notify('error', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs" fullScreen={fullScreen}>
      <form onSubmit={submit} style={{ display: 'contents' }}>
        <DialogTitle>Change password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Current password" type="password" required autoFocus
                       value={f.oldPassword} onChange={set('oldPassword')} />
            <TextField label="New password" type="password" required value={f.newPassword}
                       onChange={set('newPassword')} error={tooShort}
                       helperText={tooShort ? 'At least 6 characters' : ' '} />
            <TextField label="Confirm new password" type="password" required value={f.confirm}
                       onChange={set('confirm')} error={mismatch}
                       helperText={mismatch ? 'Passwords do not match' : ' '} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={close}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={saving || incomplete || tooShort || mismatch}>
            {saving ? 'Saving...' : 'Change password'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}