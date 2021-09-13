import { Button, DialogProps, InputGroup, Toaster } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { FormikErrors, useFormik } from 'formik';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { useRef } from 'react';

import { useHistory, useParams } from 'react-router';
import { Dialog, FormGroup, validateEmail } from './commonComponents';
import { ISignup } from './typing';

type Form = {
    name: string;
    email: string;
    phone?: string;
};

const SignupDialog: React.FC<
    DialogProps & {
        onSignup?: (anon: any) => Promise<Response | undefined>;
        callback?: () => void;
        toastRef?: any;
        close: () => void;
        settings: ISignup;
        submitText?: string;
    }
> = ({ submitText, callback, close, settings, onSignup, toastRef, ...props }) => {
    const history = useHistory();
    const { id } = useParams<{ id: string }>();
    const { email, phone } = settings;

    const { values, errors, handleChange, submitForm } = useFormik({
        initialValues: {
            name: '',
            email: '',
            phone: undefined,
        },
        validate: (values) => {
            const errors: FormikErrors<Form> = {};
            if (!values.name) errors.name = 'Name is required';

            if (email.use) {
                if (email.required && !values.email) errors.email = 'Email is required';
                if (values.email && !validateEmail(values.email)) errors.email = 'Invalid email';
            }
            if (phone.use) {
                if (phone.required && !values.phone) {
                    errors.phone = 'Phone number is required';
                }
                if (values.phone && !isValidPhoneNumber(values.phone, 'US'))
                    errors.phone = 'Invalid phone number';
            }
            return errors;
        },
        onSubmit: async (values) => {
            if (id != null) {
                console.log(values);
                const phone = values.phone ? parsePhoneNumber(values.phone, 'US') : undefined;

                if (onSignup) {
                    const res = await onSignup({ ...values, phone });

                    if (res) {
                        if (res.ok) {
                            if (callback) callback();
                            close();
                        } else if (res.status === 403) {
                            toastRef?.current &&
                                (toastRef.current as any)?.show({
                                    message: 'Email is tied to an account. Please login',
                                    intent: 'danger',
                                });
                            history.push(`/mic/signup/${id}?login=true`, { email: values.email });
                            close();
                        } else {
                            toastRef?.current &&
                                (toastRef.current as any)?.show({
                                    message: await res.text(),
                                    intent: 'danger',
                                });
                        }
                    }
                }
            }
        },
    });

    return (
        <Dialog onClose={close} {...props}>
            <div
                className={css`
                    padding: 1rem;
                `}
            >
                <h1>Sign up</h1>
                <FormGroup error={errors.name} label="Name" labelInfo="(required)">
                    <InputGroup value={values.name} id="name" onChange={handleChange} />
                </FormGroup>
                {email.use && (
                    <FormGroup
                        error={errors.email}
                        label="Email"
                        labelInfo={email.required ? '(required)' : ''}
                    >
                        <InputGroup
                            type="email"
                            value={values.email}
                            id="email"
                            onChange={handleChange}
                        />
                    </FormGroup>
                )}
                {phone.use && (
                    <FormGroup
                        error={errors.phone}
                        label="Phone"
                        labelInfo={phone.required ? '(required)' : ''}
                    >
                        <InputGroup value={values.phone} id="phone" onChange={handleChange} />
                    </FormGroup>
                )}
                <div
                    className={css`
                        display: flex;
                        justify-content: space-between;
                    `}
                >
                    <Button text="Cancel" onClick={close} />
                    <Button text={submitText ?? 'Sign up'} intent="primary" onClick={submitForm} />
                </div>
            </div>
        </Dialog>
    );
};

export default SignupDialog;
