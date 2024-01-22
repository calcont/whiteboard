import React, {useEffect, useState} from "react";
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import ContentCut from '@mui/icons-material/ContentCut';
import ContentCopy from '@mui/icons-material/ContentCopy';
import ContentPaste from '@mui/icons-material/ContentPaste';
import Cloud from '@mui/icons-material/Cloud';
import IconButton from '@mui/material/IconButton';
import {grey} from "@mui/material/colors";
import MenuIcon from '@mui/icons-material/Menu';
import "./Leftmenu.css";

function LeftMenu() {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div className="left-menu">
            <div className="left-menu__icon">
                <IconButton
                    id="basic-button"
                    onClick={handleClick}
                >
                    <MenuIcon sx={{color:grey[900]}}/>
                </IconButton>
            </div>
            <div className="left-menu__dialog">
                <Menu id="basic-menu"
                      anchorEl={anchorEl}
                      open={open}
                      onClose={handleClose}
                      MenuListProps={{
                          'aria-labelledby': 'basic-button',
                      }}>
                    <MenuList>
                        <MenuItem>
                            <ListItemIcon>
                                <ContentCut fontSize="small"/>
                            </ListItemIcon>
                            <ListItemText>Export Image</ListItemText>
                            <Typography variant="body2" color="text.secondary">
                                ⌘X
                            </Typography>
                        </MenuItem>
                        <MenuItem>
                            <ListItemIcon>
                                <ContentCopy fontSize="small"/>
                            </ListItemIcon>
                            <ListItemText>Export Json</ListItemText>
                            <Typography variant="body2" color="text.secondary">
                                ⌘C
                            </Typography>
                        </MenuItem>
                        <MenuItem>
                            <ListItemIcon>
                                <ContentPaste fontSize="small"/>
                            </ListItemIcon>
                            <ListItemText>Paste</ListItemText>
                            <Typography variant="body2" color="text.secondary">
                                ⌘V
                            </Typography>
                        </MenuItem>
                        <Divider/>
                        <MenuItem>
                            <ListItemIcon>
                                <Cloud fontSize="small"/>
                            </ListItemIcon>
                            <ListItemText>Web Clipboard</ListItemText>
                        </MenuItem>
                    </MenuList>
                </Menu>
            </div>
        </div>
    );
}

export default LeftMenu;