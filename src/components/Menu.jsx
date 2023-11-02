import React, { useState } from 'react';
import '../assets/styles/menu.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from '@mui/material';
import { iconToolsMaps } from '../constants/IconTools'
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
          {
            iconToolsMaps.map((tool,index) => (
              <Tooltip title={tool.title} key={index} >
                <FontAwesomeIcon icon={tool.icon} className={activeTab === `${tool.id}` ? 'menu-button active' : 'menu-button'} onClick={() => onToolClick(tool.id)} />
              </Tooltip>
            ))}
        </div>
      </div>
      <Whiteboard tool={tool} setToolCallBack={onToolClick} />
    </>
  )
}

export default Menu;
