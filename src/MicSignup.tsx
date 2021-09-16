import { Button, Spinner, Toaster } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router';
import {
    CenteredScreen,
    Dialog,
    FormGroup,
    getFormattedDate,
    getMicSignupState,
    useMic,
    useQuery,
    yfetch,
} from './commonComponents';
import { RowFlex, SmallHeader } from './commonStyles';
import GoogleLocation from './GoolgeLocation';
import { Login } from './Login';
import useMikerList, { removeSignedInUser } from './MikerList';
import SignupDialog, { MicDialog } from './SignupDialog';
import useUserStore from './userStore';

const MicSignup: React.FC = () => {
    const ref = useRef();
    const { id } = useParams<{ id: string }>();
    const { user } = useUserStore((state) => state);
    const [mic, setMic] = useMic(id);
    const [showSignup, setShowSignup] = useState(false);
    const query = useQuery();
    const urlLoc = useLocation();
    const [showLogin, setShowLogin] = useState(false);
    const [showCheckin, setShowCheckin] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const history = useHistory();

    const { mikers, list, refreshMikers } = useMikerList(mic);

    let login = !!query.get('login');

    useEffect(() => {
        if (login && !user) {
            const email = ((urlLoc.state as any)?.email ?? '') as string;
            setShowLogin(true);
            setLoginEmail(email);
        }
    }, [login, urlLoc.state, user]);

    const { location } = mic ?? {};

    const micSignupState = useMemo(() => (mic ? getMicSignupState(mic) : undefined), [mic]);

    const trySignup = async (anon?: any) => {
        if (micSignupState) {
            const body: any = { micId: id };

            let url = '/mic';
            if (anon) body.anon = anon;
            else url += '/user';
            if (micSignupState === 'waiting') url += '/waitinglist';
            url += '/signup';

            return yfetch(url, body);
        }
    };

    const signup = async () => {
        if (user) {
            if (mic) {
                let res = await trySignup();

                if (res) {
                    if (res.ok) {
                        setMic(await res.json());
                        refreshMikers();
                    } else if (res.status === 400)
                        (ref.current as any)?.show({ message: await res.text(), intent: 'danger' });
                }
            }
        } else {
            setShowSignup(true);
        }
    };

    const checkin = async () => {
        if (user) {
            let res = await tryCheckin();

            if (res) {
                if (res.ok) {
                    refreshMikers();
                } else {
                    (ref.current as any)?.show({ message: await res.text(), intent: 'danger' });
                }
            }
        } else {
            setShowCheckin((prev) => !prev);
        }
    };

    const tryCheckin = async (anon?: any) => {
        if (mic) return yfetch('/mic/checkin', { micId: mic.id, anon });
    };

    const signedUp = useMemo(() => {
        return user && mikers && mikers.some((miker) => miker.id === user.id);
    }, [user, mikers]);

    return mic && mikers ? (
        <div
            className={css`
                display: flex;
                justify-content: center;
                flex-direction: column;
                align-items: center;
                overflow: auto;
            `}
        >
            <RowFlex>
                <SmallHeader>{mic.name}</SmallHeader>
                {/* <Button icon="more" minimal /> */}
            </RowFlex>
            <RowFlex
                justify="space-between"
                className={css`
                    width: 100%;
                    padding: 0 1rem;
                `}
            >
                {mic.date && <label>{new Date(mic.date).toLocaleDateString()}</label>}
                <label>{getFormattedDate(mic.start)}</label>
            </RowFlex>
            {location ? (
                location.type === 'custom' ? (
                    <GoogleLocation
                        location={{
                            place_id: '',
                            formatted_address: location.address,
                            name: location.name,
                        }}
                    />
                ) : (
                    <GoogleLocation location={location} />
                )
            ) : null}
            <RowFlex
                justify={mic.checkinOpen ? 'space-between' : 'center'}
                className={css`
                    width: 100%;
                    padding: 1rem 1rem 0 1rem;
                `}
            >
                <FormGroup>
                    {signedUp ? (
                        <Button
                            text="Remove self from list"
                            intent="danger"
                            onClick={() => removeSignedInUser(mic, user, refreshMikers)}
                        />
                    ) : micSignupState === 'waiting' ? (
                        <Button intent="warning" text="Join waiting list" onClick={signup} />
                    ) : micSignupState === 'open' ? (
                        <Button text="Sign up" intent="primary" onClick={signup} />
                    ) : micSignupState === 'full' ? (
                        <Button disabled text="Mic full" />
                    ) : (
                        <Button disabled text="Signup closed" />
                    )}
                </FormGroup>
                {mic.checkinOpen && (
                    <FormGroup>
                        <Button text="Check in" intent="primary" onClick={checkin} />
                    </FormGroup>
                )}
            </RowFlex>
            {list}
            {/* dialogs */}

            <MicDialog
                title="Sign up"
                submitText="Sign up"
                settings={mic.signupConfig}
                isOpen={showSignup}
                close={() => setShowSignup(false)}
                onSubmit={async (values) => {
                    const res = await trySignup(values);

                    if (res) {
                        if (res.ok) {
                            setMic(await res.json());
                            refreshMikers();
                            setShowSignup(false);
                        } else {
                            ref?.current &&
                                (ref.current as any)?.show({
                                    message: await res.text(),
                                    intent: 'danger',
                                });
                            if (res.status === 403) {
                                history.push(`/mic/signup/${id}?login=true`, {
                                    email: values.email,
                                });
                                setShowSignup(false);
                            }
                        }
                    }
                }}
            />
            <MicDialog
                title="Check in"
                submitText="Check in"
                settings={mic.signupConfig}
                isOpen={showCheckin}
                close={() => setShowCheckin(false)}
                onSubmit={async (values) => {
                    const res = await tryCheckin(values);

                    if (res) {
                        if (res.ok) {
                            refreshMikers();
                            setShowCheckin(false);
                        } else {
                            ref?.current &&
                                (ref.current as any)?.show({
                                    message: await res.text(),
                                    intent: 'danger',
                                });
                        }
                    }
                }}
            />

            <Dialog isOpen={showLogin} onClose={() => setShowLogin(false)}>
                <h1>Sign in</h1>
                <p>An account already exists with this email. Please sign in to sign up</p>
                <Login
                    showSignupLink={false}
                    initialEmail={loginEmail}
                    callback={() => setShowLogin(false)}
                />
            </Dialog>
            <Toaster ref={ref as any} />
        </div>
    ) : (
        <CenteredScreen>
            <Spinner size={36} intent="primary" />
        </CenteredScreen>
    );
};

export default MicSignup;
