import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#337fff', // Matches tailwind primary-500
            light: '#5ca2ff',
            dark: '#0040fa',
        },
        background: {
            default: '#f9fafb', // gray-50
            paper: '#ffffff',
        },
        text: {
            primary: '#111827', // gray-900
            secondary: '#4b5563', // gray-600
        },
    },
    typography: {
        fontFamily: '"Inter", "system-ui", "Avenir", "Helvetica", "Arial", sans-serif',
        button: {
            textTransform: 'none',
            fontWeight: 500,
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    padding: '8px 16px',
                },
                containedPrimary: {
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    '&:hover': {
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                    }
                }
            }
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                    },
                },
            }
        }
    }
});

export default theme;
