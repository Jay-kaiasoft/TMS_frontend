import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { connect } from 'react-redux';

import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import CustomInput from '../../components/common/CustomInput';
import { Button, CircularProgress } from '@mui/material';
import { loginUser } from '../../services/authService';
import { setAlert, setLoading } from '../../redux/commonReducers/commonReducers';
import { setCookie, getCookie } from '../../utils/cookieHelper';
import CustomCheckbox from '../../components/common/CustomCheckbox';
import { encryptData, decryptData } from '../../utils/cryptoHelper';

const Login = ({ setAlert, setLoading, loading }) => {
    const navigate = useNavigate();

    const { control: loginControl, handleSubmit: handleLoginSubmit, setValue } = useForm({
        defaultValues: { email: '', password: '', remember_me: false }
    });

    const onLogin = async (data) => {
        setLoading(true);
        try {
            const res = await loginUser(data);
            if (res?.status === 200) {
                setCookie('tms_token', res?.result?.access_token);
                if (res?.result?.user_details) {
                    setCookie('tms_user', JSON.stringify(res?.result?.user_details));

                    if (data.remember_me) {
                        const encEmail = await encryptData(data.email);
                        const encPassword = await encryptData(data.password);
                        localStorage.setItem('email', encEmail);
                        localStorage.setItem('password', encPassword);
                        localStorage.setItem('remember_me', 'true');
                    } else {
                        localStorage.removeItem('email');
                        localStorage.removeItem('password');
                        localStorage.removeItem('remember_me');
                    }

                    navigate('/dashboard');
                }
            } else {
                setAlert({ open: true, message: res?.message || 'Invalid email or password', type: 'error' });
            }
        } catch (err) {
            setAlert({ open: true, message: err.message || 'Internal Server Error', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = getCookie('tms_token');
        if (token) {
            navigate('/dashboard');
        }

        const handleRememberMe = async () => {
            const rememberMe = localStorage.getItem('remember_me') === 'true';
            if (rememberMe) {
                const encEmail = localStorage.getItem('email');
                const encPassword = localStorage.getItem('password');

                if (encEmail && encPassword) {
                    const email = await decryptData(encEmail);
                    const password = await decryptData(encPassword);

                    if (email) setValue('email', email);
                    if (password) setValue('password', password);
                    setValue('remember_me', true);
                }
            }
        };
        handleRememberMe();
    }, [navigate, setValue])

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Log in to your account to continue."
        >
            {/* {error && <Alert severity="error" className="mb-6">{error}</Alert>} */}

            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                <CustomInput
                    name="email"
                    type="email"
                    control={loginControl}
                    label="Email Address"
                    rules={{ required: 'Email is required' }}
                />
                <div className='my-3'>
                    <CustomInput
                        name="password"
                        type="password"
                        control={loginControl}
                        label="Password"
                        rules={{ required: 'Password is required' }}
                    />
                </div>

                <div className="flex justify-between items-center">
                    <CustomCheckbox
                        name="remember_me"
                        control={loginControl}
                        label={<span className="text-sm font-medium">Remember me</span>}
                    />
                    <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
                        Forgot password?
                    </Link>
                </div>

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={loading}
                    className="h-12 text-base font-semibold shadow-md"
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
                </Button>
            </form>
        </AuthLayout>
    );
};

const mapDispatchToProps = {
    setAlert,
    setLoading
};

const mapStateToProps = (state) => ({
    loading: state.common.loading,
});

export default connect(mapStateToProps, mapDispatchToProps)(Login);
