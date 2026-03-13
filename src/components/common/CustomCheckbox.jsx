import React from 'react';
import { Controller } from 'react-hook-form';
import { Checkbox, FormControlLabel, FormHelperText, FormControl } from '@mui/material';

const CustomCheckbox = ({ name, control, label, rules, ...props }) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field: { value, onChange, ...field }, fieldState: { error } }) => (
                <FormControl error={!!error} className="mb-4">
                    <FormControlLabel
                        control={
                            <Checkbox
                                {...field}
                                {...props}
                                checked={!!value}
                                onChange={(e) => onChange(e.target.checked)}
                                color="primary"
                            />
                        }
                        label={label}
                    />
                    {/* {error && <FormHelperText>{error.message}</FormHelperText>} */}
                </FormControl>
            )}
        />
    );
};

export default CustomCheckbox;
