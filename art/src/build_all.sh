#!/bin/sh
# Rebuild every piece of art from source. Needs Python 3 with playwright (and its Chromium) and Pillow.
#   sh art/src/build_all.sh
set -e
cd "$(dirname "$0")"
python3 keyart.py ../concept/keyart.png
python3 cast.py ../concept/cast.png
python3 icons.py ../concept
python3 export_sprites.py ../../app/js/sprites.js
python3 appicons.py ../../app/assets/img
python3 -c "from PIL import Image; im = Image.open('../../app/assets/img/keyart.png').convert('RGB'); im.save('../../app/assets/img/keyart.jpg', quality=86)"
rm -f ../../app/assets/img/keyart.png
echo "art rebuilt"
