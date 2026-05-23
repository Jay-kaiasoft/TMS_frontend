import React, { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import CustomInput from '../../components/common/CustomInput';
import CustomSelect from '../../components/common/CustomSelect';
import CustomModalWrapper from '../../components/common/CustomModalWrapper';
import RichTextEditor from '../../components/common/RichTextEditor';
import DragDropAttachmentUpload from '../../components/common/DragDropAttachmentUpload';
import { FormControlLabel, Radio, RadioGroup, CircularProgress, Tooltip, IconButton, Checkbox } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faCheck } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { getTicketById, addTicket, updateTicket, getTicketsByProjectId } from '../../services/ticketService';
import { deleteTicketAttachment, uploadTicketAttachment } from '../../services/ticketAttachmentService';
import { getAllUsers, getUserHierarchy } from '../../services/userService';
import { getAllStatuses } from '../../services/statusService';
import { setAlert } from '../../redux/commonReducers/commonReducers';
import { connect } from 'react-redux';
import { getAllProjects } from '../../services/projectService';
import HierarchySelect from '../../components/common/HierarchySelect';
import DatePickerComponent from '../../components/common/datePickerComponent';
import { getDepartmentHierarchy } from '../../services/departmentService';
import CommentSection from '../../components/common/CommentSection/CommentSection';
import { getUserDetails } from '../../utils/getUserDetails';

const TicketFormModal = ({
    open,
    onClose,
    editingTicketId,
    setAlert,
    onSuccess,
    projectId
}) => {
    const userData = getUserDetails()
    const { control, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            project_id: null,
            parent_ticket_id: null,
            department_id: null,
            title: '',
            description: '',
            due_date: null,
            working_hours: null,
            user_type: 'as_customer',
            assignees: [],
            status_id: '',
            owner_id: null
        }
    });
    const [departmentHierarchy, setDepartmentHierarchy] = useState([]);
    const [projects, setProjects] = useState([]);
    const [hierarchyData, setHierarchyData] = useState([]); // store hierarchy
    // const [companyHierarchyData, setCompanyHierarchyData] = useState([]);

    const [attachments, setAttachments] = useState([]);
    // const userType = watch('user_type');
    const [statusesList, setStatusesList] = useState([]);
    const [sendMailSettings, setSendMailSettings] = useState({});
    const [projectTickets, setProjectTickets] = useState([]);
    const [loadingProjectTickets, setLoadingProjectTickets] = useState(false);

    const selectedAssigneeIds = watch('assignees') || [];
    const selectedProjectId = watch('project_id');
    const prevProjectIdRef = useRef(null);

    useEffect(() => {
        if (prevProjectIdRef.current !== null && prevProjectIdRef.current !== selectedProjectId) {
            setValue('parent_ticket_id', null);
        }
        prevProjectIdRef.current = selectedProjectId;
    }, [selectedProjectId]);

    useEffect(() => {
        const fetchProjectTickets = async () => {
            if (selectedProjectId) {
                setLoadingProjectTickets(true);
                try {
                    const res = await getTicketsByProjectId(selectedProjectId);
                    if (res.status === 200) {
                        let tickets = res.result || [];
                        if (editingTicketId) {
                            tickets = tickets.filter(t => t.id !== editingTicketId);
                        }
                        const options = tickets.map(t => ({
                            label: `${t.ticket_no} - ${t.title}`,
                            value: t.id
                        }));
                        setProjectTickets(options);
                    }
                } catch (err) {
                    console.error("Failed to load project tickets", err);
                } finally {
                    setLoadingProjectTickets(false);
                }
            } else {
                setProjectTickets([]);
            }
        };
        fetchProjectTickets();
    }, [selectedProjectId, editingTicketId]);

    useEffect(() => {
        if (selectedAssigneeIds.length > 0) {
            setSendMailSettings(prev => {
                const updated = { ...prev };
                let changed = false;
                selectedAssigneeIds.forEach(id => {
                    if (updated[id] === undefined) {
                        updated[id] = 'Y';
                        changed = true;
                    }
                });
                return changed ? updated : prev;
            });
        }
    }, [selectedAssigneeIds]);

    const getUserNameById = (id) => {
        const findName = (nodes) => {
            for (const node of nodes) {
                if (node.id === id) {
                    return node.name;
                }
                if (node.data && node.data.length > 0) {
                    const found = findName(node.data);
                    if (found) return found;
                }
            }
            return null;
        };
        return findName(hierarchyData) || `User ${id}`;
    };

    const attachmentRef = useRef(null);
    const [loadingData, setLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);
    const [ticketNoVisible, setTicketNoVisible] = useState('');
    const [copied, setCopied] = useState(false);
    const [users, setUsers] = useState([]);

    const fetchDepartments = async () => {
        try {
            const res = await getDepartmentHierarchy();
            setDepartmentHierarchy(res.result || []);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: "Failed to load departments.", type: "error" });
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await getAllProjects();
            const options = res.result?.map(u => ({ label: `${u.name}`, value: u.id, company_id: u.company_id }));
            setProjects(options);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await getUserHierarchy();
            setHierarchyData(res.result || []);
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
                if (!editingTicketId) {
                    setValue('status_id', formattedConfigs.find((row) => row.label?.toLowerCase() === "todo")?.value || null);
                }
            }
        } catch (err) {
            console.error("Failed to fetch statuses", err);
        }
    };

    const handleFormSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Prepare payload correctly
            const payload = { ...data };
            if (payload.assignees) {
                payload.assignees = payload.assignees.map(id => {
                    let cleanId = id;
                    if (typeof id === 'string' && id.startsWith('u-')) {
                        cleanId = parseInt(id.substring(2), 10);
                    }
                    const sendMailVal = sendMailSettings[id] || 'Y';
                    return {
                        id: cleanId,
                        send_mail: sendMailVal
                    };
                });
            }
            if (payload.due_date) {
                payload.due_date = payload.due_date.format('YYYY-MM-DD');
            } else {
                payload.due_date = null;
            }

            // payload.as_customer = payload.user_type === 'as_customer';
            // payload.for_customer = payload.user_type === 'for_customer';
            if (watch("owner_id")) {
                payload.for_customer = true;
            } else {
                payload.as_customer = true;
            }
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
        const link = `${siteUrl}/dashboard/manage-tickets/view/${editingTicketId}`;

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

    const getTicketDetails = async () => {
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

                    const initialSendMail = {};
                    (ticket.assignees || []).forEach(a => {
                        const id = typeof a === 'object' ? a.id : a;
                        const key = isForCustomer ? `u-${id}` : id;
                        initialSendMail[key] = a.send_mail || 'Y';
                    });
                    setSendMailSettings(initialSendMail);

                    reset({
                        project_id: ticket.project_id || null,
                        parent_ticket_id: ticket.parent_ticket_id || null,
                        department_id: ticket.department_id || null,
                        title: ticket.title || '',
                        description: ticket.description || '',
                        due_date: formattedDate,
                        working_hours: ticket.working_hours || null,
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
                setSendMailSettings({});
                reset({
                    project_id: projectId || null,
                    parent_ticket_id: null,
                    department_id: null,
                    title: '',
                    description: '',
                    due_date: null,
                    working_hours: null,
                    user_type: 'as_customer',
                    assignees: [],
                    status_id: ''
                });
                setTicketNoVisible('');
                setAttachments([]);
            }
        }
    }

    const getUsersByCompanyId = async () => {
        try {
            if (!watch('project_id')) {
                setUsers([]);
                return;
            }
            const selectedCompanyId = projects.find(p => p.value === watch('project_id'))?.company_id;
            if (selectedCompanyId) {
                const res = await getAllUsers(selectedCompanyId);
                const options = res.result?.map(u => ({ label: `${u.first_name} ${u.last_name}`, value: u.id }));
                setUsers(options || []);
            }
        } catch (err) {
            console.error("Failed to load users", err);
        }
    }

    useEffect(() => {
        if (userData?.rolename === "Customer") {
            setValue("user_type", "for_customer");
        }
        if (open) {
            fetchProjects();
            fetchUsers();
            fetchDepartments()
            fetchStatuses();
        }
    }, [open]);

    useEffect(() => {
        getTicketDetails()
    }, [editingTicketId, open, projectId]);

    useEffect(() => {
        getUsersByCompanyId();
    }, [watch('project_id')]);

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
            maxWidth="lg" // Make it slightly wider for rich text
        >
            <form id="ticket-form" onSubmit={handleSubmit(handleFormSubmit)}>
                {loadingData ? (
                    <div className="flex justify-center p-6">
                        <CircularProgress size={30} sx={{ color: '#0052CC' }} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 mt-2">
                        <div className={`grid grid-cols-2 gap-4 mb-2`}>
                            <CustomSelect
                                disabled={!!projectId}
                                name="project_id"
                                control={control}
                                label="Project"
                                options={projects}
                                rules={{ required: "Project is required" }}
                            />
                            <CustomSelect
                                name="parent_ticket_id"
                                control={control}
                                label="Parent Ticket"
                                options={projectTickets}
                                disabled={projectTickets.length === 0}
                            />
                        </div>
                        <CustomInput
                            name="title"
                            control={control}
                            label="Ticket Title"
                            rules={{ required: "Ticket title is required" }}
                        />

                        <RichTextEditor
                            name="description"
                            control={control}
                            label="Ticket Description"
                            minimal={false}
                        />

                        {/* {
                            userData?.rolename !== "Customer" && (
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
                                                    // setValue('assignees', []);
                                                }}
                                            >
                                                <FormControlLabel value="as_customer" control={<Radio />} label="As Customer" />
                                                <FormControlLabel value="for_customer" control={<Radio />} label="For Customer" />
                                            </RadioGroup>
                                        )}
                                    />
                                </div>
                            )
                        } */}
                        <CustomSelect
                            name="owner_id"
                            control={control}
                            label="Ticket Owner"
                            options={users}
                        />
                        <div className={`grid ${userData?.rolename !== "Customer" ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-2`}>
                            {
                                userData?.rolename !== "Customer" && (
                                    <HierarchySelect
                                        name="department_id"
                                        control={control}
                                        label="Department"
                                        hierarchyData={departmentHierarchy}
                                        multiple={false}
                                        showDivider={false}
                                    />
                                )
                            }
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
                            <HierarchySelect
                                name="assignees"
                                control={control}
                                label="Assign Users"
                                hierarchyData={hierarchyData}
                                rules={{ validate: (value) => value && value.length > 0 || "Assign users is required" }}
                            />

                            {selectedAssigneeIds.length > 0 && (
                                <div className="col-span-1 md:col-span-2 mt-2 p-3 bg-[#F4F5F7] border border-[#DFE1E6] rounded-lg">
                                    <h4 className="text-sm font-bold text-[#172B4D] mb-2 uppercase tracking-wider font-sans">Watch List</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                        {selectedAssigneeIds.map(id => {
                                            const name = getUserNameById(id);
                                            const isChecked = sendMailSettings[id] !== 'N';
                                            return (
                                                <div key={id} className="flex items-center justify-between py-1.5 px-3 bg-white rounded border border-[#DFE1E6] hover:border-[#4c9aff] transition-colors">
                                                    <span className="text-sm font-medium text-[#172B4D] font-sans">{name}</span>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    const newVal = e.target.checked ? 'Y' : 'N';
                                                                    setSendMailSettings(prev => ({ ...prev, [id]: newVal }));
                                                                }}
                                                                size="small"
                                                                sx={{
                                                                    color: '#42526E',
                                                                    '&.Mui-checked': {
                                                                        color: '#0052CC',
                                                                    },
                                                                }}
                                                            />
                                                        }
                                                        label={<span className="text-xs text-[#5E6C84] font-sans">Send Mail</span>}
                                                        labelPlacement="start"
                                                        sx={{ margin: 0 }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {/* {
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
                            } */}
                        </div>
                        {
                            userData?.rolename !== "Customer" && (
                                <div className='mb-2'>
                                    <CustomInput
                                        name="working_hours"
                                        control={control}
                                        label="Estimated Working Hours"
                                        onChange={(e, onChange) => {
                                            let value = e.target.value;

                                            // 1. Remove any character that isn't a digit or a dot
                                            value = value.replace(/[^0-9.]/g, '');

                                            // 2. Prevent multiple dots (keep only the first one)
                                            const parts = value.split('.');
                                            if (parts.length > 2) {
                                                value = parts[0] + '.' + parts.slice(1).join('');
                                            }

                                            // 3. Limit to 2 digits after the dot
                                            if (parts[1] && parts[1].length > 2) {
                                                value = parts[0] + '.' + parts[1].substring(0, 2);
                                            }

                                            onChange(value);
                                        }}
                                    />
                                </div>
                            )
                        }

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

            {editingTicketId && !loadingData && (
                <div className="mt-4 border-t border-[#DFE1E6] pt-4">
                    <h3 className="text-md font-semibold text-[#172B4D] mb-4">Comments</h3>
                    <CommentSection ticketId={editingTicketId} />
                </div>
            )}
        </CustomModalWrapper>
    );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
    setAlert
};

export default connect(mapStateToProps, mapDispatchToProps)(TicketFormModal);