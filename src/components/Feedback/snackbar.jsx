import * as React from 'react';
import Snackbar from '@mui/material/Snackbar';
import {Alert} from "@mui/material";

export default function SimpleSnackbar({isOpen, message, messageType, closeFn}) {

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        closeFn();
    };

    return (
        <div>
            <Snackbar open={isOpen} autoHideDuration={4000} onClose={handleClose}>
                <Alert onClose={handleClose} severity={messageType} sx={{width: '100%'}}>
                    {message}
                </Alert>
            </Snackbar>
        </div>
    );
}
