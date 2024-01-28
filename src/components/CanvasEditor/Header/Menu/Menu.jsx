import React, {useEffect, useState} from 'react';
import './menu.css';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Tooltip} from '@mui/material';
import {iconToolsMaps, TOOL_CONSTANTS} from '../../../../constants';
import {faLock, faLockOpen, faTrash} from '@fortawesome/free-solid-svg-icons';
import Divider from "@mui/material/Divider";
import GenericDialog from "../../../Dialog/ConsentDialog";
import BackgroundColor from "../../BackgroundColor";
import {Image} from "../../../../Handlers/ToolsHandler";
import {useMenuContext, useCanvasContext} from "../../../../hooks";
import removeCursor from "../../../../assets/icons/circle.svg";

const Menu = () => {
    const {activeTool, setActiveTool, lockStatus, setLockStatus} = useMenuContext();
    const {canvas} = useCanvasContext();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [isOpenBackground, setIsOpenBackground] = useState(false);

    useEffect(() => {
        if (!canvas) return;
        if (activeTool === TOOL_CONSTANTS.MARKER) {
            canvas.isDrawingMode = true;
            canvas.freeDrawingBrush.width = 3;
        } else canvas.isDrawingMode = false;
        handleToolsSettings(canvas, activeTool, () => setIsOpenBackground(true));
    }, [activeTool, lockStatus, canvas]);

    const onToolClick = (tool, event) => {
        setActiveTool(tool);
        setAnchorEl(event?.currentTarget);
    }

    const handleLock = () => {
        setLockStatus(!lockStatus);
    }

    const handleDelete = () => {
        canvas.clear();
        setIsDeleteDialogOpen(false);
    }

    const handleBackgroundClose = () => {
        setIsOpenBackground(false);
        setActiveTool(TOOL_CONSTANTS.CURSOR);
    }

    return (
        <>
            <div className="menu-container">
                <div className="menu-inner-container ">
                    <Tooltip title={'Keep selected tool active after drawing'}>
                        <FontAwesomeIcon icon={lockStatus ? faLock : faLockOpen} className='menu-button'
                                         onClick={handleLock}/>
                    </Tooltip>
                    <Divider orientation="vertical" flexItem/>
                    {
                        iconToolsMaps.map((tool, index) => (
                            <Tooltip title={tool.title} key={index}>
                                <FontAwesomeIcon icon={tool.icon}
                                                 className={activeTool === `${tool.id}` ? 'menu-button active' : 'menu-button'}
                                                 onClick={(event) => onToolClick(tool.id, event)}/>
                            </Tooltip>
                        ))
                    }
                    <Divider orientation="vertical" flexItem/>
                    <Tooltip title={'Delete entire canvas'}>
                        <FontAwesomeIcon icon={faTrash} className='menu-button'
                                         onClick={() => setIsDeleteDialogOpen(true)}/>
                    </Tooltip>
                    <GenericDialog open={isDeleteDialogOpen} handleClose={() => setIsDeleteDialogOpen(false)}
                                   handleDelete={handleDelete}/>
                    <BackgroundColor open={isOpenBackground} anchorEl={anchorEl} onClose={handleBackgroundClose}
                    />
                </div>
            </div>
        </>
    )
}


const handleToolsSettings = (canvas, tool, setOpenBgPanel) => {
    switch (tool) {
        case TOOL_CONSTANTS.CURSOR:
            canvas.getObjects().forEach((obj) => {
                obj.set({selectable: true})
            });
            canvas.selection = true;
            canvas.hoverCursor = 'move';
            canvas.defaultCursor = 'default';
            break;
        case TOOL_CONSTANTS.IMAGE:
            Image(canvas);
            break;
        case TOOL_CONSTANTS.BACKGROUND_COLOR:
            setOpenBgPanel();
            break;
        case TOOL_CONSTANTS.ERASER:
            canvas.getObjects().forEach((obj) => {
                obj.selectable = false;
            });
            canvas.isDrawingMode = false;
            canvas.hoverCursor = `url(${removeCursor}), auto`;
            canvas.defaultCursor = `url(${removeCursor}), auto`;
            canvas.discardActiveObject();
            canvas.renderAll();
            break;
        default:
            canvas.discardActiveObject();
            canvas.getObjects().forEach((obj) => {
                obj.set({selectable: false})
            });
            canvas.hoverCursor = 'cursor';
            canvas.defaultCursor = 'crosshair';
            canvas.renderAll();
            break;
    }
}

export default Menu;
