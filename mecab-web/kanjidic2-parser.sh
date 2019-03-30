#!/usr/bin/env bash
# usage:
# ./kanjidic2-parser.sh [input=kanjidic2.xml] [output=kanjidic2-lf.txt]

MYDIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

# Check if program exists; thanks to lhunath, Darryl Hein
# http://stackoverflow.com/a/677212/5257399
command -v xmlstarlet >/dev/null 2>&1 || { echo >&2 "I require 'xmlstarlet' but it's not installed. Please install via 'brew install xmlstarlet' or similar. Aborting."; exit 1; }

KANJIDIC="${1:-"$MYDIR/kanjidic2.xml"}"
OUTPUT="${2:-"$MYDIR/kanjidic2-lf.utf8.txt"}"

if [ ! -f "$KANJIDIC" ]; then
    >&2 echo "'kanjidic2.xml' not found at path '$KANJIDIC'! Please run kanjidic2-downloader.sh and copy the file that it outputs into the current working directory."
    exit 1
fi

xmlstarlet sel -T -t \
-m '/kanjidic2/character' \
  -v 'literal' \
  -o '$' \
  -v 'misc/jlpt' \
  -o '$' \
  -m 'reading_meaning/rmgroup' \
    -m 'reading[@r_type="ja_on"]' \
      -v '.' \
      -o '|' \
      --break \
    -o '`' \
    -m 'reading[@r_type="ja_kun"]' \
      -v '.' \
      -o '|' \
      --break \
    -o '`' \
    -m 'meaning[not(@m_lang)]' \
      -v '.' \
      -o '|' \
      --break \
    -o '`' \
    --break \
  -o '$' \
  -m 'reading_meaning/nanori' \
    -v '.' \
    -o '^' \
    --break \
  -o '$' \
-n \
"$KANJIDIC" \
| sed -E '
s#\$$##g;
s#\^(\$|$)#\1#g;
s#`(\^|\$|$)#\1#g;
s#\|(`|\^|\$|$)#\1#g' \
| tee "$OUTPUT"

: '
The split hierarchy is:
\n
$
^
`
|

Schema:
亜$1$ア`つ.ぐ`Asia|rank next|come after|-ous$や^つぎ^つぐ
LITERAL$JLPT$RM_GROUPS$NANORIS$
LITERAL$JLPT$RM_GROUP^$NANORI^$
LITERAL$JLPT$ONS`KUNS`MEANINGS`^$NANORI^$
LITERAL$JLPT$ON|`KUN|`MEANING|`^$NANORI^$
Split on newline (well, you probably already did this)
Split on dollars
Split RM_GROUPS on ^ to get each RM_GROUP
Slit each RM_GROUP on ` to get ONS and KUNS
Split each ONS on | to get ON
Split each KUNS on | to get KUN
Split each NANORIS on ^ to get NANORI

The following characters are vaguely safe for use as delimiters, for now (assuming English readings):
~$`^|@#
Note:
~ is used twice in French readings
^ is used in a couple of pinyin readings
# is used once in a Spanish reading
'