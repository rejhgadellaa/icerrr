#!/usr/bin/python

"""

@author REJH Gadellaa

Required:
 * csscompressor (pip3 install csscompressor)
 * jsmin (pip3 install jsmin)
 * PIL (see below)
 
 Installing PIL for py3 on windows:
 * Downloads at http://www.lfd.uci.edu/~gohlke/pythonlibs/#pillow
 * pip3 install [path-to-whl-file]

"""

# ===========================
# CONFIG

cfg_inpath = "..\\com.rejh.icerrr.itson-wwwdev" # www dev folder
cfg_outpath = "..\\com.rejh.icerrr.itson-as\\app\\src\\main\\assets\\www" # www prod folder

# ===========================
# CODE

import sys
import os
import shutil
import json

from csscompressor import compress
from jsmin import jsmin
from PIL import Image

import rgfileio
import helpers

report = {}
report["total_files"] = 0;
report["total_optimized"] = 0;
report["total_untouched"] = 0;

if not os.path.exists(cfg_outpath):
	print("Create output folder: "+ str(cfg_outpath))
	os.makedirs(cfg_outpath)

datas_compressed_images = rgfileio.read("datas_compressed_images.json");
data_compressed_images = json.loads(datas_compressed_images)

listdirr = rgfileio.listdirr(cfg_inpath)
report["total_files"] = len(listdirr)

for i in range(0, len(listdirr)):
	
	# Get fpath, fbasename, fextension and fdirname
	fpath = listdirr[i]
	fbasename = os.path.basename(fpath)
	fextension = fbasename[fbasename.rfind("."):].lower()
	fdirpath = os.path.dirname(fpath)
	
	# Prepare for copy: mkdir..?
	outdirpath = os.path.join(cfg_outpath,fdirpath[len(cfg_inpath)+1:])
	outfpath = os.path.join(outdirpath,fbasename)
	if not os.path.exists(outdirpath):
		os.makedirs(outdirpath)
	
	# Do the work by file extension..
	optimized = False
	
	# Let's a go go
	print(outfpath)
	
	# >> CSS
	if fextension == ".css" and fbasename.find(".min.")<0: 
		strunc = rgfileio.read(fpath)
		if strunc==None:
			continue # error reading file..
		strcom = compress(strunc)
		rgfileio.write(outfpath,strcom)
		factorproc = helpers.calcOptiFactorString(strunc,strcom,True,True)
		optimized = True
		
	# >> JS
	if fextension == ".js" and fbasename.find(".min.")<0:
		strunc = rgfileio.read(fpath)
		if strunc==None:
			continue # error reading file..
		strcom = jsmin(strunc)
		rgfileio.write(outfpath,strcom)
		factorproc = helpers.calcOptiFactorString(strunc,strcom,True,True)
		optimized = True
		
	# >> JPG, PNG
	if fextension == ".jpg" or fextension == ".png":
		# check data_compressed_images
		if not helpers.needsCompress(fpath,data_compressed_images):
			report["total_optimized"] += 1 # we're not processing it but it's optimized allright
			continue
		# Compress image!
		im = Image.open(fpath)
		if fextension == ".jpg":
			im.save(outfpath,"JPEG",quality=50, optimize=True, progressive=True)
		else:
			im.save(outfpath,"PNG", compress_level=9, optimize=True)
		# Create new data entry + write..
		newentry = {
			"fpath":fpath,
			"ftime":os.path.getmtime(fpath)
		}
		data_compressed_images.append(newentry)
		datas_compressed_images = json.dumps(data_compressed_images)
		rgfileio.write("datas_compressed_images.json",datas_compressed_images)
		factorproc = helpers.calcOptiFactorBinary(fpath,outfpath,True,True)
		optimized = True
	
	
	if optimized:
		report["total_optimized"] += 1
		print(" -> reduced "+ str(factorproc) +"%")
	else:
		report["total_untouched"] += 1
		if os.path.exists(outfpath):
			if os.path.getmtime(fpath) <= os.path.getmtime(outfpath):
				continue #dont copy
		shutil.copyfile(fpath,outfpath)
		

# Prep Report..
report["total_files_skipped"] = report["total_files"] - report["total_optimized"] - report["total_untouched"]

# Report..
print("Total files:     "+ str(report["total_files"]))
print("Total optimized: "+ str(report["total_optimized"]))
print("Total untouched: "+ str(report["total_untouched"]))


























		