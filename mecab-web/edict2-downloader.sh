#!/usr/bin/env bash
wget http://ftp.monash.edu/pub/nihongo/edict2.gz
gzip -d edict2.gz

# EUC-JP is the original and most storage-efficient format for EDICT2.
# cp edict2 edict2.eucjp.txt
# but support is low (Apache httpd's AddCharset EUC-JP seems to be a no-op)

# UTF8 is almost as small as EUC-JP (especially when gzipped)
# it's a better fit than UTF16, since there's a lot of English definitions in the document.
iconv -f EUC-JP -t UTF-8 edict2 > edict2.utf8.txt

# UTF16 is storage-efficient for CJK text generally. NodeJS supports low-endian.
# iconv -f EUC-JP -t UTF-16LE edict2 > edict2.utf16le.txt
# iconv -f EUC-JP -t UTF-16 edict2 > edict2.utf16.txt
# iconv -f EUC-JP -t UCS-2 edict2 > edict2.ucs2.txt