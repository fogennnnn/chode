def recite(start, take=1):
    result = []
    for i in range(take):
        current = start - i
        next_count = current - 1
        
        if current == 0:
            result.append("No more bottles of beer on the wall, no more bottles of beer.")
            result.append("Go to the store and buy some more, 99 bottles of beer on the wall.")
        elif current == 1:
            result.append("1 bottle of beer on the wall, 1 bottle of beer.")
            result.append("Take it down and pass it around, no more bottles of beer on the wall.")
        else:
            current_str = f"{current} bottles"
            next_str = f"{next_count} bottles" if next_count != 1 else "1 bottle"
            if next_count == 0:
                next_str = "no more bottles"
            result.append(f"{current_str} of beer on the wall, {current_str} of beer.")
            result.append(f"Take one down and pass it around, {next_str} of beer on the wall.")
        
        if i < take - 1:
            result.append("")
    
    return result
