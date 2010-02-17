
#!/bin/sh

if [ $(echo ${SHELL} | grep -c "bash")  -eq "1" ]; then
  echo LANG in bash
  export LANG="en_US.UTF-8"
else
  echo LANG in something else
  setenv LANG "en_US.UTF-8"
fi

START="$(date) <--------------START"
cd $(dirname $0)
TRACEMONKEY=/home/bennett/src/jslibs/Linux_32_opt/jshost
DOJO="${PWD}"/dojo-sm/dojo/dojo.js
DOH="${PWD}"/dojo-sm/util/doh/

TARGET="${PWD}"/tests/runners/tracemonkey.js

OPT="CSL_OPTIONS={fixture:\"$1\"}"
if [ "$1" != "" ]; then
    echo $OPT  run-opt.js
else
    echo "" > run-opt.js
fi

"${TRACEMONKEY}" -u "${TARGET}" 

rm -f run-opt.js
rm -f run-opt.jsxdr

echo $START
echo $(date) \<--------------END
