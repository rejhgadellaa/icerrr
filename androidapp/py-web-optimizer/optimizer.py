#!/usr/bin/python

"""

@author REJH Gadellaa

Required:
 * csscompressor (pip3 install csscompressor)
 * jsmin (pip3 install jsmin)
 * PIL (see below)
 * PyImageOptimiser (pip3 install PyImageOptimiser)
 
 Installing PIL for py3 on windows:
 * Downloads at http://www.lfd.uci.edu/~gohlke/pythonlibs/#pillow
 * pip3 install [path-to-whl-file]
 
 Notes on PyImageOptimiser:
 * Requires 'requests' module (pip3 install requests)
 * Has indentation errors. Easily fixed but annoying.

"""

# ===========================
# CODE

import sys
import os
import shutil
import json

from csscompressor import compress
from jsmin import jsmin
from PIL import Image
import PyImageOptimizer

import rgfileio
import helpers

# --- PREPARE

report = {}
report["total_files"] = 0;
report["total_optimized"] = 0;
report["total_untouched"] = 0;
report["total_filesizekb"] = 0;
report["total_filesizekb_after"] = 0;
report["total_filesizekb_reduced"] = 0;

# --- READ JSON FILES

# Config
try:
	configs = rgfileio.read("optimizer.config.json");
	config = json.loads(configs)
except:
	print("Could not load 'optimizer.config.json'")
	sys.exit(1)

try:
	
	# Paths
	cfg_inpath = config["paths"]["input_path"]
	cfg_outpath = config["paths"]["output_path"]
	
	# Ignore
	if "ignore" in config: cfg_ignore = config["ignore"]
	else: cfg_ignore = []
	
except:
	print("Error parsing config :(")
	sys.exit(1)

# Datas_compressed_images
try:
	data_compressed_images = []
	if config["opts"]["images_only_when_changed"]:
		datas_compressed_images = rgfileio.read("datas_compressed_images.json");
		data_compressed_images = json.loads(datas_compressed_images)
except:
	if "opts" in config:
		if "images_only_when_changed" in config["opts"]:
			if config["opts"]["images_only_when_changed"]:
				# Write empty file..
				rgfileio.write("datas_compressed_images.json","[]")
	pass

# --- START 

# Output some info..
print(os.path.abspath(cfg_inpath))
print(os.path.abspath(cfg_outpath))
print("")

# Check input folder
if not os.path.exists(cfg_inpath):
	print("Error: Input_path does not exist: '"+ str(cfg_inpath +"'"))
	sys.exit(1)

# Create output folder if not exist
if not os.path.exists(cfg_outpath):
	print("Create output folder: "+ str(cfg_outpath))
	os.makedirs(cfg_outpath)
	
# Read dir
listdirr = rgfileio.listdirr(cfg_inpath)
report["total_files"] = len(listdirr)

# Walk files..
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
	print(outfpath)
	
	# Only if file basename is not in ignore list..
	if not fbasename in cfg_ignore:
	
		# >> CSS
		if fextension == ".css" and fbasename.find(".min.")<0: 
			strunc = rgfileio.read(fpath)
			if strunc!=None and strunc!="None":
				strcom = compress(strunc)
				rgfileio.write(outfpath,strcom)
				factorproc = helpers.calcOptiFactorString(strunc,strcom,True,True)
				optimized = True
			
		# >> JS
		if fextension == ".js" and fbasename.find(".min.")<0:
			strunc = rgfileio.read(fpath)
			if strunc!=None and strunc!="None":
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
			
			# Open image in optimal way.. (tries and reduce colors)
			im = helpers.openImageOpti(fpath,fextension)
			
			# Save image..
			tmpfpath = os.path.join("tmp",fbasename)
			if fextension == ".jpg" or fextension == ".jpeg":
				im.save(tmpfpath,"JPEG",quality=50, optimize=True, progressive=True)
			else:
				# Special: save to tmp, pngcrush it, then copy..
				im.save(tmpfpath,"PNG", compress_level=9)
			
			# Optimize using PyImageOptimizer
			PyImageOptimizer.optimize(tmpfpath)
			shutil.move(tmpfpath,outfpath)
				
			# Create new data entry + write..
			# -> Store filename to data_compressed so we don't run this every time, only when source image is updated..			
			newentry = {
				"fpath":fpath,
				"ftime":os.path.getmtime(fpath)
			}
			data_compressed_images.append(newentry)
			datas_compressed_images = json.dumps(data_compressed_images)
			rgfileio.write("datas_compressed_images.json",datas_compressed_images)
			factorproc = helpers.calcOptiFactorBinary(fpath,outfpath,True,True)
			optimized = True
	
	# Round up..
	if optimized: # just calc some stuff...
		fsizekb = round(os.path.getsize(fpath)/1024)
		fsizekb_after = round(os.path.getsize(outfpath)/1024)
		fsizekb_reduced = fsizekb - fsizekb_after
		report["total_filesizekb"] += fsizekb
		report["total_filesizekb_after"] += fsizekb_after
		report["total_filesizekb_reduced"] += fsizekb_reduced
		report["total_optimized"] += 1
		print(" -> reduced "+ str(factorproc) +"%")
		
	else: # not optimized so we need to copy the file..
		report["total_untouched"] += 1
		if os.path.exists(outfpath):
			if os.path.getmtime(fpath) <= os.path.getmtime(outfpath):
				continue #dont copy
		shutil.copyfile(fpath,outfpath)
		
# --- REPORT

# Prep Report..
report["total_files_skipped"] = report["total_files"] - report["total_optimized"] - report["total_untouched"]

# Report..
print("")
print("Total files:      "+ str(report["total_files"]))
print("Total optimized:  "+ str(report["total_optimized"]))
print("Total untouched:  "+ str(report["total_untouched"]))
print("")
print("Total kb before:  "+ str(report["total_filesizekb"]))
print("Total kb after:   "+ str(report["total_filesizekb_after"]))
print("Total kb reduced: "+ str(report["total_filesizekb_reduced"]))

























		