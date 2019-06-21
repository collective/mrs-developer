#!/bin/bash

cd test/src/develop/repo1
echo "Totally new content" > file1.txt
git commit -am "I modify file1 too"
cd ../../../..