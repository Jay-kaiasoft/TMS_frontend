import React, { useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { useDropzone } from 'react-dropzone';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faFile, faTrash, faDownload, faSpinner, faEye } from '@fortawesome/free-solid-svg-icons';
import { IconButton, LinearProgress, Dialog, DialogContent } from '@mui/material';
import ConfirmDialog from './ConfirmDialog';
import { setAlert } from '../../redux/commonReducers/commonReducers';
import { connect } from 'react-redux';

// Constant for chunk size: 5MB
const CHUNK_SIZE = 5 * 1024 * 1024;

const DragDropAttachmentUpload = forwardRef(({
    onUploadSuccess,
    uploadApiFunction,
    existingAttachments = [],
    onDeleteExisting,
    setAlert
}, ref) => {
    const [pendingFiles, setPendingFiles] = useState([]);
    const [uploadingFiles, setUploadingFiles] = useState([]);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState({ open: false, attId: null, fileName: '' });

    const onDrop = useCallback((acceptedFiles) => {
        const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
        const validFiles = [];
        for (let file of acceptedFiles) {
            if (file.size > MAX_SIZE) {
                setAlert({
                    open: true,
                    message: `File "${file.name}" exceeds the 100MB limit.`,
                    type: 'warning'
                })
            } else {
                validFiles.push(file);
            }
        }

        const newPending = validFiles.map(file => ({
            id: `${file.name}-${Date.now()}`,
            file: file,
            progress: 0,
            status: 'pending'
        }));
        setPendingFiles(prev => [...prev, ...newPending]);
    }, []);

    const removePendingFile = (id) => {
        setPendingFiles(prev => prev.filter(f => f.id !== id));
    };

    useImperativeHandle(ref, () => ({
        uploadPendingFiles: async (entityId) => {
            console.log("pendingFiles", pendingFiles)
            if (pendingFiles.length === 0) return;

            // Move pending to uploading
            setUploadingFiles(prev => [...prev, ...pendingFiles]);
            const filesToUpload = [...pendingFiles];
            setPendingFiles([]); // clear pending

            for (let fileObj of filesToUpload) {
                const { file, id: fileId } = fileObj;
                setUploadingFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'uploading' } : f));
                try {
                    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
                    let currentChunk = 0;
                    let finalResponse = null;
                    console.log("fileObj", fileObj)
                    while (currentChunk < totalChunks) {
                        const start = currentChunk * CHUNK_SIZE;
                        const end = Math.min(start + CHUNK_SIZE, file.size);
                        const chunk = file.slice(start, end);

                        const formData = new FormData();
                        formData.append('file', chunk, file.name);
                        formData.append('chunkIndex', currentChunk);
                        formData.append('totalChunks', totalChunks);
                        formData.append('fileName', file.name);
                        formData.append('totalSize', file.size);

                        // Upload chunk
                        finalResponse = await uploadApiFunction(entityId, formData);

                        currentChunk++;
                        // Update progress
                        setUploadingFiles(prev => prev.map(f =>
                            f.id === fileId
                                ? { ...f, progress: Math.round((currentChunk / totalChunks) * 100) }
                                : f
                        ));
                    }

                    // Completed
                    setUploadingFiles(prev => prev.map(f =>
                        f.id === fileId ? { ...f, status: 'completed' } : f
                    ));

                    if (onUploadSuccess && finalResponse) {
                        onUploadSuccess(finalResponse);
                    }
                } catch (error) {
                    console.error("Upload failed for file", file.name, error);
                    setUploadingFiles(prev => prev.map(f =>
                        f.id === fileId ? { ...f, status: 'error' } : f
                    ));
                }
            }

            // Clean up completed uploading files visually after 3 seconds
            setTimeout(() => {
                setUploadingFiles(prev => prev.filter(f => f.status !== 'completed'));
            }, 3000);
        }
    }));

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    // Handle downloading
    const getAbsoluteUrl = (url) => {
        return url.startsWith('http') ? url : `${import.meta.env.VITE_APP_MAIN_SITE_URL || ''}${url}`;
    };

    const handleDownload = (e, url, fileName) => {
        e.preventDefault();
        e.stopPropagation();
        const fullURL = getAbsoluteUrl(url);
        const a = document.createElement('a');
        a.href = fullURL;
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDeleteClick = (e, attId, fileName) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteConfirmOpen({ open: true, attId, fileName });
    };

    const confirmDelete = async () => {
        if (onDeleteExisting && deleteConfirmOpen.attId) {
            await onDeleteExisting(deleteConfirmOpen.attId);
        }
        setDeleteConfirmOpen({ open: false, attId: null, fileName: '' });
    };

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    const handlePreviewClick = (e, url) => {
        e.preventDefault();
        e.stopPropagation();
        setPreviewImage(getAbsoluteUrl(url));
        setPreviewOpen(true);
    };

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[#0052CC] bg-[#E9F2FF]' : 'border-[#DFE1E6] hover:border-[#8993A4] bg-[#FAFBFC]'
                    }`}
            >
                <input {...getInputProps()} />
                <FontAwesomeIcon icon={faCloudUploadAlt} className="text-[#8993A4] text-4xl mb-4" />
                <p className="text-[#172B4D] font-medium mb-1">
                    {isDragActive ? "Drop the files here..." : "Drag & drop files here, or click to select files"}
                </p>
                <p className="text-[#5E6C84] text-sm">Supports up to 100MB per file.</p>
            </div>

            {/* List of pending files */}
            {pendingFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-semibold text-[#172B4D]">Pending Uploads (Will save with ticket)</h4>
                    {pendingFiles.map(fileObj => (
                        <div key={fileObj.id} className="bg-white border border-[#DFE1E6] p-2 rounded-lg flex justify-between items-center text-sm shadow-sm hover:border-[#8993A4] transition-colors">
                            <span className="font-medium text-[#172B4D] truncate mr-4 flex-1 flex items-center">
                                <FontAwesomeIcon icon={faFile} className="mr-2 text-[#8993A4]" />
                                <span className="truncate">{fileObj.file.name}</span>
                            </span>
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); removePendingFile(fileObj.id); }}
                                className="text-[#DE350B] hover:bg-[#FFEBE6] p-1.5 rounded-md transition-colors"
                                title="Remove"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* List of currently uploading files */}
            {uploadingFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                    <h4 className="text-sm font-semibold text-[#172B4D]">Uploading...</h4>
                    {uploadingFiles.map(fileObj => (
                        <div key={fileObj.id} className="bg-white border border-[#DFE1E6] p-3 rounded-lg flex flex-col gap-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-[#172B4D] truncate mr-4">
                                    <FontAwesomeIcon icon={faFile} className="mr-2 text-[#8993A4]" />
                                    {fileObj.file.name}
                                </span>
                                {fileObj.status === 'uploading' && <FontAwesomeIcon icon={faSpinner} spin className="text-[#0052CC]" />}
                                {fileObj.status === 'completed' && <span className="text-green-600 text-xs">Completed</span>}
                                {fileObj.status === 'error' && <span className="text-red-600 text-xs">Failed</span>}
                            </div>
                            <LinearProgress variant="determinate" value={fileObj.progress} sx={{ height: 6, borderRadius: 3 }} />
                        </div>
                    ))}
                </div>
            )}

            {/* Grid of existing attachments */}
            {existingAttachments.length > 0 && (
                <div className="mt-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {existingAttachments.map(att => (
                            <div key={att.id} className="relative bg-white border border-[#DFE1E6] rounded-md overflow-hidden group shadow-sm flex flex-col">
                                {/* Image Preview / Placeholder */}
                                <div className="h-32 bg-[#F4F5F7] flex items-center justify-center relative border-b border-[#DFE1E6]">
                                    {att.file_URL && att.file_URL.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                        <img src={getAbsoluteUrl(att.file_URL)} alt={att.file_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <FontAwesomeIcon icon={faFile} className="text-[#8993A4] text-4xl" />
                                    )}

                                    {/* Overlay Action Buttons */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {att.file_URL && att.file_URL.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) && (
                                            <button
                                                onClick={(e) => handlePreviewClick(e, att.file_URL)}
                                                className="bg-white text-[#172B4D] hover:text-[#0052CC] w-8 h-8 rounded shadow flex items-center justify-center cursor-pointer"
                                                title="Preview"
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleDownload(e, att.file_URL, att.file_name)}
                                            className="bg-white text-[#172B4D] hover:text-[#0052CC] w-8 h-8 rounded shadow flex items-center justify-center cursor-pointer"
                                            title="Download"
                                        >
                                            <FontAwesomeIcon icon={faDownload} />
                                        </button>
                                        {onDeleteExisting && (
                                            <button
                                                onClick={(e) => handleDeleteClick(e, att.id, att.file_name)}
                                                className="bg-white text-[#DE350B] hover:text-[#BF2600] w-8 h-8 rounded shadow flex items-center justify-center cursor-pointer"
                                                title="Delete"
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* File Info */}
                                <div className="p-3 bg-white">
                                    <p className="font-semibold text-[#172B4D] text-sm truncate" title={att.file_name}>
                                        {att.file_name}
                                    </p>
                                    <p className="text-xs text-[#5E6C84] mt-1">
                                        {att.created_date ? new Date(att.created_date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Uploaded just now'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteConfirmOpen.open}
                onClose={() => setDeleteConfirmOpen({ open: false, attId: null, fileName: '' })}
                onConfirm={confirmDelete}
                title="Delete Attachment"
                description={`Are you sure you want to delete "${deleteConfirmOpen.fileName}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
            />

            {/* Image Preview Modal */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
                <DialogContent className="p-0 flex items-center justify-center bg-black overflow-hidden relative" style={{ minHeight: '300px' }}>
                    {previewImage && (
                        <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain" />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
});

export default DragDropAttachmentUpload;