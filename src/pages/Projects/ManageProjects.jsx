import React, { useState, useEffect } from 'react';
import { CircularProgress, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';

import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { getAllProjects, addProject, updateProject, deleteProject } from '../../services/projectService';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionWrapper from '../../components/permissionWrapper/PermissionWrapper';
import CustomButton from '../../components/common/CustomButton';
import ProjectFormDialog from './ProjectFormDialog';
import { setAlert } from '../../redux/commonReducers/commonReducers';

const CustomTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: '#ffffff',
        color: '#172B4D',
        // Softer, more modern shadow instead of a harsh border
        boxShadow: '0px 8px 24px rgba(9, 30, 66, 0.15), 0px 0px 1px rgba(9, 30, 66, 0.31)',
        borderRadius: '6px',
        padding: '12px 16px',
        maxWidth: '280px', // Prevents the tooltip from getting too wide
        fontSize: '0.875rem',
    },
    [`& .${tooltipClasses.arrow}`]: {
        color: '#ffffff',
        '&::before': {
            // Replaces the border with a subtle shadow on the arrow
            boxShadow: '1px 1px 1px rgba(9, 30, 66, 0.1)',
        },
    },
}));

const ManageProjects = ({ setAlert }) => {
    const [projects, setProjects] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState({ open: false, project: null });

    const fetchProjects = async () => {
        try {
            const res = await getAllProjects();
            setProjects(res.result || []);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: "Failed to load projects.", type: "error" });
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleOpen = (project = null) => {
        setEditingProjectId(project ? project.id : null);
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setEditingProjectId(null);
    };

    const onSubmit = async (data) => {
        setActionLoading(true);
        try {
            if (editingProjectId) {
                await updateProject(editingProjectId, data);
            } else {
                await addProject(data);
            }
            fetchProjects();
            handleClose();
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: err.message || "Failed to save project.", type: "error" });
        } finally {
            setActionLoading(false);
        }
    };

    const openDeleteConfirm = (project) => {
        setDeleteConfirmOpen({ open: true, project });
    };

    const handleDelete = async () => {
        const id = deleteConfirmOpen.project?.id;
        if (!id) return;

        setActionLoading(true);
        try {
            await deleteProject(id);
            fetchProjects();
            setDeleteConfirmOpen({ open: false, project: null });
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: err.message || "Failed to delete project.", type: "error" });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            {/* Toolbar */}
            <div className="flex justify-end">
                <PermissionWrapper
                    functionalityName="manage project"
                    moduleName="Projects List"
                    actionId={1}
                    component={
                        <CustomButton
                            startIcon={<FontAwesomeIcon icon={faPlus} />}
                            onClick={() => handleOpen()}
                        >
                            Add Project
                        </CustomButton>
                    }
                />
            </div>

            {/* Content Section */}
            <div className="bg-white border border-[#DFE1E6] rounded-xl shadow-sm overflow-hidden">
                {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center mb-4 text-[#8993A4]">
                            <FontAwesomeIcon icon={faFolderOpen} size="2x" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#172B4D] mb-1">No projects found</h3>
                        <p className="text-[#5E6C84] mb-4">Get started by assigning your first client project.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#DFE1E6]">
                            <thead className="bg-[#FAFBFC]">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                        Project Name
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                        Client Name
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                        Ticket Count
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-[#8993A4] uppercase tracking-wider w-24">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#DFE1E6]">
                                {projects.map((project) => (
                                    <tr key={project.id} className="hover:bg-[#FAFBFC] transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#172B4D]">
                                            {project.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5E6C84]">
                                            {project.client_name || `Unknown Client (${project.client_id})`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#172B4D]">
                                            {project?.ticket_titles?.length > 0 ? (
                                                <CustomTooltip
                                                    placement="bottom"
                                                    title={
                                                        <div className="flex flex-col">
                                                            {/* 2. Added a contextual header */}
                                                            <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider mb-2">
                                                                Associated Tickets
                                                            </span>
                                                            {/* 3. Added bullet points and spacing for readability */}
                                                            <ul className="m-0 pl-4 list-disc space-y-1">
                                                                {project.ticket_titles.map((title, index) => (
                                                                    <li key={index} className="text-[#172B4D] font-medium text-xs leading-relaxed">
                                                                        {title}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    }
                                                >
                                                    <span className="cursor-pointer">
                                                        {project?.ticket_count}
                                                    </span>
                                                </CustomTooltip>
                                            ) : (
                                                <span className="cursor-pointer">{project?.ticket_count || 0}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div>
                                                <PermissionWrapper
                                                    functionalityName="manage project"
                                                    moduleName="Projects List"
                                                    actionId={2}
                                                    component={
                                                        <IconButton onClick={() => handleOpen(project)} size="small" sx={{ color: '#4C9AFF', '&:hover': { backgroundColor: '#E9F2FF' } }}>
                                                            <FontAwesomeIcon icon={faEdit} size="sm" />
                                                        </IconButton>
                                                    }
                                                />
                                                <PermissionWrapper
                                                    functionalityName="manage project"
                                                    moduleName="Projects List"
                                                    actionId={3}
                                                    component={
                                                        <IconButton onClick={() => openDeleteConfirm(project)} size="small" sx={{ color: '#DE350B', ml: 1, '&:hover': { backgroundColor: '#FFEBE6' } }}>
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

            <ProjectFormDialog
                open={openDialog}
                onClose={handleClose}
                onSave={onSubmit}
                editingProjectId={editingProjectId}
                isSubmitting={actionLoading}
            />

            <ConfirmDialog
                open={deleteConfirmOpen.open}
                onClose={() => setDeleteConfirmOpen({ open: false, project: null })}
                onConfirm={handleDelete}
                title="Delete Project"
                description={`Are you sure you want to delete ${deleteConfirmOpen.project?.name}? This action cannot be undone.`}
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

export default connect(mapStateToProps, mapDispatchToProps)(ManageProjects);
