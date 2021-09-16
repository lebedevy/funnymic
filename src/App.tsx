import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Switch, Route, useHistory, Redirect } from 'react-router-dom';

import 'normalize.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css';
import styled from '@emotion/styled';
import {
    Button,
    Classes,
    Menu,
    MenuItem,
    Navbar,
    NavbarDivider,
    NavbarGroup,
    NavbarHeading,
    Popover,
} from '@blueprintjs/core';
import CreateMic from './CreateMic';
import Homepage from './Homepage';
import Signup from './Signup';
import useUserStore from './userStore';
import ManageMic from './ManageMic';
import Mics from './Mics';
import MicSignup from './MicSignup';
import { LoginScreen } from './Login';

const Container = styled.div`
    max-height: 100%;
    height: 100%;
    width: 100wh;
    // display: flex;
    // flex-direction: column;
`;

function App() {
    const { user, login } = useUserStore((state) => state);

    useEffect(() => {
        const jwt = document.cookie
            .split(';')
            .map((cookie) => cookie.split('='))
            .find(([cookie]) => cookie === 'jwt');
        console.log(jwt);
        if (jwt) {
            if (jwt[1]) {
                try {
                    const token = JSON.parse(atob(jwt[1].split('.')[1]));
                    console.log(token);
                    login(token.user);
                } catch (error) {
                    // ignore
                }
            }
        }
    }, [login]);

    return (
        <Container>
            <Router>
                <AppNavabar />
                {user ? (
                    <>
                        <Switch>
                            <Route path="/" exact>
                                <Homepage />
                            </Route>
                            <Route path="/createmic">
                                <CreateMic />
                            </Route>
                            <Route path="/managemic/:id" component={ManageMic}></Route>
                        </Switch>
                    </>
                ) : (
                    <>
                        <Route path="/" exact>
                            <Mics />
                        </Route>
                        <Route path="/login">
                            <LoginScreen />
                        </Route>
                        <Route path="/signup">
                            <Signup />
                        </Route>
                    </>
                )}
                <Route path="/mic/signup/:id">
                    <MicSignup />
                </Route>
                {/* <Redirect
                    to={{
                        pathname: user ? '/' : '/login',
                    }}
                /> */}
            </Router>
        </Container>
    );
}

const AppNavabar: React.FC = () => {
    const user = useUserStore((state) => state.user);
    const history = useHistory();
    const clearUser = useUserStore((state) => state.logout);

    const logout = async () => {
        clearUser();
        const res = await fetch('/users/logout');
        console.log(res);
    };

    return (
        <Navbar fixedToTop>
            <NavbarGroup>
                <NavbarHeading onClick={() => history.push('/')}>Open Mic</NavbarHeading>
                <NavbarDivider />
                {user ? (
                    <Button
                        className={Classes.MINIMAL}
                        icon="add"
                        text="Create mic"
                        onClick={() => history.push('/createmic')}
                    />
                ) : (
                    <Button
                        className={Classes.MINIMAL}
                        icon="log-in"
                        text="Login"
                        onClick={() => history.push('/login')}
                    />
                )}
            </NavbarGroup>
            <NavbarGroup align="right">
                {user && (
                    <Popover
                        content={
                            <Menu>
                                <MenuItem text="Logout" icon="log-out" onClick={() => logout()} />
                            </Menu>
                        }
                    >
                        <Button className={Classes.MINIMAL} icon="user" />
                    </Popover>
                )}
            </NavbarGroup>
        </Navbar>
    );
};

export default App;
