#!/bin/bash

cd test/fake-remote/repo1
git checkout staging
echo "And one more" >> file1.txt
git commit -am "Modify file 1 again"
git checkout master
cd ../../..