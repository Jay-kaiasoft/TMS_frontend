import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { connect } from 'react-redux';
import CustomInput from '../../components/common/CustomInput';
import CustomModalWrapper from '../../components/common/CustomModalWrapper';
import { getStatusById, addStatus, updateStatus } from '../../services/statusService';
import { CircularProgress } from '@mui/material';
import { setAlert } from '../../redux/commonReducers/commonReducers';

const StatusFormDialog = ({
    open,
    onClose,
    onSuccess,
    editingStatusId,
    setAlert
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            if (editingStatusId) {
                setLoadingData(true);
                getStatusById(editingStatusId).then(res => {
                    reset({
                        name: res.result.name || '',
                    });
                }).catch(err => {
                    console.error("Failed to load status details", err);
                    setAlert({ open: true, message: "Failed to load status details.", type: "error" });
                }).finally(() => {
                    setLoadingData(false);
                });
            } else {
                reset({
                    name: ''
                });
            }
        }
    }, [open, editingStatusId, reset, setAlert]);

    const handleFormSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            if (editingStatusId) {
                await updateStatus(editingStatusId, data);
            } else {
                await addStatus(data);
            }
            if (onSuccess) onSuccess();
            setAlert({ 
                open: true, 
                message: `Status ${editingStatusId ? 'updated' : 'created'} successfully!`, 
                type: "success" 
            });
        } catch (err) {
            console.error(err);
            setAlert({ 
                open: true, 
                message: err.message || "Failed to save status.", 
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
            title={editingStatusId ? 'Edit Status' : 'Add New Status'}
            onSubmit={handleSubmit(handleFormSubmit)}
            isSubmitting={isSubmitting || loadingData}
            submitText={editingStatusId ? 'Save Changes' : 'Submit'}
            cancelText="Cancel"
            maxWidth="sm"
        >
            <form id="status-form" onSubmit={handleSubmit(handleFormSubmit)}>
                {loadingData ? (
                    <div className="flex justify-center p-6">
                        <CircularProgress size={30} sx={{ color: '#0052CC' }} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 mt-2">
                        <CustomInput
                            name="name"
                            control={control}
                            label="Status Name"
                            rules={{ required: "Status name is required" }}
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

export default connect(mapStateToProps, mapDispatchToProps)(StatusFormDialog);
