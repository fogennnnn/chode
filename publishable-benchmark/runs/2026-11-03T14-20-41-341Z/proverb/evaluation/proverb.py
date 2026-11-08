def proverb(*pieces, qualifier=None):
    if not pieces:
        return []

    result = []
    for i in range(len(pieces) - 1):
        result.append(f'For want of a {pieces[i]} the {pieces[i + 1]} was lost.')

    final_piece = pieces[0]
    if qualifier:
        final_piece = f'{qualifier} {final_piece}'
    result.append(f'And all for the want of a {final_piece}.')

    return result

