import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import CustomInput from '../../components/common/CustomInput';
import CustomSelect from '../../components/common/CustomSelect';
import CustomModalWrapper from '../../components/common/CustomModalWrapper';
import { getProjectById } from '../../services/projectService';
import { getCustomers } from '../../services/userService';
import { CircularProgress } from '@mui/material';

const ProjectFormDialog = ({
    open,
    onClose,
    onSave,
    editingProjectId,
    isSubmitting
}) => {
    const {
        control,
        handleSubmit,
        reset,
    } = useForm({
        defaultValues: {
            name: '',
            client_id: ''
        }
    });

    const [clients, setClients] = useState([]);

    const fetchClients = async () => {
        try {
            // Fetch users that have the Customer role
            const res = await getCustomers();
            const clientOptions = (res.result || []).map(user => ({
                value: user.id,
                label: `${user.first_name} ${user.last_name}`
            }));
            setClients(clientOptions);
        } catch (err) {
            console.error("Failed to fetch clients", err);
        }
    };

    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {

        if (open) {
            fetchClients();

            if (editingProjectId) {
                setLoadingData(true);
                getProjectById(editingProjectId).then(res => {
                    reset({
                        name: res.result.name || '',
                        client_id: res.result.client_id || ''
                    });
                }).catch(err => {
                    console.error("Failed to load project details", err);
                }).finally(() => {
                    setLoadingData(false);
                });
            } else {
                reset({
                    name: '',
                    client_id: ''
                });
            }
        }
    }, [open, editingProjectId, reset]);

    const handleFormSubmit = (data) => {
        onSave(data);
    };

    return (
        <CustomModalWrapper
            open={open}
            onClose={() => !isSubmitting && onClose()}
            title={editingProjectId ? 'Edit Project' : 'Add New Project'}
            onSubmit={handleSubmit(handleFormSubmit)}
            isSubmitting={isSubmitting || loadingData}
            submitText={editingProjectId ? 'Save Changes' : 'Submit'}
            cancelText="Cancel"
            maxWidth="sm"
        >
            <form id="project-form" onSubmit={handleSubmit(handleFormSubmit)}>
                {loadingData ? (
                    <div className="flex justify-center p-6">
                        <CircularProgress size={30} sx={{ color: '#0052CC' }} />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <CustomInput
                            name="name"
                            control={control}
                            label="Project Name"
                            rules={{ required: "Project name is required" }}
                        />
                        <CustomSelect
                            name="client_id"
                            control={control}
                            label="Assigned Client"
                            options={clients}
                            rules={{ required: "Client selection is required" }}
                        />
                    </div>
                )}
            </form>
        </CustomModalWrapper>
    );
};

export default ProjectFormDialog;
