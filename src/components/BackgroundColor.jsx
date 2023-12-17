import React, {useEffect} from 'react';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Grid from '@mui/material/Grid';
import Fade from '@mui/material/Fade';

const colorOptions = [
    {name: 'White', color: 'white'},
    {name: 'Black', color: 'black'},
    {name: 'Blue', color: '#add8e6'},
    {name: 'Grey', color: '#333333'},
];

const BackgroundColor = ({open, anchorEl, onClose}) => {
    const handleClose = () => {
        onClose();
    };

    useEffect(() => {
        const backgroundColor = localStorage.getItem('backgroundColor');
        if (backgroundColor) {
            document.getElementsByTagName('body')[0].style.backgroundColor = backgroundColor;
        }
    }, []);
    
    const handleColorSelect = (color) => {
        document.getElementsByTagName('body')[0].style.backgroundColor = color;
        localStorage.setItem('backgroundColor', color);
        handleClose();
    };

    return (
        <Menu
            id="color-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            TransitionComponent={Fade}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
            MenuListProps={{
                'aria-labelledby': 'color-button',
                orientation: 'horizontal',
            }}
        >
            <Grid container spacing={1}>
                {colorOptions.map((option,index) => (
                    <Grid item key={option.color}>
                        <MenuItem onClick={() => handleColorSelect(option.color)} selected={index === 0}>
                            <div
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: option.color,
                                    border: '0.1px solid #000',
                                }}
                            />
                        </MenuItem>
                    </Grid>
                ))}
            </Grid>
        </Menu>
    );
};

export default BackgroundColor;
