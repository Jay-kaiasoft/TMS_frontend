import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { connect } from 'react-redux';
import { Checkbox } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faXmark, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { getRoleById, getRolePermissions, getAllActions, createRole, updateRole } from '../../services/roleService';
import CustomInput from '../../components/common/CustomInput';
import CustomButton from '../../components/common/CustomButton';
import { setAlert } from '../../redux/commonReducers/commonReducers';

const RoleFormPage = ({ setAlert }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [headers, setHeaders] = useState([]);
    const [saving, setSaving] = useState(false);

    const {
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: '',
            functionalities: [],
        },
    });

    const functionalities = watch('functionalities');

    const handleCheckboxChange = (funcIndex, moduleIndex, actionId, checked) => {
        const currentFunctionalities = watch('functionalities');
        const updatedModules = currentFunctionalities[funcIndex].modules.map((module, index) => {
            if (index === moduleIndex) {
                const updatedActions = checked
                    ? [...module.roleAssignedActions, actionId]
                    : module.roleAssignedActions.filter((aid) => aid !== actionId);
                return { ...module, roleAssignedActions: updatedActions };
            }
            return module;
        });

        const updatedFunctionalities = currentFunctionalities.map((func, index) => {
            if (index === funcIndex) {
                return { ...func, modules: updatedModules };
            }
            return func;
        });

        setValue('functionalities', updatedFunctionalities);
    };

    const handleCheckAll = (checked) => {
        const updatedFunctionalities = watch('functionalities').map((func) => ({
            ...func,
            modules: func.modules.map((module) => ({
                ...module,
                roleAssignedActions: checked ? [...module.moduleAssignedActions] : [],
            })),
        }));
        setValue('functionalities', updatedFunctionalities);
    };

    const handleCheckAllFunctionalitiesModules = (funcIndex, checked) => {
        const updatedFunctionalities = [...watch('functionalities')];
        const modules = updatedFunctionalities[funcIndex]?.modules || [];
        modules.forEach((module) => {
            module.roleAssignedActions = checked ? [...new Set([...module.moduleAssignedActions])] : [];
        });
        setValue('functionalities', updatedFunctionalities);
    };

    const handleCheckAllModulesAction = (checked, actionId) => {
        const updatedFunctionalities = watch('functionalities').map((func) => ({
            ...func,
            modules: func.modules.map((module) => {
                const isActionAssignable = module.moduleAssignedActions.includes(actionId);
                return {
                    ...module,
                    roleAssignedActions: checked
                        ? isActionAssignable
                            ? [...new Set([...module.roleAssignedActions, actionId])]
                            : module.roleAssignedActions
                        : module.roleAssignedActions.filter((aid) => aid !== actionId),
                };
            }),
        }));
        setValue('functionalities', updatedFunctionalities);
    };

    const handleGetAllActions = async () => {
        try {
            const res = await getAllActions();
            if (res?.status === 200) {
                setHeaders(res?.result || []);
            }
        } catch (err) {
            console.error("Failed to load actions", err);
        }
    };

    const handleLoadRoleData = async () => {
        try {
            if (id) {
                const res = await getRoleById(id);
                if (res?.status === 200) {
                    setValue('name', res.result?.name || '');
                    setValue('functionalities', res.result?.rolesActions?.functionalities || []);
                }
            } else {
                const res = await getRolePermissions(0);
                if (res?.status === 200) {
                    setValue('functionalities', res.result?.functionalities || []);
                }
            }
        } catch (err) {
            console.error("Failed to load role data", err);
        }
    };

    useEffect(() => {
        handleGetAllActions();
        handleLoadRoleData();
    }, [id]);

    const handleSave = async (data) => {
        setSaving(true);
        try {
            const payload = {
                name: data.name,
                rolesActions: {
                    functionalities: data.functionalities,
                },
            };

            if (id) {
                payload.id = id;
                const res = await updateRole(id, payload);
                if (res?.status === 200) {
                    setAlert({ open: true, message: "Role updated successfully!", type: "success" });
                    navigate('/dashboard/manage-role');
                } else {
                    setAlert({ open: true, message: res?.message || "Failed to update role.", type: "error" });
                }
            } else {
                const res = await createRole(payload);
                if (res?.status === 201) {
                    setAlert({ open: true, message: "Role created successfully!", type: "success" });
                    navigate('/dashboard/manage-role');
                } else {
                    setAlert({ open: true, message: res?.message || "Failed to create role.", type: "error" });
                }
            }
        } catch (err) {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to save role.";
            setAlert({ open: true, message: errorMsg, type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const isAllChecked = functionalities?.length > 0 && functionalities.every((func) =>
        func.modules.every((module) =>
            module.moduleAssignedActions.every((action) =>
                module.roleAssignedActions.includes(action)
            )
        )
    );

    const isColumnAllChecked = (actionId) => {
        return functionalities?.length > 0 && functionalities.every((func) =>
            func.modules.every((module) =>
                !module.moduleAssignedActions.includes(actionId) ||
                module.roleAssignedActions.includes(actionId)
            )
        );
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            {/* Form */}
            <form onSubmit={handleSubmit(handleSave)}>
                <div className="bg-white border border-[#DFE1E6] rounded-xl shadow-sm p-6">
                    {/* Role Name */}
                    <div className="max-w-md mb-6">
                        <CustomInput
                            name="name"
                            control={control}
                            label="Role Name"
                            rules={{ required: "Role Name is required" }}
                        />
                    </div>

                    {/* Permissions Table */}
                    <div className="overflow-x-auto border border-[#DFE1E6] rounded-lg">
                        <table className="min-w-full bg-white border-collapse">
                            <thead>
                                <tr className="border-b border-[#DFE1E6] bg-[#FAFBFC]">
                                    <th className="p-4 w-88 text-left text-sm font-semibold text-[#172B4D]">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                size="small"
                                                checked={isAllChecked}
                                                onChange={(e) => handleCheckAll(e.target.checked)}
                                                sx={{ color: '#8993A4', '&.Mui-checked': { color: '#0052CC' } }}
                                            />
                                            <span>Functionality</span>
                                        </div>
                                    </th>
                                    <th className="p-4 w-44 text-left text-sm font-semibold text-[#172B4D]">Module</th>
                                    {headers.map((header) => (
                                        <th key={header.id} className="p-4 text-center text-sm font-semibold text-[#172B4D]">
                                            <div className="flex flex-col items-center gap-1">
                                                <span>{header.name}</span>
                                                <Checkbox
                                                    size="small"
                                                    checked={isColumnAllChecked(header.id)}
                                                    onChange={(e) => handleCheckAllModulesAction(e.target.checked, header.id)}
                                                    sx={{ color: '#8993A4', '&.Mui-checked': { color: '#0052CC' } }}
                                                />
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {functionalities?.map((func, funcIndex) => (
                                    <React.Fragment key={func.functionalityId}>
                                        <tr className="border-b border-[#DFE1E6]">
                                            <td
                                                className="p-4 text-sm font-medium text-[#172B4D]"
                                                rowSpan={func.modules?.length + 1}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        size="small"
                                                        checked={func.modules?.every((module) =>
                                                            module.moduleAssignedActions.every((action) =>
                                                                module.roleAssignedActions.includes(action)
                                                            )
                                                        )}
                                                        onChange={(e) => handleCheckAllFunctionalitiesModules(funcIndex, e.target.checked)}
                                                        sx={{ color: '#8993A4', '&.Mui-checked': { color: '#0052CC' } }}
                                                    />
                                                    <span className='capitalize'>{func.functionalityName}</span>
                                                </div>
                                            </td>
                                        </tr>
                                        {func.modules?.map((module, moduleIndex) => (
                                            <tr key={module.moduleId} className="border-b border-[#DFE1E6] hover:bg-[#FAFBFC] transition-colors">
                                                <td className="p-4 text-sm text-[#42526E]">{module.moduleName}</td>
                                                {headers.map((header) => {
                                                    const isActionAvailable = module.moduleAssignedActions.includes(header.id);
                                                    return (
                                                        <td key={header.id} className="p-4 text-center">
                                                            {isActionAvailable ? (
                                                                <Checkbox
                                                                    size="small"
                                                                    checked={module.roleAssignedActions.includes(header.id)}
                                                                    onChange={(e) =>
                                                                        handleCheckboxChange(
                                                                            funcIndex,
                                                                            moduleIndex,
                                                                            header.id,
                                                                            e.target.checked
                                                                        )
                                                                    }
                                                                    sx={{ color: '#8993A4', '&.Mui-checked': { color: '#0052CC' } }}
                                                                />
                                                            ) : null}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end my-4 gap-3">
                    <CustomButton
                        type="button"
                        useFor="disabled"
                        onClick={() => navigate(-1)}
                        startIcon={<FontAwesomeIcon icon={faXmark} />}
                    >
                        Cancel
                    </CustomButton>
                    <CustomButton
                        type="submit"
                        loading={saving}
                        startIcon={<FontAwesomeIcon icon={faFloppyDisk} />}
                    >
                        {id ? 'Update' : 'Submit'}
                    </CustomButton>
                </div>
            </form>
        </div>
    );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
    setAlert,
};

export default connect(mapStateToProps, mapDispatchToProps)(RoleFormPage);
