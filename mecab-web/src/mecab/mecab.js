export class MecabContext {
  constructor({
    callbacks: {
      mecab_sparse_tostr,

      mecab_model_new2,
      mecab_model_new_tagger,

      mecab_destroy,
      mecab_model_destroy,
    },
  }) {
    this._callbacks = {
      mecab_sparse_tostr,

      mecab_model_new2,
      mecab_model_new_tagger,

      mecab_destroy,
      mecab_model_destroy,
    };
    this._managed = new Set();
  }

  free() {
    this._managed.forEach((mecab) => {
      mecab.free();
    });
  }

  construct({
    config: {
      endOfSentence = 'EOS\n',
    },
  }) {
    // const args = document.getElementById('args').value;
    // const args = '-o output.txt input.txt';
    const args = '';
    const p_mecab_model = this._callbacks.mecab_model_new2(args);
    const p_tagger = this._callbacks.mecab_model_new_tagger(p_mecab_model);

    return new Mecab({
      config: {
        endOfSentence,
      },
      query: (sentence) => {
        return this._callbacks.mecab_sparse_tostr(p_tagger, sentence);
      },
      free: () => {
        this._callbacks.mecab_destroy(p_tagger);
        this._callbacks.mecab_model_destroy(p_mecab_model);
      },
    });
  }
}

export class Mecab {
  constructor({
    config,
    query,
    free,
  }) {
    this._config = config;
    this._query = query;
    this._free = free;
    this._freed = false;
  }

  query(sentence) {
    if (this._freed) {
      throw new Error('Cannot attempt query after freeing MeCab instance.');
    }
    return this._query(sentence);
  }

  free() {
    if (this._freed) {
      throw new Error('Cannot attempt free after freeing MeCab instance.');
    }
    return this._free();
  }

  get config() {
    return this._config;
  }
}