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
-n \
"$KANJIDIC"