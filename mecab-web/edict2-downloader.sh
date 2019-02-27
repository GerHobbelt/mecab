#!/usr/bin/env bash
wget http://ftp.monash.edu/pub/nihongo/edict2.gz
gzip -d edict2.gz
# UTF8 is probably most storage-efficient for EDICT2, since most of the document is the Engllish definitions.
iconv -f EUC-JP -t UTF-8 edict2 > edict2.utf8.txt
# UTF16 is storage-efficient for CJK text generally. NodeJS supports low-endian.
# iconv -f EUC-JP -t UTF-16LE edict2 > edict2.utf16le.txt
# iconv -f EUC-JP -t UTF-16 edict2 > edict2.utf16.txt
# iconv -f EUC-JP -t UCS-2 edict2 > edict2.ucs2.txt