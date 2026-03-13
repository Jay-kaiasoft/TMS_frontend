import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import SetPassword from './pages/Auth/SetPassword';
import ForgotPassword from './pages/Auth/ForgotPassword';

import DashboardLayout from './layouts/DashboardLayout';
import DashboardOverview from './pages/Dashboard';
import ManageUsers from './pages/Users/ManageUsers';
import ManageDepartments from './pages/Departments/ManageDepartments';
import ManageStatus from './pages/Status/ManageStatus';
import ManageProjects from './pages/Projects/ManageProjects';
import ManageTickets from './pages/Tickets/ManageTickets';
import ManageRoles from './pages/Roles/ManageRoles';
import RoleFormPage from './pages/Roles/RoleFormPage';
import ManageCompanies from './pages/Companies/ManageCompanies';
import Loader from './components/common/loader/loader';

const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/login" replace />
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/set-password",
        element: <SetPassword />
    },
    {
        path: "/forgot-password",
        element: <ForgotPassword />
    },
    {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
            {
                index: true,
                element: <DashboardOverview />
            },
            {
                path: "manage-user",
                element: <ManageUsers />
            },
            {
                path: "manage-tickets",
                element: <ManageTickets />
            },
            {
                path: "manage-department",
                element: <ManageDepartments />
            },
            {
                path: "manage-project",
                element: <ManageProjects />
            },
            {
                path: "manage-status",
                element: <ManageStatus />
            },
            {
                path: "manage-role",
                element: <ManageRoles />
            },
            {
                path: "manage-role/add",
                element: <RoleFormPage />
            },
            {
                path: "manage-role/edit/:id",
                element: <RoleFormPage />
            },
            {
                path: "manage-company",
                element: <ManageCompanies />
            }
        ]
    }
]);

const AppRoutes = () => {
    return <RouterProvider router={router} fallbackElement={<Loader />} />;
};

export default AppRoutes;
