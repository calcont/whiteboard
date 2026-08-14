import React, { useEffect, useState } from "react";
import Popover from "@mui/material/Popover";
import { Tooltip } from "@mui/material";
import { useCanvasContext } from "../../../hooks";
import { addSvgIconToCanvas } from "../../../utils/iconToCanvas";
import {
  POPULAR,
  searchIcons,
  fetchIconSvg,
  iconImgUrl,
} from "../../../utils/iconify";
import "./IconLibrary.scss";

// A searchable icon hub. Type to search the Iconify colour-logo sets; click a
// result to drop the real (full-colour) logo on the canvas. Stays open so you
// can stamp several.
const IconLibrary = ({ open, anchorEl, onClose }) => {
  const { canvas } = useCanvasContext();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(POPULAR);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const q = query.trim();
    if (!q) {
      setResults(POPULAR);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const ids = await searchIcons(q);
      setResults(ids);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, open]);

  const handlePick = async (id) => {
    const svg = await fetchIconSvg(id);
    if (svg && canvas) addSvgIconToCanvas(canvas, svg);
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <div className="icon-library">
        <input
          className="icon-library__search"
          autoFocus
          placeholder="Search logos…  aws · docker · redis · react"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="icon-library__grid">
          {results.map((id) => (
            <Tooltip title={id.split(":")[1]} key={id}>
              <button
                type="button"
                className="icon-library__item"
                aria-label={id}
                onClick={() => handlePick(id)}
              >
                <img
                  src={iconImgUrl(id, 40)}
                  alt=""
                  width="26"
                  height="26"
                  loading="lazy"
                />
              </button>
            </Tooltip>
          ))}
        </div>
        {loading && <div className="icon-library__hint">Searching…</div>}
        {!loading && results.length === 0 && (
          <div className="icon-library__hint">
            No logos found — try another term.
          </div>
        )}
      </div>
    </Popover>
  );
};

export default IconLibrary;
