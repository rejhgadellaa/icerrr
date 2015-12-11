# rgpy-web-optimizer

- Script that reads a directory recursively and optimizes javascript, css and image files. 
- It optimizes and copies files and leaves the originals intact. 
- Images are only processed when they haven't before or the file has changed (also see 'images_only_when_changed' option in config)

## REQUIREMENTS:

csscompressor, jsmin, PyImageOptimiser, PIL (or Pillow)

    pip3 install csscompressor
    pip3 install jsmin
    pip3 install PyImageOptimiser
    
Installing PIL for py3 on windows:
 * Downloads at http://www.lfd.uci.edu/~gohlke/pythonlibs/#pillow
 * pip3 install [path-to-whl-file]
 
Notes on PyImageOptimiser:
 * Requires 'requests' module (pip3 install requests)
 * Has indentation errors. Easily fixed but annoying

Tested with Python 3.5

## CONFIG

    {
    	
    	"paths":{
    		"input_path":"../absolute/or/relative/path/to/input/folder",
    		"output_path../absolute/or/relative/path/to/output/folder"
    	},
    	
    	"opts":{
    		"files_only_when_changed":true,
    		"images_only_when_changed":true
    	},
    	
    	"ignore":[
    		"smoothie.js"
    	]
    	
    }

Notes:

- Option 'files_only_when_changed' is not implemented as of yet
- 'ignore' is a list of files will not be optimized (useful for files that are already minified) but WILL be copied to the output folder!
- Files that contain ".min" in their name will automatically be added to the 'ignore' list
- Hidden files will always be ignored and not copied to output folder
