import {useCanvasContext} from "../../../../hooks";
import "./ZoomPanel.scss";
import {faPlus, faMinus} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {handleZoomUtil as handleZoom} from "../../../../utils/Zoom";
import {Tooltip} from '@mui/material';
import {useEffect, useState} from "react";

const ZoomPanel = () => {
    const {canvas, zoomRatio, setZoomRatio} = useCanvasContext();
    const [zoomRatioPercent, setZoomRatioPercent] = useState(100);

    useEffect(() => {
        setZoomRatioPercent(Math.round(zoomRatio * 100));
    }, [zoomRatio]);


    const handleZoomIn = () => {
        setZoomRatio(handleZoom(1, canvas))
    }

    const handleZoomOut = () => {
        setZoomRatio(handleZoom(-1, canvas))
    }

    const handleZoomReset = () => {
        setZoomRatio(1);
    }

    return (
        <div className="zoom-panel">
            <div className="zoom-panel__inner-container">
                <Tooltip title={'Zoom Out'}>
                    <FontAwesomeIcon icon={faMinus} className='zoom-panel__button' onClick={handleZoomOut}/>
                </Tooltip>
                <Tooltip title={'Reset Zoom'}>
                    <div className="zoom-panel__button" onClick={handleZoomReset}>{zoomRatioPercent}%</div>
                </Tooltip>
                <Tooltip title={'Zoom In'}>
                    <FontAwesomeIcon icon={faPlus} className='zoom-panel__button' onClick={handleZoomIn}/>
                </Tooltip>
            </div>
        </div>
    )
}

export default ZoomPanel;