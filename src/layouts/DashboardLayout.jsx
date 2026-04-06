import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faTimes,
    faBuilding,
    faTasks,
    faInfoCircle,
    faTicketAlt,
    faUsers,
    faSignOutAlt,
    faQuestionCircle,
    faBell,
    faChartPie,
    faAngleLeft,
    faUserShield
} from '@fortawesome/free-solid-svg-icons';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getNavigationMenu } from '../services/systemService';
import { CircularProgress } from '@mui/material';
import { getUserDetails } from '../utils/getUserDetails';
import PermissionWrapper from '../components/permissionWrapper/PermissionWrapper';
import { headerTitles, matchRoute } from '../utils/headerTitles';
import { connect } from 'react-redux';
import { setHeaderTitle } from '../redux/commonReducers/commonReducers';
import { getCookie, removeCookie } from '../utils/cookieHelper';

const iconMap = {
    "Dashboard": faChartPie,
    "Manage Department": faBuilding,
    "Manage Project": faTasks,
    "Manage Status": faInfoCircle,
    "Manage Tickets": faTicketAlt,
    "Manage User": faUsers,
    "Manage Role": faUserShield,
    "Manage Company": faBuilding
};

const DashboardLayout = ({ setHeaderTitle, headerTitle }) => {
    const userDetails = getUserDetails();

    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isMobileOpen, setMobileOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const [menuItems, setMenuItems] = useState([]);
    const [loadingMenu, setLoadingMenu] = useState(true);

    const navigate = useNavigate();
    const locaiton = useLocation()
    const currentPath = locaiton?.pathname

    useEffect(() => {
        const matched = headerTitles?.find((h) =>
            matchRoute(h.path, currentPath)
        )

        if (matched) {
            setHeaderTitle(matched.title)
        }
    }, [currentPath])

    useEffect(() => {
        const fetchNavigation = async () => {
            try {
                // We will decode the email from JWT manually or just fetch
                const token = getCookie('tms_token');
                if (!token) {
                    navigate('/');
                    return;
                }

                // Simulating decoding token to get email, since our backend needs user_email.
                // In real JWT, token parts are separated by dot
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const payload = JSON.parse(jsonPayload);
                const email = payload.sub;

                const res = await getNavigationMenu(email);
                setMenuItems(res.result.menu);
            } catch (err) {
                console.error("Failed to load navigation", err);
                // Fallback or error handling
            } finally {
                setLoadingMenu(false);
            }
        };
        fetchNavigation();
    }, [navigate]);

    const handleLogout = () => {
        removeCookie('tms_token');
        removeCookie('tms_user');
        navigate('/');
    };

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
    const toggleMobileSidebar = () => setMobileOpen(!isMobileOpen);

    return (
        <div className="flex h-screen bg-[#FAFBFC] overflow-hidden text-[#172B4D]">

            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={toggleMobileSidebar}
                />
            )}

            {/* Sidebar Architecture */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 bg-white border-r border-[#DFE1E6] transform transition-all duration-300 ease-in-out lg:relative 
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          flex flex-col shadow-[2px_0_8px_rgba(0,0,0,0.05)]
        `}
            >
                {/* Sidebar Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-[#DFE1E6] bg-[#FAFBFC]">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-[#0052CC] text-white flex items-center justify-center font-bold text-lg shrink-0">
                            T
                        </div>
                        {isSidebarOpen && <span className="font-bold text-[#172B4D] whitespace-nowrap">TMS</span>}
                    </div>

                    <button
                        onClick={toggleSidebar}
                        className="hidden lg:flex w-6 h-6 rounded bg-white border border-[#DFE1E6] items-center justify-center text-[#5E6C84] hover:bg-[#EBECF0] transition hover:text-[#172B4D] absolute -right-3 top-5 z-40 shadow-sm cursor-pointer"
                    >
                        <FontAwesomeIcon icon={isSidebarOpen ? faAngleLeft : faBars} className="text-xs" />
                    </button>
                </div>

                {/* Sidebar Menu Iteration (Based on Backend Array) */}
                <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
                    {loadingMenu ? (
                        <div className="flex justify-center my-10">
                            <CircularProgress size={24} sx={{ color: '#0052CC' }} />
                        </div>
                    ) : (
                        <nav className="space-y-4">
                            {menuItems?.map((section, idx) => (
                                <div key={idx}>
                                    {section.partition && isSidebarOpen && (
                                        <h3 className="px-4 text-xs font-bold text-[#8993A4] uppercase tracking-wider mb-2 mt-2">
                                            {section.partition}
                                        </h3>
                                    )}
                                    {section.partition && !isSidebarOpen && (
                                        <div className="border-t border-[#DFE1E6] my-3 mx-4"></div>
                                    )}

                                    <div className="space-y-1">
                                        {section?.items?.map((item) => (
                                            <div key={item.id}>
                                                <PermissionWrapper
                                                    functionalityName={item?.permission?.functionality_name}
                                                    moduleName={item?.permission?.module_name}
                                                    actionId={item?.permission?.actions[0]}
                                                    component={
                                                        <NavLink
                                                            to={`/dashboard${item.path}`}
                                                            end={item.path === ""}
                                                            className={({ isActive }) => `
                                        flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 group
                                        ${isActive
                                                                    ? 'bg-linear-to-r from-[#E9F2FF] to-transparent text-[#0052CC] font-semibold border-l-4 border-[#0052CC]'
                                                                    : 'text-[#42526E] hover:bg-[#EBECF0] hover:text-[#172B4D] border-l-4 border-transparent'}
                                    `}
                                                            title={!isSidebarOpen ? item.title : ""}
                                                        >
                                                            {({ isActive }) => (
                                                                <>
                                                                    <div className="flex items-center justify-center w-6 shrink-0">
                                                                        <FontAwesomeIcon
                                                                            icon={iconMap[item.title] || faQuestionCircle}
                                                                            className={isActive ? 'text-[#0052CC]' : 'text-[#6B778C] group-hover:text-[#42526E]'}
                                                                        />
                                                                    </div>

                                                                    {isSidebarOpen && (
                                                                        <span className="truncate whitespace-nowrap overflow-hidden">
                                                                            {item.title}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </NavLink>
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </nav>
                    )}
                </div>

                {/* Sidebar Footer (Logout) */}
                <div className="p-4 border-t border-[#DFE1E6] bg-white">
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className={`flex items-center w-full gap-3 px-3 py-3 rounded-xl text-[#DE350B] hover:bg-[#FFEBE6] transition-all duration-200 group border-l-4 border-transparent hover:border-[#DE350B] cursor-pointer`}
                        title={!isSidebarOpen ? "Log Out" : ""}
                    >
                        <div className="flex items-center justify-center w-6 shrink-0 group-hover:scale-110 transition-transform">
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </div>
                        {isSidebarOpen && <span className="font-semibold whitespace-nowrap">Log Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top Navbar */}
                <header className="h-16 bg-white border-b border-[#DFE1E6] shadow-sm items-center justify-between px-4 lg:px-8 z-10 hidden lg:flex">
                    <div>
                        <h1 className="font-bold text-[#172B4D] whitespace-nowrap text-xl">{headerTitle}</h1>
                    </div>
                    <div className="flex items-center gap-5">
                        <button className="relative p-2 text-[#5E6C84] hover:text-[#172B4D] hover:bg-[#EBECF0] rounded-full transition-colors cursor-pointer">
                            <FontAwesomeIcon icon={faBell} size="lg" />
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#DE350B] rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0052CC] to-[#4C9AFF] text-white flex items-center justify-center font-bold shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all ring-2 ring-white">
                            {
                                userDetails?.firstName.split(" ")[0][0] + userDetails?.lastName.split(" ")[0][0]
                            }
                        </div>
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="h-16 bg-white border-b border-[#DFE1E6] flex lg:hidden items-center justify-between px-4 z-10 shrink-0 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={toggleMobileSidebar} className="p-2 -ml-2 text-[#5E6C84] hover:text-[#172B4D] hover:bg-[#EBECF0] rounded-lg transition-colors">
                            <FontAwesomeIcon icon={faBars} size="lg" />
                        </button>
                        <div className="w-8 h-8 rounded bg-[#0052CC] text-white flex items-center justify-center font-bold text-lg shrink-0">
                            T
                        </div>
                        <span className="font-bold text-lg text-[#172B4D]">TMS</span>
                    </div>
                </header>

                {/* Page Content Rendered Here via Outlet */}
                <main className="flex-1 overflow-auto bg-[#FAFBFC] p-4 sm:p-6 lg:p-6">
                    <Outlet />
                </main>
            </div>

            <ConfirmDialog
                open={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                title="Log out of your account?"
                description="Are you sure you want to log out? Any unsaved changes might be lost."
                confirmText="Log Out"
                isDestructive={true}
            />
        </div>
    );
};

const mapStateToProps = (state) => ({
    headerTitle: state.common.headerTitle,
})

const mapDispatchToProps = {
    setHeaderTitle,
}

export default connect(mapStateToProps, mapDispatchToProps)(DashboardLayout)
