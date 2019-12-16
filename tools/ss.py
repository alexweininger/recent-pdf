from mss import mss
from mss import tools

with mss() as sct:
    # The screen part to capture
    # monitor = {'top': 0, 'left': 1920, 'width': 640, 'height': 400}
    monitor = {'top': 50, 'left': 3100, 'width': 640, 'height': 400}
    output = 'sct-{top}x{left}_{width}x{height}.png'.format(**monitor)

    # Grab the data
    sct_img = sct.grab(monitor)

    # Save to the picture file
    tools.to_png(sct_img.rgb, sct_img.size, output=output)
    print(output)
