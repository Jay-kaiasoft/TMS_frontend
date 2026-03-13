import React, { useState, useEffect, useCallback } from 'react';
import { Controller } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faTrash, faImage } from '@fortawesome/free-solid-svg-icons';

const LogoUpload = ({ name, control, label, existingUrl = null }) => {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value } }) => {
                const [preview, setPreview] = useState(null);

                useEffect(() => {
                    if (value && value instanceof File) {
                        const objectUrl = URL.createObjectURL(value);
                        setPreview(objectUrl);
                        return () => URL.revokeObjectURL(objectUrl);
                    } else if (value && typeof value === 'string') {
                        const fullUrl = value.startsWith('http')
                            ? value
                            : `${import.meta.env.VITE_APP_MAIN_SITE_URL || ''}${value}`;
                        setPreview(fullUrl);
                    } else if (existingUrl && !value && value !== null) {
                        const fullUrl = existingUrl.startsWith('http')
                            ? existingUrl
                            : `${import.meta.env.VITE_APP_MAIN_SITE_URL || ''}${existingUrl}`;
                        setPreview(fullUrl);
                    } else {
                        setPreview(null);
                    }
                }, [value, existingUrl]);

                const onDrop = useCallback((acceptedFiles) => {
                    if (acceptedFiles?.length > 0) {
                        onChange(acceptedFiles[0]);
                    }
                }, [onChange]);

                const { getRootProps, getInputProps, isDragActive } = useDropzone({
                    onDrop,
                    accept: { 'image/*': [] },
                    maxFiles: 1,
                    multiple: false,
                });

                const handleRemove = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onChange(null);
                    setPreview(null);
                };

                return (
                    <div>
                        {label && (
                            <label className="block text-sm font-medium text-[#42526E] mb-2">{label}</label>
                        )}

                        {preview ? (
                            <div className="relative group w-36 h-36 rounded-xl border-2 border-[#DFE1E6] overflow-hidden bg-[#FAFBFC]">
                                <img
                                    src={preview}
                                    alt="Logo preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={handleRemove}
                                        className="bg-white text-[#DE350B] hover:bg-[#FFEBE6] w-9 h-9 rounded-lg shadow-md flex items-center justify-center transition-colors cursor-pointer"
                                        title="Remove logo"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                {...getRootProps()}
                                className={`w-36 h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors
                                    ${isDragActive
                                        ? 'border-[#0052CC] bg-[#E9F2FF]'
                                        : 'border-[#DFE1E6] hover:border-[#8993A4] bg-[#FAFBFC]'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <FontAwesomeIcon
                                    icon={isDragActive ? faCloudUploadAlt : faImage}
                                    className={`text-2xl mb-2 ${isDragActive ? 'text-[#0052CC]' : 'text-[#8993A4]'}`}
                                />
                                <span className="text-xs text-[#5E6C84] text-center px-2">
                                    {isDragActive ? 'Drop here' : 'Upload Logo'}
                                </span>
                            </div>
                        )}
                    </div>
                );
            }}
        />
    );
};

export default LogoUpload;
