def translate(text):
    vowels = set('aeiou')
    
    def translate_word(word):
        # Rule 1: starts with vowel, "xr", or "yt"
        if word[0] in vowels or word.startswith('xr') or word.startswith('yt'):
            return word + 'ay'
        
        # Look for split point
        i = 0
        n = len(word)
        while i < n:
            # Rule 3: if we see 'qu', move everything up to and including 'qu'
            if i + 1 < n and word[i] == 'q' and word[i + 1] == 'u':
                return word[i + 2:] + word[:i + 2] + 'ay'
            # Rule 4: if we see 'y' and we've moved at least one consonant
            if word[i] == 'y' and i > 0:
                return word[i:] + word[:i] + 'ay'
            # If we see a vowel (and it's not part of special cases above), stop
            if word[i] in vowels:
                break
            i += 1
        # Rule 2: moved consonants to end
        return word[i:] + word[:i] + 'ay'
    
    return ' '.join(translate_word(word) for word in text.split())
