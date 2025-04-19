""""""
import json

from animations import ANIMATIONS_DICT, FULLSCREEN_CSS, EMBEDDED_CSS, SMALL_HEADER_CSS

HOST = 'localhost'
PORT = 8000

THREEJS_VERSION = '0.169.0'
# "0.175.0"

from flask import Flask, Response, send_file, abort, render_template, request
import os


app = Flask(__name__)

@app.route('/')
@app.route('/index.html')
def serve_index():
    """Serve index.html with the __THREEJS_VERSION__ placeholder replaced."""
    #css = FULLSCREEN_CSS
    css = EMBEDDED_CSS
    #fullscreen = True
    fullscreen = False
    return render_template(
        'index.html',
        fullscreen=fullscreen,
        small_header=True,
        #threejs_css=css,
        threejs_css=SMALL_HEADER_CSS,
        threejs_version=THREEJS_VERSION,
        threejs_drawings=ANIMATIONS_DICT['multiaxis'],
        nav_items=ANIMATIONS_DICT.keys(),
        main_js_path='./src/main.js'
    )

@app.route('/threejs/<animation>')
def serve_threejs(animation):
    """
    Serve the three.js library.
    Example: /threejs/animation -> /threejs/animation on disk
    """
    print('animation nav:', animation)
    css = FULLSCREEN_CSS
    fullscreen = True

    viz = ANIMATIONS_DICT.get(animation, ANIMATIONS_DICT['multiaxis'])
    data_selected_query_param = request.args.get('data_selected')
    data_selected = data_selected_query_param if data_selected_query_param else viz.get('data_sources', [None])[0] if len(viz.get('data_sources', [])) > 0 else None
    print('data_selected:', data_selected)

    threejs_version = viz.get('threejs_version', THREEJS_VERSION)

    default_importmap = {
        "three": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/build/three.module.js",
        "textgeometry": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/geometries/TextGeometry.js",
        "fontloader": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/loaders/FontLoader.js",
        "orbitcontrols": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/controls/OrbitControls.js",
        "svgloader": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/loaders/SVGLoader.js",
        "svgrenderer": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/renderers/SVGRenderer.js",
        "css2drenderer": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/renderers/CSS2DRenderer.js",
        "css3drenderer": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/renderers/CSS3DRenderer.js",
        "gltfloader": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/loaders/GLTFLoader.js",
        "pdbloader": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/loaders/PDBLoader.js",

        "tween": "https://unpkg.com/@tweenjs/tween.js@23.1.3/dist/tween.esm.js",

        "stats": "https://cdnjs.cloudflare.com/ajax/libs/stats.js/r17/Stats.min.js",
        "lil-gui": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/libs/lil-gui.module.min.js",

        'objloader': f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/loaders/OBJLoader.js",
        'plyloader': f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/loaders/PLYLoader.js",

        "d3-force-3d": "https://cdn.skypack.dev/d3-force-3d",
        "three-spritetext": "//unpkg.com/three-spritetext/dist/three-spritetext.mjs",
        "3d-force-graph": "https://cdn.jsdelivr.net/npm/3d-force-graph@1.77.0/+esm",
        "vrbutton": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/webxr/VRButton.js",

        "convex-object-breaker": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/misc/ConvexObjectBreaker.js",
        "convex-geometry": f"https://cdn.jsdelivr.net/npm/three@{threejs_version}/examples/jsm/geometries/ConvexGeometry.js",
    }

    # Force3d importmap:
    force3d_importmap = {
        "three": "https://esm.sh/three@0.175.0",
        "3d-force-graph": "https://esm.sh/3d-force-graph@1.77.0?bundle&deps=three@0.175.0",
        "three-spritetext": "https://esm.sh/three-spritetext@1.9.6?bundle&deps=three@0.175.0",
        "tween": "https://unpkg.com/@tweenjs/tween.js@23.1.3/dist/tween.esm.js",
    }

    importmap = force3d_importmap if animation == 'force3d' else default_importmap

    return render_template(
        'index.html',
        fullscreen=fullscreen,
        small_header=True,
        #threejs_css=css,
        threejs_css=SMALL_HEADER_CSS,
        threejs_version=THREEJS_VERSION,
        threejs_drawings=viz,
        nav_items=ANIMATIONS_DICT.keys(),
        #main_js_path='./src/main.js',
        main_js_path = '/src/main.js',
        data_selected=data_selected,
        importmap=json.dumps(importmap, indent=4),
    )

@app.route('/style.css')
def serve_style():
    """Serve style.css."""
    if os.path.exists('style.css'):
        return send_file('style.css', mimetype='text/css')
    else:
        abort(404)

@app.route('/src/<path:filename>.js')
def serve_js(filename):
    """
    Serve any .js file under /src/.
    Example: /src/main.js -> /src/main.js on disk
    """
    path = os.path.join('src', f'{filename}.js')
    if os.path.exists(path):
        return send_file(path, mimetype='application/javascript')
    else:
        abort(404)

@app.route('/threejs/textures/<path:filename>.<ext>')
def serve_texture(filename, ext):
    """
    Serve any image file under /textures/.
    Example: /textures/Canestra_di_frutta_Caravaggio.jpg
    """
    path = os.path.join('src', 'textures', f'{filename}.{ext}')
    if ext not in ['jpg', 'jpeg', 'png', 'mp4']:
        abort(404)
    if ext == 'jpg' or ext == 'jpeg':
        mimetype = 'image/jpeg'
    elif ext == 'png':
        mimetype = 'image/png'
    elif ext == 'mp4':
        mimetype = 'video/mp4'
    else:
        abort(404)
    if os.path.exists(path):
        return send_file(path, mimetype=mimetype)
    else:
        # Default to a specific image if the requested one doesn't exist
        default_path = os.path.join('src', 'textures', 'Canestra_di_frutta_Caravaggio.jpg')
        if os.path.exists(default_path):
            return send_file(default_path, mimetype=mimetype)
        else:
            abort(404)

# imagery (jpg, jpeg, png, svg, etc)...
@app.route('/threejs/imagery/<path:filename>.<ext>')
def serve_image(filename, ext):
    """
    Serve any image file under /imagery/.
    Example: /imagery/Canestra_di_frutta_Caravaggio.jpg
    """
    remaining_file_name_and_ext = ext.split('.')
    remaining_file_name = remaining_file_name_and_ext[:-1]
    ext = remaining_file_name_and_ext[-1]
    remaining_file_name = ".".join(remaining_file_name)
    filename = filename + '.' + remaining_file_name
    path = os.path.join('src', 'imagery', f'{filename}.{ext}')
    print(f"Serving image: {path}")
    if ext not in ['jpg', 'jpeg', 'png', 'svg', 'glb', 'ply', 'obj']:
        abort(404)
    if ext == 'jpg' or ext == 'jpeg':
        mimetype = 'image/jpeg'
    elif ext == 'png':
        mimetype = 'image/png'
    elif ext == 'svg':
        mimetype = 'image/svg+xml'
    elif ext == 'glb':
        mimetype = 'model/gltf-binary'
    elif ext == 'ply':
        mimetype = 'model/ply'
    elif ext == 'obj':
        mimetype = 'model/obj'
    else:
        abort(404)
    if os.path.exists(path):
        return send_file(path, mimetype=mimetype)
    else:
        print(f"File not found: {path}")
        abort(404)

@app.route('/scripts/helvetiker_regular.typeface.json')
@app.route('/threejs/scripts/helvetiker_regular.typeface.json')
def serve_helvetiker():
    """Serve the helvetiker_regular.typeface.json font file."""
    json_path = 'helvetiker_regular.typeface.json'
    if os.path.exists(json_path):
        return send_file(json_path, mimetype='application/json')
    else:
        abort(404)

@app.route('/data/<path:filename>.json')
@app.route('/threejs/<path:filename>.json')
def serve_json(filename):
    """
    Serve any .json file from the current directory or subdirs,
    capturing anything that ends with .json.
    """
    if not filename.startswith('data/'):
        path = f'data/{filename}.json'
    else:
        path = f'{filename}.json'
    if os.path.exists(path):
        return send_file(path, mimetype='application/json')
    else:
        abort(404)

@app.errorhandler(404)
def not_found(e):
    """Return a custom 404 page."""
    return Response("404 Not Found", status=404, mimetype='text/html')

if __name__ == '__main__':
    HOST = 'localhost'
    PORT = 8000
    print(f"Currently serving at http://{HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=True)
