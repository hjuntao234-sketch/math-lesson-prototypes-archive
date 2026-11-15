"""One-shot encrypted, in-memory browser-to-Keychain transfer; no plaintext output."""
import ctypes as C
import getpass
import json
from pathlib import Path
import re
import secrets
import subprocess
import sys

sys.path.insert(0, str(Path(__file__).parent / 'vendor'))
from cryptography.hazmat.primitives.asymmetric import padding, rsa

def main():
    private = rsa.generate_private_key(public_exponent=65537, key_size=3072)
    pub = private.public_key().public_numbers()
    # Public nonzero padding is acceptable here because the transferred API secret
    # has high entropy. This is a single-use RSA envelope, never a generic password tool.
    ps = bytes(secrets.randbelow(255) + 1 for _ in range(384))
    print(json.dumps({'modulus_hex': format(pub.n, 'x'), 'exponent': pub.e,
                      'padding_hex': ps.hex()}), flush=True)
    cipher = bytes.fromhex(sys.stdin.readline().strip())
    secret = private.decrypt(cipher, padding.PKCS1v15())
    if not re.fullmatch(rb'sk-[A-Za-z0-9_-]+', secret):
        raise ValueError('credential_format')
    sec = C.CDLL('/System/Library/Frameworks/Security.framework/Security')
    cf = C.CDLL('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')
    sec.SecKeychainFindGenericPassword.argtypes = [C.c_void_p,C.c_uint32,C.c_char_p,C.c_uint32,C.c_char_p,C.POINTER(C.c_uint32),C.POINTER(C.c_void_p),C.POINTER(C.c_void_p)]
    sec.SecKeychainFindGenericPassword.restype = C.c_int32
    sec.SecKeychainItemModifyAttributesAndData.argtypes = [C.c_void_p,C.c_void_p,C.c_uint32,C.c_void_p]
    sec.SecKeychainItemModifyAttributesAndData.restype = C.c_int32
    cf.CFRelease.argtypes = [C.c_void_p]
    service = b'compass-openai-tts'
    account = getpass.getuser().encode()
    item = C.c_void_p()
    status = sec.SecKeychainFindGenericPassword(None,len(service),service,len(account),account,None,None,C.byref(item))
    if status:
        print('keychain_find_status',status); return 2
    buf = C.create_string_buffer(secret)
    try:
        status = sec.SecKeychainItemModifyAttributesAndData(item,None,len(secret),C.cast(buf,C.c_void_p))
    finally:
        C.memset(buf,0,len(buf)); cf.CFRelease(item)
    if status:
        print('keychain_update_status',status); return 2
    r = subprocess.run(['security','find-generic-password','-s','compass-openai-tts','-w'],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
    print('replacement_key_saved_and_verified:',r.returncode==0 and r.stdout.strip()==secret,flush=True)
    return 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print('STOP',type(error).__name__,'details suppressed',flush=True)
        sys.exit(2)
