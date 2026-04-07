import React, { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import CustomInput from '../../components/common/CustomInput';
import CustomSelect from '../../components/common/CustomSelect';
import CustomModalWrapper from '../../components/common/CustomModalWrapper';
import RichTextEditor from '../../components/common/RichTextEditor';
import DragDropAttachmentUpload from '../../components/common/DragDropAttachmentUpload';
import { FormControlLabel, Radio, RadioGroup, CircularProgress, Tooltip, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faCheck } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { getTicketById, addTicket, updateTicket } from '../../services/ticketService';
import { deleteTicketAttachment, uploadTicketAttachment } from '../../services/ticketAttachmentService';
import { getUserHierarchy } from '../../services/userService';
import { getAllStatuses } from '../../services/statusService';
import { setAlert } from '../../redux/commonReducers/commonReducers';
import { connect } from 'react-redux';
import { getAllProjects } from '../../services/projectService';
import HierarchySelect from '../../components/common/HierarchySelect';
import { getAllCompaniesWithUsers } from '../../services/companyService';
import DatePickerComponent from '../../components/common/datePickerComponent';
import { getAllDepartments } from '../../services/departmentService';

const TicketFormModal = ({
    open,
    onClose,
    editingTicketId,
    setAlert,
    onSuccess
}) => {
    const { control, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            project_id: null,
            department_id: null,
            title: '',
            description: '',
            due_date: null,
            user_type: 'as_customer',
            assignees: [],
            status_id: ''
        }
    });
    const [departments, setDepartments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [hierarchyData, setHierarchyData] = useState([]); // store hierarchy
    const [companyHierarchyData, setCompanyHierarchyData] = useState([]);

    const [attachments, setAttachments] = useState([]);
    const userType = watch('user_type');
    const [statusesList, setStatusesList] = useState([]);

    const attachmentRef = useRef(null);
    const [loadingData, setLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);
    const [ticketNoVisible, setTicketNoVisible] = useState('');
    const [copied, setCopied] = useState(false);


    const fetchDepartments = async () => {
        try {
            const res = await getAllDepartments();
            const options = res.result?.map(u => ({ label: `${u.name}`, value: u.id }));
            setDepartments(options);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: "Failed to load departments.", type: "error" });
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await getAllProjects();
            const options = res.result?.map(u => ({ label: `${u.name}`, value: u.id }));
            setProjects(options);
        } catch (err) {
            console.error(err);
        }
    };

    const transformCompanyData = (companies) => {
        return companies.map(company => ({
            id: `c-${company.id}`,
            name: company.name,
            selectable: false,          // companies are not selectable
            hasChildren: true,
            data: (company.data || []).map(user => ({
                id: `u-${user.id}`,
                name: user.name,
                selectable: true,        // users are selectable
                hasChildren: false
            }))
        }));
    };

    const fetchUsers = async () => {
        try {
            setValue("assignees", []);
            if (userType === 'for_customer') {
                // Use the new companies-with-users endpoint
                const res = await getAllCompaniesWithUsers(); // you need to import this
                const transformed = transformCompanyData(res.result || []);
                setCompanyHierarchyData(transformed);
            } else {
                const res = await getUserHierarchy();
                setHierarchyData(res.result || []);
                setCompanyHierarchyData([]); // clear old data
            }
        } catch (err) {
            console.error("Failed to load users", err);
        }
    };

    const fetchStatuses = async () => {
        try {
            const res = await getAllStatuses();
            if (res.status === 200) {
                const formattedConfigs = res.result?.map(s => ({ value: s.id, label: s.name })) || [];
                setStatusesList(formattedConfigs);
            }
        } catch (err) {
            console.error("Failed to fetch statuses", err);
        }
    };

    useEffect(() => {
        if (open) {
            fetchProjects();
            fetchDepartments()
            fetchUsers();
            fetchStatuses();
        }
    }, [open, userType]);

    useEffect(() => {
        if (open) {
            if (editingTicketId) {
                setLoadingData(true);
                getTicketById(editingTicketId).then(res => {
                    const ticket = res.result;
                    let formattedDate = null;
                    if (ticket.due_date) {
                        formattedDate = dayjs(ticket.due_date);
                    }
                    const isForCustomer = ticket.for_customer;
                    const formattedAssignees = (ticket.assignees || []).map(a => {
                        const id = typeof a === 'object' ? a.id : a;
                        return isForCustomer ? `u-${id}` : id;
                    });

                    reset({
                        project_id: ticket.project_id || null,
                        department_id: ticket.department_id || null,
                        title: ticket.title || '',
                        description: ticket.description || '',
                        due_date: formattedDate,
                        user_type: isForCustomer ? 'for_customer' : 'as_customer',
                        assignees: formattedAssignees,
                        status_id: ticket.status_id || ''
                    });
                    setTicketNoVisible(ticket.ticket_no || '');
                    setAttachments(ticket.attachments || []);
                }).catch(err => {
                    console.error("Failed to load ticket details", err);
                }).finally(() => {
                    setLoadingData(false);
                });
            } else {
                reset({
                    project_id: null,
                    department_id: null,
                    title: '',
                    description: '',
                    due_date: null,
                    user_type: 'as_customer',
                    assignees: [],
                    status_id: ''
                });
                setTicketNoVisible('');
                setAttachments([]);
            }
        }
    }, [open, editingTicketId, reset]);

    const handleFormSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Prepare payload correctly
            const payload = { ...data };
            if (payload.assignees) {
                payload.assignees = payload.assignees.map(id => {
                    if (typeof id === 'string' && id.startsWith('u-')) {
                        return parseInt(id.substring(2), 10);
                    }
                    return id;
                });
            }
            if (payload.due_date) {
                payload.due_date = payload.due_date.format('YYYY-MM-DD');
            } else {
                payload.due_date = null;
            }

            payload.as_customer = payload.user_type === 'as_customer';
            payload.for_customer = payload.user_type === 'for_customer';
            delete payload.user_type;

            const selectedProject = projects.find(p => p.value === data.project_id);
            payload.project_name = selectedProject ? selectedProject.label : "";

            let resultingTicketId = editingTicketId;
            if (editingTicketId) {
                const res = await updateTicket(editingTicketId, payload);
                if (res.status !== 200) {
                    setAlert({ open: true, message: res.message || "Failed to update ticket.", type: "error" });
                    setIsSubmitting(false);
                    return;
                }
            } else {
                const res = await addTicket(payload);
                if (res.status !== 201 && res.status !== 200) {
                    setAlert({ open: true, message: res.message || "Failed to create ticket.", type: "error" });
                    setIsSubmitting(false);
                    return;
                }
                resultingTicketId = res.result?.id;
            }

            if (resultingTicketId) {
                setIsUploadingFiles(true);
                if (attachmentRef.current) {
                    await attachmentRef.current.uploadPendingFiles(resultingTicketId);
                }
                setIsUploadingFiles(false);
                setAlert({ open: true, message: `Ticket ${editingTicketId ? 'updated' : 'created'} successfully!`, type: "success" });
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: err.message || "Failed to save ticket.", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyLink = () => {
        const siteUrl = import.meta.env.REACT_APP_MAIN_SITE_URL || window.location.origin;
        const link = `${siteUrl}/dashboard/manage-tickets`;
        
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleUploadSuccess = (response) => {
        // Once successfully uploaded, add it to local attachment list visually
        setAttachments(prev => [...prev, {
            id: response.id,
            file_name: response.file_name,
            file_URL: response.file_URL
        }]);
    };

    const handleDeleteAttachment = async (attId) => {
        try {
            await deleteTicketAttachment(editingTicketId, attId);
            setAttachments(prev => prev.filter(a => a.id !== attId));
        } catch (error) {
            setAlert({ open: true, message: "Failed to delete attachment.", type: "error" });
        }
    };

    return (
        <CustomModalWrapper
            open={open}
            onClose={() => !isSubmitting && onClose()}
            title={editingTicketId ? 'Edit Ticket' : 'Add New Ticket'}
            onSubmit={handleSubmit(handleFormSubmit)}
            isSubmitting={isSubmitting || loadingData || isUploadingFiles}
            submitText={editingTicketId ? 'Save Changes' : 'Submit'}
            headerExtra={editingTicketId && ticketNoVisible && (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F4F5F7] border border-[#DFE1E6] rounded-md shadow-sm">
                        <span className="text-[10px] font-bold text-[#6B778C] uppercase tracking-wider">Ticket ID</span>
                        <span className="text-sm font-bold text-[#172B4D]">{ticketNoVisible}</span>
                    </div>
                    <Tooltip title={copied ? "Copied!" : "Copy link"} arrow>
                        <IconButton
                            size="small"
                            onClick={handleCopyLink}
                            sx={{ 
                                color: copied ? '#36B37E' : '#42526E',
                                backgroundColor: '#F4F5F7',
                                '&:hover': { backgroundColor: '#EBECF0' }
                            }}
                        >
                            <FontAwesomeIcon icon={copied ? faCheck : faLink} size="xs" />
                        </IconButton>
                    </Tooltip>
                </div>
            )}
            cancelText="Cancel"
            maxWidth="md" // Make it slightly wider for rich text
        >
            <form id="ticket-form" onSubmit={handleSubmit(handleFormSubmit)}>
                {loadingData ? (
                    <div className="flex justify-center p-6">
                        <CircularProgress size={30} sx={{ color: '#0052CC' }} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 mt-2">
                        <div className='grid grid-cols-2 gap-4'>
                            <CustomSelect
                                name="project_id"
                                control={control}
                                label="Project"
                                options={projects}
                                rules={{ required: "Project is required" }}
                            />
                            <CustomInput
                                name="title"
                                control={control}
                                label="Ticket Title"
                                rules={{ required: "Ticket title is required" }}
                            />
                        </div>

                        <RichTextEditor
                            name="description"
                            control={control}
                            label="Ticket Description"
                            minimal={false}
                        />

                        <div className="flex flex-col md:flex-row gap-4 mb-2 items-start md:items-center">
                            <Controller
                                name="user_type"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup
                                        row
                                        {...field}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            setValue('assignees', []);
                                        }}
                                    >
                                        <FormControlLabel value="as_customer" control={<Radio />} label="As Customer" />
                                        <FormControlLabel value="for_customer" control={<Radio />} label="For Customer" />
                                    </RadioGroup>
                                )}
                            />
                        </div>

                        <div className='mb-2'>
                            <CustomSelect
                                name="department_id"
                                control={control}
                                label="Department"
                                options={departments}
                                rules={{ required: "Department is required" }}
                            />
                        </div>
                        <div className='mb-2'>
                            <CustomSelect
                                name="status_id"
                                control={control}
                                label="Status"
                                options={statusesList}
                                rules={{ required: "Status is required" }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DatePickerComponent requiredFiledLabel={true} setValue={setValue} control={control} name='due_date' label={`Due Date`} minDate={new Date()} maxDate={null} required={true} />
                            {
                                userType === 'for_customer' ? (
                                    <HierarchySelect
                                        name="assignees"
                                        control={control}
                                        label="Assign Users"
                                        hierarchyData={companyHierarchyData}
                                        rules={{ validate: (value) => value && value.length > 0 || "Assign users is required" }}
                                    />
                                ) : (
                                    <HierarchySelect
                                        name="assignees"
                                        control={control}
                                        label="Assign Users"
                                        hierarchyData={hierarchyData}
                                        rules={{ validate: (value) => value && value.length > 0 || "Assign users is required" }}
                                    />
                                )
                            }
                        </div>

                        {/* Attachment Upload - Always show - will be uploaded alongside ticket info */}
                        <div className="mt-4 border-t border-[#DFE1E6] pt-4">
                            <h3 className="text-md font-semibold text-[#172B4D] mb-4">Attachments</h3>
                            <DragDropAttachmentUpload
                                ref={attachmentRef}
                                uploadApiFunction={uploadTicketAttachment}
                                onUploadSuccess={handleUploadSuccess}
                                existingAttachments={attachments}
                                onDeleteExisting={handleDeleteAttachment}
                                setAlert={setAlert}
                            />
                        </div>
                    </div>
                )}
            </form>
        </CustomModalWrapper>
    );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
    setAlert
};

export default connect(mapStateToProps, mapDispatchToProps)(TicketFormModal);