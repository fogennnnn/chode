def append(list1, list2):
    result = []
    for item in list1:
        result.append(item)
    for item in list2:
        result.append(item)
    return result


def concat(lists):
    result = []
    for list_ in lists:
        for item in list_:
            result.append(item)
    return result


def filter(function, list):
    result = []
    for item in list:
        if function(item):
            result.append(item)
    return result


def length(list):
    count = 0
    for item in list:
        count = count + 1
    return count


def map(function, list):
    result = []
    for item in list:
        result.append(function(item))
    return result


def foldl(function, list, initial):
    accumulator = initial
    for item in list:
        accumulator = function(accumulator, item)
    return accumulator


def foldr(function, list, initial):
    accumulator = initial
    index = length(list) - 1
    while index >= 0:
        accumulator = function(list[index], accumulator)
        index = index - 1
    return accumulator


def reverse(list):
    result = []
    index = length(list) - 1
    while index >= 0:
        result.append(list[index])
        index = index - 1
    return result
