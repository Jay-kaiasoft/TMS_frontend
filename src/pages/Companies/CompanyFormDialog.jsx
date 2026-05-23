import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useForm } from 'react-hook-form';
import { connect } from 'react-redux';
import { CircularProgress, Stepper, Step, StepLabel, Tooltip, IconButton, Chip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faEdit,
    faTrash,
    faEnvelope,
    faPhone,
    faMapMarkerAlt,
    faUserShield,
    faKey,
    faChevronLeft,
    faChevronRight,
    faCheck,
    faBuilding
} from '@fortawesome/free-solid-svg-icons';

import CustomInput from '../../components/common/CustomInput';
import CustomModalWrapper from '../../components/common/CustomModalWrapper';
import LogoUpload from '../../components/common/LogoUpload';
import CustomButton from '../../components/common/CustomButton';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import { getCompanyById, createCompany, updateCompany } from '../../services/companyService';
import { getAllUsers, deleteUser, sendUserCredentials } from '../../services/userService';
import { setAlert } from '../../redux/commonReducers/commonReducers';
import PermissionWrapper from '../../components/permissionWrapper/PermissionWrapper';

// Lazy-load UserFormDialog to break the circular dependency
const UserFormDialog = lazy(() => import('../Users/UserFormDialog'));

const steps = ['Company Details', 'Contact Details'];

const rolesMap = {
    1: { name: 'Administrator', color: 'error' },
    2: { name: 'Developer', color: 'info' },
    3: { name: 'Customer', color: 'default' },
    4: { name: 'Manager', color: 'success' },
    5: { name: 'Manager', color: 'success' }
};

const CompanyFormDialog = ({
    open,
    onClose,
    onSave,
    editingCompanyId,
    setAlert
}) => {
    const {
        control,
        handleSubmit,
        reset,
        setValue,
        trigger,
        getValues,
    } = useForm({
        defaultValues: {
            company_name: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            country: '',
            zip: '',
            logo: undefined,
        }
    });

    const [activeStep, setActiveStep] = useState(0);
    const [localCompanyId, setLocalCompanyId] = useState(editingCompanyId);

    const [loadingData, setLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingLogoUrl, setExistingLogoUrl] = useState(null);

    // Step 2 Users state
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // User Form Dialog state
    const [userFormOpen, setUserFormOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    // Delete User state
    const [deleteUserConfirmOpen, setDeleteUserConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Synchronize editingCompanyId prop with local states when opened
    useEffect(() => {
        if (open) {
            setLocalCompanyId(editingCompanyId);
            setActiveStep(0);
            setUsers([]);

            if (editingCompanyId) {
                setLoadingData(true);
                getCompanyById(editingCompanyId).then(res => {
                    const c = res.result;
                    reset({
                        company_name: c.company_name || '',
                        email: c.email || '',
                        phone: c.phone || '',
                        address: c.address || '',
                        city: c.city || '',
                        state: c.state || '',
                        country: c.country || '',
                        zip: c.zip || '',
                        logo: c.logo || undefined,
                    });
                    setExistingLogoUrl(c.logo || null);
                }).catch(err => {
                    console.error("Failed to load company", err);
                    setAlert({ open: true, message: "Failed to load company data.", type: "error" });
                }).finally(() => {
                    setLoadingData(false);
                });
            } else {
                reset({
                    company_name: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    state: '',
                    country: '',
                    zip: '',
                    logo: undefined,
                });
                setExistingLogoUrl(null);
            }
        }
    }, [open, editingCompanyId, reset, setAlert]);

    // Fetch company users for Step 2
    const fetchCompanyUsers = async () => {
        if (!localCompanyId) return;
        setLoadingUsers(true);
        try {
            const res = await getAllUsers(localCompanyId);
            setUsers(res.result || []);
        } catch (err) {
            console.error("Failed to load company users", err);
            setAlert({ open: true, message: "Failed to load contact details.", type: "error" });
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        if (activeStep === 1 && localCompanyId) {
            fetchCompanyUsers();
        }
    }, [activeStep, localCompanyId]);

    // Handle closing the dialog
    const handleCloseDialog = () => {
        if (isSubmitting) return;
        // If a company was created or updated, refresh the parent list
        if (localCompanyId) {
            onSave();
        } else {
            onClose();
        }
    };

    // Step 1: Validate and Save Company Info then proceed to Step 2
    const handleNext = async () => {
        const isValid = await trigger();
        if (!isValid) return;

        setIsSubmitting(true);
        try {
            const data = getValues();
            const formData = new FormData();
            formData.append('company_name', data.company_name);
            if (data.email) formData.append('email', data.email);
            if (data.phone) formData.append('phone', data.phone);
            if (data.address) formData.append('address', data.address);
            if (data.city) formData.append('city', data.city);
            if (data.state) formData.append('state', data.state);
            if (data.country) formData.append('country', data.country);
            if (data.zip) formData.append('zip', data.zip);

            // Handle logo
            if (data.logo instanceof File) {
                formData.append('logo', data.logo);
            } else if (data.logo === null && existingLogoUrl) {
                formData.append('remove_logo', 'true');
            }

            if (localCompanyId) {
                const res = await updateCompany(localCompanyId, formData);
                if (res.status !== 200) {
                    setAlert({ open: true, message: "Failed to update company.", type: "error" });
                    return;
                }
            } else {
                const res = await createCompany(formData);
                const newCompanyId = res.result?.id;
                if (!newCompanyId) {
                    setAlert({ open: true, message: "Failed to create company.", type: "error" });
                    return;
                }
                setLocalCompanyId(newCompanyId);
            }
            setActiveStep(1);
        } catch (err) {
            const errorMsg = err?.response?.data?.detail || err?.message || "Failed to save company details.";
            setAlert({ open: true, message: errorMsg, type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        setActiveStep(0);
    };

    const handleFinish = () => {
        onSave();
    };

    // User Operations in Step 2
    const handleOpenUserDialog = (userId = null) => {
        setEditingUserId(userId);
        setUserFormOpen(true);
    };

    const handleCloseUserDialog = () => {
        setUserFormOpen(false);
        setEditingUserId(null);
    };

    const handleUserSuccess = () => {
        fetchCompanyUsers();
        handleCloseUserDialog();
    };

    const confirmDeleteUser = (user) => {
        setUserToDelete(user);
        setDeleteUserConfirmOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await deleteUser(userToDelete.id);
            setDeleteUserConfirmOpen(false);
            setUserToDelete(null);
            setAlert({ open: true, message: "User deleted successfully.", type: "success" });
            fetchCompanyUsers();
        } catch (error) {
            setAlert({
                message: error.message || "Failed to delete user",
                type: "error",
                open: true
            });
        }
    };

    const handleSendUserCredentials = async (user) => {
        setLoadingUsers(true);
        try {
            await sendUserCredentials(user.id);
            setAlert({
                message: `Credentials sent successfully to ${user.first_name} (${user.email})`,
                type: "success",
                open: true
            });
        } catch (error) {
            setAlert({
                message: error.message || "Failed to send credentials",
                type: "error",
                open: true
            });
        } finally {
            setLoadingUsers(false);
        }
    };

    return (
        <CustomModalWrapper
            open={open}
            onClose={handleCloseDialog}
            title={localCompanyId ? 'Edit Company' : 'Add New Company'}
            showFooter={false}
            maxWidth="md"
        >
            <div className="flex flex-col gap-6">
                {/* Stepper */}
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Form or Table Content */}
                {loadingData ? (
                    <div className="flex justify-center p-12">
                        <CircularProgress size={40} sx={{ color: '#0052CC' }} />
                    </div>
                ) : activeStep === 0 ? (
                    <form id="company-form" onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="flex flex-col gap-4">
                        <div className='flex justify-center'>
                            <LogoUpload
                                name="logo"
                                control={control}
                                existingUrl={existingLogoUrl}
                            />
                        </div>

                        <CustomInput
                            name="company_name"
                            control={control}
                            label="Company Name"
                            rules={{ required: "Company name is required" }}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                            <CustomInput
                                name="email"
                                control={control}
                                label="Email"
                                type="email"
                            />
                            <CustomInput
                                name="phone"
                                control={control}
                                label="Phone"
                            />
                        </div>

                        <CustomInput
                            name="address"
                            control={control}
                            label="Address"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                            <CustomInput
                                name="city"
                                control={control}
                                label="City"
                            />
                            <CustomInput
                                name="state"
                                control={control}
                                label="State"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                            <CustomInput
                                name="country"
                                control={control}
                                label="Country"
                            />
                            <CustomInput
                                name="zip"
                                control={control}
                                label="ZIP Code"
                            />
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-end items-center">
                            <PermissionWrapper
                                functionalityName="manage user"
                                moduleName="users"
                                actionId={1}
                                component={
                                    <CustomButton
                                        startIcon={<FontAwesomeIcon icon={faPlus} />}
                                        onClick={() => handleOpenUserDialog()}
                                    >
                                        Add User
                                    </CustomButton>
                                }
                            />
                        </div>

                        <div className="bg-white border border-[#DFE1E6] rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#FAFBFC] border-b border-[#DFE1E6] text-xs uppercase text-[#5E6C84] font-bold tracking-wider">
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Contact Info</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#DFE1E6]">
                                        {loadingUsers ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-10 text-center">
                                                    <CircularProgress size={30} sx={{ color: '#0052CC' }} />
                                                </td>
                                            </tr>
                                        ) : users.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-10 text-center text-[#5E6C84]">
                                                    No users found. Create one above!
                                                </td>
                                            </tr>
                                        ) : users.map(user => (
                                            <tr key={user.id} className="hover:bg-[#FAFBFC] transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#0052CC] to-[#4C9AFF] text-white flex items-center justify-center font-bold shadow-sm shrink-0 uppercase">
                                                            {user.first_name[0]}{user.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-[#172B4D]">{user.first_name} {user.last_name}</div>
                                                            {user.city && (
                                                                <div className="text-xs text-[#5E6C84] mt-0.5">
                                                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 opacity-70" />
                                                                    {user.city}, {user.country}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-[#172B4D] flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faEnvelope} className="text-[#8993A4]" /> {user.email}
                                                    </div>
                                                    {user.phone && (
                                                        <div className="text-xs text-[#5E6C84] mt-1 flex items-center gap-2">
                                                            <FontAwesomeIcon icon={faPhone} className="text-[#8993A4]" /> {user.phone}
                                                            {user.is_sms_active && (
                                                                <span className="text-[10px] bg-[#E3FCEF] text-[#006644] px-1 py-0.5 rounded ml-1">
                                                                    SMS ON
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Chip
                                                        icon={<FontAwesomeIcon icon={faUserShield} style={{ fontSize: '10px' }} />}
                                                        label={rolesMap[user.role_id]?.name || 'Unknown'}
                                                        color={rolesMap[user.role_id]?.color || 'default'}
                                                        size="small"
                                                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${user.is_active ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#FFEBE6] text-[#BF2600]'}`}>
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-1">                                                        
                                                        <PermissionWrapper
                                                            functionalityName="manage user"
                                                            moduleName="users"
                                                            actionId={2}
                                                            component={
                                                                <Tooltip title="Send Credentials">
                                                                    <IconButton
                                                                        onClick={() => handleSendUserCredentials(user)}
                                                                        size="small"
                                                                        sx={{ color: '#FF9800', '&:hover': { backgroundColor: '#FFF3E0' } }}
                                                                    >
                                                                        <FontAwesomeIcon icon={faKey} size="sm" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            }
                                                        />

                                                        <PermissionWrapper
                                                            functionalityName="manage user"
                                                            moduleName="users"
                                                            actionId={2}
                                                            component={
                                                                <IconButton
                                                                    onClick={() => handleOpenUserDialog(user.id)}
                                                                    size="small"
                                                                    sx={{ color: '#4C9AFF', '&:hover': { backgroundColor: '#E9F2FF' } }}
                                                                >
                                                                    <FontAwesomeIcon icon={faEdit} size="sm" />
                                                                </IconButton>
                                                            }
                                                        />

                                                        <PermissionWrapper
                                                            functionalityName="manage user"
                                                            moduleName="users"
                                                            actionId={3}
                                                            component={
                                                                <IconButton
                                                                    onClick={() => confirmDeleteUser(user)}
                                                                    size="small"
                                                                    sx={{ color: '#DE350B', '&:hover': { backgroundColor: '#FFEBE6' } }}
                                                                >
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
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#DFE1E6]">
                    {activeStep === 1 && (
                        <CustomButton
                            variant="outlined"
                            onClick={handleBack}
                            disabled={isSubmitting}
                            sx={{
                                color: '#5E6C84',
                                borderColor: '#DFE1E6',
                                backgroundColor: 'transparent !important',
                                '&:hover': { backgroundColor: '#FAFBFC !important', borderColor: '#DFE1E6' }
                            }}
                        >
                            <span className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faChevronLeft} /> Back
                            </span>
                        </CustomButton>
                    )}

                    {activeStep === 0 ? (
                        <CustomButton
                            loading={isSubmitting}
                            onClick={handleNext}
                        >
                            <span className="flex items-center gap-2">
                                Next <FontAwesomeIcon icon={faChevronRight} />
                            </span>
                        </CustomButton>
                    ) : (
                        <CustomButton
                            loading={isSubmitting}
                            onClick={handleFinish}
                        >
                            <span className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faCheck} /> Finish
                            </span>
                        </CustomButton>
                    )}
                </div>
            </div>

            {/* Lazy Loaded Dialog & confirmation modal */}
            {userFormOpen && (
                <Suspense fallback={
                    <div className="flex justify-center p-6">
                        <CircularProgress size={30} sx={{ color: '#0052CC' }} />
                    </div>
                }>
                    <UserFormDialog
                        open={userFormOpen}
                        onClose={handleCloseUserDialog}
                        onSuccess={handleUserSuccess}
                        editingUserId={editingUserId}
                        defaultCompanyId={localCompanyId}
                        disableCompanySelect={true}
                        disableRoleSelect={true}
                        defaultRoleId={3}
                    />
                </Suspense>
            )}

            <ConfirmDialog
                open={deleteUserConfirmOpen}
                onClose={() => setDeleteUserConfirmOpen(false)}
                onConfirm={handleDeleteUser}
                title="Delete User?"
                description={`Are you sure you want to permanently delete the user ${userToDelete?.first_name} ${userToDelete?.last_name}? `}
                confirmText="Delete User"
                isDestructive={true}
            />
        </CustomModalWrapper>
    );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
    setAlert,
};

export default connect(mapStateToProps, mapDispatchToProps)(CompanyFormDialog);
