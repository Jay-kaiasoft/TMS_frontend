import React, { useState, useEffect, useCallback } from 'react';
import { Select, MenuItem, FormControl, InputLabel, Button, CircularProgress, Divider } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faSync } from '@fortawesome/free-solid-svg-icons';
import { getTicketComments } from '../../../services/ticketCommentService';
import CommentItem from './CommentItem';
import CommentEditor from './CommentEditor';
import { getUserDetails } from '../../../utils/getUserDetails';
import { connect } from 'react-redux';
import { setAlert, setLoading } from '../../../redux/commonReducers/commonReducers';
import { getAllowedCommentTypes } from '../../../services/commentService';

const CommentSection = ({ ticketId, setAlert, setLoading, loading, onCommentsCountChange }) => {
    const [comments, setComments] = useState([]);
    const [commentType, setCommentType] = useState(null); // Default: Open
    const currentUser = getUserDetails();
    const [commentTypes, setCommentTypes] = useState(getAllowedCommentTypes())

    const fetchComments = async () => {
        if (!ticketId) return;
        setLoading(true);
        try {
            const res = await getTicketComments(ticketId);
            setComments(res.result || []);
            if (onCommentsCountChange) {
                onCommentsCountChange(res.result?.length || 0);
            }
        } catch (err) {
            console.error("Failed to fetch comments", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setCommentType(currentUser.rolename === "Developer" ? 6 : currentUser.rolename === "Customer" ? 5 : 1)
        fetchComments();
    }, []);

    if (!ticketId) {
        return (
            <div className="bg-white border border-[#DFE1E6] rounded-xl p-12 text-center mt-8">
                <FontAwesomeIcon icon={faComments} className="text-[#8993A4] text-5xl mb-4" />
                <h3 className="text-[#172B4D] font-bold text-lg">Select a ticket to view comments</h3>
                <p className="text-[#5E6C84]">Discussions and updates related to the ticket will appear here.</p>
            </div>
        );
    }

    return (
        <div className="bg-white mt-4 overflow-hidden animate-fade-in-up">
            <div>
                {/* New Comment Creator */}
                {
                    <div className="space-y-2">
                        {comments?.map(comment => (
                            <CommentItem
                                key={comment.id}
                                comment={comment}
                                ticketId={ticketId}
                                currentUser={currentUser}
                                onCommentUpdated={fetchComments}
                            />
                        ))}
                    </div>
                }
                <div className="pt-4">
                    <div className="flex items-center gap-4 mb-4">
                        <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white' }}>
                            <InputLabel id="comment-type-label" shrink>Visibility</InputLabel>
                            <Select
                                labelId="comment-type-label"
                                value={commentType}
                                label="Visibility"
                                onChange={(e) => setCommentType(e.target.value)}
                            >
                                {commentTypes?.map(type => (
                                    <MenuItem key={type.id} value={type.id}>
                                        {type.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        {/* <span className="text-xs text-[#5E6C84]">Choose who can see this comment</span> */}
                    </div>

                    <CommentEditor
                        ticketId={ticketId}
                        initialVisibility={commentType}
                        onSuccess={fetchComments}
                        placeholder="Add a comment or share an update..."
                        submitText="Save"
                    />
                </div>
            </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(CommentSection);