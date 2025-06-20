const drawAdventureElements = [
    {
        tagName: 'div',
        id: 'labelContainer2d',
        className: '',
        attrs: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '1',
        },
    },
    {
        tagName: 'div',
        id: 'labelContainer',
        className: '',
        attrs: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: '1',
        },
    },
    {
        tagName: 'div',
        id: 'overlayContainer3d',
        className: '',
        attrs: {
            pointerEvents: 'none',
            zIndex: '1',
        },
    },
    {
        tagName: 'div',
        id: 'overlayText',
        className: '',
        attrs: {
            position: 'absolute',
            top: '10px',
            left: '10px',
            color: '#fff',
            fontSize: '20px',
            pointerEvents: 'none',
        },
    },
]

export { drawAdventureElements }
