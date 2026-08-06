import urllib.request
import urllib.error

url = 'http://127.0.0.1:8001/api/v1/organizations/'
try:
    with urllib.request.urlopen(url) as resp:
        data = resp.read()
        print('STATUS', resp.status)
        print('HEADERS', resp.getheaders())
        print('BODY', data.decode('utf-8'))
except urllib.error.HTTPError as e:
    print('HTTP', e.code, e.reason)
    print(e.read().decode('utf-8'))
except Exception as e:
    print('ERR', str(e))
