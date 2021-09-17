import { Button, DialogProps, InputGroup } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { FormikErrors, useFormik } from 'formik';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { Dialog, FormGroup, validateEmail } from './commonComponents';
import { ISignup } from './typing';

type Form = {
    name: string;
    email: string;
    phone?: string;
};

export const MicDialog: React.FC<
    DialogProps & {
        close: () => void;
        settings: ISignup;
        submitText: string;
        onSubmit: (values: Form) => void;
        title: string;
    }
> = (props) => {
    return (
        <PreviewMicDialog
            {...props}
            onSubmit={(values) => {
                const phone = values.phone
                    ? parsePhoneNumber(values.phone, 'US').number.toString()
                    : undefined;
                props.onSubmit({ ...values, phone });
            }}
        />
    );
};

export const PreviewMicDialog: React.FC<
    DialogProps & {
        close: () => void;
        settings: ISignup;
        submitText: string;
        onSubmit?: (values: Form) => void;
        title: string;
    }
> = ({ submitText, close, settings, title, onSubmit, ...props }) => {
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
        onSubmit: onSubmit ? onSubmit : () => {},
    });

    return (
        <Dialog onClose={close} {...props}>
            <div
                className={css`
                    padding: 1rem;
                `}
            >
                <h1>{title}</h1>
                <FormGroup error={errors.name} label="Name" labelInfo="(required)">
                    <InputGroup large value={values.name} id="name" onChange={handleChange} />
                </FormGroup>
                {email.use && (
                    <FormGroup
                        error={errors.email}
                        label="Email"
                        labelInfo={email.required ? '(required)' : ''}
                    >
                        <InputGroup
                            large
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
                        <InputGroup large value={values.phone} id="phone" onChange={handleChange} />
                    </FormGroup>
                )}
                <div
                    className={css`
                        display: flex;
                        justify-content: space-between;
                    `}
                >
                    <Button text="Cancel" onClick={close} />
                    <Button text={submitText} intent="primary" onClick={submitForm} />
                </div>
            </div>
        </Dialog>
    );
};

export default MicDialog;
