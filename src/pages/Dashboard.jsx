import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button, Avatar, Chip, LinearProgress, Tooltip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp, faTicketAlt, faCheckCircle, faTasks, faClock } from '@fortawesome/free-solid-svg-icons';
import { connect } from 'react-redux';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getCookie, removeCookie } from '../utils/cookieHelper';
import { getDashboardData } from '../services/authService';

const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        if (includeTime) {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        }
        return `${day}/${month}/${year}`;
    } catch (e) {
        return "-";
    }
};

const isOverdue = (dateString) => {
    if (!dateString) return false;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    } catch (e) {
        return false;
    }
};

const Dashboard = ({ sessionEndModel }) => {
    const navigate = useNavigate();
    const token = getCookie('tms_token');
    const [data, setData] = useState(null);

    if (!token) {
        navigate('/');
        return null;
    }

    const handleGetDashboardData = async () => {
        const res = await getDashboardData();
        if (res.status === 200) {
            setData(res?.result)
        }
    }

    useEffect(() => {
        handleGetDashboardData();
    }, [])
    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in-up">

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Tooltip
                    title={
                        data?.assigned_tickets?.length > 0 ? (
                            <div className="p-1 space-y-2">
                                <div className="font-bold text-xs border-b border-gray-100 pb-1.5 text-[#5E6C84] uppercase tracking-wider">
                                    Assigned Tickets
                                </div>
                                <ul className="m-0 pl-3 list-disc space-y-1.5">
                                    {data.assigned_tickets.map((t) => (
                                        <li key={t.id} className="text-xs font-semibold text-[#172B4D] leading-relaxed">
                                            <NavLink to={`/dashboard/manage-tickets/view/${t.id}`} className="text-[#0052CC] font-mono mr-1 cursor-pointer">{t.ticket_no}</NavLink>: {t.title}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : "No tickets assigned"
                    }
                    arrow
                    placement="right"
                    slotProps={{
                        tooltip: {
                            sx: {
                                backgroundColor: '#ffffff',
                                color: '#172B4D',
                                boxShadow: '0px 8px 24px rgba(9, 30, 66, 0.15), 0px 0px 1px rgba(9, 30, 66, 0.31)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                maxWidth: '320px',
                                border: '1px solid #DFE1E6'
                            }
                        },
                        arrow: {
                            sx: {
                                color: '#ffffff'
                            }
                        }
                    }}
                >
                    <div
                        className="relative overflow-hidden p-6 bg-white border border-[#DFE1E6] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                        onClick={() => navigate('/dashboard/manage-tickets')}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-medium text-[#5E6C84] text-sm uppercase tracking-wider">Assigned To Me</h3>
                                <p className="text-4xl font-bold mt-2 text-[#172B4D]">{data?.assigned_tickets_count}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-[#FFF0B3] text-[#FF991F] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <FontAwesomeIcon icon={faTasks} size="lg" />
                            </div>
                        </div>
                        {/* <div className="mt-4 flex items-center gap-2 text-sm">
                            <span className="text-[#5E6C84]">2 high priority</span>
                        </div> */}
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-[#FFAB00] to-[#FFC400]" />
                    </div>
                </Tooltip>
            </div>

            {/* Unanswered Tickets Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-[#172B4D]">Unanswered Tickets</h2>
                    {data?.unanswered_tickets?.length > 0 && (
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFEBE6] text-[#DE350B]">
                            {data.unanswered_tickets.length}
                        </span>
                    )}
                </div>

                {!data?.unanswered_tickets || data.unanswered_tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-[#DFE1E6] rounded-2xl shadow-sm">
                        <div className="w-16 h-16 bg-[#E3FCEF] rounded-full flex items-center justify-center mb-4 text-[#36B37E]">
                            <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#172B4D] mb-1">All caught up!</h3>
                        <p className="text-[#5E6C84]">No unanswered tickets assigned to you.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white border border-[#DFE1E6] rounded-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[#DFE1E6]">
                                    <thead className="bg-[#FAFBFC]">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">Ticket ID</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">Title</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">Project</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">Department</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">Created By</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">Last Post</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-[#DFE1E6]">
                                        {data?.unanswered_tickets?.map((ticket) => (
                                            <tr
                                                key={ticket.id}
                                                className="hover:bg-[#FAFBFC] transition-colors cursor-pointer group"
                                                onClick={() => navigate(`/dashboard/manage-tickets/view/${ticket.id}`)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#0052CC] hover:underline">
                                                    {ticket.ticket_no}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#172B4D] group-hover:text-[#0052CC] transition-colors">
                                                    {ticket.title}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5E6C84]">
                                                    {ticket.project_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5E6C84]">
                                                    {ticket.department_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E9F2FF] text-[#0052CC]">
                                                        {ticket.status_name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5E6C84]">
                                                    {ticket.created_by_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5E6C84]">
                                                    {formatDate(ticket.last_post_date, true)}
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${isOverdue(ticket.due_date) ? 'text-[#DE350B] font-semibold' : 'text-[#5E6C84]'}`}>
                                                    {formatDate(ticket.due_date)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {data.unanswered_tickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="p-5 bg-white border border-[#DFE1E6] rounded-2xl shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
                                    onClick={() => navigate(`/dashboard/manage-tickets/view/${ticket.id}`)}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm font-bold text-[#0052CC]">{ticket.ticket_no}</span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E9F2FF] text-[#0052CC]">
                                            {ticket.status_name}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-base text-[#172B4D] mb-3 line-clamp-2 hover:text-[#0052CC] transition-colors">{ticket.title}</h4>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs border-t border-[#F4F5F7] pt-4">
                                        <div>
                                            <span className="text-[#8993A4] block font-medium mb-0.5">Project</span>
                                            <span className="text-[#172B4D] font-semibold">{ticket.project_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#8993A4] block font-medium mb-0.5">Department</span>
                                            <span className="text-[#172B4D] font-semibold">{ticket.department_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#8993A4] block font-medium mb-0.5">Created By</span>
                                            <span className="text-[#172B4D] font-semibold">{ticket.created_by_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#8993A4] block font-medium mb-0.5">Due Date</span>
                                            <span className={`font-semibold ${isOverdue(ticket.due_date) ? 'text-[#DE350B]' : 'text-[#172B4D]'}`}>{formatDate(ticket.due_date)}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-[#8993A4] block font-medium mb-0.5">Last Comment</span>
                                            <span className="text-[#172B4D] font-semibold">{formatDate(ticket.last_post_date, true)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Section
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">    
                <div className="lg:col-span-2 bg-white border border-[#DFE1E6] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-[#DFE1E6] flex justify-between items-center bg-[#FAFBFC]">
                        <h2 className="text-lg font-semibold text-[#172B4D]">Recent Activity</h2>
                        <Button size="small" sx={{ textTransform: 'none', fontWeight: 600 }}>View All</Button>
                    </div>
                    <div className="p-0 flex-1">
                        {[
                            { id: 'TMS-104', type: 'Status updated', title: 'Database optimization', status: 'In Progress', time: '10 mins ago', color: 'info' },
                            { id: 'TMS-105', type: 'Comment added', title: 'Fix login screen alignment', status: 'To Do', time: '1 hour ago', color: 'default' },
                            { id: 'TMS-098', type: 'Ticket resolved', title: 'Email notification bug', status: 'Done', time: '2 hours ago', color: 'success' },
                            { id: 'TMS-102', type: 'New ticket', title: 'Update dependencies to latest versions', status: 'To Do', time: '4 hours ago', color: 'default' }
                        ].map((activity, idx) => (
                            <div key={idx} className="flex gap-4 p-4 md:p-6 border-b border-[#F4F5F7] hover:bg-[#FAFBFC] transition-colors last:border-0 items-center">
                                <div className="hidden sm:flex w-10 h-10 rounded-full bg-[#EBECF0] items-center justify-center text-[#5E6C84] shrink-0">
                                    <FontAwesomeIcon icon={activity.color === 'success' ? faCheckCircle : faClock} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-[#0052CC] text-sm">{activity.id}</span>
                                        <span className="text-xs text-[#5E6C84]">• {activity.time}</span>
                                    </div>
                                    <p className="text-[#172B4D] font-medium truncate">{activity.title}</p>
                                    <p className="text-[#5E6C84] text-sm mt-0.5">{activity.type}</p>
                                </div>
                                <div>
                                    <Chip label={activity.status} size="small" color={activity.color} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>                
                <div className="bg-white border border-[#DFE1E6] rounded-2xl shadow-sm p-6 flex flex-col">
                    <h2 className="text-lg font-semibold text-[#172B4D] mb-6">Current Workload</h2>

                    <div className="space-y-6 flex-1">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-[#172B4D]">Backend Development</span>
                                <span className="text-[#5E6C84]">70%</span>
                            </div>
                            <LinearProgress variant="determinate" value={70} sx={{ height: 8, borderRadius: 4, backgroundColor: '#EBECF0', '& .MuiLinearProgress-bar': { backgroundColor: '#0052CC' } }} />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-[#172B4D]">Frontend UI Tasks</span>
                                <span className="text-[#5E6C84]">45%</span>
                            </div>
                            <LinearProgress variant="determinate" value={45} sx={{ height: 8, borderRadius: 4, backgroundColor: '#EBECF0', '& .MuiLinearProgress-bar': { backgroundColor: '#FFAB00' } }} />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-[#172B4D]">Bug Fixes</span>
                                <span className="text-[#5E6C84]">90%</span>
                            </div>
                            <LinearProgress variant="determinate" value={90} sx={{ height: 8, borderRadius: 4, backgroundColor: '#EBECF0', '& .MuiLinearProgress-bar': { backgroundColor: '#36B37E' } }} />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-[#172B4D]">DevOps & Infrastructure</span>
                                <span className="text-[#5E6C84]">20%</span>
                            </div>
                            <LinearProgress variant="determinate" value={20} sx={{ height: 8, borderRadius: 4, backgroundColor: '#EBECF0', '& .MuiLinearProgress-bar': { backgroundColor: '#FF5630' } }} />
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-[#DFE1E6]">
                        <div className="flex items-center gap-3">
                            <Avatar sx={{ bgcolor: '#0052CC', width: 40, height: 40, fontSize: '1rem', fontWeight: 600 }}>T</Avatar>
                            <div>
                                <p className="text-[#172B4D] font-semibold text-sm">TMS Team</p>
                                <p className="text-[#5E6C84] text-xs">Project Alpha</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}

            <ConfirmDialog
                open={sessionEndModel}
                onConfirm={() => navigate("/login")}
                title="Session Expired"
                description="Your session has expired. Please log in to continue."
                confirmText="Login"
                isDestructive={true}
                closeIcon={false}
            />
        </div>
    );
};

const mapStateToProps = (state) => ({
    sessionEndModel: state.common.sessionEndModel,
})

export default connect(mapStateToProps)(Dashboard)