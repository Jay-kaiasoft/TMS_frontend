import React, { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { getAllRoles, deleteRole } from '../../services/roleService';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionWrapper from '../../components/permissionWrapper/PermissionWrapper';
import CustomButton from '../../components/common/CustomButton';
import { setAlert } from '../../redux/commonReducers/commonReducers';

const ManageRoles = ({ setAlert }) => {
    const [roles, setRoles] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState({ open: false, role: null });
    const navigate = useNavigate();

    const fetchRoles = async () => {
        try {
            const res = await getAllRoles();
            setRoles(res.result || []);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: "Failed to load roles.", type: "error" });
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleDelete = async () => {
        const id = deleteConfirmOpen.role?.id;
        if (!id) return;

        setActionLoading(true);
        try {
            await deleteRole(id);
            fetchRoles();
            setDeleteConfirmOpen({ open: false, role: null });
            setAlert({ open: true, message: "Role deleted successfully.", type: "success" });
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: err.message || "Failed to delete role.", type: "error" });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            {/* Toolbar */}
            <div className="flex justify-end">
                <PermissionWrapper
                    functionalityName="manage role"
                    moduleName="Roles List"
                    actionId={1}
                    component={
                        <CustomButton
                            startIcon={<FontAwesomeIcon icon={faPlus} />}
                            onClick={() => navigate('/dashboard/manage-role/add')}
                        >
                            Add Role
                        </CustomButton>
                    }
                />
            </div>

            {/* Content Section */}
            <div className="bg-white border border-[#DFE1E6] rounded-xl shadow-sm overflow-hidden">
                {roles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center mb-4 text-[#8993A4]">
                            <FontAwesomeIcon icon={faUserShield} size="2x" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#172B4D] mb-1">No roles found</h3>
                        <p className="text-[#5E6C84] mb-4">Get started by creating your first role.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#DFE1E6]">
                            <thead className="bg-[#FAFBFC]">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                        Role Name
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-[#8993A4] uppercase tracking-wider w-24">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#DFE1E6]">
                                {roles.map((role) => (
                                    <tr key={role.id} className="hover:bg-[#FAFBFC] transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-[#172B4D]">{role.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div>
                                                <PermissionWrapper
                                                    functionalityName="manage role"
                                                    moduleName="Roles List"
                                                    actionId={2}
                                                    component={
                                                        <IconButton onClick={() => navigate(`/dashboard/manage-role/edit/${role.id}`)} size="small" sx={{ color: '#4C9AFF', '&:hover': { backgroundColor: '#E9F2FF' } }}>
                                                            <FontAwesomeIcon icon={faEdit} size="sm" />
                                                        </IconButton>
                                                    }
                                                />
                                                <PermissionWrapper
                                                    functionalityName="manage role"
                                                    moduleName="Roles List"
                                                    actionId={3}
                                                    component={
                                                        <IconButton onClick={() => setDeleteConfirmOpen({ open: true, role })} size="small" sx={{ color: '#DE350B', ml: 1, '&:hover': { backgroundColor: '#FFEBE6' } }}>
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

            <ConfirmDialog
                open={deleteConfirmOpen.open}
                onClose={() => setDeleteConfirmOpen({ open: false, role: null })}
                onConfirm={handleDelete}
                title="Delete Role"
                description={`Are you sure you want to delete "${deleteConfirmOpen.role?.name}"? This action cannot be undone.`}
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

export default connect(mapStateToProps, mapDispatchToProps)(ManageRoles);
