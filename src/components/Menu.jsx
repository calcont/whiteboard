import React, { useState } from 'react';
import '../assets/styles/menu.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMarker, faSquare, faCircle, faArrowRight, faPalette, faFont, faRedo, faArrowPointer } from '@fortawesome/free-solid-svg-icons';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Whiteboard from './Whiteboard';

const Menu = () => {

  const [tool, setTool] = useState('marker');
  const [activeTab, setActiveTab] = useState('marker');
  // const tools = ['marker', 'rectangle', 'circle', 'arrow', 'font'];

  const onToolClick = (tool) => {
    setActiveTab(tool);
    setTool(tool);
  }

  return (
    <>
      <div className="menu-container">
        <div className="menu-inner-container ">
          <FontAwesomeIcon icon={faArrowPointer} className={activeTab === "cursor" ? 'menu-button active' : 'menu-button'} onClick={() => onToolClick('cursor')} />
          <FontAwesomeIcon icon={faMarker} className={activeTab === "marker" ? 'menu-button active' : 'menu-button'} onClick={() => onToolClick('marker')} />
          <FontAwesomeIcon icon={faSquare} className={activeTab === "rectangle" ? 'menu-button active' : 'menu-button'} onClick={() => onToolClick('rectangle')} />
          <FontAwesomeIcon icon={faCircle} className={activeTab === "circle" ? 'menu-button active' : 'menu-button'} onClick={() => onToolClick('circle')} />
          <FontAwesomeIcon icon={faArrowRight} className={activeTab === "arrow" ? 'menu-button active' : 'menu-button'} onClick={() => onToolClick('arrow')} />
          <FontAwesomeIcon icon={faPalette} className={activeTab === "bgColor" ? 'menu-button active' : 'menu-button'} onClick={() => onToolClick('bgColor')} />
        </div>
      </div>
      <Whiteboard tool={tool} setToolCallBack={onToolClick} />
    </>
  )
}

export default Menu;
