import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Controller } from 'react-hook-form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faTimes } from '@fortawesome/free-solid-svg-icons';

const FileInput = ({ name, control, label, rules, accept = { 'image/*': [] }, maxFiles = 1 }) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field: { onChange, value }, fieldState: { error } }) => {
                const [preview, setPreview] = useState(null);

                useEffect(() => {
                    if (value && value instanceof File) {
                        const objectUrl = URL.createObjectURL(value);
                        setPreview(objectUrl);
                        return () => URL.revokeObjectURL(objectUrl);
                    } else if (value && typeof value === 'string') {
                        setPreview(value);
                    } else {
                        setPreview(null);
                    }
                }, [value]);

                const onDrop = useCallback((acceptedFiles) => {
                    if (acceptedFiles?.length > 0) {
                        onChange(maxFiles === 1 ? acceptedFiles[0] : acceptedFiles);
                    }
                }, [onChange, maxFiles]);

                const { getRootProps, getInputProps, isDragActive } = useDropzone({
                    onDrop,
                    accept,
                    maxFiles
                });

                const handleRemove = (e) => {
                    e.stopPropagation();
                    onChange(null);
                    setPreview(null);
                };

                return (
                    <div className="mb-4">
                        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[150px]
                ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 bg-gray-50'}`}
                        >
                            <input {...getInputProps()} />

                            {preview ? (
                                <div className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                    <img src={preview} alt="Preview" className="h-32 object-contain" />
                                    <button
                                        type="button"
                                        onClick={handleRemove}
                                        className="absolute top-1 right-1 bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 rounded-full p-1.5 transition opacity-0 group-hover:opacity-100 flex items-center justify-center transform hover:scale-105"
                                    >
                                        <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faCloudUploadAlt} className={`text-4xl mb-3 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} />
                                    {isDragActive ? (
                                        <p className="text-primary-600 font-medium">Drop the files here ...</p>
                                    ) : (
                                        <div>
                                            <p className="text-gray-600">Drag & drop an image here, or <span className="text-primary-600 font-medium">browse</span></p>
                                            <p className="text-xs text-gray-400 mt-2">Supports PNG, JPG, JPEG (Max. 5MB)</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
                    </div>
                );
            }}
        />
    );
};

export default FileInput;
