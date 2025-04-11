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

ANIMATIONS_DICT = {
    'multiaxis':
        {
            'name': 'Multiaxis',
            'data_sources': ['data']
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
            'data_sources': ['adventure'],
            'custom_overlays': [ADVENTURE_NAVIGATION_OVERLAY],
        },
}