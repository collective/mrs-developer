#!/bin/bash

cd test/fake-remote/repo1
echo "Knowledge is power" >> file1.txt
git commit -am "new change"
git tag 1.0.9
echo "France is bacon" >> file1.txt
git commit -am "really?"
git tag 1.0.11
echo "Francis Bacon" >> file1.txt
git commit -am "fix quote"
git tag 1.0.10
cd ../../../..