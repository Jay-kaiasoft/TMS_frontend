import React, { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import RichTextEditor from '../RichTextEditor';
import DragDropAttachmentUpload from '../DragDropAttachmentUpload';
import { Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { setAlert, setLoading } from '../../../redux/commonReducers/commonReducers';
import { connect } from 'react-redux';
import { addTicketComment, uploadCommentAttachment } from '../../../services/ticketCommentService';
import CustomButton from '../CustomButton';
import { getAllowedCommentTypes } from '../../../services/commentService';

const CommentEditor = ({
    onSubmit,
    initialValue = '',
    initialVisibility = 1,
    existingAttachments = [],
    onDeleteAttachment,
    showVisibilitySelector = false,
    cancelText = 'Cancel',
    submitText = 'Save',
    onCancel,
    placeholder = 'Add a comment...',
    isSubmitting = false,
    loading,
    setAlert,
    setLoading,
    ticketId,
    parentId,
    onSuccess
}) => {
    const [commentTypes, setCommentTypes] = useState(getAllowedCommentTypes())
    const { control, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            comment: initialValue,
            comment_type_id: initialVisibility
        }
    });

    const commentType = watch('comment_type_id');

    const attachmentRef = useRef(null);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);

    const handleFormSubmit = async (data) => {
        if (!data.comment && (!attachmentRef.current || attachmentRef.current.getPendingCount() === 0)) {
            return;
        }

        try {
            setLoading(true);
            let commentRes;

            if (onSubmit) {
                // Use parent provided onSubmit (could be for editing or custom logic)
                commentRes = await onSubmit(data);
            } else if (ticketId) {
                // Handle creation directly
                const payload = {
                    ticket_id: ticketId,
                    comment: data.comment,
                    comment_type_id: data.comment_type_id,
                    parent_comment_id: parentId || null
                };
                const res = await addTicketComment(payload);
                commentRes = res.result;
            }

            if (commentRes && commentRes.id) {
                // Now upload pending files if any
                setIsUploadingFiles(true);
                if (attachmentRef.current) {
                    await attachmentRef.current.uploadPendingFiles(commentRes.id);
                }
                setIsUploadingFiles(false);
                reset();
                if (onSuccess) onSuccess(commentRes);
            } else {
                setAlert({
                    open: true,
                    type: 'error',
                    message: 'Failed to submit comment'
                });
            }
        } catch (err) {
            console.error("Failed to submit comment", err);
            setAlert({
                open: true,
                type: 'error',
                message: err.response?.data?.message || 'Failed to submit comment'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setValue('comment_type_id', initialValue);
    }, [initialVisibility, setValue]);

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-3 w-full animate-fade-in">
            <div className="bg-white overflow-hidden transition-all">
                {showVisibilitySelector && (
                    <div className="py-3">
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel id="edit-comment-type-label" sx={{ fontSize: '0.8rem' }}>Visibility</InputLabel>
                            <Select
                                labelId="edit-comment-type-label"
                                value={commentType}
                                label="Visibility"
                                onChange={(e) => setValue('comment_type_id', e.target.value)}
                                sx={{ height: 32, fontSize: '0.8rem' }}
                            >
                                {commentTypes?.map(type => (
                                    <MenuItem key={type.id} value={type.id} sx={{ fontSize: '0.8rem' }}>
                                        {type.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                )}
                <RichTextEditor
                    name="comment"
                    control={control}
                    placeholder={placeholder}
                    minimal={false}
                    className="mb-0"
                />

                <div className="py-4 bg-[#FAFBFC]">
                    <DragDropAttachmentUpload
                        ref={attachmentRef}
                        uploadApiFunction={uploadCommentAttachment}
                        existingAttachments={existingAttachments}
                        onDeleteExisting={onDeleteAttachment}
                        setAlert={() => { }} // Pass actual alert setter if needed
                        compact={true}
                    />
                </div>
            </div>

            <div className="flex gap-3 items-center">
                <CustomButton
                    loading={isUploadingFiles || loading}
                    onClick={onSubmit}
                    disabled={!watch("comment") || isUploadingFiles || loading}
                    type="submit"
                >
                    {submitText}
                </CustomButton>
                {onCancel && (
                    <Button
                        onClick={onCancel}
                        sx={{
                            color: '#42526E',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#EBECF0' }
                        }}
                    >
                        {cancelText}
                    </Button>
                )}
            </div>
        </form>
    );
};

const mapStateToProps = (state) => ({
    loading: state.common.loading
});

const mapDispatchToProps = {
    setAlert,
    setLoading
};

export default connect(mapStateToProps, mapDispatchToProps)(CommentEditor);