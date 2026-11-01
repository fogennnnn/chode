# Chode 1.9.37

The terminal logo doubles both sampling dimensions: 16 columns by 8 rows (32 by 16 quadrant pixels). The header reserves its full area and centres the adjacent status text. Terminals below 72 columns or 24 rows retain the 8 by 4 mark; smaller terminals retain the text header. Body scrolling, prompt hit targets and composer placement account for the header height. Motion, colour field and reduced-motion controls are unchanged.

The frontend's pink lighting is confined to a shallow horizon halo, strongest beneath the logo and falling continuously toward its edges. Broad coloured sky blooms and the full-width pink surface wash are removed. The halo and reflection share the same visibility and footprint attenuation, so scrolling dims them together and fully hides the coloured light when the logo leaves view.

Native qualification also exposed multiple completed Enter commands arriving in a single input chunk. Raw CR-terminated command batches now submit normally; bracketed paste and unmarked CRLF multiline paste remain editable without submitting. The regression first reproduced the native failure, then verified command execution and both paste protections.
