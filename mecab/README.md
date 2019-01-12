# Mecab WebAssembly

This is an attempt to compile mecab to WebAssembly, using Emscripten.  
Will [fasiha's mecab-emscripten](https://github.com/fasiha/mecab-emscripten), which targeted JS.

That project was from 2014. I'm hoping to explore whether the flags can be made simpler now, and whether we can target WASM instead of JS.

```bash
git clone https://github.com/Birch-san/mecab.git
cd mecab/mecab
emconfigure ./configure --with-charset=utf8
emmake make
cp src/.libs/mecab src/.libs/mecab.bc
em++ src/.libs/mecab.bc src/.libs/libmecab.dylib -o mecab.html -s EXPORTED_FUNCTIONS="['_mecab_do2']"
```