import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import api, { errorMessage } from '../../api';
import { Section } from '../../components/common';

const DEFAULTS = {
  hraPercent: 40, daPercent: 10, pfPercent: 12,
  professionalTaxThreshold: 15000, professionalTaxAmount: 200,
  taxSlabs: [
    { upTo: 25000, ratePercent: 0 },
    { upTo: 50000, ratePercent: 5 },
    { upTo: null, ratePercent: 10 },
  ],
};

const toForm = (r) => ({
  hraPercent: String(r.hraPercent), daPercent: String(r.daPercent), pfPercent: String(r.pfPercent),
  professionalTaxThreshold: String(r.professionalTaxThreshold),
  professionalTaxAmount: String(r.professionalTaxAmount),
  taxSlabs: r.taxSlabs.map((s) => ({
    upTo: s.upTo == null ? '' : String(s.upTo), ratePercent: String(s.ratePercent),
  })),
});

const percent = {
  input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
  htmlInput: { min: 0, max: 100, step: '0.01' },
};
const grid = { display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } };

export default function PayrollRules({ notify }) {
  const [meta, setMeta] = useState(null);
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/payroll/rules');
      setMeta(data);
      setF(toForm(data));
    } catch (e) {
      notify('error', errorMessage(e));
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  if (!f) {
    return (
      <Section title="Payroll rules">
        <Typography color="text.secondary">Loading rules from the .NET payroll service...</Typography>
      </Section>
    );
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setSlab = (i, k) => (e) =>
    setF({ ...f, taxSlabs: f.taxSlabs.map((s, j) => (j === i ? { ...s, [k]: e.target.value } : s)) });
  const addSlab = () => {
    const slabs = [...f.taxSlabs];
    slabs.splice(slabs.length - 1, 0, { upTo: '', ratePercent: '' });   // new slab goes before the last one
    setF({ ...f, taxSlabs: slabs });
  };
  const removeSlab = (i) => setF({ ...f, taxSlabs: f.taxSlabs.filter((_, j) => j !== i) });

  const save = async (ev) => {
    ev.preventDefault();
    if (!window.confirm('Apply these rules? They are used for payslips generated from now on.')) return;
    setSaving(true);
    const last = f.taxSlabs.length - 1;
    const payload = {
      hraPercent: Number(f.hraPercent),
      daPercent: Number(f.daPercent),
      pfPercent: Number(f.pfPercent),
      professionalTaxThreshold: Number(f.professionalTaxThreshold),
      professionalTaxAmount: Number(f.professionalTaxAmount),
      taxSlabs: f.taxSlabs.map((s, i) => ({
        upTo: i === last ? null : Number(s.upTo),
        ratePercent: Number(s.ratePercent),
      })),
    };
    try {
      const { data } = await api.put('/api/payroll/rules', payload);
      setMeta(data);
      setF(toForm(data));
      notify('success', `Rules saved (version ${data.version})`);
    } catch (e) {
      notify('error', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={save}>
      <Stack spacing={3}>
        <Section title="Payroll rules"
                 action={<Typography variant="body2" color="text.secondary">
                   Version {meta.version}
                   {meta.updatedBy ? ` | changed by ${meta.updatedBy} on ${new Date(meta.updatedAt).toLocaleString('en-IN')}` : ' | default rules'}
                 </Typography>}>
          <Alert severity="info">
            These rules are stored in the .NET payroll service and used for every salary calculation.
            Existing payslips keep their saved amounts. Regenerating a month recalculates it with the current rules.
          </Alert>
        </Section>

        <Section title="Allowances and deductions">
          <Box sx={grid}>
            <TextField label="HRA (of basic)" type="number" required value={f.hraPercent} onChange={set('hraPercent')} slotProps={percent} />
            <TextField label="DA (of basic)" type="number" required value={f.daPercent} onChange={set('daPercent')} slotProps={percent} />
            <TextField label="PF (of basic)" type="number" required value={f.pfPercent} onChange={set('pfPercent')} slotProps={percent} />
            <TextField label="Professional tax applies above gross of" type="number" required
                       value={f.professionalTaxThreshold} onChange={set('professionalTaxThreshold')}
                       slotProps={{ htmlInput: { min: 0, step: '0.01' } }} />
            <TextField label="Professional tax amount" type="number" required
                       value={f.professionalTaxAmount} onChange={set('professionalTaxAmount')}
                       slotProps={{ htmlInput: { min: 0, step: '0.01' } }} />
          </Box>
        </Section>

        <Section title="Income tax slabs"
                 action={<Button size="small" startIcon={<AddIcon />} onClick={addSlab}
                                 disabled={f.taxSlabs.length >= 10}>Add slab</Button>}>
          <Stack spacing={2}>
            {f.taxSlabs.map((s, i) => {
              const last = i === f.taxSlabs.length - 1;
              return (
                <Stack key={i} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <TextField label={last ? 'Above the previous limit' : 'Gross up to'} type="number"
                             required={!last} disabled={last} value={last ? '' : s.upTo}
                             placeholder={last ? 'No limit' : ''} onChange={setSlab(i, 'upTo')}
                             slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1, step: '0.01' } }}
                             sx={{ flex: 1 }} />
                  <TextField label="Tax rate" type="number" required value={s.ratePercent}
                             onChange={setSlab(i, 'ratePercent')} slotProps={percent} sx={{ flex: 1 }} />
                  <IconButton aria-label="Remove slab" onClick={() => removeSlab(i)}
                              disabled={f.taxSlabs.length <= 1}>
                    <DeleteOutlinedIcon />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            The slab a salary's gross falls into decides the rate, and that rate is applied to the whole gross.
            The last slab never has an upper limit.
          </Typography>
        </Section>

        <Stack direction="row" spacing={2}>
          <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save rules'}</Button>
          <Button variant="outlined" onClick={() => { setF(toForm(DEFAULTS)); notify('info', 'Default values loaded. Click Save to apply them.'); }}>
            Load defaults
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}