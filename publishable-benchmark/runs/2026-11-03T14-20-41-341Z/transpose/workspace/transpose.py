def transpose(text):
    if not text:
        return ''
    
    lines = text.split('\n')
    max_len = max(len(line) for line in lines) if lines else 0
    
    result = []
    for col in range(max_len):
        # Find the last line that has a character at this column
        last_line_with_char = -1
        for i, line in enumerate(lines):
            if col < len(line):
                last_line_with_char = i
        
        # Build the output row up to that last line
        row_chars = []
        for i in range(last_line_with_char + 1):
            if col < len(lines[i]):
                row_chars.append(lines[i][col])
            else:
                row_chars.append(' ')
        
        result.append(''.join(row_chars))
    
    return '\n'.join(result)
