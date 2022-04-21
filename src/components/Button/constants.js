import {CSSProperties} from 'react';

const MAX_WIDTH = {
    sz: 15,
    md: 20,
    lg: 30
};

export function getMaxWidth(size) {
    return MAX_WIDTH[size];
}