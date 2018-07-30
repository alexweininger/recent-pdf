import zipfile
import sys
import datetime
import os

fl = ["js", "src", "assets", "icons", "_locales"]

info = open("info.txt","w+")

if len(sys.argv) < 2:
	name = input('Folder name (enter c to cancel): ')

	if name == 'c':
		exit()
	else:
		filename = name + '.zip'
else:
	filename = sys.argv[1] + '.zip'

now = datetime.datetime.now()
info.write(filename[:-4] + '\n' + now.strftime("%Y-%m-%d %I:%M"))
info.close()

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