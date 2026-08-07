import { useCanvasContext } from "../../../../hooks";
import "./ZoomPanel.scss";
import { Plus, Minus } from "lucide-react";
import { handleZoomUtil as handleZoom } from "../../../../utils/Zoom";
import { Tooltip } from "@mui/material";
import { useEffect, useState } from "react";

const ICON_SIZE = 18;

const ZoomPanel = () => {
  const { canvas, zoomRatio, setZoomRatio } = useCanvasContext();
  const [zoomRatioPercent, setZoomRatioPercent] = useState(100);

  useEffect(() => {
    setZoomRatioPercent(Math.round(zoomRatio * 100));
  }, [zoomRatio]);

  const handleZoomIn = () => {
    setZoomRatio(handleZoom(1, canvas));
  };

  const handleZoomOut = () => {
    setZoomRatio(handleZoom(-1, canvas));
  };

  const handleZoomReset = () => {
    setZoomRatio(1);
  };

  return (
    <div className="zoom-panel upper">
      <div className="zoom-panel__inner-container">
        <Tooltip title={"Zoom Out"}>
          <Minus
            className="zoom-panel__button"
            size={ICON_SIZE}
            onClick={handleZoomOut}
          />
        </Tooltip>
        <Tooltip title={"Reset Zoom"}>
          <div className="zoom-panel__button" onClick={handleZoomReset}>
            {zoomRatioPercent}%
          </div>
        </Tooltip>
        <Tooltip title={"Zoom In"}>
          <Plus
            className="zoom-panel__button"
            size={ICON_SIZE}
            onClick={handleZoomIn}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default ZoomPanel;
