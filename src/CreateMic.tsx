// What fields I need
// mic name, location, time(start-finish), date, number of slots
// waiting list??
// standby/waiting list - (go to missing slot) jump in if someone is not there
// extra - (go to bottom) go through list, continue through extra

// TODO: make time undefined at the begining; otherwise users will glaze over it

import {
    Button,
    InputGroup,
    NumericInput,
    Switch,
    Popover,
    Menu,
    MenuItem,
    ControlGroup,
    Spinner,
    MenuDivider,
    Tooltip,
    Icon,
} from '@blueprintjs/core';
import { DateTimePicker } from '@blueprintjs/datetime';
import { css } from '@emotion/css';
import styled from '@emotion/styled';
import { FormikErrors, FormikProps, useFormik } from 'formik';
import { ChangeEvent, useCallback, useState } from 'react';
import { useHistory } from 'react-router';
import {
    CenteredScreen,
    Dialog,
    Error,
    FormGroup,
    getFormattedDate,
    LocationWrapper,
    MultiStep,
    StepLocation,
} from './commonComponents';
import { RowFlex, SmallHeader } from './commonStyles';
import GoogleLocation from './GoolgeLocation';
import SignupDialog, { MicDialog, PreviewMicDialog } from './SignupDialog';
import {
    ICustomPlace,
    IForm,
    IGoogleLocation,
    ISignupSetting,
    IPlaceForm,
    ISignup,
} from './typing';

const Screen = styled.div`
    max-height: 100%;
`;

const CreateMic: React.FC = () => {
    const history = useHistory();
    const [current, setCurrent] = useState(0);

    const formik = useFormik<IForm>({
        initialValues: {
            name: '',
            location: undefined,
            start: undefined,
            end: undefined,
            standby: undefined,
            setLength: 5,
            slots: 0,
            signupConfig: {
                email: { use: true, required: true },
                phone: { use: false, required: false },
            },
            signupOpen: false,
        },
        validate: (values) => {
            const errors: FormikErrors<IForm> = {};
            const signupConfig: FormikErrors<ISignup> = { phone: {}, email: {} };
            const {
                signupConfig: { phone, email },
            } = values;

            // validate waiting list
            if (values.standby != null) {
                if (values.standby.slots < 0) errors.standby = 'Invalid input';
            }

            // Validate set length
            if (values.setLength == null) errors.setLength = 'Set length is required';
            if (values.setLength < 0) errors.setLength = 'Set length must be positive';

            // validate date
            if (values.start == null) errors.start = 'Start time is required';
            if (values.end == null) errors.end = 'End time is required';
            if (values.end && values.start && values.end < values.start)
                errors.end = 'End time must be after start time';

            // Validate mic name
            if (values.name == null || values.name === '') errors.name = 'Mic name is required';

            // validate slots
            if (values.slots == null || values.slots <= 0)
                errors.slots = 'Must have at least one slot';

            if (!values.location) {
                // Validate location
                errors.location = 'Must specify mic location';
            } else {
                const { location } = values;
                if (
                    (location.type === 'custom' &&
                        (location.address == null ||
                            location.address === '' ||
                            location.name == null ||
                            location.name === '')) ||
                    (location.type === 'google' &&
                        (!location.place_id ||
                            !location.place_id ||
                            !location.name ||
                            !location.formatted_address))
                ) {
                    errors.location = 'Location is required';
                }
            }

            // Validate signup settings
            signupConfig.phone = {};
            signupConfig.email = {};
            if (!phone.use && !email.use) {
                signupConfig.phone.use = 'Must use either email or phone number for signup';
                signupConfig.email.use = 'Must use either email or phone number for signup';
            } else {
                if (phone.use && !phone.required && (!email.use || !email.required)) {
                    signupConfig.phone.required = 'Must require at least one identity field';
                }
                if (email.use && !email.required && (!phone.use || !phone.required)) {
                    signupConfig.email.required = 'Must require at least one identity field';
                }
            }

            if (
                Object.keys(signupConfig.phone).length > 0 ||
                Object.keys(signupConfig.email).length > 0
            )
                errors.signupConfig = signupConfig;

            return errors;
        },
        onSubmit: async (values) => {
            console.log(values);
            const res = await fetch('/mic/create', {
                body: JSON.stringify({ mic: values }),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log(res);
            if (res.ok) history.push('/');
        },
    });

    console.log(formik.values);

    return (
        <Screen>
            <form
                className={css`
                    flex: 1;
                    overflow: auto;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                `}
            >
                {current === 0 ? (
                    <BaseSettings formik={formik} />
                ) : (
                    <SignupSettings formik={formik} />
                )}
            </form>
            <RowFlex
                justify="center"
                className={css`
                    position: fixed;
                    bottom: 0;
                    height: 4rem;
                    background-color: white;
                    border-top: 1px solid #00000050;
                    width: 100%;
                `}
            >
                <Button large intent="primary" text="Create" onClick={formik.submitForm} />
            </RowFlex>
            {/* <MultiStep
                steps={[{ label: 'Details' }, { label: 'Sign up settings' }]}
                current={current}
                valid={
                    formik.dirty ? (current === 0 ? firstPageValid(formik.errors) : true) : false
                }
                controlStep={setCurrent}
                submit={formik.submitForm}
            /> */}
        </Screen>
    );
};

function firstPageValid(errors: FormikErrors<IForm>) {
    const check: Array<keyof IForm> = ['name', 'location', 'start', 'end', 'slots', 'standby'];

    for (let i = 0; i < check.length; i++) {
        if (errors[check[i]]) return false;
    }

    return true;
}

function debounce(
    func: (args: any) => void,
    setSearch: (v: string) => void,
    setLoading: (v: boolean) => void,
    timeout = 1000
) {
    let timer: NodeJS.Timeout;
    return (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        setLoading(true);
        clearTimeout(timer);
        timer = setTimeout(() => {
            func(val);
        }, timeout);
    };
}

const BaseSettings: React.FC<{
    formik: FormikProps<IForm>;
}> = ({ formik }) => {
    const [openLocation, setOpenLocation] = useState(false);
    const [openStart, setOpenStart] = useState(false);
    const [openEnd, setOpenEnd] = useState(false);

    const { values, errors } = formik;
    const { location } = values;

    return (
        <div
            className={css`
                width: 90%;
                padding-bottom: 3rem;
            `}
        >
            <h1>Create Mic</h1>

            <FormGroup label="Mic name" error={errors.name}>
                <InputGroup
                    large
                    value={formik.values.name}
                    id="name"
                    onChange={formik.handleChange}
                />
            </FormGroup>
            <FormGroup label="Location" error={errors.location}>
                {location ? (
                    <LocationWrapper>
                        {location.type === 'google' ? (
                            <GoogleLocation location={location} />
                        ) : (
                            // <CustomLocation location={location} />
                            <GoogleLocation
                                location={{
                                    place_id: '',
                                    formatted_address: location.address,
                                    name: location.name,
                                }}
                            />
                        )}
                        <Button
                            icon="delete"
                            minimal
                            onClick={() =>
                                formik.setValues({ ...formik.values, location: undefined })
                            }
                        />
                    </LocationWrapper>
                ) : (
                    <Button
                        text="Add location"
                        icon="add"
                        onClick={() => setOpenLocation((prev) => !prev)}
                    />
                )}
            </FormGroup>
            <FormGroup label="Start time" error={errors.start}>
                {!values.start ? (
                    <Button
                        text="Start time"
                        icon="time"
                        onClick={() => setOpenStart((prev) => !prev)}
                    />
                ) : (
                    <RowFlex>
                        {getFormattedDate(values.start)}
                        <Button minimal icon="edit" onClick={() => setOpenStart((prev) => !prev)} />
                    </RowFlex>
                )}
            </FormGroup>
            <FormGroup label="End time" error={errors.end}>
                {!values.end ? (
                    <Button
                        text="End time"
                        icon="time"
                        onClick={() => setOpenEnd((prev) => !prev)}
                    />
                ) : (
                    <RowFlex>
                        {getFormattedDate(values.end)}
                        <Button minimal icon="edit" onClick={() => setOpenEnd((prev) => !prev)} />
                    </RowFlex>
                )}
            </FormGroup>
            <FormGroup label="Set length (minutes)" error={errors.setLength}>
                <NumericInput
                    large
                    value={values.setLength}
                    onValueChange={(n) =>
                        formik.setValues({ ...values, setLength: Number.isNaN(n) ? 0 : n })
                    }
                />
                minutes
            </FormGroup>
            <FormGroup label="Number of slots" error={errors.slots}>
                <NumericInput
                    large
                    id="slots"
                    fill
                    inputMode="numeric"
                    value={values.slots}
                    onValueChange={(n) =>
                        formik.setValues({ ...values, slots: Number.isNaN(n) ? 0 : n })
                    }
                    min={0}
                />
            </FormGroup>
            <FormGroup
                label="Waiting list"
                className={css`
                    padding-bottom: 2rem;
                `}
                error={errors.standby}
            >
                <ControlGroup>
                    {/* <HTMLSelect
                        value={formik.values.standby?.type ?? 'standby'}
                        onChange={(e) =>
                            formik.setValues({
                                ...formik.values,
                                standby: {
                                    ...(formik.values.standby ?? { slots: 0 }),
                                    type: e.currentTarget.value as 'standby' | 'extra',
                                },
                            })
                        }
                        options={[
                            { label: 'Standby slot', value: 'standby' },
                            { label: 'Extra slots', value: 'extra' },
                        ]}
                    /> */}
                    <NumericInput
                        large
                        fill
                        value={formik.values.standby?.slots ?? 0}
                        onValueChange={(n) =>
                            formik.setValues({
                                ...formik.values,
                                standby: {
                                    ...(formik.values.standby ?? { type: 'extra' }),
                                    slots: Number.isNaN(n) ? 0 : n,
                                },
                            })
                        }
                    />
                </ControlGroup>
            </FormGroup>
            <Dialog isOpen={openLocation} onClose={() => setOpenLocation(false)}>
                <SimpleLocation formik={formik} close={() => setOpenLocation(false)} />
            </Dialog>

            <Dialog isOpen={openStart} onClose={() => setOpenStart(false)}>
                {openStart && (
                    <>
                        <RowFlex justify="center">
                            <SmallHeader>Set start time</SmallHeader>
                        </RowFlex>
                        <DateTime close={() => setOpenStart(false)} formik={formik} type="start" />
                    </>
                )}
            </Dialog>
            <Dialog isOpen={openEnd} onClose={() => setOpenEnd(false)}>
                {openEnd && (
                    <>
                        <RowFlex justify="center">
                            <SmallHeader>Set start time</SmallHeader>
                        </RowFlex>
                        <DateTime close={() => setOpenEnd(false)} formik={formik} type="end" />
                    </>
                )}
            </Dialog>
        </div>
    );
};

export default CreateMic;

const DateTime: React.FC<{ type: 'start' | 'end'; close: () => void; formik: FormikProps<IForm> }> =
    ({ close, formik, type }) => {
        const [time, setTime] = useState(
            formik.values[type] ??
                (() => {
                    const d = new Date();
                    d.setMinutes(0);
                    console.log(d);
                    return d;
                })()
        );

        const setMicTime = () => {
            const values = { ...formik.values, [type]: time };
            // if (type === 'end' && formik.values.slots === 0 && formik.values.start) {
            //     const slots =
            //     values.slots=
            // }

            formik.setValues(values);
            close();
        };

        return (
            <>
                <RowFlex justify="center">
                    <DateTimePicker
                        value={time}
                        timePickerProps={{ useAmPm: true }}
                        onChange={(d) => setTime(d)}
                    />
                </RowFlex>
                <RowFlex
                    className={css`
                        padding: 1rem 0 0 0;
                    `}
                    justify="space-between"
                >
                    <Button text="Cancel" onClick={close} />
                    <Button intent="primary" text="Set time" onClick={setMicTime} />
                </RowFlex>
            </>
        );
    };

const SimpleLocation: React.FC<{ close: () => void; formik: FormikProps<IForm> }> = ({
    formik,
    close,
}) => {
    const { address: lAddress = '', name: lName = '' } =
        formik.values.location?.type === 'custom' ? formik.values.location : {};
    const [name, setName] = useState(lName);
    const [address, setAddress] = useState(lAddress);

    const add = () => {
        formik.setValues({ ...formik.values, location: { type: 'custom', name, address } });
        close();
    };

    return (
        <div>
            <RowFlex justify="center">
                <SmallHeader>Add location</SmallHeader>
            </RowFlex>
            <FormGroup label="Name (required)">
                <InputGroup required large onChange={(e) => setName(e.target.value)} value={name} />
            </FormGroup>
            <FormGroup label="Address (required)" error={formik.errors.location}>
                <InputGroup large onChange={(e) => setAddress(e.target.value)} value={address} />
            </FormGroup>
            <RowFlex
                justify="space-between"
                className={css`
                    margin: 1rem 0 0 0;
                `}
            >
                <Button text="Cancel" onClick={close} />
                <Button text="Add" onClick={add} intent="primary" disabled={!name || !address} />
            </RowFlex>
        </div>
    );
};

const LocationSetting: React.FC<{ close: () => void; formik: FormikProps<IForm> }> = ({
    formik,
    close,
}) => {
    const [places, setPlaces] = useState<IGoogleLocation[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string>();

    const fetchPlace = useCallback(async (searchVal: string) => {
        if (searchVal && searchVal !== '') {
            try {
                setFetchError(undefined);
                const res = await fetch(`/mic/getplaces?search=${searchVal}`);
                const places = await res.json();
                console.log(places);
                setPlaces(places);
                setLoading(false);
            } catch {
                setFetchError('Error loading locations');
            }
        }
    }, []);

    const getPlaces = useCallback(debounce(fetchPlace, setSearch, setLoading, 200), [
        setSearch,
        setLoading,
        fetchPlace,
    ]);

    const update = (loc: IPlaceForm | ICustomPlace | undefined) => {
        formik.setValues({
            ...formik.values,
            location: loc,
        });
        close();
    };

    const { location } = formik.values;

    return (
        <>
            <h1>Search location</h1>
            {location == null ? (
                <>
                    <label>Search and select location</label>
                    <Popover
                        popoverClassName={css`
                            max-height: 250px;
                            overflow: auto;
                            max-width: 90vw;
                        `}
                        position="bottom-left"
                        minimal
                        content={
                            fetchError ? (
                                <Error>{fetchError}</Error>
                            ) : loading ? (
                                <div
                                    className={css`
                                        width: 90vw;
                                        padding: 0.5rem;
                                    `}
                                >
                                    <Spinner />
                                </div>
                            ) : (
                                <Menu>
                                    {search != null && search !== '' && (
                                        <>
                                            <MenuItem
                                                text={
                                                    <GoogleLocation
                                                        location={{
                                                            name: search,
                                                            formatted_address:
                                                                'Use custom location',
                                                            place_id: '',
                                                        }}
                                                    />
                                                }
                                                onClick={() =>
                                                    update({
                                                        type: 'custom',
                                                        name: search,
                                                        address: '',
                                                    })
                                                }
                                            />
                                            <MenuDivider />
                                        </>
                                    )}
                                    {places.length === 0 ? (
                                        <label
                                            className={css`
                                                width: 90vw;
                                                display: block;
                                                padding: 0.5rem;
                                            `}
                                        >
                                            No results
                                        </label>
                                    ) : (
                                        places.map((p) => (
                                            <MenuItem
                                                onClick={() => update({ type: 'google', ...p })}
                                                text={<GoogleLocation location={p} />}
                                            />
                                        ))
                                    )}
                                </Menu>
                            )
                        }
                    >
                        <InputGroup
                            large
                            fill
                            autoComplete="off"
                            id="locationPopover"
                            value={search}
                            onChange={getPlaces}
                        />
                    </Popover>
                </>
            ) : location.type === 'custom' ? (
                <LocationWrapper>
                    <CustomLocation location={location} />
                    <Button icon="delete" minimal onClick={() => update(undefined)} />
                </LocationWrapper>
            ) : (
                <LocationWrapper>
                    <GoogleLocation location={location} />
                    <Button icon="delete" minimal onClick={() => update(undefined)} />
                </LocationWrapper>
            )}
            <div
                className={css`
                    margin: 1rem 0 0 0;
                `}
            >
                <Button text="Cancel" onClick={close} />
            </div>
        </>
    );
};

const CustomLocation: React.FC<{ location: ICustomPlace }> = ({ location }) => {
    return (
        <div
            className={css`
                display: flex;
                flex-direction: column;
            `}
        >
            <label
                className={css`
                    font-weight: 700;
                `}
            >
                {location.name}
            </label>
        </div>
    );
};

const SignupSettings: React.FC<{
    formik: FormikProps<IForm>;
}> = ({ formik }) => {
    const [previewOpen, setPreviewOpen] = useState(false);

    const {
        values: { signupConfig: settings },
        errors: { signupConfig: errors },
        values,
    } = formik;

    const update = (signupConfig: ISignup) => formik.setValues({ ...formik.values, signupConfig });

    const { email, phone } = settings;

    const updateSetting = (
        type: 'email' | 'phone',
        setting: 'use' | 'required',
        value: boolean
    ) => {
        update({
            ...settings,
            [type]: {
                ...settings[type],
                [setting]: value,
            },
        });
    };

    return (
        <div
            className={css`
                width: 90%;
            `}
        >
            <h1>Configure signup</h1>
            <h2>Required information</h2>
            <SignupSubSetting
                label="Emial"
                errors={errors?.email}
                setting={email}
                update={(type, val) => updateSetting('email', type, val)}
            />
            <SignupSubSetting
                label="Phone number"
                errors={errors?.phone}
                setting={phone}
                update={(type, val) => updateSetting('phone', type, val)}
            />
            <FormGroup>
                <Button text="Preview" onClick={() => setPreviewOpen((prev) => !prev)} />
            </FormGroup>
            <FormGroup
                label={
                    <div
                        className={css`
                            display: flex;
                            align-items: center;
                        `}
                    >
                        Open signup
                        <Tooltip content="Select whether you want the sign up to the mic open as soon as it's posted, or if you want to open it manually later">
                            <Icon
                                className={css`
                                    padding-left: 1rem;
                                    display: flex;
                                `}
                                icon="info-sign"
                            />
                        </Tooltip>
                    </div>
                }
            >
                <Switch
                    label="Open signup on post"
                    checked={formik.values.signupOpen}
                    onChange={(e) =>
                        formik.setValues({ ...values, signupOpen: e.currentTarget.checked })
                    }
                />
            </FormGroup>
            {/* Preview */}
            <PreviewMicDialog
                title="Sign up"
                submitText="Sign up"
                settings={settings}
                isOpen={previewOpen}
                close={() => setPreviewOpen(false)}
            />
        </div>
    );
};

const SignupSubSetting: React.FC<{
    label: string;
    update: (type: keyof ISignupSetting, val: boolean) => void;
    errors?: FormikErrors<ISignupSetting>;
    setting: ISignupSetting;
}> = ({ errors, setting, update, label }) => {
    return (
        <>
            <FormGroup
                className={css`
                    margin: 0;
                `}
                error={errors?.use}
            >
                <Switch
                    label={label}
                    checked={setting.use}
                    onChange={(e) => update('use', e.currentTarget.checked)}
                />
            </FormGroup>
            {setting.use && (
                <FormGroup
                    className={css`
                        padding: 0 1rem 0.5rem 1rem;
                        margin: 0;
                    `}
                    error={errors?.required}
                >
                    <Switch
                        checked={setting.required}
                        label="Required?"
                        onChange={(e) => update('required', e.currentTarget.checked)}
                    />
                </FormGroup>
            )}
        </>
    );
};
