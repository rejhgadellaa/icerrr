#!/usr/bin/python
# @author REJH Gadellaa

import os
from PIL import Image

def calcOptiFactorString(orig, new, asprocent=False,reverse=False):
	origlen = len(orig)
	newlen = len(new)
	factor = newlen/origlen
	if reverse:
		factor = 1 - factor
	if asprocent:
		factor *= 100
		factor = round(factor)
	return factor
	
def calcOptiFactorBinary(fpatho, fpathn, asprocent=False,reverse=False):
	byteso = os.path.getsize(fpatho)
	bytesn = os.path.getsize(fpathn)
	factor = bytesn/byteso
	if reverse:
		factor = 1 - factor
	if asprocent:
		factor *= 100
		factor = round(factor)
	return factor
	
def needsCompress(fpath,data):
	#find entry
	for i in range(0, len(data)):
		entry = data[i]
		if entry["fpath"] == fpath:
			# found it! now check exists && filemtime..
			if not os.path.exists(fpath):
				return True
			if entry["ftime"] < os.path.getmtime(fpath):
				return True # found but file is out of date, yes compress it
			return False # found and hasn't changed, no and continue
	return True # not found so yes do compress it
	
def openImageOpti(fpath,fext):
	im = Image.open(fpath)
	return im
	"""
	if fext==".png":
		return im # png is getting BIGGER when I create palette index..??!!! ignore it
		pass
	try:
		nrOfColors = getNumberOfColors(im)
		if nrOfColors>1024:
			return im # too many colors to just reduce to 256 or less..
		elif nrOfColors > 256:
			print(" -> Convert to 256 colors..")
			cim = im.convert('P', palette=Image.ADAPTIVE, colors=256)
		else:
			print(" -> Convert to '"+ str(round(nrOfColors/2)) +"' colors..")
			cim = im.convert('P', palette=Image.ADAPTIVE, colors=round(nrOfColors/2))
		if fext==".jpg" or fext==".jpeg":
			return cim.convert("RGB") # jpeg: needs mode RGB image
		return cim # return mode P image
	except ValueError:
		print(" -> Could not convert colors :(")
		return im # if all fails..
	"""
	
def getNumberOfColors(im):
	# prep color list to keep track
	colors = []
	# get size
	imw, imh = im.size
	# convert to rgb (so we have all the colors even if we import indexed)
	rgb_im = im.convert('RGBA')
	# get pixeldata..
	for x in range(0, imw):
		for y in range(0,imh):
			# get r g b
			r, g, b, a = rgb_im.getpixel((x, y))
			hex = '#{:02x}{:02x}{:02x}{:02x}'.format(a, r, g, b)
			if not hex in colors:
				colors.append(hex)
			if len(colors)>1024: return 2056 # too many colors :S
	return len(colors)
















