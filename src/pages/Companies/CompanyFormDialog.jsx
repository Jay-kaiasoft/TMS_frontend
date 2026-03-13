import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { connect } from 'react-redux';
import { CircularProgress } from '@mui/material';
import CustomInput from '../../components/common/CustomInput';
import CustomModalWrapper from '../../components/common/CustomModalWrapper';
import LogoUpload from '../../components/common/LogoUpload';
import { getCompanyById, createCompany, updateCompany } from '../../services/companyService';
import { setAlert } from '../../redux/commonReducers/commonReducers';

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

    const [loadingData, setLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingLogoUrl, setExistingLogoUrl] = useState(null);

    useEffect(() => {
        if (open) {
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
    }, [open, editingCompanyId, reset]);

    const handleFormSubmit = async (data) => {
        setIsSubmitting(true);
        try {
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
                // Logo was removed
                formData.append('remove_logo', 'true');
            }

            if (editingCompanyId) {
                await updateCompany(editingCompanyId, formData);
                setAlert({ open: true, message: "Company updated successfully!", type: "success" });
            } else {
                await createCompany(formData);
                setAlert({ open: true, message: "Company created successfully!", type: "success" });
            }

            onSave();
        } catch (err) {
            const errorMsg = err?.response?.data?.detail || err?.message || "Failed to save company.";
            setAlert({ open: true, message: errorMsg, type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CustomModalWrapper
            open={open}
            onClose={() => !isSubmitting && onClose()}
            title={editingCompanyId ? 'Edit Company' : 'Add New Company'}
            onSubmit={handleSubmit(handleFormSubmit)}
            isSubmitting={isSubmitting || loadingData}
            submitText={editingCompanyId ? 'Save Changes' : 'Submit'}
            cancelText="Cancel"
            maxWidth="sm"
        >
            <form id="company-form" onSubmit={handleSubmit(handleFormSubmit)}>
                {loadingData ? (
                    <div className="flex justify-center p-6">
                        <CircularProgress size={30} sx={{ color: '#0052CC' }} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {/* Logo Upload */}
                        <div className='flex justify-center'>
                            <LogoUpload
                                name="logo"
                                control={control}
                                // label="Company Logo"
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
                    </div>
                )}
            </form>
        </CustomModalWrapper>
    );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
    setAlert,
};

export default connect(mapStateToProps, mapDispatchToProps)(CompanyFormDialog);
