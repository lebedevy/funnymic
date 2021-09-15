export const fetchDetails = (id: number) => {
    return fetch('/micdetails', {
        body: JSON.stringify({ micId: id }),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

export const fetchMikers = (id: number) => {
    return fetch('/mic/performers', {
        body: JSON.stringify({ micId: id }),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
};
