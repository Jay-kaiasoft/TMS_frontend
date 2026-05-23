import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Draggable } from '@hello-pangea/dnd';
import { Box, Typography, IconButton, Tooltip, Avatar, AvatarGroup } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faExclamationTriangle, faCalendarAlt, faCheckSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import InlineEdit from '../../components/common/InlineEdit';
import TicketFormModal from './TicketFormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { connect } from 'react-redux';
import { setAlert } from '../../redux/commonReducers/commonReducers';
import { deleteTicket } from '../../services/ticketService';
import PermissionWrapper from '../../components/permissionWrapper/PermissionWrapper';
import { getUserDetails } from '../../utils/getUserDetails';

const KanbanCard = ({ ticket, index, onUpdateTitle, fetchTickets, setAlert }) => {
    const userData = getUserDetails();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTicketId, setEditingTicketId] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState({ open: false, ticket: null });

    // Safe due date validation
    const isValidDueDate = ticket.due_date && dayjs(ticket.due_date).isValid();
    const isOverdue = isValidDueDate && 
        dayjs(ticket.due_date).isBefore(dayjs(), 'day') && 
        ticket.status_name?.toLowerCase() !== 'done';

    const handleSaveTitle = (newTitle) => {
        onUpdateTitle(ticket.id, newTitle);
        setIsEditing(false);
    };

    const formatDate = (date) => {
        if (!date || !dayjs(date).isValid()) return '';
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
                        onClick={() => {
                            navigate(`/dashboard/manage-tickets/view/${ticket.id}`);
                        }}
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
                                            pr: 3,
                                            wordBreak: 'break-word',
                                            flex: 1
                                        }}
                                    >
                                        {ticket.title}
                                    </Typography>
                                    {(isHovered && ticket.created_by === userData.id) && (
                                        <Box 
                                            onClick={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            sx={{ position: 'absolute', right: 8, top: 12, display: 'flex', gap: 0.5 }}
                                        >
                                            <PermissionWrapper
                                                functionalityName="manage tickets"
                                                moduleName="Tickets"
                                                actionId={2}
                                                component={
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/dashboard/manage-tickets/view/${ticket.id}`);
                                                        }}
                                                        sx={{ padding: '4px', color: '#6B778C' }}
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} size="xs" />
                                                    </IconButton>
                                                }
                                            />
                                            <PermissionWrapper
                                                functionalityName="manage tickets"
                                                moduleName="Tickets"
                                                actionId={3}
                                                component={
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openDeleteConfirm(ticket);
                                                        }}
                                                        sx={{ padding: '4px', color: '#DE350B' }}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} size="xs" />
                                                    </IconButton>
                                                }
                                            />
                                        </Box>
                                    )}
                                </Box>

                                {/* Bottom row with ticket ID, due date, and assignees - now with flex wrap for better responsiveness */}
                                <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    mt: 1,
                                    flexWrap: 'wrap',
                                    gap: 1,
                                    rowGap: 1
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                                        <FontAwesomeIcon icon={faCheckSquare} size="xs" color="#4C9AFF" />
                                        <Typography variant="caption" sx={{ color: '#6B778C', fontWeight: 600 }}>
                                            {ticket.ticket_no}
                                        </Typography>
                                    </Box>

                                    {/* Due date and assignees container with wrapping support */}
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1,
                                        flexWrap: 'wrap',
                                        justifyContent: 'flex-end',
                                        flex: '1 1 auto',
                                        minWidth: 0
                                    }}>
                                        {/* Due date display with validation and proper styling */}
                                        {ticket.due_date && dayjs(ticket.due_date).isValid() && (
                                            <Box
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    backgroundColor: isOverdue ? '#FFEBE6' : 'transparent',
                                                    color: isOverdue ? '#BF2600' : '#6B778C',
                                                    border: isOverdue ? '1px solid #FF5630' : 'none',
                                                    whiteSpace: 'nowrap',
                                                    flexShrink: 0
                                                }}
                                            >
                                                {isOverdue && <FontAwesomeIcon icon={faExclamationTriangle} size="xs" />}
                                                <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '11px' }}>
                                                    {formatDate(ticket.due_date)}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Fallback when no due date exists (optional) */}
                                        {(!ticket.due_date || !dayjs(ticket.due_date).isValid()) && (
                                            <Box
                                                sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    backgroundColor: '#F4F5F7',
                                                    color: '#6B778C',
                                                    whiteSpace: 'nowrap',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faCalendarAlt} size="xs" />
                                                <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '11px' }}>
                                                    No due date
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Assignees */}
                                        {ticket.assignees?.length > 0 && (
                                            <AvatarGroup max={2} sx={{
                                                flexShrink: 0,
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
                description={`Are you sure you want to delete "${deleteConfirmOpen.ticket?.title}"? `}
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