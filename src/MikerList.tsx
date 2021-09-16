import {
    Button,
    Card,
    Icon,
    IconName,
    Intent,
    Menu,
    MenuItem,
    Popover,
    Text,
    Toaster,
    Tooltip,
} from '@blueprintjs/core';
import { css } from '@emotion/css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMikers } from './api';
import { Dialog, useMic, yfetch } from './commonComponents';
import { ColumnFlex, RowFlex } from './commonStyles';
import useMicStore from './micStore';
import { MicDialog } from './SignupDialog';
import { IMicPerfomer, IMicResult } from './typing';
import useUserStore, { IUser } from './userStore';

export const removeSignedInUser = async (
    mic: IMicResult | undefined,
    user: IUser | undefined,
    refreshMikers: () => void
) => {
    if (user && mic) {
        const res = await fetch('/mic/removeself', {
            body: JSON.stringify({ micId: mic.id }),
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        console.log(res);
        if (res.ok) refreshMikers();
    }
};

const useMikerList = (
    mic: IMicResult | undefined,
    { admin }: { admin: boolean } = { admin: false }
) => {
    const [mikers, setMikers] = useState<IMicPerfomer[]>();
    const setMic = useMicStore((store) => store.setCurrentMic);

    const id = mic?.id;

    const refreshMikers = useCallback(async () => {
        if (id != null) {
            const res = await fetchMikers(id);
            if (res.ok) {
                const mikers = await res.json();
                setMikers(mikers);
            }
        }
    }, [id]);

    // Probably not the right place for this
    useEffect(() => {
        if (id != null) {
            const host =
                process.env.NODE_ENV === 'production' ? window.location.host : 'localhost:8080';
            let ws = new WebSocket(`wss://${host}/socket/mic`);
            ws.onopen = () => {
                console.log('Opening ws connection');
                ws.send(id.toString());
            };
            ws.onmessage = (event) => {
                console.log('::ws event');
                const { mic, mikers } = JSON.parse(event.data);
                if (mic) setMic(mic);
                if (mikers) setMikers(mikers);
            };
            return () => ws.close();
        }
    }, [id, setMic]);

    useEffect(() => {
        refreshMikers();
    }, [refreshMikers]);

    const setNext = useCallback(
        async (id: number) => {
            if (mikers && mic) {
                const res = await yfetch('/mic/performer/setnext', {
                    curPerfId: mikers.find((m) => m.order === mic.current)?.id,
                    movePerfId: id,
                    micId: mic.id,
                });
                if (res.ok) {
                    setMic(await res.json());
                    refreshMikers();
                }
            }
        },
        [mikers, mic, refreshMikers, setMic]
    );

    return {
        mikers,
        refreshMikers,
        list: (
            <ColumnFlex
                className={css`
                    padding: 2rem 0;
                    width: 100%;
                    overflow: auto;
                `}
            >
                {mic && (
                    <>
                        {mikers && mikers.length > 0 ? (
                            <>
                                {mikers.slice(0, mic.slots).map((miker) => (
                                    <Miker
                                        current={mic.current}
                                        type={'active'}
                                        refreshMikers={refreshMikers}
                                        mic={mic}
                                        miker={miker}
                                        admin={admin}
                                        setNext={() => setNext(miker.id)}
                                    />
                                ))}
                                {mikers.length > mic.slots && (
                                    <>
                                        <h2>{mic.waitingList?.type}</h2>
                                        {mikers.slice(mic.slots).map((miker, ind) => (
                                            <Miker
                                                current={mic.current}
                                                type={'waiting'}
                                                refreshMikers={refreshMikers}
                                                mic={mic}
                                                miker={miker}
                                                admin={admin}
                                                setNext={() => setNext(miker.id)}
                                            />
                                        ))}
                                    </>
                                )}
                            </>
                        ) : (
                            <h2>
                                {admin && !mic.signupOpen
                                    ? 'Open signup to allow performers to signup'
                                    : 'No one has signed up yet :)'}
                            </h2>
                        )}
                    </>
                )}
            </ColumnFlex>
        ),
    };
};

export default useMikerList;

const Miker: React.FC<{
    mic: IMicResult;
    admin?: boolean;
    miker: IMicPerfomer;
    refreshMikers: () => void;
    type: 'waiting' | 'active';
    current: number;
    setNext: () => void;
}> = ({ current, miker, admin = false, refreshMikers, mic, type, setNext }) => {
    const [, setMic] = useMic(mic.id);
    const ref = useRef();
    const user = useUserStore((state) => state.user);
    // const [hover, setHover] = useState(false);
    const [removeDialog, setRemoveDialog] = useState(false);
    const [confirm, setConfirm] = useState(false);

    const remove = () => {
        // the user will have to confirm their identity if not admin;
        // that will serve as the confirmation
        if (admin && user) setConfirm(true);
        else removeUser();
    };

    const removeUser = async () => {
        if (admin && user) {
            if (user.id === miker.id) removeSignedInUser(mic, user, refreshMikers);
            else {
                const res = await fetch('/admin/mic/removeuser', {
                    body: JSON.stringify({ micId: mic.id, userId: miker.id }),
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (res.ok) {
                    setMic(await res.json());
                    refreshMikers();
                }
            }
        } else {
            // remove anon user
            setRemoveDialog(true);
        }
    };

    const removeUserApi = (anon: any) => {
        return fetch('/mic/removeanonuser', {
            body: JSON.stringify({ userId: miker.id, micId: mic.id, anon }),
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    };

    const checkinUser = async () => {
        if (admin && mic) {
            const res = await yfetch('/mic/admin/checkin', { micId: mic.id, userId: miker.id });
            if (res.ok) refreshMikers();
        }
    };

    return (
        <Card
            className={css`
                width: 90%;
                max-width: 500px;
                margin: 0.2rem;
                display: flex;
                justify-content: space-between;
                padding: 1rem;
                ${type === 'active'
                    ? 'box-shadow: 0 0 0 1px #0f9960, 0 0 0 #0f9960, 0 0 0 #0f9960;'
                    : 'box-shadow: 0 0 0 1px #d9822b, 0 0 0 #d9822b, 0 0 0 #d9822b;'}
                // ${miker.setComplete && 'background-color: lightgray;'}
                ${miker.checkedIn && 'background-color: #0f99650;'}
            `}
        >
            <Toaster ref={ref as any} />
            <RowFlex
                className={css`
                    height: 30px;
                `}
            >
                <Icon
                    icon="user"
                    size={20}
                    className={css`
                        margin-right: 1rem;
                        ${mic.checkinOpen && !miker.checkedIn && 'color: gray;'}
                    `}
                />
                <Text
                    className={css`
                        ${mic.checkinOpen && !miker.checkedIn && 'color: gray;'}
                        ${mic.checkinOpen && miker.setComplete && 'text-decoration: line-through;'}
                    `}
                >
                    {miker.name}
                </Text>
                {mic.checkinOpen && <StatusIcon miker={miker} />}
            </RowFlex>
            {mic.checkinOpen && current === miker.order && <RowFlex>Current performer</RowFlex>}
            {mic.checkinOpen ? (
                admin && (
                    <Popover
                        minimal
                        position="bottom"
                        content={
                            <Menu>
                                <MenuItem
                                    disabled={miker.checkedIn}
                                    text="Check in"
                                    icon="tick"
                                    onClick={checkinUser}
                                />
                                <MenuItem
                                    disabled={
                                        !miker.skipped ||
                                        miker.setComplete ||
                                        current === miker.order
                                    }
                                    icon="pin"
                                    text="Set as next"
                                    onClick={setNext}
                                />
                            </Menu>
                        }
                    >
                        <Button minimal icon="more" />
                    </Popover>
                )
            ) : (user && user.id === miker.id) || (!user && miker.type !== 'user') || admin ? (
                <Button icon="delete" minimal onClick={remove} />
            ) : null}

            <MicDialog
                title="Remove from list"
                settings={mic.signupConfig}
                submitText="Remove user"
                onSubmit={async (values) => {
                    const res = await removeUserApi(values);

                    if (res.ok) {
                        setMic(await res.json());
                        refreshMikers();
                    }
                }}
                isOpen={removeDialog}
                close={() => setRemoveDialog(false)}
            />

            <ConfirmDialog
                open={confirm}
                close={() => setConfirm(false)}
                label={`Are you sure you want to remove ${miker.name} from the list?`}
                callback={removeUser}
            />
        </Card>
    );
};

const ConfirmDialog: React.FC<{
    open: boolean;
    close: () => void;
    label: string;
    callback: () => void;
}> = ({ open, close, label, callback }) => {
    return (
        <Dialog isOpen={open} onClose={close}>
            <h2>Confirm</h2>
            <Text
                className={css`
                    margin: 1rem 0;
                `}
            >
                {label}
            </Text>
            <RowFlex justify="space-between">
                <Button text="Cancel" onClick={close} />
                <Button
                    intent="primary"
                    onClick={() => {
                        callback();
                        close();
                    }}
                    text="Confirm"
                />
            </RowFlex>
        </Dialog>
    );
};

const StatusIcon: React.FC<{ miker: IMicPerfomer }> = ({ miker }) => {
    let content = 'Not checked in';
    let icon: IconName = 'circle';
    let intent: Intent = 'none';

    if (miker.checkedIn) {
        content = 'Checked in';
        icon = 'tick';
        intent = 'success';
    }

    if (miker.skipped) {
        content = 'Skipped';
        icon = 'selection';
        intent = 'warning';
    }

    if (miker.setComplete) {
        content = 'Set comlete';
        icon = 'tick-circle';
        intent = 'success';
    }

    return (
        <>
            <Tooltip content={content}>
                <Icon
                    className={css`
                        margin-left: 0.5rem;
                    `}
                    icon={icon}
                    intent={intent}
                />
            </Tooltip>
            {miker.skipped && miker.checkedIn && !miker.setComplete && (
                <Tooltip content="Checked in">
                    <Icon
                        className={css`
                            margin-left: 0.5rem;
                        `}
                        icon="tick"
                        intent="success"
                    />
                </Tooltip>
            )}
        </>
    );
};
