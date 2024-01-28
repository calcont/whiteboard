import React from "react";
import {styled} from '@mui/material/styles';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {Collections, Image, FileCopy, Panorama} from '@mui/icons-material';
import Fade from '@mui/material/Fade';
import ListItemIcon from "@mui/material/ListItemIcon";
import SimpleSnackbar from "../../../Feedback/snackbar";
import {useCanvasContext} from "../../../../hooks";
import {MESSAGE_TYPE} from "../../../../constants";
import "./Save.css";

// Styled Button
const StyledButton = styled(Button)({
    backgroundColor: "#fff",
    border: "1px solid #fff",
    fontSize: "14px",
    color: "#000",
});

function SaveImage() {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const {canvas} = useCanvasContext();
    const [openCopyBar, setOpenCopyBar] = React.useState(false);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const saveImage = (format) => {
        handleClose();
        const dataURL = canvas.toDataURL({
            format: format,
            quality: 1,
        });
        const link = document.createElement('a');
        link.download = 'untitled Drawing-calcontBoard' + '.' + format;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async function handleCopy() {
        const imgUrl = canvas.toDataURL({
            format: "png",
            quality: 1,
        });
        const data = await fetch(imgUrl);
        const blob = await data.blob();
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob,
            }),
        ]);
        setOpenCopyBar(true);
        handleClose();
    }

    return (
        <>
            <SimpleSnackbar isOpen={openCopyBar} message={"Copied to Clipboard"} messageType={MESSAGE_TYPE.INFO}
                            closeFn={() => setOpenCopyBar(false)}/>
            <div className="save-image">
                <div className="save-image__icon">
                    <StyledButton
                        id="demo-customized-button"
                        className="save-image__icon-button"
                        aria-controls={open ? 'demo-customized-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        variant="outlined"
                        onClick={handleClick}
                        endIcon={<KeyboardArrowDownIcon/>}
                    >
                        Export
                    </StyledButton>
                </div>
                <Menu
                    id="fade-menu"
                    MenuListProps={{
                        'aria-labelledby': 'fade-button',
                    }}
                    sx={{mt: 1}}
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    TransitionComponent={Fade}
                >
                    <MenuItem onClick={() => saveImage("jpg")}>
                        <ListItemIcon>
                            <Image fontSize="small"/>
                        </ListItemIcon>
                        JPG
                    </MenuItem>
                    <MenuItem onClick={() => saveImage("png")}>
                        <ListItemIcon>
                            <Collections fontSize="small"/>
                        </ListItemIcon>
                        PNG
                    </MenuItem>
                    <MenuItem onClick={() => saveImage("svg")}>
                        <ListItemIcon>
                            <Panorama fontSize="small"/>
                        </ListItemIcon>
                        SVG
                    </MenuItem>
                    <MenuItem onClick={handleCopy}>
                        <ListItemIcon>
                            <FileCopy fontSize="small"/>
                        </ListItemIcon>
                        Copy to Clipboard
                    </MenuItem>
                </Menu>
            </div>
        </>
    );
}

export default SaveImage;
