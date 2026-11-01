# Chode 1.9.39

The compact 8 by 4 TUI orb uses native Sixel pixels when the terminal reports both graphics support and its character-cell dimensions. Windows Terminal 1.24 was probed directly and reported 10×20 cells: the orb receives an 80×80 raster in the same compact area. The field and palette follow the website's three-node equations; real pixels remove character-row gaps. Each frame paints the full image, including its background, and saves/restores the composer cursor.

Other terminals use fine braille dots instead of solid quadrant blocks: a 16×16 dot field in the same 8×4 cells. No graphics are sent without positive capability and geometry reports. Probe replies are consumed separately from typed input, including fragmented replies and mixed command chunks. Resizing renegotiates dimensions; closing cancels the probe and animation timers. Set CHODE_TERMINAL_GRAPHICS=off to use text rendering. Reduced motion remains supported.
