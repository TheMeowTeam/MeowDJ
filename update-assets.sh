#!/bin/bash

mkdir assets-tmp
cd assets-tmp

git clone https://github.com/MeowDJ/MeowDJ-Assets.git .

rm -Rf .git
rm LICENSE.txt
rm README.md
rm styles/custom.less
cp -r * ../assets

cd ..
rm -Rf assets-tmp
