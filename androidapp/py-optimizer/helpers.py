#!/usr/bin/python
# @author REJH Gadellaa

import os

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
			# found it! now check filemtime..
			if entry["ftime"] < os.path.getmtime(fpath):
				return True # found but file is out of date, yes compress it
			return False # found and hasn't changed, no and continue
	return True # not found so yes do compress it