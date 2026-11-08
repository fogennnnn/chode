def transpose(text):
    if not text:
        return ''
    lines = text.split('\n')
    max_len = max(len(line) for line in lines) if lines else 0
    result = [''] * max_len
    for i in range(max_len):
        for j, line in enumerate(lines):
            if i < len(line):
                result[i] += line[i]
            else:
                result[i] += ' ' if i < max_len and any(len(line) > i for line in lines) else ''
    return '\n'.join(result)
