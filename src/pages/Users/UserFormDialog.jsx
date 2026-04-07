import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { connect } from 'react-redux';
import CustomInput from '../../components/common/CustomInput';
import CustomCheckbox from '../../components/common/CustomCheckbox';
import CustomSelect from '../../components/common/CustomSelect';
import CustomModalWrapper from '../../components/common/CustomModalWrapper';
import { getNonCustomers, getUserById, addUser, updateUser } from '../../services/userService';
import { CircularProgress, IconButton, Tooltip } from '@mui/material';
import { getAllCompanies } from '../../services/companyService';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CompanyFormDialog from '../Companies/CompanyFormDialog';
import { setAlert } from '../../redux/commonReducers/commonReducers';

const UserFormDialog = ({
    open,
    onClose,
    onSuccess,
    editingUserId,
    setAlert
}) => {
    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue
    } = useForm({
        defaultValues: {
            first_name: '', last_name: '', email: '', password: '', role_id: 3,
            city: '', state: '', country: '', zip: '', phone: '',
            is_sms_active: false, is_active: true, report_to: null, company_id: null
        }
    });

    const [loadingData, setLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);

    const handleOpen = () => {
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
    };

    const fetchCompanies = async () => {
        try {
            const res = await getAllCompanies();
            const options = res?.result?.map(u => ({ label: `${u.company_name}`, value: u.id }));
            setCompanies(options);
            handleClose();
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUsers = async () => {
        try {
            let res = await getNonCustomers();
            const options = res?.result?.map(u => ({ label: `${u.first_name} ${u.last_name}`, value: u.id }));
            setUsersList(options);
        } catch (err) {
            console.error("Failed to load users", err);
        }
    };

    useEffect(() => {
        if (open) {
            fetchUsers();
            fetchCompanies();
            if (editingUserId) {
                setLoadingData(true);
                getUserById(editingUserId).then(res => {
                    reset({
                        first_name: res.result.first_name || '',
                        last_name: res.result.last_name || '',
                        email: res.result.email || '',
                        password: '', // Blank by default on edit
                        role_id: res.result.role_id || 3,
                        city: res.result.city || '',
                        state: res.result.state || '',
                        country: res.result.country || '',
                        zip: res.result.zip || '',
                        phone: res.result.phone || '',
                        is_sms_active: res.result.is_sms_active ?? false,
                        is_active: res.result.is_active ?? true,
                        report_to: res.result.report_to ?? null,
                        company_id: res?.result?.company_id || null,
                    });
                }).catch(err => {
                    console.error("Failed to fetch user details", err);
                    setAlert({ open: true, message: "Failed to load user details.", type: "error" });
                }).finally(() => {
                    setLoadingData(false);
                });
            } else {
                reset({
                    first_name: '', last_name: '', email: '', password: '', role_id: 3,
                    city: '', state: '', country: '', zip: '', phone: '',
                    is_sms_active: false, is_active: true, report_to: null, company_id: null
                });
            }
        }
    }, [open, editingUserId, reset, setAlert]);

    const handleFormSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            if (editingUserId) {
                const updateData = { ...data };
                if (!updateData.password) {
                    delete updateData.password;
                }
                await updateUser(editingUserId, updateData);
            } else {
                await addUser(data);
            }
            setAlert({ 
                open: true, 
                message: `User ${editingUserId ? 'updated' : 'created'} successfully!`, 
                type: "success" 
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            setAlert({ 
                open: true, 
                message: err.message || "Failed to save user.", 
                type: "error" 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const roleOptions = [
        { value: 1, label: 'Administrator' },
        { value: 2, label: 'Developer' },
        { value: 3, label: 'Customer' }
    ];

    return (
        <CustomModalWrapper
            open={open}
            onClose={() => !isSubmitting && onClose()}
            title={editingUserId ? 'Edit User' : 'Add New User'}
            onSubmit={handleSubmit(handleFormSubmit)}
            isSubmitting={isSubmitting || loadingData}
            submitText={editingUserId ? 'Save Changes' : 'Submit'}
            cancelText="Cancel"
            maxWidth="sm"
        >
            <form id="user-form" onSubmit={handleSubmit(handleFormSubmit)}>
                {loadingData ? (
                    <div className="flex justify-center p-6">
                        <CircularProgress size={30} sx={{ color: '#0052CC' }} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">

                        <div className="grid grid-cols-2 gap-4 mb-4 mt-2">
                            <CustomInput
                                name="first_name"
                                control={control}
                                label="First Name"
                                rules={{ required: "First name is required" }}
                            />
                            <CustomInput
                                name="last_name"
                                control={control}
                                label="Last Name"
                                rules={{ required: "Last name is required" }}
                            />

                            <CustomInput
                                name="email"
                                control={control}
                                label="Email Address"
                                type="email"
                                rules={{
                                    required: "Email is required",
                                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email" }
                                }}
                            />

                            <CustomInput
                                name="password"
                                control={control}
                                label={editingUserId ? "Password (Leave blank to keep)" : "Password"}
                                type="password"
                                rules={{ required: editingUserId ? false : "Password is required" }}
                            />
                        </div>

                        <CustomSelect
                            name="role_id"
                            control={control}
                            label="Role"
                            options={roleOptions}
                            rules={{ required: "Role is required" }}
                        />

                        {
                            watch("role_id") === 2 && (
                                <div className='mt-4'>
                                    <CustomSelect
                                        name="report_to"
                                        control={control}
                                        label="Manager"
                                        options={usersList}
                                    />
                                </div>
                            )
                        }

                        {
                            watch("role_id") === 3 && (
                                <div className='mt-4 flex items-center gap-4'>
                                    <div className='w-full'>
                                        <CustomSelect
                                            name="company_id"
                                            control={control}
                                            label="Company"
                                            options={companies}
                                            rules={{ required: "Company is required" }}
                                        />
                                    </div>
                                    <div>
                                        <Tooltip title="Add Company">
                                            <IconButton
                                                size="small"
                                                onClick={handleOpen}
                                            >
                                                <FontAwesomeIcon icon={faPlus} className="text-[#172B4D] font-bold" />
                                            </IconButton>
                                        </Tooltip>
                                    </div>
                                </div>
                            )
                        }

                        <div className="my-2">
                            <h4 className="font-semibold text-[#172B4D] text-sm py-3">Additional Info (Optional)</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <CustomInput name="phone" control={control} label="Phone Number" />
                            <CustomInput name="city" control={control} label="City" />
                            <CustomInput name="state" control={control} label="State/Province" />
                            <CustomInput name="country" control={control} label="Country" />
                            <CustomInput name="zip" control={control} label="ZIP Code" />
                        </div>

                        <div className="flex gap-4 mt-2">
                            <CustomCheckbox
                                name="is_active"
                                control={control}
                                label={<span className="text-sm font-medium">Account Active</span>}
                            />
                        </div>
                    </div>
                )}
            </form>
            <CompanyFormDialog
                open={openDialog}
                onClose={handleClose}
                onSave={fetchCompanies}
                editingCompanyId={null}
            />
        </CustomModalWrapper>
    );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
    setAlert
};

export default connect(mapStateToProps, mapDispatchToProps)(UserFormDialog);
