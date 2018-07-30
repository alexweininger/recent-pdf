import zipfile
import sys
import datetime
import os
import json

fl = ["js", "src", "assets", "icons", "_locales"]

if len(sys.argv) < 2:
    name = input('Enter name (enter c to cancel): ')
    version = input('Version number: ')
    if name == 'c':
        exit()
    else:
        filename = name + '-' + version + '.zip'
else:
    version = sys.argv[2]
    filename = sys.argv[1] + '-' + version + '.zip'

# updating manifest.json version
jsonfile = 'manifest.json'
with open(jsonfile, 'r') as f:
    data = json.load(f)
    data['version'] = version  # <--- add `id` value.

os.remove(jsonfile)
with open(jsonfile, 'w') as f:
    json.dump(data, f, indent=4)

# updating the info.txt file with date and time
info = open("info.txt", "w+")
now = datetime.datetime.now()
info.write(filename[:-4] + '\n' + now.strftime("%Y-%m-%d %I:%M"))
info.close()

# writing files to archive
print('creating archive')
z = zipfile.ZipFile('versions/' + filename, mode='w')
try:
    for f in fl:
        for root, dirs, files in os.walk(f):
            for filename in files:
                z.write(os.path.join(root, filename))
    z.write('manifest.json')
    z.write('info.txt')
finally:
    z.close()