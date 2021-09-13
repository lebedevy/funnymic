import { Button, Icon, Spinner, Tooltip, Text, Tag } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { fetchDetails } from './api';
import { FormGroup, yfetch } from './commonComponents';
import { RowFlex, SmallHeader } from './commonStyles';
import useMikerList from './MikerList';
import { IMicPerfomer, IMicResult } from './typing';
import useUserStore from './userStore';
import { useTimer } from 'react-timer-hook';

const getCurrentMiker = (mikers: IMicPerfomer[]) => {
    return mikers.find(
        ({ checkedIn, setMissed, setComplete }) =>
            (checkedIn && (!setComplete || (setMissed && !setComplete))) ||
            (!checkedIn && !setMissed)
    );
};

const ManageMic: React.FC = () => {
    const user = useUserStore((state) => state.user);
    const { id } = useParams<{ id: string }>();
    const [mic, setMic] = useState<IMicResult>();
    const { list, mikers, refreshMikers } = useMikerList(mic, {
        admin: !!(user && mic && user.id === mic.userId),
    });

    const current = useMemo(() => getCurrentMiker(mikers), [mikers]);

    const getMic = useCallback(async () => {
        const mic = await fetchDetails(id);
        if (mic.ok) setMic(await mic.json());
    }, [id]);

    useEffect(() => {
        getMic();
    }, [getMic]);

    const updateMicSignup = async (micSignupState: boolean) => {
        if (mic) {
            const res = await yfetch('/mic/managesignupstate', { micId: mic.id, micSignupState });
            if (res.ok) {
                setMic(await res.json());
            }
        }
    };

    const updateMicCheckin = async (checkinOpen: boolean) => {
        if (mic) {
            const res = await yfetch('/mic/managecheckin', {
                micId: mic.id,
                checkinOpen,
                micSignupState: checkinOpen ? false : undefined,
            });
            if (res.ok) {
                setMic(await res.json());
            }
        }
    };

    return (
        <>
            {mic ? (
                <>
                    <RowFlex justify="center">
                        <SmallHeader>{mic.name}</SmallHeader>
                        <Button icon="cog" minimal />
                    </RowFlex>
                    {!mic.signupOpen && (
                        <RowFlex justify="space-between">
                            <FormGroup
                                className={css`
                                    margin: 1rem 1rem 0 1rem;
                                `}
                            >
                                <Button
                                    onClick={() => updateMicSignup(!mic.signupOpen)}
                                    intent={mic.signupOpen ? 'danger' : 'success'}
                                    text={`${mic.signupOpen ? 'Close' : 'Open'} signup`}
                                    rightIcon={
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Tooltip
                                                className={css`
                                                    margin: 0 8px;
                                                `}
                                                content="Controls whether people can sign up for your mic"
                                            >
                                                <Icon icon="info-sign" />
                                            </Tooltip>
                                        </div>
                                    }
                                />
                            </FormGroup>
                            <FormGroup
                                className={css`
                                    margin: 1rem 1rem 0 1rem;
                                `}
                            >
                                <Button
                                    onClick={() => updateMicCheckin(!mic.checkinOpen)}
                                    intent={mic.checkinOpen ? 'danger' : 'success'}
                                    text={`${mic.checkinOpen ? 'Close' : 'Open'} check in`}
                                />
                            </FormGroup>
                        </RowFlex>
                    )}
                    {current && (
                        <ManageMiker miker={current} mic={mic} refreshMikers={refreshMikers} />
                    )}
                </>
            ) : (
                <Spinner />
            )}
            {list}
        </>
    );
};

export default ManageMic;

const ManageMiker: React.FC<{ refreshMikers: () => void; mic: IMicResult; miker: IMicPerfomer }> =
    ({ mic, miker, refreshMikers }) => {
        const setLength = 5;
        const [started, setStarted] = useState(false);

        const { seconds, minutes, isRunning, pause, resume, restart } = useTimer({
            expiryTimestamp: new Date(),
            autoStart: false,
            onExpire: () => console.log('done'),
        });

        const startTimer = () => {
            setStarted(true);
            const time = new Date();
            time.setSeconds(time.getSeconds() + 70); //300);
            restart(time);
        };

        // DUPLICATE FROM MIKER LIST
        const checkinUser = async () => {
            const res = await yfetch('/mic/admin/checkin', { micId: mic.id, userId: miker.id });
            if (res.ok) refreshMikers();
        };

        console.log(isRunning, seconds, minutes);

        return (
            <div
                className={css`
                    border: 1px solid #00000040;
                    border-radius: 3px;
                    padding: 1rem;
                    margin: 0.5rem;
                `}
            >
                <Text
                    className={css`
                        font-size: 1.2rem;
                    `}
                    ellipsize
                >
                    Current performer:{' '}
                    <label
                        className={css`
                            font-size: 1.2rem;
                            font-weight: 600;
                        `}
                    >
                        {miker.name}
                    </label>
                </Text>
                <div>
                    <RowFlex
                        justify="space-between"
                        className={css`
                            padding: 1rem 0;
                            font-size: 1.2rem;
                        `}
                    >
                        Timer
                        <div
                            className={css`
                                padding-left: 1rem;
                                font-size: inherit;
                                ${minutes <= 0 && `color: orange;`}
                            `}
                        >{`${started ? minutes : setLength}m ${started ? seconds : 0}s`}</div>
                        <div>
                            <Button
                                icon={isRunning ? 'pause' : 'play'}
                                minimal
                                onClick={() =>
                                    isRunning ? pause() : started ? resume() : startTimer()
                                }
                            />
                            <Button
                                icon="stop"
                                minimal
                                onClick={() => {
                                    pause();
                                    setStarted(false);
                                }}
                            />
                        </div>
                    </RowFlex>
                    <RowFlex
                        justify="space-between"
                        className={css`
                            // margin: 1rem 0;
                        `}
                    >
                        <FormGroup>
                            {miker.checkedIn ? (
                                <Tag large intent="success">
                                    <Icon
                                        className={css`
                                            padding-right: 0.5rem;
                                        `}
                                        icon="tick"
                                    />
                                    Checked in
                                </Tag>
                            ) : (
                                <Button
                                    icon="tick"
                                    minimal
                                    text="Check in"
                                    disabled={miker.checkedIn}
                                    onClick={checkinUser}
                                />
                            )}
                        </FormGroup>
                        <FormGroup>
                            <Button
                                icon="tick-circle"
                                minimal
                                text="Set complete"
                                onClick={async () => {
                                    const res = await yfetch('/mic/completeset', {
                                        userId: miker.id,
                                        micId: mic.id,
                                    });
                                    if (res.ok) refreshMikers();
                                }}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Button
                                icon="step-forward"
                                minimal
                                text="Skip"
                                // icon="arrow-right"
                                onClick={async () => {
                                    const res = await yfetch('/mic/missedset', {
                                        userId: miker.id,
                                        micId: mic.id,
                                        setComplete: miker.checkedIn ? true : undefined,
                                    });
                                    if (res.ok) refreshMikers();
                                }}
                            />
                        </FormGroup>
                    </RowFlex>
                </div>
            </div>
        );
    };
