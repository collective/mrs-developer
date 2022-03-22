#!/bin/bash

cd test
rm -rf src fake-remote
mkdir src
mkdir fake-remote
cd fake-remote
git init repo1
cd repo1
git branch -m main
echo "fffile 1" > file1.txt
git add file1.txt
git commit -am "Add file 1"
git checkout -b conflicting
rm file1.txt
git add .
git commit -m "Delete file 1"
git checkout main
echo "File 1" > file1.txt
git add file1.txt
git commit --amend --no-edit
git tag 1.0.0
echo "File 2" > file2.txt
git add file2.txt
git commit -am "Add file 2"
git checkout main

cd ../../..