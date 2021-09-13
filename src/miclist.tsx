import { Button } from '@blueprintjs/core';
import styled from '@emotion/styled';
import { useState } from 'react';

export const Screen = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    // justify-content: center;
    align-items: center;
    padding-top: 2rem;
    overflow: auto;
`;

const person = {
    name: 'Peterson MicMicson',
};

const Perfomer = styled.div`
    width: 300px;
    // height: 50px;
    border-radius: 5px;
    border: 1px solid black;
    margin: 1rem;
    padding: 1rem;
`;

const MicList: React.FC = () => {
    const [performers, setPerfomers] = useState(Array(10).fill(JSON.parse(JSON.stringify(person))));

    return (
        <Screen>
            <div>
                {performers.map(({ name }) => (
                    <Perfomer>
                        {name}
                        <Button icon="delete" minimal />
                    </Perfomer>
                ))}
            </div>
        </Screen>
    );
};

export default MicList;
