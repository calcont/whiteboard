import React from "react";
import { GitHub, Twitter } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import { SOCIAL_MEDIA_LINKS } from "../../../../constants";
import "./LeftMenu_social.scss";

const LeftMenuSocial = () => {
  return (
    <>
      <div className="social upper">
        <Grid container spacing={1}>
          <Grid item>
            <IconButton
              className="social-button"
              href={SOCIAL_MEDIA_LINKS.GITHUB}
              target="_blank"
              size="small"
            >
              <GitHub />
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton
              className="social-button"
              href={SOCIAL_MEDIA_LINKS.TWITTER}
              target="_blank"
              size="small"
            >
              <Twitter />
            </IconButton>
          </Grid>
        </Grid>
      </div>
    </>
  );
};

export default LeftMenuSocial;
