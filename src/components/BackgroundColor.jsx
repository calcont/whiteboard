import * as React from 'react';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';

const BackgroundColor = ({open,anchorEl}) => {
    const handleClose = () => {

    }
    return (
        <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
                'aria-labelledby': 'basic-button',
            }}
        >
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleClose}>My account</MenuItem>
            <MenuItem onClick={handleClose}>Logout</MenuItem>
        </Menu>
    );
}

export default BackgroundColor;