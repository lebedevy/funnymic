import styled from '@emotion/styled';

type IRowFlex = {
    justify?: 'center' | 'space-between';
};

export const RowFlex = styled.div<IRowFlex>`
    display: flex;
    align-items: center;
    justify-content: ${({ justify }) => justify ?? 'normal'};
`;

export const ColumnFlex = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const SmallHeader = styled.h1`
    font-size: 1.6rem;
    margin: 0.7rem;
    padding: 0;
`;
