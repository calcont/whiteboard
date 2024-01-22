export const isCtrlZ = e => {
    return e.ctrlKey && !e.shiftKey && e.code === 'KeyZ'
}
export const isCtrlShiftZ = e => {
    return e.ctrlKey && e.shiftKey && e.code === 'KeyZ'
}

export const isCtrlD = e => {
    return e.ctrlKey && !e.shiftKey && e.code === 'KeyD'
}

export const isCtrlA = e => {
    return e.ctrlKey && !e.shiftKey && e.code === 'KeyA'
}

export const isCtrlPlus = e => {
    return e.ctrlKey && !e.shiftKey && e.code === 'Equal'
}

export const isCtrlMinus = e => {
    return e.ctrlKey && !e.shiftKey && e.code === 'Minus'
}

export const isArrow = e => {
    return ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(e.code)
}
