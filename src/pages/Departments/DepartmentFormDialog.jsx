import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { connect } from 'react-redux';
import CustomInput from '../../components/common/CustomInput';
import CustomModalWrapper from '../../components/common/CustomModalWrapper';
import { getDepartmentById, addDepartment, updateDepartment, getAllDepartments } from '../../services/departmentService';
import { CircularProgress } from '@mui/material';
import { setAlert } from '../../redux/commonReducers/commonReducers';
import CustomSelect from '../../components/common/CustomSelect';

const DepartmentFormDialog = ({
    open,
    onClose,
    onSuccess,
    editingDepartmentId,
    setAlert
}) => {
    const {
        control,
        handleSubmit,
        reset,
    } = useForm({
        defaultValues: {
            name: '',
            parent_department_id: null,
        }
    });

    const [loadingData, setLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departments, setDepartments] = useState([]);

    const fetchDepartments = async () => {
        try {
            const res = await getAllDepartments();
            const options = res.result?.map(u => ({ label: `${u.name}`, value: u.id }));
            setDepartments(options);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: "Failed to load departments.", type: "error" });
        }
    };

    const fetchDepartmentDetails = async () => {
        if (editingDepartmentId) {
            setLoadingData(true);
            getDepartmentById(editingDepartmentId).then(res => {
                reset({
                    name: res.result.name || '',
                    parent_department_id: res.result.parent_department_id || null
                });
            }).catch(err => {
                console.error("Failed to load department", err);
                setAlert({ open: true, message: "Failed to load department details.", type: "error" });
            }).finally(() => {
                setLoadingData(false);
            });
        } else {
            reset({
                name: '',
                parent_department_id: null
            });
        }
    }

    useEffect(() => {
        if (open) {
            fetchDepartments()
            fetchDepartmentDetails()
        }
    }, [open]);

    const handleFormSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            if (editingDepartmentId) {
                await updateDepartment(editingDepartmentId, data);
            } else {
                await addDepartment(data);
            }
            setAlert({
                open: true,
                message: `Department ${editingDepartmentId ? 'updated' : 'created'} successfully!`,
                type: "success"
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            setAlert({
                open: true,
                message: err.message || "Failed to save department.",
                type: "error"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CustomModalWrapper
            open={open}
            onClose={() => !isSubmitting && onClose()}
            title={editingDepartmentId ? 'Edit Department' : 'Add New Department'}
            onSubmit={handleSubmit(handleFormSubmit)}
            isSubmitting={isSubmitting || loadingData}
            submitText={editingDepartmentId ? 'Save Changes' : 'Submit'}
            cancelText="Cancel"
            maxWidth="md"
        >
            <form id="department-form" onSubmit={handleSubmit(handleFormSubmit)}>
                {loadingData ? (
                    <div className="flex justify-center p-6">
                        <CircularProgress size={30} sx={{ color: '#0052CC' }} />
                    </div>
                ) : (
                    <div className="flex flex-row gap-2 mt-2">
                        <CustomSelect
                            name="parent_department_id"
                            control={control}
                            label="Parent Department"
                            options={departments}
                        />

                        <CustomInput
                            name="name"
                            control={control}
                            label="Department Name"
                            rules={{ required: "Department name is required" }}
                        />
                    </div>
                )}
            </form>
        </CustomModalWrapper>
    );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
    setAlert
};

export default connect(mapStateToProps, mapDispatchToProps)(DepartmentFormDialog);
