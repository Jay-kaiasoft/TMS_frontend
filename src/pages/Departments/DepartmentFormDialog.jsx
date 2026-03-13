import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import CustomInput from '../../components/common/CustomInput';
import CustomModalWrapper from '../../components/common/CustomModalWrapper';
import { getDepartmentById } from '../../services/departmentService';
import { CircularProgress } from '@mui/material';

const DepartmentFormDialog = ({
    open,
    onClose,
    onSave,
    editingDepartmentId,
    apiError,
    isSubmitting
}) => {
    const {
        control,
        handleSubmit,
        reset,
    } = useForm({
        defaultValues: {
            name: ''
        }
    });

    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (open) {
            if (editingDepartmentId) {
                setLoadingData(true);
                getDepartmentById(editingDepartmentId).then(res => {
                    reset({
                        name: res.result.name || '',
                    });
                }).catch(err => {
                    console.error("Failed to load department", err);
                }).finally(() => {
                    setLoadingData(false);
                });
            } else {
                reset({
                    name: ''
                });
            }
        }
    }, [open, editingDepartmentId, reset]);

    const handleFormSubmit = (data) => {
        onSave(data);
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
            maxWidth="sm"
        >
            <form id="department-form" onSubmit={handleSubmit(handleFormSubmit)}>
                {loadingData ? (
                    <div className="flex justify-center p-6">
                        <CircularProgress size={30} sx={{ color: '#0052CC' }} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 mt-2">
                        {apiError && (
                            <div className="p-3 bg-[#FFEBE6] text-[#BF2600] rounded-md text-sm font-medium mb-4">
                                {apiError}
                            </div>
                        )}

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

export default DepartmentFormDialog;
