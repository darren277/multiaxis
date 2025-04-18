""""""

WALKING_CONTROLS_TOGGLE = """
<!-- Walking Controls Toggle Button -->
<button id="walking-toggle-btn" style="display: block; width: 120px; margin-bottom: 0.5em; cursor: pointer;">Walking: OFF</button>
"""

ADVENTURE_NAVIGATION_OVERLAY = """
<!-- Adventure Navigation Overlay -->
<!--        <div id="overlayText" style="position: absolute; top: 20px; left: 20px; max-width: 300px; padding: 10px; background: rgba(0,0,0,0.7); color: white; font-family: sans-serif;">-->
<div id="overlayText" style="position: absolute; top: 20px; left: 20px; max-width: 300px; padding: 10px; background: rgba(0,0,0,0.7); color: white; font-family: sans-serif;">
    <!-- The dynamic text goes here -->
    <p id="overlayTextContent">Adventure Navigation</p>
    <p>To go Left, hit the Left Arrow.</p>
    <p>To go Right, hit the Right Arrow.</p>
    <p>To go Up, hit the Up Arrow.</p>
    <p>To go Down, hit the Down Arrow.</p>
</div>
"""


EMBEDDED_CSS = """
.threejs-container {
    position: relative;
    width: 100%;
    height: 600px;
    background: #000;
    z-index: 9999;
}
"""

FULLSCREEN_CSS = """
html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden; /* prevents scroll bars if scene is bigger than window */
}

/* 2) This container #c is our Three.js “stage” */
#c {
    position: absolute; /* let it fill the entire window */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: block;
}

/* 3) If needed, override the default canvas background or styling: */
#c canvas {
    display: block; /* remove any default inline-block spacing */
    background-color: #000; /* or transparent if you prefer */
}

/* 4) If you have an overlay UI, it must be position: absolute as well */
#ui-container {
    position: absolute;
    top: 1em;
    right: 1em;
    z-index: 9999;
    background-color: rgba(255, 255, 255, 0.2);
    padding: 0.5em;
}

.threejs-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    z-index: 9999;
}

/* The CSS selector for element name (`<section>`) and class (`.threejs`) is: */
main.threejs {
    position: fixed; /* let it fill the entire window */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: block;
}

.threejs-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #000;
    z-index: 9999;
}

#c {
    position: absolute; /* let it fill the entire window */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: block;
    background-color: #000; /* or transparent if you prefer */
    /* remove any default inline-block spacing */
    display: block;
}
"""

SMALL_HEADER_CSS = """
/* 1) Make the page and body fill the browser window */
html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
}

/* 2) Use flex layout on the body to have a fixed-height header + flexible main */
body {
    display: flex;
    flex-direction: column;
}

/* 3) A small header bar at the top */
header {
    height: 60px;           /* fixed height */
    background: #333;
    color: #fff;
    display: flex;
    align-items: center;
    padding-left: 1em;
    box-sizing: border-box; /* so padding doesn’t add extra height */
}

/* 4) The main area takes the remaining space */
main {
    flex: 1;               /* fill leftover vertical space */
    display: flex;         /* so that #c can fill it if needed */
    flex-direction: column;
    position: relative;    /* if you want absolutely positioned overlays inside */
}

/* 5) The Three.js container */
#c {
    flex: 1;              /* fill the rest of main */
    position: relative;
    width: 100%;          /* not strictly necessary, but often used for clarity */
    /* no hard-coded height; let flex fill the space */
}

/* 6) If you're directly putting <canvas> in #c: */
#c canvas {
    width: 100%;
    height: 100%;
    display: block;       /* remove default inline canvas spacing */
    background-color: black;
}


header {
    height: 60px;
    background: #333;
    color: #fff;
    display: flex;
    align-items: center;
    padding: 0 1em;
    box-sizing: border-box;
}
"""

# TODO: This is likely redundant when we have `THREEJS_DRAWINGS` in the JS library.
ANIMATIONS_DICT = {
    'multiaxis':
        {
            'name': 'Multiaxis',
            'data_sources': ['data', 'experimental', 'experimental_1'],
            'custom_meta': dict(),
        },
    'music':
        {
            'name': 'Music',
            'data_sources': ['music'],
            'custom_meta': dict(music=True),
            'custom_overlays': ["""
<!-- Tempo Slider -->
<label for="tempo-slider">Tempo:</label>
<input id="tempo-slider" type="range" min="0.25" max="2.0" value="1" step="0.01"/>
<span id="tempo-value">1.00x</span>
            """]
        },
    'adventure':
        {
            'name': 'Adventure',
            'data_sources': ['adventure1', 'adventure2'],
            'custom_overlays': [ADVENTURE_NAVIGATION_OVERLAY],
            'custom_meta': dict(),
        },
    'room':
        {
            'name': 'Room',
            'data_sources': [],
            'custom_meta': dict(),
        },
    'cayley':
        {
            'name': 'Cayley',
            'data_sources': ['cayley'],
            'custom_meta': dict(),
        },
    'force':
        {
            'name': 'Force',
            'data_sources': [],
            'custom_meta': dict(),
        },
    'geo':
        {
            'name': 'Geo',
            'data_sources': ['geo'],
            'custom_meta': dict(),
        },
    'geo3d':
        {
            'name': 'Geo3D',
            'data_sources': ['geo3d'],
            'custom_meta': dict(),
        },
    'quantum':
        {
            'name': 'Quantum',
            'data_sources': [],
            'custom_meta': dict(),
        },
    'svg':
        {
            'name': 'SVG',
            'data_sources': ['OpenProject', 'Knowledge'],
            'custom_meta': dict(),
        },
    'library':
        {
            'name': 'Library',
            'data_sources': ['library'],
            'custom_meta': dict(),
            'custom_css': """
    #resourceOverlay {
        position: fixed;
        bottom:  20px;
        right:   20px;
        max-width: 300px;
        max-height: 60vh;
        overflow: auto;
        padding: 16px;
        border-radius: 8px;
        background: #222;
        color: #fff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        display: none;                /* hidden by default */
    }
    
    #resourceOverlay h2 { margin-top: 0; font-size: 1.1rem; }
    
    #resourceOverlay .close {
        float: right; cursor: pointer; font-weight: bold; margin-left: 8px;
    }
    
    .label {
        background: rgba(255,0,0,0.7);   /* bright red for debugging */
        padding: 2px 4px;
        border-radius: 3px;
        color: #fff;
        font-size: 12px;
        white-space: nowrap;             /* prevent wrap‑around */
        pointer-events: none;
    }
""",
            'custom_overlays': ["""
<div id="resourceOverlay">
    <span class="close" onclick="() => {document.getElementById('resourceOverlay').style.display = 'none';}">✕</span>
    <h2 id="overlayTitle"></h2>
    <p id="overlayAuthorYear"></p>
    <div id="overlayBody"></div>
</div>
            """],
            'custom_js': """
"""
        },
    'plot':
        {
            'name': 'Plot',
            'data_sources': ['plot'],
            'custom_meta': dict(),
        },
    'rubiks':
        {
            'name': 'Rubiks',
            'data_sources': ['rubiks'],
            'custom_meta': dict(),
        },
    'chess':
        {
            'name': 'Chess',
            'data_sources': ['chess'],
            'custom_meta': dict(),
        },
    'clustering':
        {
            'name': 'Clustering',
            'data_sources': ['clustering'],
            'custom_meta': dict(),
        },
    'orbits':
        {
            'name': 'Orbits',
            'data_sources': [],
            'custom_meta': dict(),
        },
    'force3d':
        {
            'name': 'Force3D',
            'data_sources': ['force3d', 'philpapers', 'math'],
            'custom_meta': dict(),
        },
    'cards':
        {
            'name': 'Cards',
            'data_sources': ['cards', 'thinkpak'],
            'custom_meta': dict(),
        },
    'gltf':
        {
            'name': 'GLTF',
            'data_sources': ['humanoid'],
            'custom_meta': dict(),
        },
}