import React, {useEffect} from 'react';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Grid from '@mui/material/Grid';
import Fade from '@mui/material/Fade';
import {useCanvasContext} from "../../hooks";

const colorOptions = [
    {name: 'White', color: 'white'},
    // {name: 'Black', color: 'black'},
    {name: 'Blue', color: '#f5faff'},
    {name: 'Grey', color: '#333333'},
];

const BackgroundColor = ({open, anchorEl, onClose}) => {
    const {canvas} = useCanvasContext();
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const handleClose = () => {
        onClose();
    };

    const handleColorSelect = (color, index) => {
        document.getElementsByTagName('body')[0].style.backgroundColor = color;
        canvas.backgroundColor = color;
        canvas.renderAll();
        setSelectedIndex(index);
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
            <Grid container spacing={0.2}>
                {colorOptions.map((option, index) => (
                    <Grid item key={option.color}>
                        <MenuItem onClick={() => handleColorSelect(option.color, index)}
                                  selected={selectedIndex === index}>
                            <div
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '10%',
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
