import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Box, Typography, IconButton, Tooltip, Avatar, AvatarGroup } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faExclamationTriangle, faCalendarAlt, faCheckSquare, faEllipsisH, faTrash } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import InlineEdit from '../../components/common/InlineEdit';
import TicketFormModal from './TicketFormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { connect } from 'react-redux';
import { setAlert } from '../../redux/commonReducers/commonReducers';
import { deleteTicket } from '../../services/ticketService';

const KanbanCard = ({ ticket, index, onUpdateTitle, fetchTickets, setAlert }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTicketId, setEditingTicketId] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState({ open: false, ticket: null });

    const isOverdue = ticket.due_date && dayjs(ticket.due_date).isBefore(dayjs(), 'day') && ticket.status_name?.toLowerCase() !== 'done';

    const handleSaveTitle = (newTitle) => {
        onUpdateTitle(ticket.id, newTitle);
        setIsEditing(false);
    };

    const formatDate = (date) => {
        return dayjs(date).format('MMM D, YYYY');
    };

    const handleOpen = (ticketId) => {
        setEditingTicketId(ticketId);
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setEditingTicketId(null);
    };

    const openDeleteConfirm = (ticket) => {
        setDeleteConfirmOpen({ open: true, ticket });
    };

    const handleDelete = async () => {
        const id = deleteConfirmOpen.ticket?.id;
        if (!id) return;
        try {
            await deleteTicket(id);
            fetchTickets();
            setDeleteConfirmOpen({ open: false, ticket: null });
        } catch (err) {
            setAlert({ open: true, message: err.message || "Failed to delete ticket.", type: "error" });
        }
    };
    return (
        <>
            <Draggable draggableId={String(ticket.id)} index={index}>
                {(provided, snapshot) => (
                    <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onClick={() => handleOpen(ticket.id)}
                        sx={{
                            backgroundColor: snapshot.isDragging ? '#f4f5f7' : 'white',
                            borderRadius: '4px',
                            padding: '12px',
                            marginBottom: '8px',
                            boxShadow: snapshot.isDragging
                                ? '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)'
                                : '0 1px 2px rgba(9, 30, 66, 0.25)',
                            border: isOverdue ? '2px solid #FF5630' : '1px solid #dfe1e6',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            '&:hover': {
                                backgroundColor: '#f4f5f7',
                            },
                            cursor: "pointer"
                        }}
                    >
                        {isEditing ? (
                            <InlineEdit
                                initialValue={ticket.title}
                                onSave={handleSaveTitle}
                                onCancel={() => setIsEditing(false)}
                            />
                        ) : (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: 500,
                                            color: '#172B4D',
                                            fontSize: '14px',
                                            lineHeight: '20px',
                                            pr: 3
                                        }}
                                    >
                                        {ticket.title}
                                    </Typography>
                                    {isHovered && (
                                        <Box sx={{ position: 'absolute', right: 8, top: 12, display: 'flex', gap: 0.5 }}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsEditing(true);
                                                }}
                                                sx={{ padding: '4px', color: '#6B778C' }}
                                            >
                                                <FontAwesomeIcon icon={faEdit} size="xs" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDeleteConfirm(ticket);
                                                }}
                                                sx={{ padding: '4px', color: '#DE350B', }}
                                            >
                                                <FontAwesomeIcon icon={faTrash} size="xs" />
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>

                                {/* Tags / Extra info like Projects can go here if needed */}
                                {ticket.project_name && (
                                    <Box sx={{ mb: 1.5 }}>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#EBECF0] text-[#42526E] uppercase tracking-wider">
                                            {ticket.project_name}
                                        </span>
                                    </Box>
                                )}

                                {/* Bottom row: Ticket ID and Due Date */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <FontAwesomeIcon icon={faCheckSquare} size="xs" color="#4C9AFF" />
                                        <Typography variant="caption" sx={{ color: '#6B778C', fontWeight: 600 }}>
                                            {ticket.ticket_no}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {ticket.due_date && (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    backgroundColor: isOverdue ? '#FFEBE6' : 'transparent',
                                                    color: isOverdue ? '#BF2600' : '#6B778C',
                                                    border: isOverdue ? '1px solid #FF5630' : 'none'
                                                }}
                                            >
                                                {isOverdue && <FontAwesomeIcon icon={faExclamationTriangle} size="xs" />}
                                                <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '11px' }}>
                                                    {formatDate(ticket.due_date)}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Assignees */}
                                        {ticket.assignees?.length > 0 && (
                                            <AvatarGroup max={2} sx={{
                                                '& .MuiAvatar-root': {
                                                    width: 24,
                                                    height: 24,
                                                    fontSize: '10px',
                                                    border: '2px solid white'
                                                }
                                            }}>
                                                {ticket.assignees.map((user, idx) => (
                                                    <Tooltip key={idx} title={user.name}>
                                                        <Avatar
                                                            alt={user.name}
                                                            sx={{ bgcolor: '#00A3BF' }}
                                                        >
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                    </Tooltip>
                                                ))}
                                            </AvatarGroup>
                                        )}
                                        {(!ticket.assignees || ticket.assignees.length === 0) && (
                                            <Avatar sx={{ width: 24, height: 24, bgcolor: '#f4f5f7' }}>
                                                <Box sx={{ color: '#6B778C', fontSize: '12px' }}>
                                                    <FontAwesomeIcon icon={faCalendarAlt} size="xs" />
                                                </Box>
                                            </Avatar>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}
            </Draggable>
            <TicketFormModal
                open={openDialog}
                onClose={handleClose}
                onSuccess={() => {
                    fetchTickets();
                    handleClose();
                }}
                editingTicketId={editingTicketId}
            />
            <ConfirmDialog
                open={deleteConfirmOpen.open}
                onClose={() => setDeleteConfirmOpen({ open: false, ticket: null })}
                onConfirm={handleDelete}
                title="Delete Ticket"
                description={`Are you sure you want to delete "${deleteConfirmOpen.ticket?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
            />
        </>
    );
};
const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
    setAlert
};

export default connect(mapStateToProps, mapDispatchToProps)(KanbanCard);
