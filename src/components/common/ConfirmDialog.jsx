import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    IconButton
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import CustomButton from './CustomButton';

const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDestructive = false
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                    minWidth: { xs: '300px', sm: '400px' }
                }
            }}
        >
            <div className="flex justify-between items-center px-6 pt-6 pb-4">
                <DialogTitle sx={{ p: 0, display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 600, color: '#111827' }}>
                    {isDestructive && (
                        <div className="bg-red-100 text-red-600 rounded-full w-8 h-8 flex items-center justify-center">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-sm" />
                        </div>
                    )}
                    {title}
                </DialogTitle>
                <IconButton onClick={onClose} size="small">
                    <FontAwesomeIcon icon={faTimes} />
                </IconButton>
            </div>

            <DialogContent sx={{ px: 6, pb: 4, pt: 0 }}>
                <DialogContentText sx={{ color: '#4B5563', fontSize: '0.95rem' }}>
                    {description}
                </DialogContentText>
            </DialogContent>

            <DialogActions sx={{ px: 3 }}>
                <CustomButton
                    onClick={onClose}
                    variant="text"
                    useFor="disabled"
                >
                    {cancelText}
                </CustomButton>
                <CustomButton
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    color={isDestructive ? "error" : "primary"}
                    sx={{
                        boxShadow: 'none',
                        fontWeight: 600,
                        borderRadius: '6px'
                    }}
                    useFor='error'
                    autoFocus
                >
                    {confirmText}
                </CustomButton>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
