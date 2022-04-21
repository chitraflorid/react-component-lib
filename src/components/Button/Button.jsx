import React from 'react';
import {getMaxWidth} from './constants';
import  './button.css';

export function Button({variant, disabled, type, className, children, onClick, label, name, size, role}) {
    function handleOnClick(e) {
        e.preventDefault();
        onClick();
    }

    const childrenEl = children || label;
    const variantClassName = disabled ? 'disabled-btn' : `${variant}-btn`;
    return (
        <>
            <button type={type}
                    className={`btn ${variantClassName} ${className}`}
                    onClick={disabled ? undefined : handleOnClick}
                    role={role}
                    disabled={disabled}
                    name={name}
                    style={{maxWidth: getMaxWidth(size)}}
            >
                {childrenEl}
            </button>
        </>
    );
}

Button.defaultProps = {
    variant: 'primary',
    disabled: false,
    type: 'button',
    className: 'primary-button',
    onClick: () => {},
    label: null,
    name: null,
    size: 'sm',
    role: 'primary-button'
};