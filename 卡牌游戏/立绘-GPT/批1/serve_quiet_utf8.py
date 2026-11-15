"""仅供本机验收的 HTTP 服务，显式声明 UTF-8，不改构建产物。"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from functools import partial
class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.html':'text/html; charset=utf-8'}
    def log_message(self, format, *args): pass
root=Path(__file__).resolve().parents[2]/'v6/dist'
ThreadingHTTPServer(('127.0.0.1',8768),partial(Handler,directory=str(root))).serve_forever()
