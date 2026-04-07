import { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Box, Typography, Button } from '@mui/material';
import { connect } from 'react-redux';
import { getAllStatuses } from '../../services/statusService';
import { updateTicket, updateTicketStatus, updateTicketTitle } from '../../services/ticketService';
import { setAlert } from '../../redux/commonReducers/commonReducers';
import KanbanColumn from './KanbanColumn';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const KanbanBoard = ({ tickets, fetchTickets, setAlert, onAddTicket }) => {
    const [statuses, setStatuses] = useState([]);
    const [boardData, setBoardData] = useState({});

    useEffect(() => {
        const loadStatuses = async () => {
            try {
                const res = await getAllStatuses();
                // Assumes res.result is an array of statuses
                setStatuses(res.result?.reverse() || []);
            } catch (err) {
                setAlert({ open: true, message: "Failed to load statuses", type: "error" });
            }
        };
        loadStatuses();
    }, [setAlert]);

    useEffect(() => {
        if (statuses.length > 0) {
            const grouped = {};
            statuses.forEach(status => {
                grouped[status.id] = tickets.filter(t => t.status_id === status.id);
            });
            setBoardData(grouped);
        }
    }, [tickets, statuses]);

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const sourceStatusId = source.droppableId;
        const destinationStatusId = destination.droppableId;
        const ticketId = draggableId;

        // Optimistic UI update
        const newBoardData = { ...boardData };
        const sourceColumn = [...newBoardData[sourceStatusId]];
        const [movedTicket] = sourceColumn.splice(source.index, 1);

        const destinationColumn = [...newBoardData[destinationStatusId]];
        destinationColumn.splice(destination.index, 0, { ...movedTicket, status_id: parseInt(destinationStatusId) });

        newBoardData[sourceStatusId] = sourceColumn;
        newBoardData[destinationStatusId] = destinationColumn;

        setBoardData(newBoardData);

        // API Call
        try {
            const res = await updateTicketStatus(ticketId, parseInt(destinationStatusId));
            if (res.status !== 200) {
                throw new Error(res.message || "Failed to update status");
            }
            fetchTickets(); // Refresh to ensure sync
        } catch (err) {
            setAlert({ open: true, message: err.message, type: "error" });
            fetchTickets(); // Rollback UI by re-fetching
        }
    };

    const handleUpdateTitle = async (ticketId, newTitle) => {
        try {
            const res = await updateTicketTitle(ticketId, newTitle);
            if (res.status === 200) {
                fetchTickets();
            } else {
                setAlert({ open: true, message: res.message || "Failed to update title", type: "error" });
            }
        } catch (err) {
            setAlert({ open: true, message: "Error updating title", type: "error" });
        }
    };

    return (
        <Box
            sx={{
                overflowX: 'auto',
                paddingBottom: '20px',
                minHeight: 'calc(100vh - 250px)',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <DragDropContext onDragEnd={onDragEnd}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: '4px'
                    }}
                >
                    {statuses?.map(status => (
                        <KanbanColumn
                            key={status.id}
                            status={status}
                            tickets={boardData[status.id] || []}
                            onUpdateTitle={handleUpdateTitle}
                        />
                    ))}

                    {/* Add Column button placeholder if needed or just padding */}
                    <Box
                        sx={{
                            flex: '0 0 280px',
                            padding: '12px',
                            cursor: 'pointer',
                            color: '#5E6C84',
                            '&:hover': { color: '#172B4D', backgroundColor: 'rgba(9, 30, 66, 0.08)', borderRadius: '8px' }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FontAwesomeIcon icon={faPlus} size="sm" />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>Add Column</Typography>
                        </Box>
                    </Box>
                </Box>
            </DragDropContext>
        </Box>
    );
};

const mapDispatchToProps = {
    setAlert
};

export default connect(null, mapDispatchToProps)(KanbanBoard);