import { useState, useEffect } from 'react';
import { IconButton, Chip, Tooltip, tooltipClasses } from '@mui/material';
import { styled } from '@mui/material/styles';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faTicketAlt, faLink, faCheck, faThLarge, faList } from '@fortawesome/free-solid-svg-icons';
import { deleteTicket, filterTickets } from '../../services/ticketService';
import { Tabs } from '../../components/common/tabs';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionWrapper from '../../components/permissionWrapper/PermissionWrapper';
import CustomButton from '../../components/common/CustomButton';
import TicketFormModal from './TicketFormModal';
import KanbanBoard from './KanbanBoard';
import { useForm } from 'react-hook-form';
import { setAlert } from '../../redux/commonReducers/commonReducers';
import CustomSelect from '../../components/common/CustomSelect';

const formatDate = (iso) => {
    if (!iso) return "-";
    const dateStr = iso.split('T')[0];
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

const CustomTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: '#ffffff',
        color: '#172B4D',
        boxShadow: '0px 8px 24px rgba(9, 30, 66, 0.15), 0px 0px 1px rgba(9, 30, 66, 0.31)',
        borderRadius: '6px',
        padding: '12px 16px',
        maxWidth: '280px',
        fontSize: '0.875rem',
    },
    [`& .${tooltipClasses.arrow}`]: {
        color: '#ffffff',
        '&::before': {
            boxShadow: '1px 1px 1px rgba(9, 30, 66, 0.1)',
        },
    },
}));

const ManageTickets = ({ setAlert }) => {
    const [tickets, setTickets] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const { control, watch } = useForm({
        defaultValues: {
            filterType: 0 // 0 for Internal, 1 for Customer
        }
    });

    const filterType = watch('filterType');
    const [view, setView] = useState('kanban'); // 'table' or 'kanban'

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTicketId, setEditingTicketId] = useState(null);

    // Delete confirm dialogue state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState({ open: false, ticket: null });
    const [copiedTicketId, setCopiedTicketId] = useState(null);

    const fetchTickets = async () => {
        try {
            const filter = {
                as_customer: filterType === 0,
                for_customer: filterType === 1
            };
            const res = await filterTickets(filter);
            setTickets(res.result || []);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: "Failed to load tickets.", type: "error" });
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [filterType]);

    const handleOpen = (ticket = null) => {
        setEditingTicketId(ticket ? ticket.id : null);
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

        setActionLoading(true);
        try {
            await deleteTicket(id);
            setAlert({ open: true, message: "Ticket deleted successfully!", type: "success" });
            fetchTickets();
            setDeleteConfirmOpen({ open: false, ticket: null });
        } catch (err) {
            setAlert({ open: true, message: err.message || "Failed to delete ticket.", type: "error" });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCopyLink = (e, ticketId) => {
        e.stopPropagation();
        const siteUrl = import.meta.env.REACT_APP_MAIN_SITE_URL || window.location.origin;
        const link = `${siteUrl}/dashboard/manage-tickets`;

        navigator.clipboard.writeText(link).then(() => {
            setCopiedTicketId(ticketId);
            setTimeout(() => setCopiedTicketId(null), 2000);
        });
    };

    return (
        <div className="space-y-4 max-w-full mx-auto px-4">
            {/* View Toggle - Outside of primary toolbar */}
            <div className='border-b border-gray-300'>
                <Tabs
                    selectedTab={view === 'kanban' ? 0 : 1}
                    handleChange={(idx) => setView(idx === 0 ? 'kanban' : 'table')}
                    tabsData={[
                        { label: 'Board', icon: <FontAwesomeIcon icon={faThLarge} /> },
                        { label: 'List', icon: <FontAwesomeIcon icon={faList} /> }
                    ]}
                    fontSize="14px"
                />
            </div>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <CustomSelect
                        name="filterType"
                        control={control}
                        label="Filter By"
                        options={[
                            { label: 'Internal', value: 0 },
                            { label: 'Customer', value: 1 }
                        ]}
                        className="mb-0"
                        sx={{ minWidth: 250 }}
                    />
                </div>

                <div className="flex justify-end w-full sm:w-auto">
                    {/* 1 in functionalityName is Add actionId */}
                    <PermissionWrapper
                        functionalityName="manage tickets"
                        moduleName="Tickets List"
                        actionId={1}
                        component={
                            <CustomButton
                                startIcon={<FontAwesomeIcon icon={faPlus} />}
                                onClick={() => handleOpen()}
                            >
                                Add Ticket
                            </CustomButton>
                        }
                    />
                </div>
            </div>

            {/* Content Section */}
            {view === 'table' ? (
                <div className="bg-white border border-[#DFE1E6] rounded-xl shadow-sm overflow-hidden">
                    {tickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center mb-4 text-[#8993A4]">
                                <FontAwesomeIcon icon={faTicketAlt} size="2x" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#172B4D] mb-1">No tickets found</h3>
                            <p className="text-[#5E6C84] mb-4">Get started by creating your first ticket.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#DFE1E6]">
                                <thead className="bg-[#FAFBFC]">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                            Ticket ID
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                            Title
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                            Due Date
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-[#8993A4] uppercase tracking-wider w-24">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-[#DFE1E6]">
                                    {tickets.map((ticket) => (
                                        <tr
                                            key={ticket.id}
                                            className="hover:bg-[#FAFBFC] transition-colors group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 group/id">
                                                    {ticket?.assignees?.length > 0 ? (
                                                        <CustomTooltip
                                                            placement="bottom-start"
                                                            title={
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2">
                                                                        Assigned To
                                                                    </span>
                                                                    <ul className="m-0 pl-4 list-disc space-y-1">
                                                                        {ticket.assignees.map((user, index) => (
                                                                            <li key={index} className="text-[#172B4D] font-medium text-xs leading-relaxed">
                                                                                {user.name}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            }
                                                        >
                                                            <div className="text-sm font-semibold text-[#172B4D] hover:text-[#0052CC] transition-colors inline-block font-sans">
                                                                {ticket.ticket_no}
                                                            </div>
                                                        </CustomTooltip>
                                                    ) : (
                                                        <div className="text-sm font-semibold text-[#172B4D] font-sans">
                                                            {ticket.ticket_no}
                                                        </div>
                                                    )}

                                                    <Tooltip title={copiedTicketId === ticket.id ? "Copied!" : "Copy link"} arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => handleCopyLink(e, ticket.id)}
                                                            className={`opacity-0 group-hover/id:opacity-100 transition-opacity duration-200 ${copiedTicketId === ticket.id ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={copiedTicketId === ticket.id ? faCheck : faLink}
                                                                size="xs"
                                                            />
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-[#172B4D] font-sans">
                                                    {ticket.title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {ticket.status_name ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E9F2FF] text-[#0052CC]">
                                                        {ticket.status_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-[#8993A4]">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {ticket.due_date ? (
                                                    <div className="text-sm text-[#172B4D]">{formatDate(ticket.due_date)}</div>
                                                ) : (
                                                    <span className="text-xs text-[#8993A4]">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div>
                                                    <PermissionWrapper
                                                        functionalityName="manage tickets"
                                                        moduleName="Tickets List"
                                                        actionId={2}
                                                        component={
                                                            <IconButton onClick={(e) => { e.stopPropagation(); handleOpen(ticket); }} size="small" sx={{ color: '#4C9AFF', '&:hover': { backgroundColor: '#E9F2FF' } }}>
                                                                <FontAwesomeIcon icon={faEdit} size="sm" />
                                                            </IconButton>
                                                        }
                                                    />
                                                    <PermissionWrapper
                                                        functionalityName="manage tickets"
                                                        moduleName="Tickets List"
                                                        actionId={3}
                                                        component={
                                                            <IconButton onClick={(e) => { e.stopPropagation(); openDeleteConfirm(ticket); }} size="small" sx={{ color: '#DE350B', ml: 1, '&:hover': { backgroundColor: '#FFEBE6' } }}>
                                                                <FontAwesomeIcon icon={faTrash} size="sm" />
                                                            </IconButton>
                                                        }
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <KanbanBoard
                    tickets={tickets}
                    fetchTickets={fetchTickets}
                    onAddTicket={handleOpen}
                />
            )}

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
        </div>
    );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
    setAlert
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageTickets);