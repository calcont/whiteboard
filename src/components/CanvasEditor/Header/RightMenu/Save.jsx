import React from "react";
import {styled} from '@mui/material/styles';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Fade from '@mui/material/Fade';
import SimpleSnackbar from "../../../Feedback/snackbar";
import {useCanvasContext} from "../../../../hooks";
import {MESSAGE_TYPE,IMAGE_FORMAT} from "../../../../constants";
import "./Save.scss";

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
                    <Button
                        className="save-image__icon-button"
                        variant="contained"
                        onClick={handleClick}
                        endIcon={<KeyboardArrowDownIcon/>}
                    >
                        Export as
                    </Button>
                </div>
                <Menu
                    id="fade-menu"
                    MenuListProps={{
                        'aria-labelledby': 'fade-button',
                    }}
                    sx={{mt: 0.5}}
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                    TransitionComponent={Fade}
                >
                    <MenuItem onClick={() => saveImage(IMAGE_FORMAT.JPG)}>
                        <p className="save-image__menu-text">JPG</p>
                    </MenuItem>
                    <MenuItem onClick={() => saveImage(IMAGE_FORMAT.PNG)}>
                        <p className="save-image__menu-text">PNG</p>
                    </MenuItem>
                    <MenuItem onClick={() => saveImage(IMAGE_FORMAT.SVG)}>
                        <p className="save-image__menu-text">SVG</p>
                    </MenuItem>
                    <MenuItem onClick={handleCopy}>
                        <p className="save-image__menu-text">Copy to Clipboard</p>
                    </MenuItem>
                </Menu>
            </div>
        </>
    );
}

export default SaveImage;
