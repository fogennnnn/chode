import math

ALPHABET_SIZE = 26
GROUP_SIZE = 5


def _are_coprime(a, m):
    return math.gcd(a, m) == 1


def _modular_inverse(a, m):
    for x in range(1, m):
        if (a * x) % m == 1:
            return x
    raise ValueError("no modular multiplicative inverse")


def _require_coprime_key(a):
    if not _are_coprime(a, ALPHABET_SIZE):
        raise ValueError("a and m must be coprime")


def encode(plain_text, a, b):
    _require_coprime_key(a)

    cipher_chars = []
    for char in plain_text.lower():
        if char.isalpha():
            i = ord(char) - ord("a")
            cipher_chars.append(chr(((a * i + b) % ALPHABET_SIZE) + ord("a")))
        elif char.isdigit():
            cipher_chars.append(char)
        # spaces and punctuation are excluded

    cipher_text = "".join(cipher_chars)
    groups = [
        cipher_text[i:i + GROUP_SIZE]
        for i in range(0, len(cipher_text), GROUP_SIZE)
    ]
    return " ".join(groups)


def decode(ciphered_text, a, b):
    _require_coprime_key(a)

    a_inv = _modular_inverse(a, ALPHABET_SIZE)

    plain_chars = []
    for char in ciphered_text.lower():
        if char.isalpha():
            y = ord(char) - ord("a")
            plain_chars.append(chr(((a_inv * (y - b)) % ALPHABET_SIZE) + ord("a")))
        elif char.isdigit():
            plain_chars.append(char)
        # spaces and punctuation are excluded

    return "".join(plain_chars)
