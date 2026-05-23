import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, Paper, Avatar, AvatarGroup, Divider,
    CircularProgress, Tooltip, IconButton, FormControlLabel, Radio, RadioGroup,
    Checkbox
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faCalendarAlt, faClock, faFolder, faBuilding,
    faUser, faUsers, faTag, faDownload, faFileAlt, faComments,
    faPaperclip, faExclamationTriangle, faLink, faCheck, faInfoCircle,
    faEdit
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getTicketById, updateTicket, updateAssigneeSendMail, getTicketsByProjectId } from '../../services/ticketService';
import { getTicketComments } from '../../services/ticketCommentService';
import { getAllProjects } from '../../services/projectService';
import { getAllDepartments, getDepartmentHierarchy } from '../../services/departmentService';
import CommentSection from '../../components/common/CommentSection/CommentSection';
import { connect } from 'react-redux';
import { setAlert } from '../../redux/commonReducers/commonReducers';
import { getUserDetails } from '../../utils/getUserDetails';

import { useForm, Controller } from 'react-hook-form';
import CustomInput from '../../components/common/CustomInput';
import CustomSelect from '../../components/common/CustomSelect';
import RichTextEditor from '../../components/common/RichTextEditor';
import DragDropAttachmentUpload from '../../components/common/DragDropAttachmentUpload';
import HierarchySelect from '../../components/common/HierarchySelect';
import DatePickerComponent from '../../components/common/datePickerComponent';
import { getUserHierarchy } from '../../services/userService';
import { getAllStatuses } from '../../services/statusService';
import { deleteTicketAttachment, uploadTicketAttachment } from '../../services/ticketAttachmentService';

dayjs.extend(relativeTime);

const TicketViewPage = ({ setAlert }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const userData = getUserDetails()

    // Core data state
    const [ticket, setTicket] = useState(null);
    const [commentsCount, setCommentsCount] = useState(0);
    const [projects, setProjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [departmentHierarchy, setDepartmentHierarchy] = useState([]);
    const [loading, setLoading] = useState(true);

    // React Hook Form initialization
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
            status_id: ''
        }
    });

    // Inline edit states
    const [isEditing, setIsEditing] = useState(false);
    const [statusesList, setStatusesList] = useState([]);
    const [hierarchyData, setHierarchyData] = useState([]);
    const [editAttachments, setEditAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);
    const attachmentRef = useRef(null);

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
                        if (id) {
                            tickets = tickets.filter(t => t.id !== parseInt(id, 10));
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
    }, [selectedProjectId, id]);

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
            }
        } catch (err) {
            console.error("Failed to fetch statuses", err);
        }
    };

    const handleStartEdit = async () => {
        if (!ticket) return;

        if (hierarchyData.length === 0) {
            await fetchUsers();
        }
        if (statusesList.length === 0) {
            await fetchStatuses();
        }

        const formattedDate = ticket.due_date ? dayjs(ticket.due_date) : null;
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

        if (userData?.rolename === "Customer") {
            setValue("user_type", "for_customer");
        }

        setEditAttachments(ticket.attachments || []);
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleUploadSuccess = (response) => {
        setEditAttachments(prev => [...prev, {
            id: response.id,
            file_name: response.file_name,
            file_URL: response.file_URL
        }]);
    };

    const handleDeleteAttachment = async (attId) => {
        try {
            await deleteTicketAttachment(ticket.id, attId);
            setEditAttachments(prev => prev.filter(a => a.id !== attId));
        } catch (error) {
            setAlert({ open: true, message: "Failed to delete attachment.", type: "error" });
        }
    };

    const handleFormSubmit = async (data) => {
        setIsSubmitting(true);
        try {
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

            payload.as_customer = payload.user_type === 'as_customer';
            payload.for_customer = payload.user_type === 'for_customer';
            delete payload.user_type;

            const selectedProject = projects.find(p => p.id === data.project_id);
            payload.project_name = selectedProject ? selectedProject.name : "";

            const res = await updateTicket(ticket.id, payload);
            if (res.status !== 200) {
                setAlert({ open: true, message: res.message || "Failed to update ticket.", type: "error" });
                setIsSubmitting(false);
                return;
            }

            setIsUploadingFiles(true);
            if (attachmentRef.current) {
                await attachmentRef.current.uploadPendingFiles(ticket.id);
            }
            setIsUploadingFiles(false);

            setAlert({ open: true, message: "Ticket updated successfully!", type: "success" });
            setIsEditing(false);
            fetchData(true);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: err.message || "Failed to save ticket.", type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Copy to clipboard state
    const [copied, setCopied] = useState(false);

    const fetchData = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const [ticketRes, commentsRes, projectsRes, departmentsRes, hierarchyRes] = await Promise.all([
                getTicketById(id),
                getTicketComments(id),
                getAllProjects(),
                getAllDepartments(),
                getDepartmentHierarchy()
            ]);

            setTicket(ticketRes.result);
            setCommentsCount(commentsRes.result?.length || 0);
            setProjects(projectsRes.result || []);
            setDepartments(departmentsRes.result || []);
            setDepartmentHierarchy(hierarchyRes.result || []);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: "Failed to load ticket details.", type: "error" });
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const getProjectName = (projId) => {
        const found = projects.find(p => p.id === projId);
        return found ? found.name : "-";
    };

    const getDepartmentName = (deptId) => {
        if (!deptId) return "-";
        const path = [];
        let currentId = deptId;
        const visited = new Set();
        while (currentId && !visited.has(currentId)) {
            visited.add(currentId);
            const found = departments.find(d => d.id === currentId);
            if (found) {
                path.unshift(found.name);
                currentId = found.parent_department_id;
            } else {
                break;
            }
        }
        return path.length > 0 ? path.join(' > ') : "-";
    };

    const getAbsoluteUrl = (url) => {
        if (!url) return '';
        return url.startsWith('http') ? url : `${import.meta.env.REACT_APP_MAIN_SITE_URL || ''}${url}`;
    };

    const handleDownload = (url, fileName) => {
        const a = document.createElement('a');
        a.href = getAbsoluteUrl(url);
        a.download = fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleCopyLink = () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setAlert({ open: true, message: "Ticket link copied to clipboard!", type: "success" });
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const getStatusColorClass = (statusName) => {
        const name = statusName?.toLowerCase() || '';
        if (name === 'done') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (name === 'in progress') return 'bg-blue-50 text-blue-700 border-blue-200';
        if (name === 'todo') return 'bg-violet-50 text-violet-700 border-violet-200';
        if (name === 'in review') return 'bg-violet-50 text-violet-700 border-violet-200';
        return 'bg-slate-50 text-slate-700 border-slate-200';
    };

    const getStatusDotColor = (statusName) => {
        const name = statusName?.toLowerCase() || '';
        if (name === 'done') return 'bg-emerald-500';
        if (name === 'in progress') return 'bg-blue-500';
        if (name === 'todo') return 'bg-violet-500';
        if (name === 'in review') return 'bg-violet-500';
        return 'bg-slate-500';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <CircularProgress size={45} sx={{ color: '#337fff' }} />
                <Typography variant="body2" className="text-gray-500 font-medium">
                    Loading ticket details...
                </Typography>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Button
                    startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
                    onClick={() => navigate('/dashboard/manage-tickets')}
                    className="text-gray-600 mb-6 hover:text-gray-900 normal-case"
                >
                    Back to Tickets
                </Button>
                <Paper className="p-8 text-center border border-gray-200 rounded-2xl shadow-sm">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-5xl mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Ticket Not Found</h3>
                    <p className="text-gray-500">The ticket you are trying to view does not exist or you do not have permission to view it.</p>
                </Paper>
            </div>
        );
    }

    const isOverdue = ticket.due_date && dayjs(ticket.due_date).isBefore(dayjs(), 'day');
    const isToday = ticket.due_date && dayjs(ticket.due_date).isSame(dayjs(), 'day');
    const relativeDueDate = ticket.due_date ? dayjs(ticket.due_date).fromNow() : null;
    const formattedDueDate = ticket.due_date ? dayjs(ticket.due_date).format('MMM D, YYYY') : "-";

    return (
        <div className="max-w-full mx-auto px-4 space-y-6 animate-fade-in font-sans">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
                        onClick={() => navigate('/dashboard/manage-tickets')}
                        className="normal-case text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        sx={{ borderRadius: '8px', padding: '6px 14px' }}
                    >
                        Back
                    </Button>
                </div>
                {userData?.id === ticket?.created_by && (
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleCancelEdit}
                                    className="normal-case text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                    sx={{ borderRadius: '8px', padding: '6px 14px' }}
                                    disabled={isSubmitting || isUploadingFiles}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleSubmit(handleFormSubmit)}
                                    className="normal-case bg-[#0052CC] hover:bg-[#0747A6] text-white font-medium shadow-sm transition-all"
                                    sx={{ borderRadius: '8px', padding: '6px 16px' }}
                                    disabled={isSubmitting || isUploadingFiles}
                                    startIcon={(isSubmitting || isUploadingFiles) ? <CircularProgress size={16} color="inherit" /> : null}
                                >
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<FontAwesomeIcon icon={faEdit} />}
                                onClick={handleStartEdit}
                                className="normal-case bg-[#0052CC] hover:bg-[#0747A6] text-white font-medium shadow-sm transition-all"
                                sx={{ borderRadius: '8px', padding: '6px 16px' }}
                            >
                                Edit Ticket
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Title Block */}
                    <div className="bg-white p-6 border border-gray-200 rounded-2xl shadow-sm space-y-2 hover:border-gray-300 transition-all duration-200">
                        {isEditing ? (
                            <div className="space-y-4">
                                <CustomInput
                                    name="title"
                                    control={control}
                                    label="Ticket Title"
                                    rules={{ required: "Ticket title is required" }}
                                />
                                {selectedProjectId && projectTickets.length > 0 && (
                                    <CustomSelect
                                        name="parent_ticket_id"
                                        control={control}
                                        label="Parent Ticket"
                                        options={projectTickets}
                                    />
                                )}
                            </div>
                        ) : (
                            <>
                                {ticket.parent_ticket_id && (
                                    <div 
                                        className="text-xs font-semibold text-[#0052CC] hover:underline cursor-pointer mb-2 flex items-center gap-1.5 select-none" 
                                        onClick={() => navigate(`/dashboard/manage-tickets/view/${ticket.parent_ticket_id}`)}
                                    >
                                        <FontAwesomeIcon icon={faFolder} size="xs" />
                                        <span>Parent Ticket: {ticket.parent_ticket_no ? `[${ticket.parent_ticket_no}] ` : ''}{ticket.parent_ticket_title}</span>
                                    </div>
                                )}
                                <div className="flex items-start justify-between gap-4 p-1">
                                    <Typography variant="h4" className="font-bold text-gray-900 tracking-tight leading-tight select-none">
                                        {ticket.title}
                                    </Typography>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                                        <span>Opened by <span className="font-semibold text-gray-700">{ticket.created_by_name || 'System'}</span></span>
                                    </div>
                                    <span className="text-gray-300">•</span>
                                    <div>
                                        <span>Created {dayjs(ticket.created_date).fromNow()}</span>
                                    </div>
                                    <span className="text-gray-300">•</span>
                                    <div className="flex items-center gap-1.5">
                                        <FontAwesomeIcon icon={faComments} className="text-gray-400" />
                                        <span>{commentsCount} comments</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Description Block */}
                    <Paper className="p-6 border border-gray-200 rounded-2xl shadow-sm bg-white space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faFileAlt} size="sm" />
                                </div>
                                <Typography variant="subtitle1" className="font-bold text-gray-800">
                                    Description
                                </Typography>
                            </div>
                        </div>

                        <div className="pt-1">
                            {isEditing ? (
                                <RichTextEditor
                                    name="description"
                                    control={control}
                                    // label="Ticket Description"
                                    minimal={false}
                                />
                            ) : (
                                ticket.description ? (
                                    <div
                                        className="prose prose-sm max-w-none text-gray-800 leading-relaxed min-h-[80px]"
                                        dangerouslySetInnerHTML={{ __html: ticket.description }}
                                    />
                                ) : (
                                    <Typography variant="body2" className="text-gray-400 italic py-4">
                                        No description provided for this ticket.
                                    </Typography>
                                )
                            )}
                        </div>
                    </Paper>

                    {/* <Paper className="p-6 border border-gray-200 rounded-2xl shadow-sm bg-white space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faPaperclip} size="sm" />
                                </div>
                                <Typography variant="subtitle1" className="font-bold text-gray-800">
                                    Attachments
                                    <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                        {isEditing ? (editAttachments?.length || 0) : (ticket.attachments?.length || 0)}
                                    </span>
                                </Typography>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="mt-4 pt-4">
                                <DragDropAttachmentUpload
                                    ref={attachmentRef}
                                    uploadApiFunction={uploadTicketAttachment}
                                    onUploadSuccess={handleUploadSuccess}
                                    existingAttachments={editAttachments}
                                    onDeleteExisting={handleDeleteAttachment}
                                    setAlert={setAlert}
                                />
                            </div>
                        ) : (
                            ticket.attachments && ticket.attachments.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    {ticket.attachments.map((file) => (
                                        <div
                                            key={file.id}
                                            className="group/item flex items-center justify-between p-3 border border-gray-100 hover:border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0 border border-blue-100">
                                                    <FontAwesomeIcon icon={faFileAlt} size="sm" />
                                                </div>
                                                <div className="min-w-0">
                                                    <Typography
                                                        variant="body2"
                                                        noWrap
                                                        className="font-semibold text-gray-700 group-hover/item:text-blue-600 transition-colors"
                                                        title={file.file_name}
                                                    >
                                                        {file.file_name}
                                                    </Typography>
                                                    {file.created_date && (
                                                        <span className="text-[10px] text-gray-400 block mt-0.5">
                                                            Uploaded {dayjs(file.created_date).fromNow()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-60 group-hover/item:opacity-100 transition-opacity">
                                                <Tooltip title="Download attachment">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDownload(file.file_URL, file.file_name)}
                                                        className="text-gray-500 hover:text-blue-600 hover:bg-white p-1.5"
                                                    >
                                                        <FontAwesomeIcon icon={faDownload} size="sm" />
                                                    </IconButton>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/20">
                                    <FontAwesomeIcon icon={faPaperclip} className="text-gray-300 text-3xl mb-2" />
                                    <Typography variant="body2" className="text-gray-400 italic">
                                        No attachments uploaded.
                                    </Typography>
                                </div>
                            )
                        )}
                    </Paper> */}

                    {/* Comments Section */}
                    <Paper className="p-6 border border-gray-200 rounded-2xl shadow-sm bg-white space-y-4">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <FontAwesomeIcon icon={faComments} size="sm" />
                            </div>
                            <Typography variant="subtitle1" className="font-bold text-gray-800">
                                Comments
                            </Typography>
                        </div>

                        <CommentSection
                            ticketId={id}
                            onCommentsCountChange={(count) => setCommentsCount(count)}
                        />
                    </Paper>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">

                    {/* Sticky Container */}
                    <div className="lg:sticky lg:top-6 space-y-6">

                        {/* Ticket Properties Card */}
                        <Paper className="border border-gray-200 rounded-2xl shadow-sm bg-white overflow-hidden">
                            <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                <Typography className="font-bold text-gray-800 text-sm">
                                    Ticket Attributes
                                </Typography>
                            </div>

                            <div className="p-5 space-y-5">
                                {/* User Type Selector for non-Customers */}
                                {isEditing && userData?.rolename !== "Customer" && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                            User Type
                                        </label>
                                        <Controller
                                            name="user_type"
                                            control={control}
                                            render={({ field }) => (
                                                <RadioGroup
                                                    row
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                    }}
                                                >
                                                    <FormControlLabel value="as_customer" control={<Radio size="small" />} label={<span className="text-xs">As Customer</span>} />
                                                    <FormControlLabel value="for_customer" control={<Radio size="small" />} label={<span className="text-xs">For Customer</span>} />
                                                </RadioGroup>
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Status details */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                                        <FontAwesomeIcon icon={faTag} size="xs" /> Status
                                    </label>
                                    {isEditing ? (
                                        <CustomSelect
                                            name="status_id"
                                            control={control}
                                            options={statusesList}
                                            rules={{ required: "Status is required" }}
                                        />
                                    ) : (
                                        <div className={`flex items-center gap-2 font-semibold border rounded-lg p-2.5 ${getStatusColorClass(ticket.status_name)}`}>
                                            <span className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(ticket.status_name)}`} />
                                            <span className="text-sm">{ticket.status_name || 'Unassigned'}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Project details */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                                        <FontAwesomeIcon icon={faFolder} size="xs" /> Project
                                    </label>
                                    {isEditing ? (
                                        <CustomSelect
                                            name="project_id"
                                            control={control}
                                            options={projects.map(p => ({ label: p.name, value: p.id }))}
                                            rules={{ required: "Project is required" }}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                                            <span>{getProjectName(ticket.project_id)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Department details */}
                                {(userData?.rolename !== "Customer" || !isEditing) && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faBuilding} size="xs" /> Department
                                        </label>
                                        {isEditing ? (
                                            <HierarchySelect
                                                name="department_id"
                                                control={control}
                                                label=""
                                                hierarchyData={departmentHierarchy}
                                                multiple={false}
                                                showDivider={false}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                                                <span>{getDepartmentName(ticket.department_id)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Due Date Badge */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                                        <FontAwesomeIcon icon={faCalendarAlt} size="xs" /> Due Date
                                    </label>
                                    {isEditing ? (
                                        <DatePickerComponent
                                            requiredFiledLabel={true}
                                            setValue={setValue}
                                            control={control}
                                            name="due_date"
                                            label=""
                                            minDate={new Date()}
                                            maxDate={null}
                                            required={true}
                                        />
                                    ) : (
                                        <div className={`flex items-center justify-between gap-2 text-sm font-semibold border rounded-lg p-2.5 ${isOverdue ? 'bg-red-50 border-red-100 text-red-700' : isToday ? 'bg-yellow-50 border-yellow-100 text-yellow-600' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                                            <span className="flex items-center gap-2">
                                                <FontAwesomeIcon icon={faCalendarAlt} className={isOverdue ? 'text-red-400' : isToday ? 'text-yellow-400' : 'text-gray-400'} />
                                                {formattedDueDate}
                                            </span>
                                            {relativeDueDate && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${isOverdue ? 'bg-red-200 text-red-800' : isToday ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-600'}`}>
                                                    {relativeDueDate}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Working Hours */}
                                {isEditing ? (
                                    userData?.rolename !== "Customer" && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                                                <FontAwesomeIcon icon={faClock} size="xs" /> Estimated Working Hours
                                            </label>
                                            <CustomInput
                                                name="working_hours"
                                                control={control}
                                                onChange={(e, onChange) => {
                                                    let value = e.target.value;
                                                    value = value.replace(/[^0-9.]/g, '');
                                                    const parts = value.split('.');
                                                    if (parts.length > 2) {
                                                        value = parts[0] + '.' + parts.slice(1).join('');
                                                    }
                                                    if (parts[1] && parts[1].length > 2) {
                                                        value = parts[0] + '.' + parts[1].substring(0, 2);
                                                    }
                                                    onChange(value);
                                                }}
                                            />
                                        </div>
                                    )
                                ) : (
                                    ticket.working_hours && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                                                <FontAwesomeIcon icon={faClock} size="xs" /> Estimated Working Hours
                                            </label>
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                                                <span>{ticket.working_hours} hours</span>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </Paper>

                        {/* Assignees Card */}
                        <Paper className="border border-gray-200 rounded-2xl shadow-sm bg-white p-5 space-y-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                                <FontAwesomeIcon icon={faUsers} size="xs" /> Assignees ({isEditing ? (watch('assignees')?.length || 0) : (ticket.assignees?.length || 0)})
                            </label>

                            {isEditing ? (
                                <>
                                    <HierarchySelect
                                        name="assignees"
                                        control={control}
                                        label=""
                                        hierarchyData={hierarchyData}
                                        rules={{ validate: (value) => value && value.length > 0 || "Assign users is required" }}
                                        limitTags={0}
                                    />
                                    {selectedAssigneeIds.length > 0 && (
                                        <div className="mt-4 p-3 bg-[#F4F5F7] border border-[#DFE1E6] rounded-lg">
                                            <h4 className="text-xs font-bold text-[#172B4D] mb-2 uppercase tracking-wider font-sans">Watch List</h4>
                                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                                {selectedAssigneeIds.map(id => {
                                                    const name = getUserNameById(id);
                                                    const isChecked = sendMailSettings[id] !== 'N';
                                                    return (
                                                        <div key={id} className="flex items-center justify-between py-1.5 px-3 bg-white rounded border border-[#DFE1E6] hover:border-[#4c9aff] transition-colors">
                                                            <span className="text-xs font-medium text-[#172B4D] font-sans">{name}</span>
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
                                                                label={<span className="text-[10px] text-[#5E6C84] font-sans">Send Mail</span>}
                                                                labelPlacement="start"
                                                                sx={{ margin: 0 }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                ticket.assignees && ticket.assignees.length > 0 ? (
                                    <div className="space-y-3 pt-1">
                                        <AvatarGroup max={5} className="justify-end flex-row-reverse border-gray-100">
                                            {ticket.assignees.map((user, idx) => (
                                                <Tooltip key={idx} title={user.name}>
                                                    <Avatar
                                                        className="bg-blue-600 hover:scale-105 transition-transform border-2 border-white"
                                                        sx={{ width: 34, height: 34, fontSize: '0.8rem', fontWeight: 600 }}
                                                    >
                                                        {user.name?.split(' ').map(n => n[0]).join('')}
                                                    </Avatar>
                                                </Tooltip>
                                            ))}
                                        </AvatarGroup>

                                        <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-gray-50/30">
                                            {ticket.assignees.map((user, idx) => (
                                                <div key={idx} className="flex items-center gap-2.5 p-2 px-3 hover:bg-gray-50 transition-colors">
                                                    <Avatar
                                                        className="bg-blue-50 text-blue-600 font-semibold"
                                                        sx={{ width: 26, height: 26, fontSize: '0.7rem' }}
                                                    >
                                                        {user.name?.split(' ').map(n => n[0]).join('')}
                                                    </Avatar>
                                                    <span className="text-xs font-semibold text-gray-700 truncate">
                                                        {user.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50/20">
                                        <FontAwesomeIcon icon={faUsers} className="text-gray-300 text-2xl mb-1" />
                                        <Typography variant="body2" className="text-gray-400 italic">
                                            Unassigned
                                        </Typography>
                                    </div>
                                )
                            )}
                        </Paper>

                        {/* Watch List Card */}
                        {!isEditing && ticket.assignees && ticket.assignees.length > 0 && (
                            <Paper className="border border-gray-200 rounded-2xl shadow-sm bg-white p-5 space-y-4">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5 font-sans">
                                    <FontAwesomeIcon icon={faUsers} size="xs" /> Watch List
                                </label>
                                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-gray-50/30">
                                    {ticket.assignees.map((user, idx) => {
                                        const isChecked = user.send_mail !== 'N';
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-2 px-3 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Avatar
                                                        className="bg-blue-50 text-blue-600 font-semibold"
                                                        sx={{ width: 26, height: 26, fontSize: '0.7rem' }}
                                                    >
                                                        {user.name?.split(' ').map(n => n[0]).join('')}
                                                    </Avatar>
                                                    <span className="text-xs font-semibold text-gray-700 truncate font-sans">
                                                        {user.name}
                                                    </span>
                                                </div>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={isChecked}
                                                            onChange={async (e) => {
                                                                const newVal = e.target.checked ? 'Y' : 'N';
                                                                try {
                                                                    const res = await updateAssigneeSendMail(ticket.id, user.id, newVal);
                                                                    if (res.status === 200) {
                                                                        setTicket(prev => {
                                                                            if (!prev) return prev;
                                                                            const updatedAssignees = prev.assignees.map(a => 
                                                                                a.id === user.id ? { ...a, send_mail: newVal } : a
                                                                            );
                                                                            return { ...prev, assignees: updatedAssignees };
                                                                        });
                                                                        setAlert({ open: true, message: `Watchlist updated successfully`, type: "success" });
                                                                    } else {
                                                                        setAlert({ open: true, message: res.message || "Failed to update watchlist", type: "error" });
                                                                    }
                                                                } catch (err) {
                                                                    setAlert({ open: true, message: "Error updating watchlist", type: "error" });
                                                                }
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
                                                    label={<span className="text-[10px] text-[#5E6C84] font-sans">Send Mail</span>}
                                                    labelPlacement="start"
                                                    sx={{ margin: 0 }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </Paper>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
    setAlert
};

export default connect(mapStateToProps, mapDispatchToProps)(TicketViewPage);
