import {useContext} from 'react';
import {MenuContext} from "../contexts/";
export const useMenuContext = () => {
    const {activeTool, setActiveTool, lockStatus, setLockStatus} = useContext(MenuContext)
    return {
        activeTool,
        setActiveTool,
        lockStatus,
        setLockStatus
    }
}