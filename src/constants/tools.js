export const TOOL_CONSTANTS = {
    CURSOR: 'cursor',
    MARKER: 'marker',
    RECTANGLE: 'rectangle',
    CIRCLE: 'circle',
    ARROW: 'arrow',
    FONT: 'font',
    IMAGE: 'image',
    BACKGROUND_COLOR: 'bgColors',
};

export const TOOL_FUNCTIONS = {
    [TOOL_CONSTANTS.CURSOR]: {
        createOnClick: false,
        onMove: false,
    },
    [TOOL_CONSTANTS.MARKER]: {
        createOnClick: false,
        onMove: false,
    },
    [TOOL_CONSTANTS.RECTANGLE]: {
        createOnClick: true,
        onMove: true,
    },
    [TOOL_CONSTANTS.CIRCLE]: {
        createOnClick: true,
        onMove: true,
    },
    [TOOL_CONSTANTS.ARROW]: {
        createOnClick: true,
        onMove: true,
    },
    [TOOL_CONSTANTS.FONT]: {
        createOnClick: true,
        onMove: false,
    },
    [TOOL_CONSTANTS.IMAGE]: {
        createOnClick: false,
        onMove: false,
    },
};
