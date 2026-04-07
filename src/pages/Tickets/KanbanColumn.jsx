import { Droppable } from '@hello-pangea/dnd';
import { Box, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faClipboardList, faSpinner, faEye, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import KanbanCard from './KanbanCard';

const getStatusIcon = (statusName) => {
    const name = statusName?.toLowerCase() || '';
    // if (name.includes('todo') || name.includes('to do')) return faClipboardList;
    // if (name.includes('progress')) return faSpinner;
    // if (name.includes('review')) return faEye;
    if (name.includes('done') || name.includes('complete')) return faCheck;
};

const KanbanColumn = ({ status, tickets, onUpdateTitle }) => {
    return (
        <Box
            sx={{
                flex: '0 0 300px', // Fixed width for each column
                minHeight: '400px',
                backgroundColor: '#F4F5F7',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                marginRight: '12px',
                '@media (max-width: 768px)': {
                    flex: '0 0 280px',
                    minWidth: '260px'
                }
            }}
        >
            <Box sx={{ p: 1, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                        variant="overline"
                        sx={{
                            fontWeight: 700,
                            color: '#5E6C84',
                            fontSize: '12px',
                            letterSpacing: '0.05em'
                        }}
                    >
                        {status.name}
                    </Typography>
                    <Box sx={{
                        backgroundColor: '#EBECF0',
                        borderRadius: '4px',
                        // p: 1,
                        p: 0.25,
                        minWidth: '20px',
                        textAlign: 'center'
                    }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#42526E' }}>
                            {tickets.length}
                        </Typography>
                    </Box>
                </Box>
                {/* Visual indicator / Icon for the status */}
                <Box sx={{ color: '#016630' }}>
                    <FontAwesomeIcon icon={getStatusIcon(status.name)} size="sm" />
                </Box>
            </Box>

            <Droppable droppableId={String(status.id)}>
                {(provided, snapshot) => (
                    <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{
                            flexGrow: 1,
                            minHeight: '20px',
                            transition: 'background-color 0.2s ease',
                            backgroundColor: snapshot.isDraggingOver ? '#EBECF0' : 'transparent',
                            borderRadius: '4px',
                            padding: '4px'
                        }}
                    >
                        {tickets.map((ticket, index) => (
                            <KanbanCard
                                key={ticket.id}
                                ticket={ticket}
                                index={index}
                                onUpdateTitle={onUpdateTitle}
                            />
                        ))}
                        {provided.placeholder}
                    </Box>
                )}
            </Droppable>
        </Box>
    );
};

export default KanbanColumn;
