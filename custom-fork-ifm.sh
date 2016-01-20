#!/usr/bin/env bash

# test if no previous copy exists
if [ -e ../interrrgalacticfm ]
then
    echo 'ERROR: Please, remove ../interrrgalacticfm before running the script.'
    exit 1
fi

# make copy and go to destination
cd ..
cp -a icerrr interrrgalacticfm
cd interrrgalacticfm

# remove riskful and unneeded files
rm -rf .git .gitignore custom-fork-ifm.sh

# search and replace inside files
for e in `echo bat css gradle html iml java js json md php txt xml`
do
    for i in `find . -type f -name *\.$e`
    do
        sed -i -e 's/icerrr/interrrgalacticfm/g' $i
        sed -i -e 's/Icerrr/InterrrgalacticFM/g' $i
        sed -i -e 's/ICERRR/INTERRRGALACTICFM/g' $i
    done
done

# search and replace files
#TODO

# search and replace filenames
#TODO

# search and replace urls and parameters
#TODO
