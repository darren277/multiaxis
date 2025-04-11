""""""
from animations import ANIMATIONS_DICT, FULLSCREEN_CSS, EMBEDDED_CSS, SMALL_HEADER_CSS

HOST = 'localhost'
PORT = 8000

THREEJS_VERSION = '0.169.0'

from flask import Flask, Response, send_file, abort, render_template
import os


app = Flask(__name__)

@app.route('/')
@app.route('/index.html')
def serve_index():
    """Serve index.html with the __THREEJS_VERSION__ placeholder replaced."""
    css = FULLSCREEN_CSS
    #css = EMBEDDED_CSS
    fullscreen = True
    return render_template(
        'index.html',
        fullscreen=fullscreen,
        small_header=True,
        #threejs_css=css,
        threejs_css=SMALL_HEADER_CSS,
        threejs_version=THREEJS_VERSION,
        threejs_drawings=ANIMATIONS_DICT['multiaxis']
    )

@app.route('/threejs/<animation>')
def serve_threejs(animation):
    """
    Serve the three.js library.
    Example: /threejs/animation -> /threejs/animation on disk
    """
    #css = FULLSCREEN_CSS
    css = EMBEDDED_CSS
    fullscreen = False
    return render_template(
        'index.html',
        fullscreen=fullscreen,
        small_header=False,
        threejs_css=css,
        threejs_version=THREEJS_VERSION,
        threejs_drawings=ANIMATIONS_DICT.get(animation, ANIMATIONS_DICT['multiaxis'])
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

@app.route('/textures/<path:filename>.<ext>')
def serve_texture(filename, ext):
    """
    Serve any image file under /textures/.
    Example: /textures/Canestra_di_frutta_Caravaggio.jpg
    """
    path = os.path.join('src', 'textures', f'{filename}.{ext}')
    if ext not in ['jpg', 'jpeg', 'png']:
        abort(404)
    if ext == 'jpg' or ext == 'jpeg':
        mimetype = 'image/jpeg'
    elif ext == 'png':
        mimetype = 'image/png'
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

@app.route('/scripts/helvetiker_regular.typeface.json')
def serve_helvetiker():
    """Serve the helvetiker_regular.typeface.json font file."""
    json_path = 'helvetiker_regular.typeface.json'
    if os.path.exists(json_path):
        return send_file(json_path, mimetype='application/json')
    else:
        abort(404)

@app.route('/<path:filename>.json')
def serve_json(filename):
    """
    Serve any .json file from the current directory or subdirs,
    capturing anything that ends with .json.
    """
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
