#!/usr/bin/env bash
# usage:
# kanjidic2-parser.sh kanjidic2.xml

MYDIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)

# Check if program exists; thanks to lhunath, Darryl Hein
# http://stackoverflow.com/a/677212/5257399
command -v xmlstarlet >/dev/null 2>&1 || { echo >&2 "I require 'xmlstarlet' but it's not installed. Please install via 'brew install xmlstarlet' or similar. Aborting."; exit 1; }

KANJIDIC="${1:-"$MYDIR/kanjidic2.xml"}"

if [ ! -f "$KANJIDIC" ]; then
    >&2 echo "'kanjidic2.xml' not found at path '$KANJIDIC'! Please run kanjidic2-downloader.sh and copy the file that it outputs into the current working directory."
    exit 1
fi

xmlstarlet sel -T -t \
-m '/kanjidic2/character' \
  -v 'literal' \
  -o '$' \
  -v 'misc/jlpt' \
  -o '|' \
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
    -o '^' \
    --break \
  -o '$' \
  -m 'reading_meaning/nanori' \
  -v '.' \
  -o '|' \
  --break \
-n \
"$KANJIDIC" \
| sed -E 's#[\^|`]+([`\$]|$)#\1#g' \
# \
#| sed -E 's#;([ ])#\1#g'
# | sed 's/;}/}/g'

: '
Schema:
亜$1$ア|`つ.ぐ$や|つぎ|つぐ
LITERAL$TAGS$RM_GROUPS$NANORI
LITERAL$JLPT|$RM_GROUP/$NANORIS
LITERAL$JLPT|$ONS`KUNS/$NANORI|
LITERAL$JLPT|$ON|`KUN|/$NANORI|
Split on dollars
Split TAGS on | to get JLPT
Split RM_GROUPS on ^ to get each RM_GROUP
Slit each RM_GROUP on ` to get ONS and KUNS
Split each ONS on | to get ON
Split each KUNS on | to get KUN
Split each NANORIS on | to get NANORI

The following characters are vaguely safe for use as delimiters, for now:
~$`^|
'