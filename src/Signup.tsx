import { Button, Icon, InputGroup, Switch, Toaster, Tooltip } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { FormikErrors, useFormik } from 'formik';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CenteredScreen, FormGroup, PasswordInput, validateEmail } from './commonComponents';
import useUserStore from './userStore';

type ISignup = {
    first: string;
    last: string;
    email: string;
    password: string;
    admin: boolean;
};

const Signup: React.FC = () => {
    const login = useUserStore((state) => state.login);
    const ref = useRef();

    const formik = useFormik({
        initialValues: {
            first: '',
            last: '',
            email: '',
            password: '',
            admin: false,
        },
        validate: (values) => {
            const errors: FormikErrors<ISignup> = {};

            // validate basic fields

            if (!values.first) errors.first = 'First name required';
            if (!values.last) errors.last = 'Last name required';
            if (!values.email) errors.email = 'Email required';
            if (!values.password) errors.password = 'Password required';

            // validate email
            if (!validateEmail(values.email)) errors.email = 'Invalid email';

            return errors;
        },
        onSubmit: async (values) => {
            const res = await fetch('users/signup', {
                body: JSON.stringify({ user: values }),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(res);
            if (res.ok) {
                login((await res.json()).user);
            } else {
                (ref.current as any)?.show({ message: await res.text(), intent: 'danger' });
            }
        },
    });

    const { errors, values } = formik;

    return (
        <CenteredScreen>
            <h1>{`Create an account`}</h1>
            <Toaster ref={ref as any} />
            <FormGroup label="First name" error={errors.first}>
                <InputGroup id="first" onChange={formik.handleChange} value={values.first} />
            </FormGroup>
            <FormGroup label="Last name" error={errors.last}>
                <InputGroup id="last" onChange={formik.handleChange} value={values.last} />
            </FormGroup>
            <FormGroup label="Email" error={errors.email}>
                <InputGroup
                    type="email"
                    id="email"
                    onChange={formik.handleChange}
                    value={values.email}
                />
            </FormGroup>
            <PasswordInput
                onChange={formik.handleChange}
                value={formik.values.password}
                error={errors.password}
            />
            <FormGroup
                label={
                    <div
                        className={css`
                            display: flex;
                            align-items: center;
                        `}
                    >
                        Mic host
                        <Tooltip
                            className={css`
                                padding: 5px;
                            `}
                            content="Mic hosts can still use their account to signup for mics"
                        >
                            <Icon icon="info-sign" />
                        </Tooltip>
                    </div>
                }
            >
                <Switch
                    value={values.password}
                    onChange={formik.handleChange}
                    id="admin"
                    label="This account will be used to host mics"
                />
            </FormGroup>
            <FormGroup>
                <Button text="Sign up" intent="primary" onClick={formik.submitForm} />
            </FormGroup>
            <FormGroup>
                <Link to="/login">Already have an account? Login</Link>
            </FormGroup>
        </CenteredScreen>
    );
};

export default Signup;
