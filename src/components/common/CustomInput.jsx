import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const CustomInput = ({ name, control, label, type = 'text', rules, onChange: customOnChange, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field, fieldState: { error } }) => (
                <TextField
                    size='small'
                    {...field}
                    onChange={(e) => {
                        if (customOnChange) {
                            customOnChange(e, field.onChange);
                        } else {
                            field.onChange(e);
                        }
                    }}
                    {...props}
                    label={label}
                    type={inputType}
                    error={!!error}
                    // helperText={error ? error.message : null}
                    fullWidth
                    variant="outlined"
                    className='my-3'
                    InputProps={{
                        ...props.InputProps, // Maintain any passed InputProps
                        endAdornment: type === 'password' ? (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleClickShowPassword}
                                    edge="end"
                                >
                                    <FontAwesomeIcon icon={!showPassword ? faEyeSlash : faEye} className="text-gray-500 text-sm" />
                                </IconButton>
                            </InputAdornment>
                        ) : props.InputProps?.endAdornment,
                    }}
                />
            )}
        />
    );
};

export default CustomInput;
