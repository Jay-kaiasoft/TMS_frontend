import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Avatar, Chip, LinearProgress } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp, faTicketAlt, faCheckCircle, faTasks, faClock } from '@fortawesome/free-solid-svg-icons';
import { connect } from 'react-redux';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getCookie, removeCookie } from '../utils/cookieHelper';

const Dashboard = ({ sessionEndModel }) => {
    const navigate = useNavigate();
    const token = getCookie('tms_token');

    if (!token) {
        navigate('/');
        return null;
    }

    const handleLogout = () => {
        removeCookie('tms_token');
        removeCookie('tms_user');
        navigate('/');
    };

    // Mock current date
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in-up">

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="relative overflow-hidden p-6 bg-white border border-[#DFE1E6] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-medium text-[#5E6C84] text-sm uppercase tracking-wider">Active Tickets</h3>
                            <p className="text-4xl font-bold mt-2 text-[#172B4D]">12</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-[#E9F2FF] text-[#0052CC] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FontAwesomeIcon icon={faTicketAlt} size="lg" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                        <span className="text-[#36B37E] flex items-center gap-1 font-medium bg-[#E3FCEF] px-2 py-0.5 rounded-md">
                            <FontAwesomeIcon icon={faArrowTrendUp} /> 8%
                        </span>
                        <span className="text-[#5E6C84]">vs last week</span>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-[#0052CC] to-[#4C9AFF]" />
                </div>

                {/* Card 2 */}
                <div className="relative overflow-hidden p-6 bg-white border border-[#DFE1E6] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-medium text-[#5E6C84] text-sm uppercase tracking-wider">Resolved This Week</h3>
                            <p className="text-4xl font-bold mt-2 text-[#172B4D]">45</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-[#E3FCEF] text-[#36B37E] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FontAwesomeIcon icon={faCheckCircle} size="lg" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                        <span className="text-[#36B37E] flex items-center gap-1 font-medium bg-[#E3FCEF] px-2 py-0.5 rounded-md">
                            <FontAwesomeIcon icon={faArrowTrendUp} /> 12%
                        </span>
                        <span className="text-[#5E6C84]">vs last week</span>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-[#36B37E] to-[#57D9A3]" />
                </div>

                {/* Card 3 */}
                <div className="relative overflow-hidden p-6 bg-white border border-[#DFE1E6] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-medium text-[#5E6C84] text-sm uppercase tracking-wider">Assigned To Me</h3>
                            <p className="text-4xl font-bold mt-2 text-[#172B4D]">3</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-[#FFF0B3] text-[#FF991F] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FontAwesomeIcon icon={faTasks} size="lg" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                        <span className="text-[#5E6C84]">2 high priority</span>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-[#FFAB00] to-[#FFC400]" />
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Activity */}
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

                {/* Performance or Workload */}
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

            </div>

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