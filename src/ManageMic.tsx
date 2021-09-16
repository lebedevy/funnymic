import {
    Button,
    Icon,
    Spinner,
    Tooltip,
    Popover,
    Menu,
    MenuItem,
    MenuItemProps,
} from '@blueprintjs/core';
import { css } from '@emotion/css';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { FormGroup, useMic, yfetch } from './commonComponents';
import { RowFlex, SmallHeader } from './commonStyles';
import useMikerList from './MikerList';
import useUserStore from './userStore';
import ManageMiker from './ManageMiker';

const ManageMic: React.FC = () => {
    const user = useUserStore((state) => state.user);
    const { id } = useParams<{ id: string }>();
    const [mic, setMic] = useMic(id);
    const { list, mikers, refreshMikers } = useMikerList(mic, {
        admin: !!(user && mic && user.id === mic.userId),
    });

    const curr = mic?.current;

    const current = useMemo(
        () => (curr != null ? mikers?.find((m) => m.order === curr) : undefined),
        [curr, mikers]
    );

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
            });
            if (res.ok) {
                setMic(await res.json());
            }
        }
    };

    const signupProps: MenuItemProps | undefined = mic
        ? {
              onClick: () => updateMicSignup(!mic.signupOpen),
              intent: mic.signupOpen ? 'danger' : 'success',
              text: `${mic.signupOpen ? 'Close' : 'Open'} signup`,
          }
        : undefined;

    const checkinProps: MenuItemProps | undefined = mic
        ? {
              onClick: () => updateMicCheckin(!mic.checkinOpen),
              intent: mic.checkinOpen ? 'danger' : 'success',
              text: `${mic.checkinOpen ? 'Close' : 'Open'} check in`,
          }
        : undefined;

    return (
        <>
            {mic ? (
                <div
                    className={css`
                        max-height: 100%;
                        postition: relative;
                        display: flex;
                        flex-direction: column;
                    `}
                >
                    <RowFlex justify="center">
                        <SmallHeader>{mic.name}</SmallHeader>
                        {mic.checkinOpen && (
                            <Popover
                                minimal
                                content={
                                    <Menu>
                                        <MenuItem {...signupProps} />
                                        <MenuItem {...checkinProps} />
                                    </Menu>
                                }
                            >
                                <Button icon="cog" minimal />
                            </Popover>
                        )}
                    </RowFlex>
                    {!mic.checkinOpen && (
                        <RowFlex justify="space-between">
                            <FormGroup
                                className={css`
                                    margin: 1rem 1rem 0 1rem;
                                `}
                            >
                                <Button
                                    {...signupProps}
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
                                <Button {...checkinProps} />
                            </FormGroup>
                        </RowFlex>
                    )}
                    {mic.checkinOpen && current && (
                        <ManageMiker
                            setMic={setMic}
                            miker={current}
                            mic={mic}
                            refreshMikers={refreshMikers}
                        />
                    )}
                    <div
                        className={css`
                            overflow: auto;
                        `}
                    >
                        {list}
                    </div>
                </div>
            ) : (
                <Spinner />
            )}
        </>
    );
};

export default ManageMic;
