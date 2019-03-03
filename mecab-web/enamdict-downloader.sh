#!/usr/bin/env bash
wget http://ftp.monash.edu/pub/nihongo/enamdict.gz
gzip -d enamdict.gz
iconv -f EUC-JP -t UTF-8 enamdict > enamdict.utf8.txt