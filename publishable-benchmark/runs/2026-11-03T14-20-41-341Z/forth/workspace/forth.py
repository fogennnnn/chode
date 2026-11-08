class StackUnderflowError(Exception):
    pass


class IllegalOperationError(Exception):
    pass


_BUILTINS = {'+', '-', '*', '/', 'DUP', 'DROP', 'SWAP', 'OVER'}


def evaluate(commands):
    stack = []
    defined_words = {}

    # Flatten all commands into tokens
    all_tokens = []
    for command in commands:
        all_tokens.extend(command.split())

    i = 0
    while i < len(all_tokens):
        token = all_tokens[i]
        token_upper = token.upper()

        # Check if we're starting a definition
        if token == ':':
            # Find the semicolon
            if ';' not in all_tokens[i:]:
                raise ValueError('illegal operation')
            # Word name is at i+1
            if i + 1 >= len(all_tokens):
                raise ValueError('illegal operation')
            word_name = all_tokens[i + 1]
            word_name_upper = word_name.upper()
            # Check if redefining a number
            if word_name_upper.replace('-', '', 1).isdigit():
                   raise ValueError("illegal operation")
            # Find definition end
            definition_end = all_tokens.index(';', i)
            # Definition is tokens between word name and semicolon
            definition = all_tokens[i + 2:definition_end]
            defined_words[word_name_upper] = definition
            i = definition_end + 1
            continue

        # Check if it's a user-defined word (case insensitive)
        if token_upper in defined_words:
            # Expand the definition by inserting tokens
            definition = defined_words[token_upper]
            # Insert in reverse order so they execute in order
            for sub_token in reversed(definition):
                all_tokens.insert(i + 1, sub_token)
            i += 1
            continue

        # Check if it's a number (including negative)
        if token.lstrip('-').isdigit() and token != '-':
            stack.append(int(token))
            i += 1
            continue

        # Check built-ins (case insensitive)
        if token_upper in _BUILTINS:
            if token_upper in ['+', '-', '*', '/']:
                if len(stack) < 2:
                    raise StackUnderflowError('Insufficient number of items in stack')
                if token_upper == '+':
                    b = stack.pop()
                    a = stack.pop()
                    stack.append(a + b)
                elif token_upper == '-':
                    b = stack.pop()
                    a = stack.pop()
                    stack.append(a - b)
                elif token_upper == '*':
                    b = stack.pop()
                    a = stack.pop()
                    stack.append(a * b)
                elif token_upper == '/':
                    b = stack.pop()
                    a = stack.pop()
                    if b == 0:
                        raise ZeroDivisionError('integer division or modulo by zero')
                    stack.append(int(a // b))
            elif token_upper == 'DUP':
                if not stack:
                    raise StackUnderflowError('Insufficient number of items in stack')
                stack.append(stack[-1])
            elif token_upper == 'DROP':
                if not stack:
                    raise StackUnderflowError('Insufficient number of items in stack')
                stack.pop()
            elif token_upper == 'SWAP':
                if len(stack) < 2:
                    raise StackUnderflowError('Insufficient number of items in stack')
                b = stack.pop()
                a = stack.pop()
                stack.append(b)
                stack.append(a)
            elif token_upper == 'OVER':
                if len(stack) < 2:
                    raise StackUnderflowError('Insufficient number of items in stack')
                b = stack.pop()
                a = stack.pop()
                stack.append(a)
                stack.append(b)
                stack.append(a)
            i += 1
            continue

        i += 1

    return stack
