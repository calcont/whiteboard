import React, { useState } from 'react';
import '../assets/styles/menu.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMarker, faSquare, faCircle, faArrowRight, faPalette, faFont } from '@fortawesome/free-solid-svg-icons';
import Whiteboard from './Whiteboard';

const Menu = () => {

  const [tool, setTool] = useState('marker');
  const [activeTab, setActiveTab] = useState('marker');

  const onToolClick = (tool) => {
    setActiveTab(tool);
    setTool(tool);
  }

  return (
    <>
      <div className="menu-container">
        <div className="menu-inner-container ">
          <FontAwesomeIcon icon={faMarker} className={activeTab === "marker" ? 'menu-button active' : 'menu-button'} onClick={() => onToolClick('marker')} />
          <FontAwesomeIcon icon={faSquare} className={activeTab === "rectangle" ? 'menu-button active' : 'menu-button'} onClick={() => onToolClick('rectangle')} />
          <FontAwesomeIcon icon={faCircle} className={activeTab === "circle" ? 'menu-button active' : 'menu-button'} onClick={() => onToolClick('circle')} />
          <FontAwesomeIcon icon={faArrowRight} className={activeTab === "arrow" ? 'menu-button active' : 'menu-button'} onClick={() => onToolClick('arrow')} />
          <FontAwesomeIcon icon={faPalette} className={activeTab === "bgColor" ? 'menu-button active' : 'menu-button'} onClick={() => onToolClick('bgColor')} />
          <FontAwesomeIcon icon={faFont} className={activeTab === "font" ? 'menu-button active' : 'menu-button'} onClick={() => onToolClick('font')} />
        </div>
      </div>
      <Whiteboard tool={tool} />
    </>
  )
}

export default Menu;
