def encode(plain_text, a, b):
    import math

M = 26  # alphabet size


def gcd(a, b):
    """Calculate greatest common divisor."""
    while b:
        a, b = b, a % b
    return a


def are_coprime(a, m):
    """Check if a and m are coprime."""
    return gcd(a, m) == 1


def mod_inverse(a, m):
    """Find modular multiplicative inverse of a mod m."""
    for x in range(1, m):
        if (a * x) % m == 1:
            return x
    raise ValueError('a and m must be coprime.')


def encode(plain_text, a, b):
    if not are_coprime(a, M):
        raise ValueError('a and m must be coprime.')
    result = []
    for char in plain_text.lower():
        if 'a' <= char <= 'z':
            idx = ord(char) - ord('a')
            cipher_idx = (a * idx + b) % M
            result.append(chr(cipher_idx + ord('a')))
        elif char.isdigit():
            result.append(char)
    return ''.join(result)


def decode(ciphered_text, a, b):
    if not are_coprime(a, M):
        raise ValueError('a and m must be coprime.')
    inv_a = mod_inverse(a, M)
    result = []
    for char in ciphered_text.lower():
        if 'a' <= char <= 'z':
            idx = ord(char) - ord('a')
            plain_idx = (inv_a * (idx - b)) % M
            result.append(chr(plain_idx + ord('a')))
        elif char.isdigit():
            result.append(char)
    # Group into 5-character blocks separated by spaces
    return ''.join(result)

# Fix encode function to handle grouping

def encode(plain_text, a, b):
    if not are_coprime(a, M):
        raise ValueError('a and m must be coprime.')
    result = []
    for char in plain_text.lower():
        if 'a' <= char <= 'z':
            idx = ord(char) - ord('a')
            cipher_idx = (a * idx + b) % M
            result.append(chr(cipher_idx + ord('a')))
        elif char.isdigit():
            result.append(char)
    # Group into 5-character blocks separated by spaces
    return ' '.join([result[i:i+5] for i in range(0, len(result), 5)])
