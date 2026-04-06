import React from 'react';
import { Controller } from 'react-hook-form';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const DatePickerComponent = ({
    control,
    name,
    label,
    required = false,
    minDate = null,
    maxDate = null,
    setValue, // provided but might not be needed for basic use-case
    requiredFiledLabel = false
}) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={{ required: required ? `${label} is required` : false }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        label={label}
                        value={value}
                        onChange={onChange}
                        format="DD/MM/YYYY"
                        minDate={minDate ? dayjs(minDate) : null}
                        maxDate={maxDate ? dayjs(maxDate) : null}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                error: !!error,
                                helperText: error ? error.message : null,
                                size: "small",
                                sx: { backgroundColor: 'white' },
                                InputLabelProps: { shrink: true }
                            }
                        }}
                    />
                </LocalizationProvider>
            )}
        />
    );
};

export default DatePickerComponent;
