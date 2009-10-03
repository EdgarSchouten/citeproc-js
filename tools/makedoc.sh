#!/bin/bash

set -e

cd $(dirname $0)

cd ../ref/citeproc-doc

function increment() {
  echo Incrementing ...
  DATE=$(date +"%e %B %Y" | sed -e "s/^ //")
  echo $DATE
  VERSION=$(grep '##[0-9]\+##' citeproc-doc.rst| sed -e "s/.*##\([0-9]\+\)##/\1/")
  VERSION=$((VERSION+1))
  echo $VERSION
  cat citeproc-doc.rst \
     | sed -e "s/##\([0-9]\+##\)/##$VERSION##/" \
     | sed -e "s/=D=\(.*\)=D=/=D=$DATE=D=/" > tmp-with-markup.txt
}

function noincrement() {
  DATE=$(grep '=D=.*=D=' citeproc-doc.rst | sed -e "s/.*=D=\([^=]*\)=D=/\1/")
  echo $DATE
  VERSION=$(grep '##[0-9]\+##' citeproc-doc.rst| sed -e "s/.*##\([0-9]\+\)##/\1/")
  echo $VERSION
  cp citeproc-doc.rst tmp-with-markup.txt
}

if [ "$1" == "--increment" ]; then
  increment
else
  noincrement
fi

cat tmp-with-markup.txt \
     | sed -e "s/##\([0-9]\+\)##/$VERSION/" \
     | sed -e "s/=D=\(.*\)=D=/$DATE/" > tmp-without-markup.txt

./rst2html4citeproc \
    --stylesheet="./screen-citeprocjs.css" \
    ./tmp-without-markup.txt > ./index.html

cd ..
if [ "$1" == "--increment" ]; then
  scp ./citeproc-doc/index.html gsl-nagoya-u.net:/http/pub/citeproc-doc.html
  mv ./citeproc-doc/tmp-with-markup.txt ./citeproc-doc/citeproc-doc.rst
fi

tar --create \
    --gzip \
    --exclude="tmp-*" \
    --file ./citeproc-doc.tar.gz \
    ./citeproc-doc/

if [ "$1" == "--increment" ]; then
  scp ./citeproc-doc.tar.gz gsl-nagoya-u.net:/http/pub/citeproc-doc.tar.gz
fi

rm -f ./citeproc-doc/tmp-with-markup.txt
rm ./citeproc-doc/tmp-without-markup.txt
