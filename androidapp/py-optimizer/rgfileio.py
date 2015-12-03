#!/usr/bin/python
# Filename rgfileio.py

import os

version = "0.02"

# Listdirr() - returns recursive list of folder structure
def listdirr(dirpath, skipHidden=True):
	res = []
	if not os.path.isdir(dirpath):
		return res # always return a list..
	listdir = os.listdir(dirpath)
	for i in range(0,len(listdir)):
		if listdir[i].startswith('.'):
			continue # skip hidden files
		subpath = os.path.join(dirpath,listdir[i])
		if os.path.isdir(subpath):
			subres = listdirr(subpath)
			for j in range(0, len(subres)):
				res.append( subres[j] )
		else:
			res.append( subpath )
	return res

# Read() - Ascii, returns string
def read(filename,ignoreErrors=True):
	fr = None
	try:
		fo = open(filename,"r")
		fr = fo.read()
		fo.close()
	except:
		pass
	return str(fr)

# Write() - Ascii, expects string!
def write(filename, content):
    fo = open(filename,"w")
    fo.write(content)
    fo.close()
