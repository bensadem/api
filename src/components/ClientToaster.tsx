'use client';

import { Toaster } from 'react-hot-toast';

export default function ClientToaster() {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                style: {
                    background: '#2c2c2c',
                    color: '#fff',
                    borderRadius: '8px',
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                    },
                },
            }}
        />
    );
}
