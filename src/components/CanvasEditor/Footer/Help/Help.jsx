import React, { useState } from "react";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import { OpenInNew } from "@mui/icons-material";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import { Chip, Container, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import { SHORTCUTS, HELP_LINKS } from "../../../../constants";
import "./Help.scss";

function Help() {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <HelpDialog open={open} onClose={handleClose} />
            <div className="help upper">
                <div className="help__icon">
                    <Tooltip title="Shortcuts">
                        <IconButton aria-label="help" onClick={handleOpen}>
                            <HelpOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </div>
            </div>
        </>
    );
}

function HelpDialog({ open, onClose }) {
    return (
        <div className="help-dialog">
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth={true}>
                <Container>
                    <DialogTitle fontWeight="bold">Help</DialogTitle>
                    <DialogContent>
                        <Divider />
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item>
                                <Button
                                    className="help-dialog__button"
                                    endIcon={<OpenInNew />}
                                    size="small"
                                    onClick={() =>
                                        window.open(HELP_LINKS.GITHUB_CONTRIBUTING, "_blank")
                                    }
                                >
                                    Want to Contribute?
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    className="help-dialog__button"
                                    endIcon={<OpenInNew />}
                                    size="small"
                                    onClick={() =>
                                        window.open(HELP_LINKS.GITHUB_ISSUES, "_blank")
                                    }
                                >
                                    Found an issue?
                                </Button>
                            </Grid>
                        </Grid>
                        <Typography
                            variant="subtitle1"
                            sx={{ my: 2 }}
                            className="help-dialog__shortcuts-title"
                            fontWeight="bold"
                        >
                            Keyboard shortcuts
                        </Typography>
                        <div className="help-dialog__shortcuts">
                            <List>
                                {SHORTCUTS.map((shortcut, index) => (
                                    <ListItem
                                        key={index}
                                        className="help-dialog__shortcuts-shortcut"
                                    >
                                        <div className="help-dialog__shortcuts-content">
                                            <div className="help-dialog__shortcuts-text">
                                                <ListItemText
                                                    primaryTypographyProps={{ fontSize: "14px" }}
                                                    primary={shortcut.name}
                                                />
                                                {shortcut.release && (
                                                    <Chip
                                                        label={shortcut.release}
                                                        className="help-dialog__shortcuts-chip"
                                                        variant="outlined"
                                                        size="small"
                                                        color="primary"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <ListItemIcon>
                                            {shortcut.key.split("&").map((key, index) => (
                                                <kbd
                                                    className="help-dialog__shortcuts-shortcut-key"
                                                    key={index}
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </ListItemIcon>
                                    </ListItem>
                                ))}
                            </List>


                        </div>
                    </DialogContent>
                </Container>
            </Dialog>
        </div>
    );
}

export default Help;
