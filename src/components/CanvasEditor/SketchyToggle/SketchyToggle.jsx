import React, { useState } from "react";
import { Tooltip } from "@mui/material";
import { Pencil, Square } from "lucide-react";
import { useCanvasContext } from "../../../hooks";
import { isSketchyMode, setSketchyMode } from "../../../utils/roughRender";
import "./SketchyToggle.scss";

// Global board mode: hand-drawn (rough.js, default) vs crisp vector. Sketchy
// suits brainstorming; crisp suits clean infra/architecture diagrams. Persisted
// in localStorage by roughRender.
const SketchyToggle = () => {
  const { canvas } = useCanvasContext();
  const [sketchy, setSketchy] = useState(isSketchyMode());

  const handleToggle = () => {
    const next = !sketchy;
    setSketchyMode(next);
    setSketchy(next);
    if (canvas) {
      // Force a re-render through any object/group caches so the whole board
      // switches style immediately.
      canvas.getObjects().forEach((o) => {
        o.dirty = true;
        if (o._objects) o._objects.forEach((c) => (c.dirty = true));
      });
      canvas.requestRenderAll();
    }
  };

  const Icon = sketchy ? Pencil : Square;
  return (
    <div className="sketchy-toggle upper">
      <Tooltip
        title={
          sketchy
            ? "Sketchy style (click for crisp)"
            : "Crisp style (click for sketchy)"
        }
      >
        <Icon
          className="sketchy-toggle__button"
          size={18}
          onClick={handleToggle}
        />
      </Tooltip>
    </div>
  );
};

export default SketchyToggle;
