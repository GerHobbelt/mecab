# Mecab WebAssembly

This project compiles mecab to WebAssembly, using Emscripten.  
Refers to [fasiha's mecab-emscripten](https://github.com/fasiha/mecab-emscripten), which targeted JS.  
Uses [https://github.com/WaniKani/WanaKana](WanaKana) (MIT license) for transliteration, additional tokenization, and classification.

See a live demo [on Birchlabs](https://birchlabs.co.uk/mecab-web/index.html).

Japanese is a language without spaces. MeCab suggests where to put spaces.  
MeCab suggests how to pronounce kanji words.  
MeCab deconjugates verbs, revealing the "dictionary form".

## License

BSD-3-Clause

## Building


```bash
git clone https://github.com/Birch-san/mecab.git
cd mecab

# build dictionary
cd mecab-naist-jdic
./configure --with-charset=utf8 && make
# prepare a folder containing just the files that our wasm binary cares about
mkdir -p dist
cp {dicrc,unk.dic,char.bin,sys.dic,matrix.bin} dist
cd ..

cd mecab
emconfigure ./configure --with-charset=utf8 && emmake make
# add a file extension to the LLVM IR so that em++ understands what it is
cp src/.libs/mecab src/.libs/mecab.bc
# emit WebAssembly from LLVM IR
# note: on Linux, the .dylib would be .so
em++ \
src/.libs/mecab.bc \
src/.libs/libmecab.dylib \
-o ../mecab-web/mecab.html \
-s EXPORTED_FUNCTIONS="[
'_mecab_do2',
'_mecab_model_new2',
'_mecab_model_destroy',
'_mecab_strerror',
'_mecab_model_new_tagger',
'_mecab_destroy',
'_mecab_nbest_sparse_tostr',
'_mecab_sparse_tostr'
]" \
-s MODULARIZE=1 \
-s EXPORT_ES6=1 \
-s EXTRA_EXPORTED_RUNTIME_METHODS='[
"cwrap",
"addOnExit",
"FS"
]' \
--no-heap-copy \
-s ALLOW_MEMORY_GROWTH=1 \
--preload-file ../mecab-naist-jdic/dist@naist-jdic/

cd ..
cd mecab-web
npm install
npx @pika/web
# download dictionaries
./edict-downloader.sh
./enamdict-downloader.sh
./kanjidic2-downloader.sh

# we need xmlstarlet to turn the KANJIDIC2 xml into a line-feed text file
brew install xmlstarlet
./kanjidic2-parser.sh

##--START OPTIONAL (setup service worker, for offline use)
# checks if you have workbox-cli, installs if you don't.
npm ls -g --depth 0 workbox-cli > /dev/null 2>&1 || npm install -g workbox-cli

# rather than having our webpack grab workbox from a CDN,
# let's serve a workbox_modules folder
mkdir -p workbox_modules
cp node_modules/workbox-*/build/workbox-*{.dev,.prod,}.js workbox_modules

# after you change any source code, run this to update the service worker's cache config
npx workbox-cli injectManifest workbox-config.js
##--END OPTIONAL

# now view mecab-web/index.html
```

## Serving the files

In total, you need to serve the following files:

```
.htaccess
index.html   # my helper page which combines various Japanese language technologies
style.css
licenses.html
mecab.js     # bootstraps WASM, exports functionality, handles lifecycle, preloads assets
mecab.wasm   # the compiled MeCab CLI executable (incl. libmecab)
mecab.data   # preloaded assets (mostly the NAIST-jdic dictionary)
edict2.utf8.txt     # generated via ./edict-downloader.sh
enamdict.utf8.txt   # generated via ./enamdict-downloader.sh
kanjidic2-lf.utf8.txt    # generated via ./kanjidic2-downloader.sh then ./kanjidic2-parser.sh
src/**/*     # source code
web_modules/**/*    # library dependencies, bundled by @pika/web
node_modules/**/*   # (optional, for debug) the source maps of web_modules point here
workbox_modules/**/*    # (optional, for offline support) libraries used by service worker
manifest.webmanifest    # (optional, for offline support) progressive web application manifest
sw.js        # (optional, for offline support) service worker
```

See the `.htaccess` for how to set the correct MIME types for streaming compilation, and how to make use of pre-compressed files (instead of gzipping them each time they're requested).

Here's how to create .gz pre-compressed copies of each file:

```bash
gzip -kf mecab.data mecab.wasm mecab.js edict2.utf8.txt enamdict.utf8.txt kanjidic2-lf.utf8.txt
```

## Preparing release

The source code does not require any kind of bundling; it can be served as-is.

That said: the _service worker_ does need complete and up-to-date knowledge of the application assets. For this reason, we do need to regenerate the service worker's manifest.

```bash
npx workbox-cli injectManifest workbox-config.js

rm -rf dist
mkdir -p dist

cp -R \
.htaccess \
index.html \
style.css \
LICENSE \
licenses.html \
manifest.webmanifest \
sw.js \
logo \
src \
web_modules \
workbox_modules \
mecab.data \
mecab.wasm \
mecab.js \
edict2.utf8.txt \
enamdict.utf8.txt \
kanjidic2-lf.utf8.txt \
dist/

tar -zcvf dist.tar.gz dist/
```