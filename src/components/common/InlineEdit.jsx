import { useState, useRef, useEffect } from 'react';
import { IconButton, TextField, Box } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const InlineEdit = ({ initialValue, onSave, onCancel, sx = {} }) => {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const handleSave = (e) => {
        e.stopPropagation();
        if (value.trim() !== "") {
            onSave(value);
        }
    };

    const handleCancel = (e) => {
        e.stopPropagation();
        onCancel();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave(e);
        } else if (e.key === 'Escape') {
            handleCancel(e);
        }
    };

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1, 
                width: '100%',
                backgroundColor: '#E9F2FF',
                padding: '8px',
                borderRadius: '4px',
                border: '2px solid #4C9AFF',
                ...sx 
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <TextField
                fullWidth
                multiline
                variant="outlined"
                size="small"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                inputRef={inputRef}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        '& fieldset': { border: 'none' },
                    },
                    '& .MuiInputBase-input': {
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#172B4D',
                        padding: '4px 8px',
                    }
                }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <IconButton 
                    size="small" 
                    onClick={handleSave}
                    sx={{ 
                        backgroundColor: 'white', 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        '&:hover': { backgroundColor: '#f4f5f7' }
                    }}
                >
                    <FontAwesomeIcon icon={faCheck} size="xs" color="#36B37E" />
                </IconButton>
                <IconButton 
                    size="small" 
                    onClick={handleCancel}
                    sx={{ 
                        backgroundColor: 'white', 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        '&:hover': { backgroundColor: '#f4f5f7' }
                    }}
                >
                    <FontAwesomeIcon icon={faTimes} size="xs" color="#FF5630" />
                </IconButton>
            </Box>
        </Box>
    );
};

export default InlineEdit;
