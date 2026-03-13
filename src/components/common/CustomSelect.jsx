import React from 'react';
import { Controller } from 'react-hook-form';
import { FormControl, Checkbox, Autocomplete, TextField } from '@mui/material';

const CustomSelect = ({
    name,
    control,
    label,
    options,
    multiple = false,
    withCheckbox = false,
    rules,
    ...props
}) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => {
                const autocompleteValue = multiple
                    ? options.filter((opt) => (value || []).includes(opt.value))
                    : options.find((opt) => opt.value === value) || null;

                return (
                    <FormControl fullWidth error={!!error} className="mb-4" {...props}>
                        <Autocomplete
                            size='small'
                            multiple={multiple}
                            options={options}
                            disableCloseOnSelect={multiple && withCheckbox}
                            getOptionLabel={(option) => option.label || ''}
                            isOptionEqualToValue={(option, val) => option.value === val.value}
                            value={autocompleteValue}
                            onChange={(_, newValue) => {
                                if (multiple) {
                                    onChange(newValue.map((val) => val.value));
                                } else {
                                    onChange(newValue ? newValue.value : '');
                                }
                            }}
                            renderOption={(props, option, { selected }) => (
                                <li {...props}>
                                    {multiple && withCheckbox && (
                                        <Checkbox
                                            style={{ marginRight: 8 }}
                                            checked={selected}
                                        />
                                    )}
                                    {option.label}
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    inputRef={ref}
                                    label={label}
                                    variant="outlined"
                                    size="small"
                                    error={!!error}
                                // helperText={error ? error.message : null}
                                />
                            )}
                        />
                    </FormControl>
                );
            }}
        />
    );
};

export default CustomSelect;
