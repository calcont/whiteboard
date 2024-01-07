import * as React from 'react';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export default function SimpleSnackbar({isOpen, message, messageType, closeFn}) {

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        closeFn();
    };

    return (
        <div>
            <Snackbar open={isOpen} autoHideDuration={6000} onClose={handleClose}>
                <Alert onClose={handleClose} severity={messageType} sx={{width: '100%'}}>
                    {message}
                </Alert>
            </Snackbar>
        </div>
    );
}
