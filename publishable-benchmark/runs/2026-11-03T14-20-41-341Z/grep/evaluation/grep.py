def grep(pattern, flags, files):
    flag_list = flags.split() if flags else []
    show_line_numbers = '-n' in flag_list
    filenames_only = '-l' in flag_list
    case_insensitive = '-i' in flag_list
    invert = '-v' in flag_list
    entire_line = '-x' in flag_list

    results = []

    for filename in files:
        try:
            with open(filename) as f:
                lines = f.readlines()
        except Exception:
            continue

        file_matches = []
        for line_number, line in enumerate(lines, 1):
            # Keep original line content including newline as in file
            line_to_check = line
            # For matching, we compare against the line without line endings?
            # Tests show lines in FILE_TEXT end with \n and expected outputs include \n
            search_line = line_to_check
            search_pattern = pattern

            if case_insensitive:
                search_line_cmp = search_line.lower()
                search_pattern_cmp = search_pattern.lower()
            else:
                search_line_cmp = search_line
                search_pattern_cmp = search_pattern

            if entire_line:
                # Match entire line - need to compare without trailing newline
                line_cmp = search_line_cmp
                if line_cmp.endswith('\n'):
                    line_cmp = line_cmp[:-1]
                if line_cmp.endswith('\r'):
                    line_cmp = line_cmp[:-1]
                pattern_cmp = search_pattern_cmp
                is_match = line_cmp == pattern_cmp
            else:
                is_match = search_pattern_cmp in search_line_cmp

            if invert:
                is_match = not is_match

            if is_match:
                file_matches.append((line_number, line_to_check))

        if filenames_only:
            if file_matches:
                results.append(filename + '\n')
        else:
            for line_number, line_to_check in file_matches:
                if len(files) > 1:
                    if show_line_numbers:
                        results.append(f'{filename}:{line_number}:{line_to_check}')
                    else:
                        results.append(f'{filename}:{line_to_check}')
                else:
                    if show_line_numbers:
                        results.append(f'{line_number}:{line_to_check}')
                    else:
                        results.append(line_to_check)

    return ''.join(results)
