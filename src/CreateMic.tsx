// What fields I need
// mic name, location, time(start-finish), date, number of slots
// waiting list??
// standby/waiting list - (go to missing slot) jump in if someone is not there
// extra - (go to bottom) go through list, continue through extra

// TODO: make time undefined at the begining; otherwise users will glaze over it

import {
    Button,
    FormGroup,
    InputGroup,
    NumericInput,
    Switch,
    HTMLSelect,
    Popover,
    Menu,
    MenuItem,
    ControlGroup,
    Spinner,
    MenuDivider,
    Tooltip,
    Icon,
} from '@blueprintjs/core';
import { DatePicker } from '@blueprintjs/datetime';
import { css, cx } from '@emotion/css';
import styled from '@emotion/styled';
import { FormikErrors, FormikProps, useFormik } from 'formik';
import { ChangeEvent, useCallback, useState } from 'react';
import { useHistory } from 'react-router';
import {
    CenteredScreen,
    Dialog,
    Error,
    formattedTimeString,
    LocationWrapper,
    MultiStep,
    StepLocation,
    useWindowDimensions,
} from './commonComponents';
import GoogleLocation from './GoolgeLocation';
import SignupDialog from './SignupDialog';
import {
    ICustomPlace,
    IForm,
    IGoogleLocation,
    ISignupSetting,
    IPlaceForm,
    ISignup,
    ITime,
} from './typing';

const CreateMic: React.FC = () => {
    const history = useHistory();
    const [current, setCurrent] = useState(0);

    const formik = useFormik<IForm>({
        initialValues: {
            name: '',
            location: undefined,
            date: undefined,
            standby: undefined,
            slots: 0,
            time: {
                start: { hour: 12, minute: 0, type: 'PM' },
                end: { hour: 12, minute: 0, type: 'PM' },
            },
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

            // validate date
            if (values.date == null) errors.date = 'Date is required';

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
                        (location.location == null || location.location === '')) ||
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
            const res = await fetch('/mic', {
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

    return (
        <CenteredScreen>
            <StepLocation
                steps={[{ label: 'Details' }, { label: 'Sign up settings' }]}
                current={current}
            />
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
            <MultiStep
                steps={[{ label: 'Details' }, { label: 'Sign up settings' }]}
                current={current}
                valid={
                    formik.dirty ? (current === 0 ? firstPageValid(formik.errors) : true) : false
                }
                controlStep={setCurrent}
                submit={formik.submitForm}
            />
        </CenteredScreen>
    );
};

function firstPageValid(errors: FormikErrors<IForm>) {
    const check: Array<keyof IForm> = ['name', 'location', 'date', 'time', 'slots', 'standby'];

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
    const [openDate, setOpenDate] = useState(false);
    const [timeOpen, setTimeOpen] = useState(false);

    const { values, errors } = formik;
    const { location } = values;

    return (
        <div
            className={css`
                width: 90%;
            `}
        >
            <h1>Create Mic</h1>

            <FormGroup label="Mic name" helperText={errors.name && <Error>{errors.name}</Error>}>
                <InputGroup value={formik.values.name} id="name" onChange={formik.handleChange} />
            </FormGroup>
            <FormGroup
                label="Location"
                helperText={errors.location && <Error>{errors.location}</Error>}
            >
                {location ? (
                    <LocationWrapper>
                        {location.type === 'google' ? (
                            <GoogleLocation location={location} />
                        ) : (
                            <CustomLocation location={location} />
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
            <FormGroup label="Date" helperText={errors.date && <Error>{errors.date}</Error>}>
                {values.date ? (
                    <div>
                        <label>{values.date.toLocaleDateString()}</label>
                        <Button
                            icon="delete"
                            minimal
                            onClick={() => formik.setValues({ ...values, date: undefined })}
                        />
                    </div>
                ) : (
                    <Button text="Add date" icon="add" onClick={() => setOpenDate(true)} />
                )}
            </FormGroup>
            <FormGroup label="Time" helperText={errors.time && <Error>{errors.time}</Error>}>
                <div
                    className={css`
                        display: flex;
                        align-items: center;
                    `}
                >
                    {formattedTimeString(formik.values.time)}
                    <Button icon="edit" minimal onClick={() => setTimeOpen((prev) => !prev)} />
                </div>
            </FormGroup>
            <FormGroup
                label="Number of slots"
                helperText={errors.slots && <Error>{errors.slots}</Error>}
            >
                <NumericInput
                    id="slots"
                    fill
                    inputMode="numeric"
                    value={values.slots}
                    onValueChange={(slots) => formik.setValues({ ...values, slots })}
                    min={0}
                />
            </FormGroup>
            <FormGroup
                label="Waiting list"
                className={css`
                    padding-bottom: 2rem;
                `}
                helperText={errors.standby && <Error>{errors.standby}</Error>}
            >
                <ControlGroup>
                    <HTMLSelect
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
                    />
                    <NumericInput
                        fill
                        value={formik.values.standby?.slots ?? 0}
                        onValueChange={(slots) =>
                            formik.setValues({
                                ...formik.values,
                                standby: {
                                    ...(formik.values.standby ?? { type: 'standby' }),
                                    slots,
                                },
                            })
                        }
                    />
                </ControlGroup>
            </FormGroup>
            <Dialog isOpen={openLocation} onClose={() => setOpenLocation(false)}>
                <LocationSetting formik={formik} close={() => setOpenLocation(false)} />
            </Dialog>
            <Dialog isOpen={openDate} onClose={() => setOpenDate(false)} center>
                <MicDate close={() => setOpenDate(false)} formik={formik} />
            </Dialog>
            <Dialog isOpen={timeOpen} onClose={() => setTimeOpen(false)} center>
                <h1>Add mic time</h1>
                <MicTime formik={formik} />
            </Dialog>
        </div>
    );
};

export default CreateMic;

const MicDate: React.FC<{ close: () => void; formik: FormikProps<IForm> }> = ({
    close,
    formik,
}) => {
    const [date, setDate] = useState(formik.values.date);

    return (
        <>
            <h1>Select date</h1>
            <DatePicker
                highlightCurrentDay
                canClearSelection
                value={formik.values.date}
                onChange={(e) => setDate(e)}
            />
            <div
                className={css`
                    margin: 1rem 1rem 0;
                    display: flex;
                    justify-content: space-between;
                    width: 100%;
                `}
            >
                <Button text="Cancel" onClick={close} />
                <Button
                    intent="primary"
                    text="Submit"
                    onClick={() => {
                        formik.setValues({ ...formik.values, date });
                        close();
                    }}
                />
            </div>
        </>
    );
};

const MicTime: React.FC<{ formik: FormikProps<IForm> }> = ({ formik }) => {
    const { width } = useWindowDimensions();

    return (
        <div
            className={css`
                ${width < 600 && 'flex-direction: column;'}
            `}
        >
            <TimeInput formik={formik} type="start" />
            <div
                className={css`
                    display: flex;
                    align-items: center;
                    padding: 0 1rem;
                    text-align: center;
                    padding: 0.4rem;
                    max-width: 150px;
                    justify-content: center;
                `}
            >
                to
            </div>
            <TimeInput formik={formik} type="end" />
        </div>
    );
};

const TimeInputCss = styled.input`
    max-width: 50px;
    border-width: 1px;
    border-style: inset;
    box-shadow: 0 0 0 0 rgb(19 124 189 / 0%), 0 0 0 0 rgb(19 124 189 / 0%),
        inset 0 0 0 1px rgb(16 22 26 / 15%), inset 0 1px 1px rgb(16 22 26 / 20%);
    border-radius: 3px;
    padding: 0 10px;
    line-height: 30px;
`;

const TimeInput: React.FC<{ formik: FormikProps<IForm>; type: 'start' | 'end' }> = ({
    formik,
    type,
}) => {
    const validate =
        (min: number, max: number, setItem: (n: number) => void) =>
        (e: ChangeEvent<HTMLInputElement>) => {
            const val = e.currentTarget.value;
            if (val.length > 2) return;

            try {
                const hr = parseInt(val);
                if (val === '') return setItem(0);
                if (Number.isNaN(hr) || hr > max || hr < min) return;
                setItem(hr);
            } catch (e) {
                console.log(e);
            }
        };

    const current = formik.values.time?.[type];

    const setValue = (item: keyof ITime, val: string | number) => {
        formik.setValues({
            ...formik.values,
            time: {
                ...formik.values.time,
                [type]: { ...current, [item]: val },
            },
        });
    };

    const validateHour = validate(0, 12, (hour) => setValue('hour', hour));
    const validateMin = validate(0, 59, (minute) => setValue('minute', minute));

    return (
        <div
            className={css`
                display: flex;
                align-items: center;
            `}
        >
            <TimeInputCss value={current.hour} onChange={validateHour} inputMode="numeric" />
            :
            <TimeInputCss value={current.minute} inputMode="numeric" onChange={validateMin} />
            <HTMLSelect
                options={['AM', 'PM']}
                value={current.type}
                onChange={(e) => setValue('type', e.currentTarget.value)}
            />
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
                const res = await fetch(`/getplaces?search=${searchVal}`);
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
                                                        formatted_address: 'Use custom location',
                                                        place_id: '',
                                                    }}
                                                />
                                            }
                                            onClick={() =>
                                                update({ type: 'custom', location: search })
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
                    <div>
                        <label>Search and select location</label>
                        <InputGroup
                            fill
                            autoComplete="off"
                            id="locationPopover"
                            value={search}
                            onChange={getPlaces}
                        />
                    </div>
                </Popover>
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
                {location.location}
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
            <SignupDialog
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
                helperText={<Error>{errors?.use}</Error>}
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
                    helperText={<Error>{errors?.required}</Error>}
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
