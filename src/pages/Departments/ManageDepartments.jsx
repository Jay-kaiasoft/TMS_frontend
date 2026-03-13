import React, { useState, useEffect } from 'react';
import { CircularProgress, IconButton } from '@mui/material';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { getAllDepartments, addDepartment, updateDepartment, deleteDepartment } from '../../services/departmentService';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionWrapper from '../../components/permissionWrapper/PermissionWrapper';
import CustomButton from '../../components/common/CustomButton';
import DepartmentFormDialog from './DepartmentFormDialog';
import { setAlert } from '../../redux/commonReducers/commonReducers';

const ManageDepartments = ({ setAlert }) => {
    const [departments, setDepartments] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [editingDepartmentId, setEditingDepartmentId] = useState(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const fetchDepartments = async () => {
        try {
            const res = await getAllDepartments();
            setDepartments(res.result || []);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: "Failed to load departments.", type: "error" });
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleOpen = (department = null) => {
        setEditingDepartmentId(department ? department.id : null);
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setEditingDepartmentId(null);
    };

    const onSubmit = async (data) => {
        setActionLoading(true);
        try {
            if (editingDepartmentId) {
                await updateDepartment(editingDepartmentId, data);
            } else {
                await addDepartment(data);
            }
            fetchDepartments();
            handleClose();
            setAlert({ open: true, message: `Department ${editingDepartmentId ? 'updated' : 'created'} successfully!`, type: "success" });
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: err.message || "Failed to save department.", type: "error" });
        } finally {
            setActionLoading(false);
        }
    };

    const openDeleteConfirm = (department) => {
        setDeleteConfirmOpen({ open: true, department });
    };

    const handleDelete = async () => {
        const id = deleteConfirmOpen.department?.id;
        if (!id) return;

        setActionLoading(true);
        try {
            await deleteDepartment(id);
            fetchDepartments();
            setDeleteConfirmOpen({ open: false, department: null });
            setAlert({ open: true, message: "Department deleted successfully.", type: "success" });
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: err.message || "Failed to delete department.", type: "error" });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            {/* Toolbar */}
            <div className="flex justify-end">
                <PermissionWrapper
                    functionalityName="manage department"
                    moduleName="Departments List"
                    actionId={1}
                    component={
                        <CustomButton
                            startIcon={<FontAwesomeIcon icon={faPlus} />}
                            onClick={() => handleOpen()}
                        >
                            Add Department
                        </CustomButton>
                    }
                />
            </div>

            {/* Content Section */}
            <div className="bg-white border border-[#DFE1E6] rounded-xl shadow-sm overflow-hidden">
                {departments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center mb-4 text-[#8993A4]">
                            <FontAwesomeIcon icon={faBuilding} size="2x" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#172B4D] mb-1">No departments found</h3>
                        <p className="text-[#5E6C84] mb-4">Get started by creating your first department.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#DFE1E6]">
                            <thead className="bg-[#FAFBFC]">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                        Department Name
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-[#8993A4] uppercase tracking-wider w-24">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#DFE1E6]">
                                {departments.map((dept) => (
                                    <tr key={dept.id} className="hover:bg-[#FAFBFC] transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-[#172B4D]">{dept.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div>
                                                <PermissionWrapper
                                                    functionalityName="manage department"
                                                    moduleName="Departments List"
                                                    actionId={2}
                                                    component={
                                                        <IconButton onClick={() => handleOpen(dept)} size="small" sx={{ color: '#4C9AFF', '&:hover': { backgroundColor: '#E9F2FF' } }}>
                                                            <FontAwesomeIcon icon={faEdit} size="sm" />
                                                        </IconButton>
                                                    }
                                                />
                                                <PermissionWrapper
                                                    functionalityName="manage department"
                                                    moduleName="Departments List"
                                                    actionId={3}
                                                    component={
                                                        <IconButton onClick={() => openDeleteConfirm(dept)} size="small" sx={{ color: '#DE350B', ml: 1, '&:hover': { backgroundColor: '#FFEBE6' } }}>
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

            <DepartmentFormDialog
                open={openDialog}
                onClose={handleClose}
                onSave={onSubmit}
                editingDepartmentId={editingDepartmentId}
                isSubmitting={actionLoading}
            />

            <ConfirmDialog
                open={deleteConfirmOpen.open}
                onClose={() => setDeleteConfirmOpen({ open: false, department: null })}
                onConfirm={handleDelete}
                title="Delete Department"
                description={`Are you sure you want to delete ${deleteConfirmOpen.department?.name}? This action cannot be undone.`}
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

export default connect(mapStateToProps, mapDispatchToProps)(ManageDepartments);
