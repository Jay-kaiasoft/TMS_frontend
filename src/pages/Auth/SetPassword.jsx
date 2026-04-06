import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { connect } from 'react-redux';
import AuthLayout from '../../layouts/AuthLayout';
import CustomInput from '../../components/common/CustomInput';
import { Button, CircularProgress } from '@mui/material';
import { setPassword } from '../../services/authService';
import { setAlert, setLoading } from '../../redux/commonReducers/commonReducers';

import { getCookie } from '../../utils/cookieHelper';

const SetPassword = ({ setAlert, setLoading, loading }) => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const { control, handleSubmit, watch } = useForm({
        defaultValues: { password: '', confirm_password: '' }
    });

    useEffect(() => {
        const token = getCookie('tms_token');
        if (token) {
            navigate('/dashboard');
        }
    }, [])

    useEffect(() => {
        if (!token) {
            setAlert({ open: true, message: 'Invalid or expired token.', type: 'error' });
        }
    }, [token, setAlert]);

    const onSubmit = async (data) => {
        if (!token) return;

        setLoading(true);

        try {
            await setPassword({
                token: token,
                new_password: data.password
            });
            setAlert({ open: true, message: 'Password set successfully. Redirecting to login...', type: 'success' });
            setTimeout(() => navigate('/'), 2000);
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Failed to set password', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const currentPassword = watch('password');

    return (
        <AuthLayout
            title="Secure Your Account"
            subtitle="Enter a strong password to activate your account."
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <CustomInput
                        name="password"
                        type="password"
                        control={control}
                        label="New Password"
                        rules={{
                            required: 'Password is required',
                            minLength: { value: 6, message: 'Password must be at least 6 characters' }
                        }}
                    />
                </div>
                <div className='my-3'>
                    <CustomInput
                        name="confirm_password"
                        type="password"
                        control={control}
                        label="Confirm Password"
                        rules={{
                            required: 'Please confirm your password',
                            validate: value => value === currentPassword || 'Passwords do not match'
                        }}
                    />
                </div>
                <div>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        disabled={loading || !token}
                        className="h-12 text-base font-semibold shadow-md mt-4"
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Set Password'}
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
};

const mapStateToProps = (state) => ({
    loading: state.common.loading,
});

const mapDispatchToProps = {
    setAlert,
    setLoading
};

export default connect(mapStateToProps, mapDispatchToProps)(SetPassword);
