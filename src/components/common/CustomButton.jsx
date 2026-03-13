import React from 'react';
import { Button, CircularProgress, useTheme } from '@mui/material';

const CustomButton = ({
    children,
    loading = false,
    disabled = false,
    variant = "contained",
    useFor = "primary",
    type = "button",
    sx = {},
    ...props
}) => {
    const theme = useTheme();

    return (
        <Button
            type={type}
            variant={variant}
            disabled={disabled || loading}
            sx={{
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: variant === 'contained' ? 'none' : 'auto',
                // color: useFor !== "primary" ? "#fff" : theme.palette.text.primary,
                backgroundColor: useFor === "success" ? theme.palette.success.main : useFor === "error" ? theme.palette.error.main : useFor === "warning" ? theme.palette.warning.main : useFor === "disabled" ? "#6B778C" : theme.palette.primary.main,
                color: useFor === "disabled" ? "#fff" : undefined,
                ...sx
            }}
            {...props}
        >
            {loading ? (
                <CircularProgress size={24} color="inherit" />
            ) : (
                children
            )}
        </Button>
    );
};

export default CustomButton;
