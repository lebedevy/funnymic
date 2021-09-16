import { Button, InputGroup, Toaster } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { FormikErrors, useFormik } from 'formik';
import { useRef } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { CenteredScreen, FormGroup, PasswordInput, validateEmail } from './commonComponents';
import { ColumnFlex } from './commonStyles';
import useUserStore from './userStore';

export const LoginScreen: React.FC = () => {
    const history = useHistory();
    return (
        <div
            className={css`
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
            `}
        >
            <Login callback={() => history.push('/')} />
        </div>
    );
};

export const Login: React.FC<{
    callback?: () => void;
    initialEmail?: string;
    showSignupLink?: boolean;
}> = ({ initialEmail, showSignupLink = true, callback }) => {
    const login = useUserStore((state) => state.login);
    const ref = useRef();

    const {
        values: { email, password },
        errors,
        handleChange,
        submitForm,
    } = useFormik({
        initialValues: {
            email: initialEmail ?? '',
            password: '',
        },
        validate: (values) => {
            const errors: FormikErrors<{ email: string; password: string }> = {};

            if (!validateEmail(values.email)) errors.email = 'Invalid email';
            if (!values.password) errors.password = 'Invalid password';

            return errors;
        },
        onSubmit: async ({ email, password }) => {
            const res = await fetch('/users/login', {
                body: JSON.stringify({ email, password }),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (res.ok) {
                login(await res.json());
                if (callback) callback();
            } else (ref.current as any)?.show({ message: await res.text(), intent: 'danger' });
        },
    });

    return (
        <ColumnFlex>
            <Toaster ref={ref as any} />
            <FormGroup label="Email" error={errors.email}>
                <InputGroup large type="email" id="email" value={email} onChange={handleChange} />
            </FormGroup>
            <PasswordInput onChange={handleChange} value={password} error={errors.password} />
            <FormGroup>
                <Button text="Login" intent="primary" onClick={submitForm} />
            </FormGroup>
            {showSignupLink && <Link to="/signup">Don't have an account? Sign up</Link>}
        </ColumnFlex>
    );
};
