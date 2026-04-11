import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import CustomButton from './CustomButton';
import { connect } from 'react-redux';

const CustomModalWrapper = ({
    open,
    onClose,
    title,
    children,
    onSubmit,
    isSubmitting = false,
    maxWidth = 'sm',
    submitText = 'Submit',
    cancelText = 'Cancel',
    showFooter = true,
    headerExtra = null,
    loading
}) => {
    return (
        <Dialog
            open={open}
            // onClose={() => !isSubmitting && onClose()}
            maxWidth={maxWidth}
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '8px',
                    m: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }
            }}
        >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE1E6]">
                <DialogTitle sx={{ p: 0, fontWeight: 600, color: '#172B4D', fontSize: '1.25rem' }}>
                    {title}
                </DialogTitle>
                <div className="flex items-center gap-3">
                    {headerExtra}
                    <IconButton
                        onClick={onClose}
                        disabled={isSubmitting || loading}
                        size="small"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-[#172B4D] text-lg font-bold" />
                    </IconButton>
                </div>
            </div>

            <DialogContent sx={{ p: "1.5rem", overflowY: 'auto' }}>
                {children}
            </DialogContent>

            {showFooter && (
                <DialogActions className="border-t border-[#DFE1E6]" sx={{ justifyContent: 'flex-end', px: "1.5rem", py: "1rem" }}>
                    <CustomButton
                        loading={isSubmitting}
                        startIcon={!isSubmitting && <FontAwesomeIcon icon={faSave} />}
                        onClick={onSubmit}
                        disabled={isSubmitting || loading}
                        type="submit"
                    >
                        {submitText}
                    </CustomButton>
                </DialogActions>
            )}
        </Dialog>
    );
};

const mapStateToProps = (state) => ({
    loading: state.common.loading
});

export default connect(mapStateToProps, null)(CustomModalWrapper);
