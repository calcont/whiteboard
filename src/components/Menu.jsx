import React, {useState} from 'react';
import '../assets/styles/menu.css';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {Tooltip} from '@mui/material';
import {iconToolsMaps} from '../constants/';
import {TOOL_CONSTANTS} from '../constants/';
import {faLock, faLockOpen, faTrash} from '@fortawesome/free-solid-svg-icons';
import Whiteboard from './Whiteboard';

const Menu = () => {

    const [tool, setTool] = useState(TOOL_CONSTANTS.MARKER);
    const [activeTab, setActiveTab] = useState(TOOL_CONSTANTS.MARKER);
    const [isLocked, setIsLocked] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const onToolClick = (tool, event) => {
        setActiveTab(tool);
        setTool(tool);
        setAnchorEl(event?.currentTarget);
    }

    const handleLock = () => {
        setIsLocked(!isLocked);
    }

    return (
        <>
            <div className="menu-container">
                <div className="menu-inner-container ">
                    <Tooltip title={'Keep selected tool active after drawing'}>
                        <FontAwesomeIcon icon={isLocked ? faLock : faLockOpen} className='menu-button' onClick={handleLock}/>
                    </Tooltip>
                    <div className="menu-divider"></div>
                    {
                        iconToolsMaps.map((tool, index) => (
                            <Tooltip title={tool.title} key={index}>
                                <FontAwesomeIcon icon={tool.icon} className={activeTab === `${tool.id}` ? 'menu-button active' : 'menu-button'} onClick={(event) => onToolClick(tool.id, event)}/>
                            </Tooltip>
                        ))}
                    <div className="menu-divider"></div>
                    <Tooltip title={'Delete entire canvas'}>
                        <FontAwesomeIcon icon={faTrash} className='menu-button' />
                    </Tooltip>
                </div>
            </div>
            <Whiteboard tool={tool} anchor={anchorEl} setToolCallBack={onToolClick} lockStatus={isLocked}/>
        </>
    )
}

export default Menu;
