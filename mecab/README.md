# Mecab WebAssembly

This is an attempt to compile mecab to WebAssembly, using Emscripten.  
Will [fasiha's mecab-emscripten](https://github.com/fasiha/mecab-emscripten), which targeted JS.

That project was from 2014. I'm hoping to explore whether the flags can be made simpler now, and whether we can target WASM instead of JS.


```bash
git clone https://github.com/Birch-san/mecab.git
cd mecab/mecab-ipadic
./configure --with-charset=utf8 && make && sudo make install

cd mecab/mecab
mkdir -p ipadic
# copy dictionary
cp /usr/local/lib/mecab/dic/ipadic/**/* ipadic
emconfigure ./configure --with-charset=utf8 && emmake make
cp src/.libs/mecab src/.libs/mecab.bc
# # works, but choice of TOTAL_MEMORY was super arbitrary
# em++ src/.libs/mecab.bc src/.libs/libmecab.dylib -o mecab.html -s EXPORTED_FUNCTIONS="['_mecab_do2']" -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap", "intArrayFromString"]' -s TOTAL_MEMORY=134217728 --preload-file ipadic/
em++ src/.libs/mecab.bc src/.libs/libmecab.dylib -o mecab.html -s EXPORTED_FUNCTIONS="['_mecab_do2']" -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap", "intArrayFromString"]' --no-heap-copy -s ALLOW_MEMORY_GROWTH=1 --preload-file ipadic/


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