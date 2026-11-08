import os


def grep(pattern, flags, files):
    # Parse flags
    flag_list = flags.split() if flags else []
    show_line_numbers = '-n' in flag_list
    show_file_names_only = '-l' in flag_list
    case_insensitive = '-i' in flag_list
    invert_match = '-v' in flag_list
    match_entire_line = '-x' in flag_list
    
    results = []
    multiple_files = len(files) > 1
    
    for filename in files:
        try:
            with open(filename, 'r') as f:
                content = f.read()
        except Exception:
            continue
        
        # Split into lines preserving line endings info
        lines = content.splitlines(True)  # keepends=True
        
        matching_lines_with_info = []
        
        for lineno, line_with_ending in enumerate(lines, start=1):
            # Determine line ending
            if line_with_ending.endswith('\r\n'):
                line_content = line_with_ending[:-2]
                ending = '\r\n'
            elif line_with_ending.endswith('\n'):
                line_content = line_with_ending[:-1]
                ending = '\n'
            elif line_with_ending.endswith('\r'):
                line_content = line_with_ending[:-1]
                ending = '\r'
            else:
                line_content = line_with_ending
                ending = '\n'  # Default to \n if no ending
            
            # Perform matching
            if case_insensitive:
                pattern_cmp = pattern.lower()
                line_cmp = line_content.lower()
            else:
                pattern_cmp = pattern
                line_cmp = line_content
            
            if match_entire_line:
                if case_insensitive:
                    is_match = pattern_cmp == line_cmp
                else:
                    is_match = pattern == line_content
            else:
                if case_insensitive:
                    is_match = pattern_cmp in line_cmp
                else:
                    is_match = pattern in line_content
            
            if invert_match:
                is_match = not is_match
            
            if is_match:
                matching_lines_with_info.append({
                    'filename': filename,
                    'lineno': lineno,
                    'line_content': line_content,
                    'ending': ending
                })
        
        # If -l flag is set and there are matches in this file
        if show_file_names_only:
            if matching_lines_with_info:
                results.append(filename + '\n')
        else:
            for match in matching_lines_with_info:
                if multiple_files and show_line_numbers:
                    results.append(f"{match['filename']}:{match['lineno']}:{match['line_content']}{match['ending']}")
                elif multiple_files and not show_line_numbers:
                    results.append(f"{match['filename']}:{match['line_content']}{match['ending']}")
                elif not multiple_files and show_line_numbers:
                    results.append(f"{match['lineno']}:{match['line_content']}{match['ending']}")
                elif not multiple_files and not show_line_numbers:
                    results.append(f"{match['line_content']}{match['ending']}")
    
    return ''.join(results)
