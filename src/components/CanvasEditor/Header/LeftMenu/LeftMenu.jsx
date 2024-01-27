import React, {useContext, useState} from "react";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import IconButton from "@mui/material/IconButton";
import {grey} from "@mui/material/colors";
import MenuIcon from "@mui/icons-material/Menu";
import {Help, Delete, GitHub, Twitter, FileDownload} from "@mui/icons-material";
import {SOCIAL_MEDIA_LINKS} from "../../../../constants";
import GenericDialog from "../../../Dialog/Dialog";
import {useCanvasContext} from "../../../../hooks";
import "./Leftmenu.css";

const menuItemTextStyle = {
    fontSize: "14px",
};

const iconStyle = {
    fontSize: "18px",
};

function LeftMenu() {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const {canvas} = useCanvasContext();
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleDeleteClose = () => {
        setDeleteDialogOpen(false);
    }

    const handleDeleteOpen = () => {
        setDeleteDialogOpen(true);
    }

    const handleDelete = () => {
        canvas.clear();
        setDeleteDialogOpen(false);
    }


    return (
        <>
            <GenericDialog open={deleteDialogOpen} handleDelete={handleDelete} handleClose={handleDeleteClose}/>
            <div className="left-menu">
                <div className="left-menu__icon">
                    <IconButton id="basic-button" onClick={handleClick}>
                        <MenuIcon sx={{color: grey[900]}}/>
                    </IconButton>
                </div>
                <div className="left-menu__dialog">
                    <Menu
                        id="basic-menu"
                        anchorEl={anchorEl}
                        open={open}
                        sx={{mt: 1}}
                        onClose={handleClose}
                        MenuListProps={{
                            "aria-labelledby": "basic-button",
                        }}
                    >
                        <MenuList>
                            <MenuItem>
                                <ListItemIcon>
                                    <FileDownload style={iconStyle}/>
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={menuItemTextStyle}>
                                    Export Image...
                                </ListItemText>
                            </MenuItem>
                            <MenuItem>
                                <ListItemIcon>
                                    <Help style={iconStyle}/>
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={menuItemTextStyle}>
                                    Help
                                </ListItemText>
                            </MenuItem>
                            <MenuItem onClick={handleDeleteOpen}>
                                <ListItemIcon>
                                    <Delete style={iconStyle}/>
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={menuItemTextStyle}>
                                    Reset canvas
                                </ListItemText>
                            </MenuItem>
                            <Divider/>
                            <MenuItem onClick={() => {
                                window.open(SOCIAL_MEDIA_LINKS.GITHUB, "_blank")
                            }}>
                                <ListItemIcon>
                                    <GitHub style={iconStyle}/>
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={menuItemTextStyle}>
                                    Github
                                </ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => {
                                window.open(SOCIAL_MEDIA_LINKS.TWITTER, "_blank")
                            }}>
                                <ListItemIcon>
                                    <Twitter style={iconStyle}/>
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={menuItemTextStyle}>
                                    Follow me
                                </ListItemText>
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </div>
            </div>
        </>
    );
}

export default LeftMenu;
