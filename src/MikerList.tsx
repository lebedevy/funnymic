import {
    Button,
    Card,
    Icon,
    Menu,
    MenuDivider,
    MenuItem,
    Popover,
    Text,
    Toaster,
    Tooltip,
} from '@blueprintjs/core';
import { css } from '@emotion/css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMikers } from './api';
import { Dialog, yfetch } from './commonComponents';
import { ColumnFlex, RowFlex, SmallHeader } from './commonStyles';
import SignupDialog from './SignupDialog';
import { IMicPerfomer, IMicResult } from './typing';
import useUserStore, { IUser } from './userStore';

const getCurrentMiker = (mikers: IMicPerfomer[]) => {
    return mikers.find(
        ({ checkedIn, setMissed, setComplete }) =>
            (checkedIn && (!setComplete || (setMissed && !setComplete))) ||
            (!checkedIn && !setMissed)
    )?.id;
};

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
    const [mikers, setMikers] = useState<IMicPerfomer[]>([]);
    const [current, setCurrent] = useState<number | undefined>();

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

    useEffect(() => {
        refreshMikers();
    }, [refreshMikers]);

    useEffect(() => {
        setCurrent(getCurrentMiker(mikers));
    }, [mikers]);

    console.log(mikers);
    console.log(current);

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
                        {mikers.length > 0 ? (
                            <>
                                {mikers.slice(0, mic.slots).map((miker) => (
                                    <Miker
                                        current={current}
                                        type={'active'}
                                        refreshMikers={refreshMikers}
                                        mic={mic}
                                        miker={miker}
                                        admin={admin}
                                    />
                                ))}
                                {mikers.length > mic.slots && (
                                    <>
                                        <h2>{mic.waitingList?.type}</h2>
                                        {mikers.slice(mic.slots).map((miker, ind) => (
                                            <Miker
                                                current={current}
                                                type={'waiting'}
                                                refreshMikers={refreshMikers}
                                                mic={mic}
                                                miker={miker}
                                                admin={admin}
                                            />
                                        ))}
                                    </>
                                )}
                            </>
                        ) : (
                            <h2>No one has signed up yet :)</h2>
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
    current: number | undefined;
}> = ({ current, miker, admin = false, refreshMikers, mic, type }) => {
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
                if (res.ok) refreshMikers();
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
                ${miker.setComplete && 'background-color: lightgray;'}
            `}
            // onMouseEnter={() => setHover(true)}
            // onMouseLeave={() => setHover(false)}
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
                        ${mic.checkinOpen &&
                        (miker.setComplete || (!miker.checkedIn && miker.setMissed)) &&
                        'text-decoration: line-through;'}
                    `}
                >
                    {miker.name}
                </Text>
                {mic.checkinOpen && miker.checkedIn ? (
                    <Tooltip content={miker.setComplete ? 'Set complete' : 'User checked in'}>
                        <Icon
                            className={css`
                                margin-left: 0.5rem;
                                color: green;
                            `}
                            icon="tick-circle"
                        />
                    </Tooltip>
                ) : (
                    miker.setMissed && (
                        <Tooltip content="No show">
                            <Icon
                                className={css`
                                    margin-left: 0.5rem;
                                    color: #da4167;
                                `}
                                icon="heart-broken"
                            />
                        </Tooltip>
                    )
                )}
            </RowFlex>
            {/* {admin &&
                current === miker.id &&
                (mic.checkinOpen ? (
                    miker.checkedIn ? (
                        <Button
                            text="Set complete"
                            intent="primary"
                            onClick={async () => {
                                const res = await yfetch('/mic/completeset', {
                                    userId: miker.id,
                                    micId: mic.id,
                                });
                                if (res.ok) refreshMikers();
                            }}
                        />
                    ) : (
                        !miker.setMissed && (
                            <Button
                                text="Spot missed"
                                intent="primary"
                                onClick={async () => {
                                    const res = await yfetch('/mic/missedset', {
                                        userId: miker.id,
                                        micId: mic.id,
                                    });
                                    if (res.ok) refreshMikers();
                                }}
                            />
                        )
                    )
                ) : null)} */}
            {/* {admin &&
                mic.checkinOpen &&
                current === miker.id &&
                (miker.checkedIn ? (
                    <Button
                        text="Set complete"
                        intent="primary"
                        onClick={async () => {
                            const res = await yfetch('/mic/completeset', {
                                userId: miker.id,
                                micId: mic.id,
                            });
                            if (res.ok) refreshMikers();
                        }}
                    />
                ) : (
                    <Button
                        text="Check in"
                        intent="primary"
                        onClick={async () => {
                            const res = await yfetch('/mic/completeset', {
                                userId: miker.id,
                                micId: mic.id,
                            });
                            if (res.ok) refreshMikers();
                        }}
                    />
                ))} */}
            {current === miker.id && <RowFlex>Current performer</RowFlex>}
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

                                <MenuItem text="Set completed" icon="tick-circle" />
                                <MenuDivider />
                                <MenuItem
                                    text="Skip"
                                    icon="arrow-right"
                                    onClick={async () => {
                                        const res = await yfetch('/mic/missedset', {
                                            userId: miker.id,
                                            micId: mic.id,
                                        });
                                        if (res.ok) refreshMikers();
                                    }}
                                />
                                {/* <MenuItem
                                    intent="danger"
                                    onClick={remove}
                                    text="Remove"
                                    icon="delete"
                                /> */}
                            </Menu>
                        }
                    >
                        <Button minimal icon="cog" />
                    </Popover>
                )
            ) : (user && user.id === miker.id) || (!user && miker.type !== 'user') || admin ? (
                <Button icon="delete" minimal onClick={remove} />
            ) : null}
            <SignupDialog
                toastRef={ref}
                isOpen={removeDialog}
                close={() => setRemoveDialog(false)}
                onSignup={removeUserApi}
                callback={refreshMikers}
                settings={mic.signupConfig}
                submitText="Remove user"
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
