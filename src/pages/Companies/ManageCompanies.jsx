import React, { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { getAllCompanies, deleteCompany } from '../../services/companyService';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionWrapper from '../../components/permissionWrapper/PermissionWrapper';
import CustomButton from '../../components/common/CustomButton';
import CompanyFormDialog from './CompanyFormDialog';
import { setAlert } from '../../redux/commonReducers/commonReducers';

const ManageCompanies = ({ setAlert }) => {
    const [companies, setCompanies] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);

    const [openDialog, setOpenDialog] = useState(false);
    const [editingCompanyId, setEditingCompanyId] = useState(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState({ open: false, company: null });

    const fetchCompanies = async () => {
        try {
            const res = await getAllCompanies();
            setCompanies(res.result || []);
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: "Failed to load companies.", type: "error" });
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleOpen = (company = null) => {
        setEditingCompanyId(company ? company.id : null);
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setEditingCompanyId(null);
    };

    const onSubmit = async () => {
        fetchCompanies();
        handleClose();
    };

    const openDeleteConfirm = (company) => {
        setDeleteConfirmOpen({ open: true, company });
    };

    const handleDelete = async () => {
        const id = deleteConfirmOpen.company?.id;
        if (!id) return;

        setActionLoading(true);
        try {
            await deleteCompany(id);
            fetchCompanies();
            setDeleteConfirmOpen({ open: false, company: null });
            setAlert({ open: true, message: "Company deleted successfully.", type: "success" });
        } catch (err) {
            console.error(err);
            setAlert({ open: true, message: err.message || "Failed to delete company.", type: "error" });
        } finally {
            setActionLoading(false);
        }
    };

    const getLogoUrl = (url) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `${import.meta.env.VITE_APP_MAIN_SITE_URL || ''}${url}`;
    };

    return (
        <div className="space-y-4 max-w-7xl mx-auto">
            {/* Toolbar */}
            <div className="flex justify-end">
                <PermissionWrapper
                    functionalityName="manage company"
                    moduleName="Companies List"
                    actionId={1}
                    component={
                        <CustomButton
                            startIcon={<FontAwesomeIcon icon={faPlus} />}
                            onClick={() => handleOpen()}
                        >
                            Add Company
                        </CustomButton>
                    }
                />
            </div>

            {/* Content Section */}
            <div className="bg-white border border-[#DFE1E6] rounded-xl shadow-sm overflow-hidden">
                {companies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-[#F4F5F7] rounded-full flex items-center justify-center mb-4 text-[#8993A4]">
                            <FontAwesomeIcon icon={faBuilding} size="2x" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#172B4D] mb-1">No companies found</h3>
                        <p className="text-[#5E6C84] mb-4">Get started by adding your first company.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#DFE1E6]">
                            <thead className="bg-[#FAFBFC]">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider w-16">
                                        Logo
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                        Company Name
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#8993A4] uppercase tracking-wider">
                                        City
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-[#8993A4] uppercase tracking-wider w-24">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#DFE1E6]">
                                {companies.map((company) => (
                                    <tr key={company.id} className="hover:bg-[#FAFBFC] transition-colors group">
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            {company.logo ? (
                                                <img
                                                    src={getLogoUrl(company.logo)}
                                                    alt={company.company_name}
                                                    className="w-10 h-10 rounded-lg object-cover border border-[#DFE1E6]"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-[#F4F5F7] flex items-center justify-center text-[#8993A4]">
                                                    <FontAwesomeIcon icon={faBuilding} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-[#172B4D]">{company.company_name}</div>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-[#5E6C84]">
                                            {company.email || '-'}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-[#5E6C84]">
                                            {company.phone || '-'}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-[#5E6C84]">
                                            {company.city || '-'}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            <div>
                                                <PermissionWrapper
                                                    functionalityName="manage company"
                                                    moduleName="Companies List"
                                                    actionId={2}
                                                    component={
                                                        <IconButton onClick={() => handleOpen(company)} size="small" sx={{ color: '#4C9AFF', '&:hover': { backgroundColor: '#E9F2FF' } }}>
                                                            <FontAwesomeIcon icon={faEdit} size="sm" />
                                                        </IconButton>
                                                    }
                                                />
                                                <PermissionWrapper
                                                    functionalityName="manage company"
                                                    moduleName="Companies List"
                                                    actionId={3}
                                                    component={
                                                        <IconButton onClick={() => openDeleteConfirm(company)} size="small" sx={{ color: '#DE350B', ml: 1, '&:hover': { backgroundColor: '#FFEBE6' } }}>
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
                )}
            </div>

            <CompanyFormDialog
                open={openDialog}
                onClose={handleClose}
                onSave={onSubmit}
                editingCompanyId={editingCompanyId}
                isSubmitting={actionLoading}
            />

            <ConfirmDialog
                open={deleteConfirmOpen.open}
                onClose={() => setDeleteConfirmOpen({ open: false, company: null })}
                onConfirm={handleDelete}
                title="Delete Company"
                description={`Are you sure you want to delete "${deleteConfirmOpen.company?.company_name}"? This action cannot be undone.`}
                confirmText="Delete"
                isDestructive={true}
            />
        </div>
    );
};

const mapStateToProps = (state) => ({});

const mapDispatchToProps = {
    setAlert
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageCompanies);
