import { createContext, useCallback, useContext, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

const NotifyContext = createContext(() => { });
export const useNotify = () => useContext(NotifyContext);

export function NotifyProvider({ children }) {
    const [msg, setMsg] = useState(null);
    const notify = useCallback((severity, text) => setMsg({ severity, text, key: Date.now() }), []);

    return (
        <NotifyContext.Provider value={notify}>
            {children}
            <Snackbar key={msg?.key} open={!!msg} autoHideDuration={4500}
                onClose={(_, reason) => { if (reason !== 'clickaway') setMsg(null); }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {msg ? <Alert severity={msg.severity} variant="filled" onClose={() => setMsg(null)}
                    sx={{ width: '100%' }}>{msg.text}</Alert> : <span />}
            </Snackbar>
        </NotifyContext.Provider>
    );
}