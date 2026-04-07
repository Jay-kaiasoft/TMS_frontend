import React, { useState, useEffect } from 'react';
import { CircularProgress, IconButton } from '@mui/material';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faTasks } from '@fortawesome/free-solid-svg-icons';
import { getAllStatuses, deleteStatus } from '../../services/statusService';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionWrapper from '../../components/permissionWrapper/PermissionWrapper';
import CustomButton from '../../components/common/CustomButton';
import StatusFormDialog from './StatusFormDialog';
import { setAlert } from '../../redux/commonReducers/commonReducers';

const ManageStatus = ({ setAlert }) => {
    const [statuses, setStatuses] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [editingStatusId, setEditingStatusId] = useState(null);

    // Delete confirm dialogue state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState({ open: false, statusItem: null });

    const fetchStatuses = async () => {
        try {
            const res = await getAllStatuses();
            setStatuses(res.result || []);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: "Failed to load statuses.", type: "error" });
        }
    };

    useEffect(() => {
        fetchStatuses();
    }, []);

    const handleOpen = (statusItem = null) => {
        setEditingStatusId(statusItem ? statusItem.id : null);
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setEditingStatusId(null);
    };

    const openDeleteConfirm = (statusItem) => {
        setDeleteConfirmOpen({ open: true, statusItem });
    };

    const handleDelete = async () => {
        const id = deleteConfirmOpen.statusItem?.id;
        if (!id) return;

        setActionLoading(true);
        try {
            await deleteStatus(id);
            fetchStatuses();
            setDeleteConfirmOpen({ open: false, statusItem: null });
            setAlert({ open: true, message: "Status deleted successfully.", type: "success" });
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: err.message || "Failed to delete status.", type: "error" });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            {/* Toolbar */}
            <div className="flex justify-end">
                <PermissionWrapper
                    functionalityName="manage status"
                    moduleName="Status List"
                    actionId={1}
                    component={
                        <CustomButton
                            startIcon={<FontAwesomeIcon icon={faPlus} />}
                            onClick={() => handleOpen()}
                        >
                            Add Status
                        </CustomButton>
                    }
                />
            </div>

            {/* Content Section */}
            <div className="bg-white border border-[#DFE1E6] rounded-xl shadow-sm overflow-hidden">
                {statuses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center mb-4 text-[#8993A4]">
                            <FontAwesomeIcon icon={faTasks} size="2x" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#172B4D] mb-1">No statuses found</h3>
                        <p className="text-[#5E6C84] mb-4">Get started by creating your first status.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#DFE1E6]">
                            <thead className="bg-[#FAFBFC]">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                        Status Name
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-[#8993A4] uppercase tracking-wider w-24">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#DFE1E6]">
                                {statuses.map((statusItem) => (
                                    <tr key={statusItem.id} className="hover:bg-[#FAFBFC] transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-[#172B4D]">
                                                {statusItem.name}
                                                {/* <Chip label={} sx={{ fontWeight: 600, backgroundColor: '#E9F2FF', color: '#0052CC' }} /> */}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div>
                                                <PermissionWrapper
                                                    functionalityName="manage status"
                                                    moduleName="Status List"
                                                    actionId={2}
                                                    component={
                                                        <IconButton onClick={() => handleOpen(statusItem)} size="small" sx={{ color: '#4C9AFF', '&:hover': { backgroundColor: '#E9F2FF' } }}>
                                                            <FontAwesomeIcon icon={faEdit} size="sm" />
                                                        </IconButton>
                                                    }
                                                />
                                                <PermissionWrapper
                                                    functionalityName="manage status"
                                                    moduleName="Status List"
                                                    actionId={3}
                                                    component={
                                                        <IconButton onClick={() => openDeleteConfirm(statusItem)} size="small" sx={{ color: '#DE350B', ml: 1, '&:hover': { backgroundColor: '#FFEBE6' } }}>
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

            <StatusFormDialog
                open={openDialog}
                onClose={handleClose}
                onSuccess={() => {
                    fetchStatuses();
                    handleClose();
                }}
                editingStatusId={editingStatusId}
            />

            <ConfirmDialog
                open={deleteConfirmOpen.open}
                onClose={() => setDeleteConfirmOpen({ open: false, statusItem: null })}
                onConfirm={handleDelete}
                title="Delete Status"
                description={`Are you sure you want to delete the status "${deleteConfirmOpen.statusItem?.name}"? This action cannot be undone.`}
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

export default connect(mapStateToProps, mapDispatchToProps)(ManageStatus);
