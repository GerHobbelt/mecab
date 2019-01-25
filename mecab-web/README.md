# Mecab WebAssembly

This project compiles mecab to WebAssembly, using Emscripten.  
Refers to [fasiha's mecab-emscripten](https://github.com/fasiha/mecab-emscripten), which targeted JS.  
Uses [https://github.com/WaniKani/WanaKana](WanaKana) (MIT license) for transliteration, additional tokenization, and classification.

See a live demo [on Birchlabs](https://birchlabs.co.uk/wasm/index.html).

Japanese is a language without spaces. MeCab suggests where to put spaces.  
MeCab suggests how to pronounce kanji words.  
MeCab deconjugates verbs, revealing the "dictionary form".

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
em++ src/.libs/mecab.bc src/.libs/libmecab.dylib -o ../mecab-web/mecab.html -s EXPORTED_FUNCTIONS="['_mecab_do2', '_mecab_model_new2', '_mecab_model_destroy', '_mecab_strerror', '_mecab_model_new_tagger', '_mecab_destroy', '_mecab_nbest_sparse_tostr', '_mecab_sparse_tostr']" -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap", "addOnExit"]' --no-heap-copy -s ALLOW_MEMORY_GROWTH=1 --preload-file ../mecab-naist-jdic/dist@naist-jdic/
cd ..

# now view mecab-web/index.html
```

## Serving the files

In total, you need to serve the following files:

```
index.html   // my helper page with a form to invoke functionality from MeCab + WanaKana
lib/wanakana.min.js  // Wanakana (transliteration, additional tokenization, classification)
mecab.js     // bootstraps WASM, exports functionality, handles lifecycle, preloads assets
mecab.wasm   // the compiled MeCab CLI executable (incl. libmecab)
mecab.data   // preloaded assets (mostly the NAIST-jdic dictionary)
```

See the `.htaccess` for how to set the correct MIME types for streaming compilation, and how to make use of pre-compressed files (instead of gzipping them each time they're requested).

Here's how to create .gz pre-compressed copies of each file:

```bash
gzip -kf mecab.data mecab.wasm mecab.js
```