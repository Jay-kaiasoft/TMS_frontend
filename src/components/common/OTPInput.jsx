import React, { useRef } from 'react';
import { Controller } from 'react-hook-form';

const OTPInput = ({ name, control, length = 6, error }) => {
    const inputRefs = useRef([]);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value } }) => {
                const otpValue = value || '';

                const handleChange = (e, index) => {
                    const char = e.target.value.toUpperCase();

                    if (!/^[A-Z0-9]*$/.test(char)) return;

                    const newOtp = otpValue.split('');
                    // Only take the last character entered
                    newOtp[index] = char.slice(-1);
                    const combined = newOtp.join('');
                    onChange(combined);

                    // Auto-focus next input
                    if (char && index < length - 1) {
                        inputRefs.current[index + 1]?.focus();
                    }
                };

                const handleKeyDown = (e, index) => {
                    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
                        inputRefs.current[index - 1]?.focus();
                    }
                };

                const handlePaste = (e) => {
                    e.preventDefault();
                    const pasteData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, length);
                    if (pasteData) {
                        onChange(pasteData);
                        // Focus the next empty input or the last one
                        const nextIndex = Math.min(pasteData.length, length - 1);
                        inputRefs.current[nextIndex]?.focus();
                    }
                };

                return (
                    <div className="flex flex-col items-center">
                        <div className="flex gap-2 sm:gap-3 justify-center w-full" onPaste={handlePaste}>
                            {Array.from({ length }).map((_, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    maxLength={2} // Allow 2 so we can grab the newest char if they type without selecting
                                    value={otpValue[index] || ''}
                                    onChange={(e) => handleChange(e, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all outline-none 
                    ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50 focus:border-primary-500 focus:bg-white'}
                    ${otpValue[index] ? 'border-primary-400 bg-primary-50 text-primary-800' : 'text-gray-900'}
                  `}
                                />
                            ))}
                        </div>
                        {error && <p className="text-red-500 text-sm mt-3">{error.message}</p>}
                    </div>
                );
            }}
        />
    );
};

export default OTPInput;
