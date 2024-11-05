""""""
from http.server import HTTPServer, SimpleHTTPRequestHandler

HOST = 'localhost'
PORT = 8000

THREEJS_VERSION = b'0.169.0'

# serve ./index.html

# This requires the following:
# - index.html
# - style.css
# - src/main.js

# The following is a simple server that serves the index.html file from the current directory.
# To run the server, execute the following command in the terminal:
#
#     python serve.py
#
# Then, navigate to http://localhost:8000 in your browser to view the
# served index.html file.


class MyHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        print(f"DEBUG: path={self.path}, self.headers={self.headers}")

        if self.path == '/' or self.path == '/index.html':
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            content = open('index.html', 'rb').read()
            # INJECT __THREEJS_VERSION__
            content = content.replace(b'__THREEJS_VERSION__', THREEJS_VERSION)
            self.wfile.write(content)
        elif self.path == '/style.css':
            self.send_response(200)
            self.send_header("Content-type", "text/css")
            self.end_headers()
            self.wfile.write(open('style.css', 'rb').read())
        elif self.path.startswith('/src/main.js'):
            self.send_response(200)
            self.send_header("Content-type", "application/javascript")
            self.end_headers()
            self.wfile.write(open('src/main.js', 'rb').read())
        elif self.path == '/three/fonts/helvetiker_regular.typeface.json':
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(open('helvetiker_regular.typeface.json', 'rb').read())
        elif self.path.endswith('.json'):
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(open(f'.{self.path}', 'rb').read())
        else:
            self.send_response(404)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"404 Not Found")


httpd = HTTPServer(('localhost', PORT), MyHandler)

print(f"Currently serving at http://{HOST}:{PORT}")

httpd.serve_forever()
