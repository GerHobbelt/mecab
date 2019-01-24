# Mecab WebAssembly

This is an attempt to compile mecab to WebAssembly, using Emscripten.  
Will [fasiha's mecab-emscripten](https://github.com/fasiha/mecab-emscripten), which targeted JS.

That project was from 2014. I'm hoping to explore whether the flags can be made simpler now, and whether we can target WASM instead of JS.


```bash
git clone https://github.com/Birch-san/mecab.git
cd mecab/mecab-naist-jdic-0.6.3b-20111013
./configure --with-charset=utf8 && make && sudo make install

cd mecab/mecab
mkdir -p naist-jdic
# copy dictionary
cp /usr/local/lib/mecab/dic/naist-jdic/{dicrc,unk.dic,char.bin,sys.dic,matrix.bin} naist-jdic
emconfigure ./configure --with-charset=utf8 && emmake make
cp src/.libs/mecab src/.libs/mecab.bc
# # works, but choice of TOTAL_MEMORY was super arbitrary
# em++ src/.libs/mecab.bc src/.libs/libmecab.dylib -o mecab.html -s EXPORTED_FUNCTIONS="['_mecab_do2']" -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap", "intArrayFromString"]' -s TOTAL_MEMORY=134217728 --preload-file naist-jdic/
em++ src/.libs/mecab.bc src/.libs/libmecab.dylib -o mecab.html -s EXPORTED_FUNCTIONS="['_mecab_do2', '_mecab_model_new2', '_mecab_model_destroy', '_mecab_strerror', '_mecab_model_new_tagger', '_mecab_destroy', '_mecab_nbest_sparse_tostr', '_mecab_sparse_tostr']" -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap", "addOnExit"]' --no-heap-copy -s ALLOW_MEMORY_GROWTH=1 --preload-file naist-jdic/

gzip -kf mecab.data mecab.wasm mecab.js

# serve the current directory on port 8094
# and navigate to:
# http://localhost:8094/mymecab.html
docker run -it --rm \
-p 8094:8043 \
-v "$PWD":/srv/http:ro,delegated \
--name static-web-server \
pierrezemb/gostatic

# or:
emrun --no_browser mymecab.html
```

Note: consider https://ja.osdn.net/projects/naist-jdic/ as a permissive relicense of ipadic.

initial
=16777216
16777216+51*1024*1024
=70254592
// 134217728 is known to work

# todo:
# minify

# todo: use lattice API insetad of parsing text
```
, 'mecab_model_new_lattice', '_mecab_lattice_clear', '_mecab_lattice_destroy', '_mecab_lattice_is_available', '_mecab_lattice_set_sentence', '_mecab_lattice_strerror', '_mecab_lattice_get_size', '_mecab_lattice_get_begin_nodes', '_mecab_lattice_next', '_mecab_lattice_tostr'
```