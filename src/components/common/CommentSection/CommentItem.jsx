import React, { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Avatar, IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReply, faEllipsisV, faEdit, faTrash, faDownload, faEye, faPaperclip, faClock } from '@fortawesome/free-solid-svg-icons';
import PermissionWrapper from '../../permissionWrapper/PermissionWrapper';
import CommentEditor from './CommentEditor';
import { deleteTicketComment, updateTicketComment, deleteCommentAttachment } from '../../../services/ticketCommentService';
import ConfirmDialog from '../ConfirmDialog';
import { connect } from 'react-redux';
import { setAlert, setLoading } from '../../../redux/commonReducers/commonReducers';

dayjs.extend(relativeTime);

const CommentItem = ({ comment, ticketId, onCommentUpdated, currentUser, setLoading, setAlert, loading }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [currentAttachments, setCurrentAttachments] = useState(comment.attachments || []);

    const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleEdit = () => {
        setIsEditing(true);
        handleMenuClose();
    };

    const handleDelete = () => {
        setDeleteConfirmOpen(true);
        handleMenuClose();
    };

    const confirmDelete = async () => {
        try {
            await deleteTicketComment(comment.id);
            onCommentUpdated();
        } catch (err) {
            console.error("Failed to delete comment", err);
        }
        setDeleteConfirmOpen(false);
    };

    const handleUpdate = async (data) => {
        // Prepare payload with comment and comment_type_id
        const res = await updateTicketComment(comment.id, data);
        setIsEditing(false);
        onCommentUpdated();
        return res;
    };

    const handleDeleteAttachment = async (attId) => {
        try {
            await deleteCommentAttachment(comment.id, attId);
            setCurrentAttachments(prev => prev.filter(a => a.id !== attId));
            onCommentUpdated(); // Refresh parent to stay in sync
        } catch (err) {
            console.error("Failed to delete attachment", err);
        }
    };

    // handleReplySubmit removed as CommentEditor now handles it via ticketId/parentId props

    const getAbsoluteUrl = (url) => {
        return url.startsWith('http') ? url : `${import.meta.env.REACT_APP_MAIN_SITE_URL || ''}${url}`;
    };

    const handleDownload = (url, fileName) => {
        const a = document.createElement('a');
        a.href = getAbsoluteUrl(url);
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const formatDate = (dateString) => {
        return dayjs(dateString).fromNow();
    };

    return (
        <div className="flex gap-4 group animate-fade-in py-4 border-b border-[#F4F5F7] last:border-0">
            <Avatar
                sx={{ bgcolor: '#0052CC', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 600 }}
            >
                {comment.created_by_name?.split(' ').map(n => n[0]).join('')}
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-[#172B4D]">{comment.created_by_name}</span>
                        <span className="text-xs text-[#5E6C84] flex items-center gap-1">
                            {formatDate(comment.created_date_time)}
                        </span>
                        {comment.comment_type_id !== 1 && (
                            <span className="bg-[#E9F2FF] text-[#0052CC] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {comment.comment_type_name}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {!isEditing && (
                            <Tooltip title="Reply">
                                <IconButton size="small" onClick={() => setIsReplying(!isReplying)} sx={{ color: '#42526E' }}>
                                    <FontAwesomeIcon icon={faReply} style={{ fontSize: '14px' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        {comment.created_by === currentUser?.id && (
                            <>
                                <IconButton size="small" onClick={handleMenuClick} sx={{ color: '#42526E' }}>
                                    <FontAwesomeIcon icon={faEllipsisV} style={{ fontSize: '14px' }} />
                                </IconButton>
                                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                                    <MenuItem onClick={handleEdit} className="text-sm">
                                        <FontAwesomeIcon icon={faEdit} className="mr-3 text-[#0052CC] w-4" />
                                        Edit
                                    </MenuItem>
                                    <MenuItem onClick={handleDelete}>
                                        <FontAwesomeIcon icon={faTrash} className="mr-3 w-4 text-sm text-[#DE350B]" /> Delete
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <div className="mt-2">
                        <CommentEditor
                            initialValue={comment.comment}
                            initialVisibility={comment.comment_type_id}
                            existingAttachments={currentAttachments}
                            onDeleteAttachment={handleDeleteAttachment}
                            showVisibilitySelector={true}
                            onSubmit={handleUpdate}
                            onCancel={() => setIsEditing(false)}
                            submitText="Save"
                        />
                    </div>
                ) : (
                    <>
                        <div
                            className="text-[#172B4D] prose prose-sm max-w-none comment-content"
                            dangerouslySetInnerHTML={{ __html: comment.comment }}
                        />

                        {comment.attachments?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {comment.attachments?.map(att => (
                                    <div key={att.id} className="flex items-center gap-2 bg-[#FAFBFC] border border-[#DFE1E6] rounded px-3 py-1.5 text-xs hover:bg-[#F4F5F7] transition-colors group/att">
                                        <FontAwesomeIcon icon={faPaperclip} className="text-[#5E6C84]" />
                                        <span className="font-medium text-[#42526E] truncate max-w-37.5">{att.file_name}</span>
                                        <div className="flex gap-1 ml-2">
                                            <button onClick={() => handleDownload(att.file_url, att.file_name)} className="text-[#0052CC] cursor-pointer" title="Download">
                                                <FontAwesomeIcon icon={faDownload} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {isReplying && (
                    <div className="mt-4 pl-4 border-l-2 border-[#DFE1E6]">
                        <CommentEditor
                            ticketId={ticketId}
                            parentId={comment.id}
                            onSuccess={() => {
                                setIsReplying(false);
                                onCommentUpdated();
                            }}
                            onCancel={() => setIsReplying(false)}
                            placeholder={`Reply to ${comment.created_by_name}...`}
                            submitText="Reply"
                            showVisibilitySelector={true}
                        />
                    </div>
                )}

                {comment.replies?.length > 0 && (
                    <div className="mt-4 pl-8 space-y-2 border-l-2 border-[#F4F5F7]">
                        {comment.replies.map(reply => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                ticketId={ticketId}
                                onCommentUpdated={onCommentUpdated}
                                currentUser={currentUser}
                                setLoading={setLoading}
                                setAlert={setAlert}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Comment"
                description="Are you sure you want to delete this comment? This will also delete all replies and attachments."
                confirmText="Delete"
                isDestructive={true}
            />
        </div>
    );
};

const mapStateToProps = (state) => ({
    loading: state.common.loading
});

const mapDispatchToProps = {
    setAlert,
    setLoading
};

export default connect(mapStateToProps, mapDispatchToProps)(CommentItem);
