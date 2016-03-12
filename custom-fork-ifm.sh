#!/usr/bin/env bash
set -xe

# test if no previous copy exists
if [ -e ../interrrgalacticfm ]
then
    echo 'ERROR: Please, remove ../interrrgalacticfm before running the script.'
    exit 1
fi

# make copy and go to destination
rm -rf webapp/rgt/cache/*
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
cd ifm-assets
for i in *
do
    for j in `find ../*app -name $i`
    do
        cp -a $i $j
    done
done
cd ..
rm -rf ifm-assets

# search and replace filenames
# NOTE: Recursive sollution with find runs easily into troubles
# because changes made in for loop are not updatedin the loop vatiable.
# Hence, it is a bit ugly. Make sure travelled depth is enough.
for i in *app
do
    cd $i
    if [ `ls *|wc -l` != 0 ]
    then
    for j in *
    do
        if [ `echo $j|grep icerrr|wc -l` != 0 ]
        then
        jj=`echo $j|sed -e 's/icerrr/interrrgalacticfm/g'`
        echo $j
        mv $j $jj
        else
        jj=$j
        fi
        if [ -d $jj ]
        then
        cd $jj
        if [ `ls *|wc -l` != 0 ]
        then
        for k in *
        do
            if [ `echo $k|grep icerrr|wc -l` != 0 ]
            then
            kk=`echo $k|sed -e 's/icerrr/interrrgalacticfm/g'`
            echo $k
            mv $k $kk
            else
            kk=$k
            fi
            if [ -d $kk ]
            then
            cd $kk
            if [ `ls *|wc -l` != 0 ]
            then
            for l in *
            do
                if [ `echo $l|grep icerrr|wc -l` != 0 ]
                then
                ll=`echo $l|sed -e 's/icerrr/interrrgalacticfm/g'`
                echo $l
                mv $l $ll
                else
                ll=$l
                fi
                if [ -d $ll ]
                then
                cd $ll
                if [ `ls *|wc -l` != 0 ]
                then
                for m in *
                do
                    if [ `echo $m|grep icerrr|wc -l` != 0 ]
                    then
                    mm=`echo $m|sed -e 's/icerrr/interrrgalacticfm/g'`
                    mv $m $mm
                    else
                    mm=$m
                    fi
                    if [ -d $mm ]
                    then
                    cd $mm
                    if [ `ls *|wc -l` != 0 ]
                    then
                    for n in *
                    do
                        if [ `echo $n|grep icerrr|wc -l` != 0 ]
                        then
                        nn=`echo $n|sed -e 's/icerrr/interrrgalacticfm/g'`
                        mv $n $nn
                        else
                        nn=$n
                        fi
                        if [ -d $nn ]
                        then
                        cd $nn
                        if [ `ls *|wc -l` != 0 ]
                        then
                        for o in *
                        do
                            if [ `echo $o|grep icerrr|wc -l` != 0 ]
                            then
                            oo=`echo $o|sed -e 's/icerrr/interrrgalacticfm/g'`
                            mv $o $oo
                            else
                            oo=$o
                            fi
                            if [ -d $oo ]
                            then
                            cd $oo
                            if [ `ls *|wc -l` != 0 ]
                            then
                            for p in *
                            do
                                if [ `echo $p|grep icerrr|wc -l` != 0 ]
                                then
                                pp=`echo $p|sed -e 's/icerrr/interrrgalacticfm/g'`
                                mv $p $pp
                                else
                                pp=$p
                                fi
                                if [ -d $pp ]
                                then
                                cd $pp
                                if [ `ls *|wc -l` != 0 ]
                                then
                                for q in *
                                do
                                    if [ `echo $q|grep icerrr|wc -l` != 0 ]
                                    then
                                    qq=`echo $q|sed -e 's/icerrr/interrrgalacticfm/g'`
                                    mv $q $qq
                                    else
                                    qq=$q
                                    fi
                                done
                                fi
                                cd ..
                                fi
                            done
                            fi
                            cd ..
                            fi
                        done
                        fi
                        cd ..
                        fi
                    done
                    fi
                    cd ..
                    fi
                done
                fi
                cd ..
                fi
            done
            fi
            cd ..
            fi
        done
        fi
        cd ..
        fi
    done
    fi
    cd ..
done
for i in `find . -name '*Icerrr*'`
do
    mv $i `echo $i|sed -e 's/Icerrr/Interrrgalacticfm/g'`
done

# search and replace text, urls and parameters
#TODO
