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
    faEdit, faSave
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
import PermissionWrapper from '../../components/permissionWrapper/PermissionWrapper';

import { useForm, Controller } from 'react-hook-form';
import CustomInput from '../../components/common/CustomInput';
import CustomSelect from '../../components/common/CustomSelect';
import RichTextEditor from '../../components/common/RichTextEditor';
import DragDropAttachmentUpload from '../../components/common/DragDropAttachmentUpload';
import HierarchySelect from '../../components/common/HierarchySelect';
import DatePickerComponent from '../../components/common/datePickerComponent';
import { getUserHierarchy, getAllUsers } from '../../services/userService';
import { getAllStatuses } from '../../services/statusService';
import { deleteTicketAttachment, uploadTicketAttachment } from '../../services/ticketAttachmentService';
import { upsertTodayTicketWork, getTodayTicketWork } from '../../services/todayTicketWorkService';

dayjs.extend(relativeTime);

const TicketViewPage = ({ setAlert }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const userData = getUserDetails();

    // Today's Work State
    const [workHours, setWorkHours] = useState('0');
    const [workMinutes, setWorkMinutes] = useState('00');
    const [workNote, setWorkNote] = useState('');
    const [isSavingWork, setIsSavingWork] = useState(false);

    const hourOptions = Array.from({ length: 11 }, (_, i) => String(i));
    const minuteOptions = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

    const fetchTodayWork = async () => {
        if (!userData?.id || !id) return;
        try {
            const todayStr = dayjs().format('YYYY-MM-DD');
            const res = await getTodayTicketWork(userData.id, id, todayStr);
            if (res.status === 200 && res.result && res.result.length > 0) {
                const log = res.result[0];
                setWorkHours(log.hours || '0');
                setWorkMinutes(log.minutes || '00');
                setWorkNote(log.note || '');
            } else {
                setWorkHours('0');
                setWorkMinutes('00');
                setWorkNote('');
            }
        } catch (err) {
            console.error("Failed to load today's work details", err);
        }
    };

    const handleSaveTodayWork = async () => {
        if (!id || !userData?.id) return;

        if (parseInt(workHours, 10) === 0 && parseInt(workMinutes, 10) === 0) {
            setAlert({ open: true, message: "Please specify work duration.", type: "warning" });
            return;
        }

        setIsSavingWork(true);
        try {
            const todayStr = dayjs().format('YYYY-MM-DD');
            const payload = {
                ticket_id: parseInt(id, 10),
                date: todayStr,
                hours: workHours,
                minutes: workMinutes,
                note: workNote
            };
            const res = await upsertTodayTicketWork(payload);
            if (res.status === 200) {
                setAlert({ open: true, message: "Today's work saved successfully!", type: "success" });
                fetchTodayWork();
            } else {
                setAlert({ open: true, message: res.message || "Failed to save work.", type: "error" });
            }
        } catch (err) {
            console.error("Error saving today's work:", err);
            setAlert({ open: true, message: err.message || "Error saving today's work.", type: "error" });
        } finally {
            setIsSavingWork(false);
        }
    };

    useEffect(() => {
        if (id && userData?.id) {
            fetchTodayWork();
        }
    }, [id, userData?.id]);

    // Core data state
    const [ticket, setTicket] = useState(null);
    const [commentsCount, setCommentsCount] = useState(0);
    const [projects, setProjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [departmentHierarchy, setDepartmentHierarchy] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    // React Hook Form initialization
    const { control, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            project_id: null,
            parent_ticket_id: null,
            department_id: null,
            title: '',
            description: '',
            priority: 'low',
            due_date: null,
            working_hours: null,
            user_type: 'as_customer',
            assignees: [],
            status_id: '',
            owner_id: null
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

    const getUsersByCompanyId = async () => {
        try {
            if (!watch('project_id')) {
                setUsers([]);
                return;
            }
            const selectedCompanyId = projects.find(p => p.id === watch('project_id'))?.company_id;
            if (selectedCompanyId) {
                const res = await getAllUsers(selectedCompanyId);
                const options = res.result?.map(u => ({ label: `${u.first_name} ${u.last_name}`, value: u.id }));
                setUsers(options || []);
            }
        } catch (err) {
            console.error("Failed to load users", err);
        }
    };

    useEffect(() => {
        getUsersByCompanyId();
    }, [watch('project_id'), projects]);

    const getUserNameById = (id) => {
        const findName = (nodes) => {
            for (const node of nodes) {
                if (String(node.id) === String(id)) {
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
                setStatusesList(formattedConfigs?.reverse());
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
        const formattedAssignees = (ticket.assignees || []).map(a => {
            return typeof a === 'object' ? a.id : a;
        });

        const initialSendMail = {};
        (ticket.assignees || []).forEach(a => {
            const id = typeof a === 'object' ? a.id : a;
            initialSendMail[id] = a.send_mail || 'Y';
        });
        setSendMailSettings(initialSendMail);

        reset({
            project_id: ticket.project_id || null,
            parent_ticket_id: ticket.parent_ticket_id || null,
            department_id: ticket.department_id || null,
            title: ticket.title || '',
            description: ticket.description || '',
            priority: ticket.priority || 'low',
            due_date: formattedDate,
            working_hours: ticket.working_hours || null,
            // user_type: isForCustomer ? 'for_customer' : 'as_customer',
            assignees: formattedAssignees,
            status_id: ticket.status_id || '',
            owner_id: ticket.owner_id || ticket.created_by || null
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

            if (payload.owner_id) {
                payload.for_customer = true;
                payload.as_customer = false;
            } else {
                payload.as_customer = true;
                payload.for_customer = false;
            }
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
    const isClosed = ticket?.status_name?.toLowerCase() === 'close';

    return (
        <div className="max-w-full mx-auto px-4 space-y-4 animate-fade-in font-sans text-slate-800">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
                        onClick={() => navigate('/dashboard/manage-tickets')}
                        className="normal-case text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                        sx={{ borderRadius: '8px', padding: '5px 12px', fontSize: '0.825rem' }}
                    >
                        Back
                    </Button>
                </div>
                {!isClosed && (
                    <PermissionWrapper
                        functionalityName="manage tickets"
                        moduleName="Tickets"
                        actionId={2}
                        component={
                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={handleCancelEdit}
                                            className="normal-case text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                            sx={{ borderRadius: '8px', padding: '5px 12px', fontSize: '0.825rem' }}
                                            disabled={isSubmitting || isUploadingFiles}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={handleSubmit(handleFormSubmit)}
                                            className="normal-case bg-[#0052CC] hover:bg-[#0747A6] text-white font-medium shadow-sm transition-all"
                                            sx={{ borderRadius: '8px', padding: '5px 14px', fontSize: '0.825rem' }}
                                            disabled={isSubmitting || isUploadingFiles}
                                            startIcon={(isSubmitting || isUploadingFiles) ? <CircularProgress size={14} color="inherit" /> : null}
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
                                        sx={{ borderRadius: '8px', padding: '5px 14px', fontSize: '0.825rem' }}
                                    >
                                        Edit Ticket
                                    </Button>
                                )}
                            </div>
                        }
                    />
                )}
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

                {/* Main Column */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Title Block */}
                    <div className="bg-white p-4 border-t-2 border-t-[#0052CC] border-x border-b border-slate-100 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05),0_10px_20px_-10px_rgba(0,0,0,0.04)] rounded-xl space-y-2.5 hover:shadow-md transition-all duration-300">
                        {isEditing ? (
                            <div className="space-y-3">
                                <CustomInput
                                    name="title"
                                    control={control}
                                    label="Ticket Title"
                                    rules={{ required: "Ticket title is required" }}
                                />
                            </div>
                        ) : (
                            <>
                                {/* {ticket.parent_ticket_id && (
                                    <div
                                        className="text-xs font-semibold text-[#0052CC] hover:underline cursor-pointer mb-1 flex items-center gap-1.5 select-none"
                                        onClick={() => navigate(`/dashboard/manage-tickets/view/${ticket.parent_ticket_id}`)}
                                    >
                                        <FontAwesomeIcon icon={faFolder} size="xs" />
                                        <span>Parent Ticket: {ticket.parent_ticket_no ? `[${ticket.parent_ticket_no}] ` : ''}{ticket.parent_ticket_title}</span>
                                    </div>
                                )} */}
                                <div className="flex items-start justify-between gap-4 py-0.5">
                                    <Typography variant="h5" className="font-bold text-slate-900 tracking-tight leading-tight select-none flex items-center gap-2 flex-wrap">
                                        {ticket.ticket_no && (
                                            <span className="bg-blue-50 text-[#0052CC] px-2 py-0.5 rounded text-xs font-mono font-bold border border-blue-100 shadow-sm">
                                                {ticket.ticket_no}
                                            </span>
                                        )}
                                        <span>{ticket.title}</span>
                                    </Typography>
                                </div>
                                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 pt-2.5 mt-2 border-t border-slate-50">
                                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100/80 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors select-none">
                                        <FontAwesomeIcon icon={faUser} className="text-slate-400" />
                                        <span>Opened by <span className="font-medium text-slate-700">{ticket.created_by_name || 'System'}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100/80 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors select-none">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400" />
                                        <span>Created {dayjs(ticket.created_date).format("MMMM D, YYYY")}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100/80 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors select-none">
                                        <FontAwesomeIcon icon={faComments} className="text-slate-400" />
                                        <span>{commentsCount} comment{commentsCount !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Description & Attachments Block */}
                    <Paper className="p-4 border border-slate-100 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05),0_10px_20px_-10px_rgba(0,0,0,0.04)] rounded-xl bg-white space-y-3 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="w-6.5 h-6.5 rounded-lg bg-blue-50/80 text-[#0052CC] flex items-center justify-center flex-shrink-0">
                                <FontAwesomeIcon icon={faFileAlt} size="xs" />
                            </div>
                            <span className="font-semibold text-slate-800 text-xs tracking-wider uppercase select-none">
                                Description
                                {/* & Attachments */}
                            </span>
                        </div>

                        <div className="pt-0.5 space-y-4">
                            {isEditing ? (
                                <>
                                    <RichTextEditor
                                        name="description"
                                        control={control}
                                        minimal={false}
                                    />
                                    {/* <div className="mt-6 pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2 mb-3 select-none">
                                            <FontAwesomeIcon icon={faPaperclip} className="text-slate-400" size="sm" />
                                            <span className="font-semibold text-slate-700 text-xs tracking-wider uppercase">
                                                Attachments ({editAttachments?.length || 0})
                                            </span>
                                        </div>
                                        <DragDropAttachmentUpload
                                            ref={attachmentRef}
                                            uploadApiFunction={uploadTicketAttachment}
                                            onUploadSuccess={handleUploadSuccess}
                                            existingAttachments={editAttachments}
                                            onDeleteExisting={handleDeleteAttachment}
                                            setAlert={setAlert}
                                        />
                                    </div> */}
                                </>
                            ) : (
                                <>
                                    {ticket.description ? (
                                        <div
                                            className="prose prose-sm max-w-none text-slate-800 leading-relaxed max-h-20"
                                            dangerouslySetInnerHTML={{ __html: ticket.description }}
                                        />
                                    ) : (
                                        <Typography variant="body2" className="text-slate-400 italic py-2">
                                            No description provided for this ticket.
                                        </Typography>
                                    )}

                                    {(ticket.attachments && ticket.attachments.length > 0) && (
                                        <div className="mt-6 pt-4 border-t border-slate-100">
                                            <div className="flex items-center gap-2 mb-3 select-none">
                                                <FontAwesomeIcon icon={faPaperclip} className="text-slate-400" size="sm" />
                                                <span className="font-semibold text-slate-700 text-xs tracking-wider uppercase">
                                                    Attachments ({ticket.attachments?.length || 0})
                                                </span>
                                            </div>
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
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Paper>

                    {/* Comments Section */}
                    <Paper className="p-4 border border-slate-100 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05),0_10px_20px_-10px_rgba(0,0,0,0.04)] rounded-xl bg-white space-y-3 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="w-6.5 h-6.5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <FontAwesomeIcon icon={faComments} size="xs" />
                            </div>
                            <span className="font-semibold text-slate-800 text-xs tracking-wider uppercase">
                                Comments ({commentsCount})
                            </span>
                        </div>

                        <CommentSection
                            ticketId={id}
                            onCommentsCountChange={(count) => setCommentsCount(count)}
                            isClosed={isClosed}
                        />
                    </Paper>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-4">

                    {/* Sticky Container */}
                    <div className="lg:sticky lg:top-4 space-y-4">

                        {/* Ticket Properties Card */}
                        <Paper className="border border-slate-100 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05),0_10px_20px_-10px_rgba(0,0,0,0.04)] rounded-xl bg-white p-4 space-y-4 hover:shadow-md transition-all duration-300">
                            <div className="border-b border-slate-100 pb-2 flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-500 flex items-center justify-center flex-shrink-0">
                                    <FontAwesomeIcon icon={faInfoCircle} size="xs" />
                                </div>
                                <span className="font-semibold text-slate-800 text-xs tracking-wider uppercase">
                                    Ticket Details
                                </span>
                            </div>

                            {isEditing ? (
                                <div className="space-y-3">
                                    {/* User Type Selector for non-Customers */}
                                    {/* {userData?.rolename !== "Customer" && (
                                        <div className="flex flex-col gap-1 pb-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                User Type
                                            </span>
                                            <Controller
                                                name="user_type"
                                                control={control}
                                                render={({ field }) => (
                                                    <RadioGroup
                                                        row
                                                        {...field}
                                                    >
                                                        <FormControlLabel value="as_customer" control={<Radio size="small" />} label={<span className="text-xs">As Customer</span>} />
                                                        <FormControlLabel value="for_customer" control={<Radio size="small" />} label={<span className="text-xs">For Customer</span>} />
                                                    </RadioGroup>
                                                )}
                                            />
                                        </div>
                                    )} */}

                                    {/* Status */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faTag} size="xs" /> Status
                                        </label>
                                        <CustomSelect
                                            name="status_id"
                                            control={control}
                                            options={statusesList}
                                            rules={{ required: "Status is required" }}
                                        />
                                    </div>

                                    {/* Priority */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faExclamationTriangle} size="xs" /> Priority
                                        </label>
                                        <CustomSelect
                                            name="priority"
                                            control={control}
                                            options={[
                                                { value: 'low', label: 'Low' },
                                                { value: 'medium', label: 'Medium' },
                                                { value: 'high', label: 'High' }
                                            ]}
                                            rules={{ required: "Priority is required" }}
                                        />
                                    </div>

                                    {/* Project */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faFolder} size="xs" /> Project
                                        </label>
                                        <CustomSelect
                                            name="project_id"
                                            control={control}
                                            options={projects.map(p => ({ label: p.name, value: p.id }))}
                                            rules={{ required: "Project is required" }}
                                        />
                                    </div>

                                    {/* Ticket Owner */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faUser} size="xs" /> Ticket Owner
                                        </label>
                                        <CustomSelect
                                            name="owner_id"
                                            control={control}
                                            options={users}
                                        />
                                    </div>

                                    {/* Department */}
                                    {userData?.rolename !== "Customer" && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                                <FontAwesomeIcon icon={faBuilding} size="xs" /> Department
                                            </label>
                                            <HierarchySelect
                                                name="department_id"
                                                control={control}
                                                label=""
                                                hierarchyData={departmentHierarchy}
                                                multiple={false}
                                                showDivider={false}
                                            />
                                        </div>
                                    )}

                                    {/* Due Date */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faCalendarAlt} size="xs" /> Due Date
                                        </label>
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
                                    </div>

                                    {/* Working Hours */}
                                    {/* {userData?.rolename !== "Customer" && ( */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faClock} size="xs" /> Estimated Hours
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
                                    {/* )} */}

                                    {selectedProjectId && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                                <FontAwesomeIcon icon={faFolder} size="xs" /> Parent Ticket
                                            </label>
                                            <CustomSelect
                                                name="parent_ticket_id"
                                                control={control}
                                                label=""
                                                options={projectTickets}
                                                disabled={projectTickets.length === 0}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-3.5 items-center text-xs">
                                    {/* Status details */}
                                    <span className="text-slate-500 font-medium flex items-center gap-1.5 select-none hover:text-[#0052CC] transition-colors">
                                        <FontAwesomeIcon icon={faTag} size="xs" className="text-slate-400" /> Status
                                    </span>
                                    <div className="hover:bg-slate-50/50 p-1 -m-1 rounded transition-colors select-none">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColorClass(ticket.status_name)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(ticket.status_name)} animate-pulse`} />
                                            {ticket.status_name || 'Unassigned'}
                                        </span>
                                    </div>

                                    {/* Priority details */}
                                    <span className="text-slate-500 font-medium flex items-center gap-1.5 select-none hover:text-[#0052CC] transition-colors">
                                        <FontAwesomeIcon icon={faExclamationTriangle} size="xs" className="text-slate-400" /> Priority
                                    </span>
                                    <div className="hover:bg-slate-50/50 p-1 -m-1 rounded transition-colors select-none">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                            ticket.priority?.toLowerCase() === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                            ticket.priority?.toLowerCase() === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            'bg-slate-50 text-slate-700 border-slate-200'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                ticket.priority?.toLowerCase() === 'high' ? 'bg-rose-500' :
                                                ticket.priority?.toLowerCase() === 'medium' ? 'bg-amber-500' :
                                                'bg-slate-500'
                                            }`} />
                                            {ticket.priority ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) : 'Low'}
                                        </span>
                                    </div>

                                    {/* Project details */}
                                    <span className="text-slate-500 font-medium flex items-center gap-1.5 select-none hover:text-[#0052CC] transition-colors">
                                        <FontAwesomeIcon icon={faFolder} size="xs" className="text-slate-400" /> Project
                                    </span>
                                    <div className="hover:bg-slate-50/50 p-1 -m-1 rounded transition-colors select-none">
                                        <span className="font-semibold text-slate-700">
                                            {getProjectName(ticket.project_id)}
                                        </span>
                                    </div>

                                    {/* Owner details */}
                                    {ticket.owner_name && (
                                        <>
                                            <span className="text-slate-500 font-medium flex items-center gap-1.5 select-none hover:text-[#0052CC] transition-colors">
                                                <FontAwesomeIcon icon={faUser} size="xs" className="text-slate-400" /> Owner
                                            </span>
                                            <div className="hover:bg-slate-50/50 p-1 -m-1 rounded transition-colors select-none">
                                                <span className="font-semibold text-slate-700">
                                                    {ticket.owner_name}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {/* Department details */}
                                    {ticket.department_id && (
                                        <>
                                            <span className="text-slate-500 font-medium flex items-center gap-1.5 select-none hover:text-[#0052CC] transition-colors">
                                                <FontAwesomeIcon icon={faBuilding} size="xs" className="text-slate-400" /> Department
                                            </span>
                                            <div className="hover:bg-slate-50/50 p-1 -m-1 rounded transition-colors select-none min-w-0">
                                                <span className="font-semibold text-slate-700 truncate block" title={getDepartmentName(ticket.department_id)}>
                                                    {getDepartmentName(ticket.department_id)}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {/* Due Date Badge */}
                                    <span className="text-slate-500 font-medium flex items-center gap-1.5 select-none hover:text-[#0052CC] transition-colors">
                                        <FontAwesomeIcon icon={faCalendarAlt} size="xs" className="text-slate-400" /> Due Date
                                    </span>
                                    <div className="hover:bg-slate-50/50 p-1 -m-1 rounded transition-colors flex flex-wrap items-center gap-1.5 select-none">
                                        <span className={`font-semibold ${isOverdue ? 'text-rose-600' : isToday ? 'text-amber-600' : 'text-slate-700'}`}>
                                            {formattedDueDate}
                                        </span>
                                        {relativeDueDate && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${isOverdue ? 'bg-rose-50 text-rose-700 border border-rose-100 shadow-sm' : isToday ? 'bg-amber-50 text-amber-700 border border-amber-100 shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                                {relativeDueDate}
                                            </span>
                                        )}
                                    </div>

                                    {/* Working Hours */}
                                    {ticket.working_hours && (
                                        <>
                                            <span className="text-slate-500 font-medium flex items-center gap-1.5 select-none hover:text-[#0052CC] transition-colors">
                                                <FontAwesomeIcon icon={faClock} size="xs" className="text-slate-400" /> Estimated Hours
                                            </span>
                                            <div className="hover:bg-slate-50/50 p-1 -m-1 rounded transition-colors select-none">
                                                <span className="font-semibold text-slate-700">
                                                    {ticket.working_hours} hours
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {/* Parent Tickets details */}
                                    {ticket.parent_ticket_id && (
                                        <>
                                            <span className="text-slate-500 font-medium flex items-center gap-1.5 select-none hover:text-[#0052CC] transition-colors">
                                                <FontAwesomeIcon icon={faFolder} size="xs" className="text-slate-400" /> Parent Ticket
                                            </span>
                                            <div className="hover:bg-slate-50/50 p-1 -m-1 rounded transition-colors select-none min-w-0" onClick={() => navigate(`/dashboard/manage-tickets/view/${ticket.parent_ticket_id}`)}>
                                                <span className="font-semibold text-[#0052CC] truncate block underline cursor-pointer" title={ticket.parent_ticket_title}>
                                                    {ticket.parent_ticket_title}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </Paper>

                        {/* People Card (Merged Assignees and Watch List) */}
                        <Paper className="border border-slate-100 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05),0_10px_20px_-10px_rgba(0,0,0,0.04)] rounded-xl bg-white p-4 space-y-3 hover:shadow-md transition-all duration-300">
                            <div className="border-b border-slate-100 pb-2 flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-500 flex items-center justify-center flex-shrink-0">
                                    <FontAwesomeIcon icon={faUsers} size="xs" />
                                </div>
                                <span className="font-semibold text-slate-800 text-xs tracking-wider uppercase">
                                    People
                                </span>
                            </div>

                            {isEditing ? (
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Assignees ({watch('assignees')?.length || 0})
                                        </label>
                                        <HierarchySelect
                                            name="assignees"
                                            control={control}
                                            label=""
                                            hierarchyData={hierarchyData}
                                            rules={{ validate: (value) => value && value.length > 0 || "Assign users is required" }}
                                            limitTags={0}
                                        />
                                    </div>

                                    {selectedAssigneeIds.length > 0 && (
                                        <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                                            <h4 className="text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-sans">Watch List</h4>
                                            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                                                {selectedAssigneeIds.map(id => {
                                                    const name = getUserNameById(id);
                                                    const isChecked = sendMailSettings[id] !== 'N';
                                                    return (
                                                        <div key={id} className="flex items-center justify-between py-1 px-2 bg-white rounded border border-slate-200 hover:border-blue-400 transition-colors shadow-sm">
                                                            <span className="text-xs font-medium text-slate-700 font-sans truncate pr-2">{name}</span>
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
                                                                            padding: '2px',
                                                                            color: '#94a3b8',
                                                                            '&.Mui-checked': {
                                                                                color: '#0052CC',
                                                                            },
                                                                        }}
                                                                        disabled={isClosed}
                                                                    />
                                                                }
                                                                label={<span className="text-[9px] text-slate-500 font-medium font-sans">Send Mail</span>}
                                                                labelPlacement="start"
                                                                sx={{ margin: 0 }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {ticket.assignees && ticket.assignees.length > 0 ? (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-500">
                                                    Assignees ({ticket.assignees.length})
                                                </span>
                                                <AvatarGroup max={4} className="border-slate-100">
                                                    {ticket?.assignees?.map((user, idx) => (
                                                        <Tooltip key={idx} title={user.name}>
                                                            <Avatar
                                                                className="bg-primary-500 hover:scale-105 transition-transform border border-white shadow-sm"
                                                                sx={{ width: 24, height: 24, fontSize: '0.65rem', fontWeight: 600 }}
                                                            >
                                                                {user.name?.split(' ').map(n => n[0]).join('')}
                                                            </Avatar>
                                                        </Tooltip>
                                                    ))}
                                                </AvatarGroup>
                                            </div>

                                            <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden bg-slate-50/20 shadow-sm">
                                                {ticket?.assignees?.map((user, idx) => {
                                                    const isChecked = user.send_mail !== 'N';
                                                    return (
                                                        <div key={idx} className="flex items-center justify-between p-1.5 px-2.5 bg-slate-50/40 hover:bg-slate-50 border-b border-slate-100/60 transition-colors last:border-b-0">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <Avatar
                                                                    className="bg-primary-50 text-[#0052CC] font-semibold border border-blue-100"
                                                                    sx={{ width: 22, height: 22, fontSize: '0.6rem' }}
                                                                >
                                                                    {user.name?.split(' ').map(n => n[0]).join('')}
                                                                </Avatar>
                                                                <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px] select-none">
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
                                                                            padding: '2px',
                                                                            color: '#94a3b8',
                                                                            '&.Mui-checked': {
                                                                                color: '#337fff',
                                                                            },
                                                                        }}
                                                                        disabled={isClosed || !PermissionWrapper.hasPermission({
                                                                            functionalityName: "manage tickets",
                                                                            moduleName: "Tickets",
                                                                            actionId: 2
                                                                        })}
                                                                    />
                                                                }
                                                                label={<span className="text-[9px] text-slate-500 font-medium font-sans">Send Email</span>}
                                                                labelPlacement="start"
                                                                sx={{ margin: 0 }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="border border-dashed border-slate-200 rounded-lg p-3 text-center bg-slate-50/20">
                                            <FontAwesomeIcon icon={faUsers} className="text-slate-300 text-lg mb-1" />
                                            <Typography variant="body2" className="text-slate-400 text-xs italic">
                                                Unassigned
                                            </Typography>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Paper>

                        {/* Todays Work Card */}
                        <Paper className="border border-slate-100 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05),0_10px_20px_-10px_rgba(0,0,0,0.04)] rounded-xl bg-white p-4 space-y-4 hover:shadow-md transition-all duration-300">
                            <div className="border-b border-slate-100 pb-2 flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded bg-slate-50 text-slate-500 flex items-center justify-center flex-shrink-0">
                                    <FontAwesomeIcon icon={faClock} size="xs" />
                                </div>
                                <span className="font-semibold text-slate-800 text-xs tracking-wider uppercase">
                                    Todays Work
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-2 items-center text-xs">
                                    <span className="text-slate-500 font-medium w-10 text-right">Hour:</span>
                                    <div className="flex flex-wrap items-center gap-2 flex-1">
                                        <select
                                            value={workHours}
                                            onChange={(e) => setWorkHours(e.target.value)}
                                            className="border border-slate-200 rounded p-1 px-1.5 bg-white text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
                                        >
                                            {hourOptions.map(h => (
                                                <option key={h} value={h}>{h}</option>
                                            ))}
                                        </select>

                                        <span className="text-slate-500 font-medium ml-1">Min:</span>
                                        <select
                                            value={workMinutes}
                                            onChange={(e) => setWorkMinutes(e.target.value)}
                                            className="border border-slate-200 rounded p-1 px-1.5 bg-white text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
                                        >
                                            {minuteOptions.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>

                                        <input
                                            type="text"
                                            value={dayjs().format('YYYY-MM-DD')}
                                            disabled
                                            className="border border-slate-100 rounded p-1 px-2 bg-slate-50 text-xs w-24 text-center cursor-not-allowed text-slate-400 font-medium ml-1"
                                        />

                                        <Tooltip title="Save Work Log">
                                            <button
                                                onClick={handleSaveTodayWork}
                                                disabled={isSavingWork}
                                                className="w-7 h-7 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#0052CC] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 ml-auto"
                                            >
                                                {isSavingWork ? (
                                                    <CircularProgress size={14} color="inherit" />
                                                ) : (
                                                    <FontAwesomeIcon icon={faSave} size="sm" />
                                                )}
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>

                                <div className="flex gap-2 items-start text-xs">
                                    <span className="text-slate-500 font-medium pt-1.5 w-10 text-right">Note:</span>
                                    <textarea
                                        value={workNote}
                                        onChange={(e) => setWorkNote(e.target.value)}
                                        placeholder="Enter details of your work..."
                                        rows={3}
                                        className="flex-1 border border-slate-200 rounded p-2 text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 resize-y min-h-[60px]"
                                    />
                                </div>
                            </div>
                        </Paper>
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
