import React, { useState, useEffect } from 'react';
import { IconButton, Chip, CircularProgress } from '@mui/material';
import CustomButton from '../../components/common/CustomButton';
import UserFormDialog from './UserFormDialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEnvelope, faPhone, faMapMarkerAlt, faUserShield } from '@fortawesome/free-solid-svg-icons';
import { getAllUsers, deleteUser } from '../../services/userService';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionWrapper from '../../components/permissionWrapper/PermissionWrapper';
import { connect } from 'react-redux';
import { setAlert, setLoading } from '../../redux/commonReducers/commonReducers';

const ManageUsers = ({ setAlert, setLoading, loading }) => {
    const [users, setUsers] = useState([]);

    // Modal State
    const [open, setOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    // Delete State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const rolesMap = {
        1: { name: 'Administrator', color: 'error' },
        2: { name: 'Developer', color: 'info' },
        3: { name: 'Customer', color: 'default' }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await getAllUsers();
            setUsers(res.result || []);
        } catch (error) {
            setAlert({
                message: "Failed to fetch users",
                type: "error",
                open: true
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpen = (user = null) => {
        if (user) {
            setEditingUserId(user.id);
        } else {
            setEditingUserId(null);
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingUserId(null);
    };

    const confirmDelete = (user) => {
        setUserToDelete(user);
        setDeleteConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        try {
            await deleteUser(userToDelete.id);
            setDeleteConfirmOpen(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (error) {
            setAlert({
                message: error.message || "Failed to delete user",
                type: "error",
                open: true
            });
        }
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            {/* Toolbar */}
            <div className="flex justify-end">
                <PermissionWrapper
                    functionalityName="manage user"
                    moduleName="users"
                    actionId={1}
                    component={
                        <CustomButton
                            startIcon={<FontAwesomeIcon icon={faPlus} />}
                            onClick={() => handleOpen()}
                        >
                            Add User
                        </CustomButton>
                    }
                />
            </div>

            <div className="bg-white border border-[#DFE1E6] rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#FAFBFC] border-b border-[#DFE1E6] text-xs uppercase text-[#5E6C84] font-bold tracking-wider">
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DFE1E6]">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center">
                                        <CircularProgress size={30} sx={{ color: '#0052CC' }} />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-[#5E6C84]">
                                        No users found. Create one above!
                                    </td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="hover:bg-[#FAFBFC] transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#0052CC] to-[#4C9AFF] text-white flex items-center justify-center font-bold shadow-sm shrink-0 uppercase">
                                                {user.first_name[0]}{user.last_name[0]}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-[#172B4D]">{user.first_name} {user.last_name}</div>
                                                {user.city && <div className="text-xs text-[#5E6C84] mt-0.5"><FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 opacity-70" />{user.city}, {user.country}</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-[#172B4D] flex items-center gap-2">
                                            <FontAwesomeIcon icon={faEnvelope} className="text-[#8993A4]" /> {user.email}
                                        </div>
                                        {user.phone && (
                                            <div className="text-xs text-[#5E6C84] mt-1 flex items-center gap-2">
                                                <FontAwesomeIcon icon={faPhone} className="text-[#8993A4]" /> {user.phone} {user.is_sms_active && <span className="text-[10px] bg-[#E3FCEF] text-[#006644] px-1 py-0.5 rounded ml-1">SMS ON</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Chip
                                            icon={<FontAwesomeIcon icon={faUserShield} style={{ fontSize: '10px' }} />}
                                            label={rolesMap[user.role_id]?.name || 'Unknown'}
                                            color={rolesMap[user.role_id]?.color || 'default'}
                                            size="small"
                                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.is_active ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#FFEBE6] text-[#BF2600]'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div>
                                            <PermissionWrapper
                                                functionalityName="manage user"
                                                moduleName="users"
                                                actionId={2}
                                                component={
                                                    <IconButton onClick={() => handleOpen(user)} size="small" sx={{ color: '#4C9AFF', '&:hover': { backgroundColor: '#E9F2FF' } }}>
                                                        <FontAwesomeIcon icon={faEdit} size="sm" />
                                                    </IconButton>
                                                }
                                            />
                                            <PermissionWrapper
                                                functionalityName="manage user"
                                                moduleName="users"
                                                actionId={3}
                                                component={
                                                    <IconButton onClick={() => confirmDelete(user)} size="small" sx={{ color: '#DE350B', ml: 1, '&:hover': { backgroundColor: '#FFEBE6' } }}>
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
            </div>

            <UserFormDialog
                open={open}
                onClose={handleClose}
                onSuccess={() => {
                    fetchUsers();
                    handleClose();
                }}
                editingUserId={editingUserId}
            />

            <ConfirmDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Delete User?"
                description={`Are you sure you want to permanently delete the user ${userToDelete?.first_name} ${userToDelete?.last_name}? This action cannot be undone.`}
                confirmText="Delete User"
                isDestructive={true}
            />
        </div>
    );
};

const mapStateToProps = (state) => ({
    loading: state.common.loading
});

const mapDispatchToProps = {
    setLoading,
    setAlert
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageUsers);
