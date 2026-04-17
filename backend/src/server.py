import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / 'data' / 'db.json'
ADMINS_PATH = BASE_DIR / 'data' / 'admins.json'
SECRET = os.environ.get('JWT_SECRET', 'special-academy-dev-secret').encode()
PORT = int(os.environ.get('PORT', '4000'))

LEVEL_RANK = {'editor': 1, 'manager': 2, 'superadmin': 3}


def read_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_json(path, payload):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def parse_password_hash(stored):
    salt_hex, digest_hex = stored.split('$', 1)
    return bytes.fromhex(salt_hex), bytes.fromhex(digest_hex)


def verify_password(password, stored):
    salt, expected = parse_password_hash(stored)
    actual = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 150000)
    return hmac.compare_digest(actual, expected)


def hash_password(password):
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 150000)
    return f'{salt.hex()}${digest.hex()}'


def b64url(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def sign_token(payload):
    header = {'alg': 'HS256', 'typ': 'JWT'}
    data = payload.copy()
    data['exp'] = int((datetime.utcnow() + timedelta(hours=8)).timestamp())
    header_b64 = b64url(json.dumps(header, separators=(',', ':')).encode())
    payload_b64 = b64url(json.dumps(data, separators=(',', ':')).encode())
    signing = f'{header_b64}.{payload_b64}'.encode()
    signature = hmac.new(SECRET, signing, hashlib.sha256).digest()
    return f'{header_b64}.{payload_b64}.{b64url(signature)}'


def verify_token(token):
    try:
        header_b64, payload_b64, signature_b64 = token.split('.')
        signing = f'{header_b64}.{payload_b64}'.encode()
        expected_sig = b64url(hmac.new(SECRET, signing, hashlib.sha256).digest())
        if not hmac.compare_digest(expected_sig, signature_b64):
            return None
        padded = payload_b64 + '=' * ((4 - len(payload_b64) % 4) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded.encode()).decode())
        if datetime.utcnow().timestamp() > payload.get('exp', 0):
            return None
        return payload
    except Exception:
        return None


def auto_tags_by_category(category):
    mapping = {
        'informazioni-corso': ['lead', 'corso'],
        'richiesta-evento': ['evento', 'live'],
        'supporto': ['supporto'],
        'partnership': ['business'],
        'generica': ['generica']
    }
    return mapping.get(category, ['generica'])


class Handler(BaseHTTPRequestHandler):
    def _send(self, status=200, data=None):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        self.end_headers()
        if data is not None:
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def _body(self):
        length = int(self.headers.get('Content-Length', '0'))
        if not length:
            return {}
        raw = self.rfile.read(length).decode('utf-8')
        return json.loads(raw)

    def _auth(self):
        auth = self.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return None
        return verify_token(auth.replace('Bearer ', '', 1))

    def _require(self, permission=None):
        user = self._auth()
        if not user:
            self._send(401, {'error': 'Token mancante o non valido'})
            return None
        if permission and permission not in user.get('permissions', []):
            self._send(403, {'error': 'Permessi insufficienti'})
            return None
        return user

    def do_OPTIONS(self):
        self._send(204)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        db = read_json(DB_PATH)

        public_map = {
            '/api/public/courses': db['courses'],
            '/api/public/masters': db['masters'],
            '/api/public/events': db['events'],
            '/api/public/calendar': db['calendar']
        }
        if path in public_map:
            return self._send(200, public_map[path])
        if path == '/api/health':
            return self._send(200, {'status': 'ok', 'date': datetime.utcnow().isoformat()})

        private_resources = {
            '/api/courses': ('courses', 'manage_courses'),
            '/api/masters': ('masters', 'manage_masters'),
            '/api/events': ('events', 'manage_events'),
            '/api/calendar': ('calendar', 'manage_calendar'),
            '/api/genericRequests': ('genericRequests', 'manage_requests'),
            '/api/contacts': ('contacts', 'manage_contacts')
        }
        if path in private_resources:
            key, permission = private_resources[path]
            if not self._require(permission):
                return
            return self._send(200, db[key])

        if path == '/api/contacts/email-list':
            if not self._require('send_contact_emails'):
                return
            emails = sorted({c['email'].lower() for c in db['contacts'] if c.get('email')})
            return self._send(200, {'count': len(emails), 'emails': emails})

        if path == '/api/admins':
            if not self._require('manage_admins'):
                return
            admins = read_json(ADMINS_PATH)
            clean = [{k: v for k, v in a.items() if k != 'passwordHash'} for a in admins]
            return self._send(200, clean)

        return self._send(404, {'error': 'Endpoint non trovato'})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._body()

        if path == '/api/auth/login':
            admins = read_json(ADMINS_PATH)
            email = str(body.get('email', '')).lower()
            admin = next((a for a in admins if a['email'].lower() == email), None)
            if not admin or not verify_password(body.get('password', ''), admin['passwordHash']):
                return self._send(401, {'error': 'Credenziali non valide'})

            payload = {
                'id': admin['id'],
                'email': admin['email'],
                'name': admin['name'],
                'level': admin['level'],
                'permissions': admin['permissions']
            }
            token = sign_token(payload)
            return self._send(200, {'token': token, 'admin': payload})

        db = read_json(DB_PATH)

        if path == '/api/public/contacts':
            rec = {
                'id': str(uuid4()),
                'name': body.get('name'),
                'email': body.get('email'),
                'phone': body.get('phone'),
                'message': body.get('message'),
                'category': body.get('category', 'generica'),
                'tags': list(set(auto_tags_by_category(body.get('category', 'generica')) + body.get('tags', []))),
                'source': body.get('source', 'form-public'),
                'status': 'nuovo',
                'createdAt': datetime.utcnow().isoformat() + 'Z'
            }
            db['contacts'].append(rec)
            write_json(DB_PATH, db)
            return self._send(201, rec)

        create_map = {
            '/api/courses': ('courses', 'manage_courses'),
            '/api/masters': ('masters', 'manage_masters'),
            '/api/events': ('events', 'manage_events'),
            '/api/calendar': ('calendar', 'manage_calendar'),
            '/api/genericRequests': ('genericRequests', 'manage_requests')
        }
        if path in create_map:
            key, permission = create_map[path]
            if not self._require(permission):
                return
            payload = {'id': str(uuid4()), **body}
            db[key].append(payload)
            write_json(DB_PATH, db)
            return self._send(201, payload)

        if path == '/api/admins':
            user = self._require('manage_admins')
            if not user:
                return
            new_level = body.get('level', 'editor')
            if LEVEL_RANK.get(new_level, 0) >= LEVEL_RANK.get(user['level'], 0):
                return self._send(403, {'error': 'Non puoi creare admin con livello uguale/superiore'})
            admins = read_json(ADMINS_PATH)
            if any(a['email'].lower() == str(body.get('email', '')).lower() for a in admins):
                return self._send(409, {'error': 'Email admin già presente'})
            new_admin = {
                'id': str(uuid4()),
                'name': body.get('name'),
                'email': body.get('email'),
                'passwordHash': hash_password(body.get('password', 'ChangeMe123!')),
                'level': new_level,
                'permissions': body.get('permissions', [])
            }
            admins.append(new_admin)
            write_json(ADMINS_PATH, admins)
            clean = {k: v for k, v in new_admin.items() if k != 'passwordHash'}
            return self._send(201, clean)

        return self._send(404, {'error': 'Endpoint non trovato'})

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._body()
        db = read_json(DB_PATH)

        resource_map = {
            'courses': 'manage_courses',
            'masters': 'manage_masters',
            'events': 'manage_events',
            'calendar': 'manage_calendar',
            'genericRequests': 'manage_requests',
            'contacts': 'manage_contacts'
        }
        parts = path.strip('/').split('/')
        if len(parts) == 3 and parts[0] == 'api' and parts[1] in resource_map:
            key = parts[1]
            item_id = parts[2]
            if not self._require(resource_map[key]):
                return
            idx = next((i for i, r in enumerate(db[key]) if r['id'] == item_id), -1)
            if idx == -1:
                return self._send(404, {'error': 'Elemento non trovato'})
            if key == 'contacts' and 'tags' in body and isinstance(body['tags'], list):
                body['tags'] = list(dict.fromkeys(body['tags']))
            db[key][idx] = {**db[key][idx], **body, 'id': item_id}
            write_json(DB_PATH, db)
            return self._send(200, db[key][idx])

        return self._send(404, {'error': 'Endpoint non trovato'})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        db = read_json(DB_PATH)

        resource_map = {
            'courses': 'manage_courses',
            'masters': 'manage_masters',
            'events': 'manage_events',
            'calendar': 'manage_calendar',
            'genericRequests': 'manage_requests'
        }
        parts = path.strip('/').split('/')
        if len(parts) == 3 and parts[0] == 'api' and parts[1] in resource_map:
            key = parts[1]
            item_id = parts[2]
            if not self._require(resource_map[key]):
                return
            before = len(db[key])
            db[key] = [r for r in db[key] if r['id'] != item_id]
            if len(db[key]) == before:
                return self._send(404, {'error': 'Elemento non trovato'})
            write_json(DB_PATH, db)
            return self._send(204)

        return self._send(404, {'error': 'Endpoint non trovato'})


if __name__ == '__main__':
    print(f'SpecialAcademy backend attivo su http://localhost:{PORT}')
    HTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
