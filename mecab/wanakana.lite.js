(function(window) {
/**
Code extracted from WanaKana
https://github.com/wanikani/wanakana
http://wanakana.com/

The MIT License (MIT)

Copyright (c) 2013 WaniKani Community Github
*/

/**
 * Returns detailed type as string (instead of just 'object' for arrays etc)
 * @private
 * @param {any} value js value
 * @returns {String} type of value
 * @example
 * typeOf({}); // 'object'
 * typeOf([]); // 'array'
 * typeOf(function() {}); // 'function'
 * typeOf(/a/); // 'regexp'
 * typeOf(new Date()); // 'date'
 * typeOf(null); // 'null'
 * typeOf(undefined); // 'undefined'
 * typeOf('a'); // 'string'
 * typeOf(1); // 'number'
 * typeOf(true); // 'boolean'
 * typeOf(new Map()); // 'map'
 * typeOf(new Set()); // 'map'
 */
function typeOf(value) {
  if (value === null) {
    return 'null';
  }
  if (value !== Object(value)) {
    return typeof value;
  }
  return {}.toString
    .call(value)
    .slice(8, -1)
    .toLowerCase();
}

/**
 * Checks if input string is empty
 * @param  {String} input text input
 * @return {Boolean} true if no input
 */
function isEmpty(input) {
  if (typeOf(input) !== 'string') {
    return true;
  }
  return !input.length;
}

/**
 * Takes a character and a unicode range. Returns true if the char is in the range.
 * @param  {String}  char  unicode character
 * @param  {Number}  start unicode start range
 * @param  {Number}  end   unicode end range
 * @return {Boolean}
 */
function isCharInRange(char = '', start, end) {
  if (isEmpty(char)) return false;
  const code = char.charCodeAt(0);
  return start <= code && code <= end;
}

const HIRAGANA_START = 0x3041;
const HIRAGANA_END = 0x3096;
const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30fc;
const KANJI_START = 0x4e00;
const KANJI_END = 0x9faf;
const PROLONGED_SOUND_MARK = 0x30fc;
const KANA_SLASH_DOT = 0x30fb;
const ROMANIZATIONS = {
  HEPBURN: 'hepburn',
};

/**
 * Tests a character. Returns true if the character is a CJK ideograph (kanji).
 * @param  {String} char character string to test
 * @return {Boolean}
 */
function isCharKanji(char = '') {
  return isCharInRange(char, KANJI_START, KANJI_END);
}

/**
 * Tests a character. Returns true if the character is [Hiragana](https://en.wikipedia.org/wiki/Hiragana).
 * @param  {String} char character string to test
 * @return {Boolean}
 */
function isCharHiragana(char = '') {
  if (isEmpty(char)) return false;
  if (isCharLongDash(char)) return true;
  return isCharInRange(char, HIRAGANA_START, HIRAGANA_END);
}

/**
 * Tests a character. Returns true if the character is [Katakana](https://en.wikipedia.org/wiki/Katakana).
 * @param  {String} char character string to test
 * @return {Boolean}
 */
function isCharKatakana(char = '') {
  return isCharInRange(char, KATAKANA_START, KATAKANA_END);
}

/**
 * Returns true if char is 'ー'
 * @param  {String} char to test
 * @return {Boolean}
 */
function isCharLongDash(char = '') {
  if (isEmpty(char)) return false;
  return char.charCodeAt(0) === PROLONGED_SOUND_MARK;
}

/**
 * Tests if char is '・'
 * @param  {String} char
 * @return {Boolean} true if '・'
 */
function isCharSlashDot(char = '') {
  if (isEmpty(char)) return false;
  return char.charCodeAt(0) === KANA_SLASH_DOT;
}

/**
 * Test if `input` is [Katakana](https://en.wikipedia.org/wiki/Katakana)
 * @param  {String} [input=''] text
 * @return {Boolean} true if all [Katakana](https://en.wikipedia.org/wiki/Katakana)
 * @example
 * isKatakana('ゲーム')
 * // => true
 * isKatakana('あ')
 * // => false
 * isKatakana('A')
 * // => false
 * isKatakana('あア')
 * // => false
 */
function isKatakana(input = '') {
  if (isEmpty(input)) return false;
  return [...input].every(isCharKatakana);
}

/**
 * Default config for WanaKana, user passed options will be merged with these
 * @type {DefaultOptions}
 * @name defaultOptions
 * @property {Boolean} [useObsoleteKana=false] - Set to true to use obsolete characters, such as ゐ and ゑ.
 * @example
 * toHiragana('we', { useObsoleteKana: true })
 * // => 'ゑ'
 * @property {Boolean} [passRomaji=false] - Set to true to pass romaji when using mixed syllabaries with toKatakana() or toHiragana()
 * @example
 * toHiragana('only convert the katakana: ヒラガナ', { passRomaji: true })
 * // => "only convert the katakana: ひらがな"
 * @property {Boolean} [upcaseKatakana=false] - Set to true to convert katakana to uppercase using toRomaji()
 * @example
 * toRomaji('ひらがな カタカナ', { upcaseKatakana: true })
 * // => "hiragana KATAKANA"
 * @property {Boolean|String} [IMEMode=false] - Set to true, 'toHiragana', or 'toKatakana' to handle conversion while it is being typed.
 * @property {String} [romanization='hepburn'] - choose toRomaji() romanization map (currently only 'hepburn')
 * @property {Object} [customKanaMapping] - custom map will be merged with default conversion
 * @example
 * toKana('wanakana', { customKanaMapping: { na: 'に', ka: 'Bana' }) };
 * // => 'わにBanaに'
 * @property {Object} [customRomajiMapping] - custom map will be merged with default conversion
 * @example
 * toRomaji('つじぎり', { customRomajiMapping: { じ: 'zi', つ: 'tu', り: 'li' }) };
 * // => 'tuzigili'
 */
const DEFAULT_OPTIONS = {
  useObsoleteKana: false,
  passRomaji: false,
  upcaseKatakana: false,
  ignoreCase: false,
  IMEMode: false,
  romanization: ROMANIZATIONS.HEPBURN,
};

const mergeWithDefaultOptions = (opts = {}) => Object.assign({}, DEFAULT_OPTIONS, opts);

/**
 * Convert kana to romaji
 * @param  {String} kana text input
 * @param  {DefaultOptions} [options=defaultOptions]
 * @return {String} converted text
 * @example
 * toRomaji('ひらがな　カタカナ')
 * // => 'hiragana katakana'
 * toRomaji('げーむ　ゲーム')
 * // => 'ge-mu geemu'
 * toRomaji('ひらがな　カタカナ', { upcaseKatakana: true })
 * // => 'hiragana KATAKANA'
 * toRomaji('つじぎり', { customRomajiMapping: { じ: 'zi', つ: 'tu', り: 'li' } });
 * // => 'tuzigili'
 */
function toRomaji(input = '', options = {}) {
  const mergedOptions = mergeWithDefaultOptions(options);
  // just throw away the substring index information and just concatenate all the kana
  return splitIntoRomaji(input, mergedOptions)
    .map((romajiToken) => {
      const [start, end, romaji] = romajiToken;
      const makeUpperCase = options.upcaseKatakana && isKatakana(input.slice(start, end));
      return makeUpperCase ? romaji.toUpperCase() : romaji;
    })
    .join('');
}

let customMapping = null;
function splitIntoRomaji(input, options) {
  let map = getKanaToRomajiTree(options);

  if (options.customRomajiMapping) {
    if (customMapping == null) {
      customMapping = mergeCustomMapping(map, options.customRomajiMapping);
    }
    map = customMapping;
  }

  return applyMapping(katakanaToHiragana(input, toRomaji, true), map, !options.IMEMode);
}

// transform the tree, so that for example hepburnTree['ゔ']['ぁ'][''] === 'va'
// or kanaTree['k']['y']['a'][''] === 'きゃ'
function transform(tree) {
  return Object.entries(tree).reduce((map, [char, subtree]) => {
    const endOfBranch = typeOf(subtree) === 'string';
    map[char] = endOfBranch ? { '': subtree } : transform(subtree);
    return map;
  }, {});
}

function getSubTreeOf(tree, string) {
  return string.split('').reduce((correctSubTree, char) => {
    if (correctSubTree[char] === undefined) {
      correctSubTree[char] = {};
    }
    return correctSubTree[char];
  }, tree);
}

function applyMapping(string, mapping, convertEnding) {
  const root = mapping;

  function nextSubtree(tree, nextChar) {
    const subtree = tree[nextChar];
    if (subtree === undefined) {
      return undefined;
    }
    // if the next child node does not have a node value, set its node value to the input
    return Object.assign({ '': tree[''] + nextChar }, tree[nextChar]);
  }

  function newChunk(remaining, currentCursor) {
    // start parsing a new chunk
    const firstChar = remaining.charAt(0);

    return parse(
      Object.assign({ '': firstChar }, root[firstChar]),
      remaining.slice(1),
      currentCursor,
      currentCursor + 1
    );
  }

  function parse(tree, remaining, lastCursor, currentCursor) {
    if (!remaining) {
      if (convertEnding || Object.keys(tree).length === 1) {
        // nothing more to consume, just commit the last chunk and return it
        // so as to not have an empty element at the end of the result
        return tree[''] ? [[lastCursor, currentCursor, tree['']]] : [];
      }
      // if we don't want to convert the ending, because there are still possible continuations
      // return null as the final node value
      return [[lastCursor, currentCursor, null]];
    }

    if (Object.keys(tree).length === 1) {
      return [[lastCursor, currentCursor, tree['']]].concat(newChunk(remaining, currentCursor));
    }

    const subtree = nextSubtree(tree, remaining.charAt(0));

    if (subtree === undefined) {
      return [[lastCursor, currentCursor, tree['']]].concat(newChunk(remaining, currentCursor));
    }
    // continue current branch
    return parse(subtree, remaining.slice(1), lastCursor, currentCursor + 1);
  }

  return newChunk(string, 0);
}

function mergeCustomMapping(map, customMapping) {
  if (!customMapping) {
    return map;
  }
  return typeOf(customMapping) === 'function'
    ? customMapping(map)
    : createCustomMapping(customMapping)(map);
}


let kanaToHepburnMap = null;

/* eslint-disable */
// prettier-ignore
const BASIC_ROMAJI = {
  あ:'a',    い:'i',   う:'u',   え:'e',    お:'o',
  か:'ka',   き:'ki',  く:'ku',  け:'ke',   こ:'ko',
  さ:'sa',   し:'shi', す:'su',  せ:'se',   そ:'so',
  た:'ta',   ち:'chi', つ:'tsu', て:'te',   と:'to',
  な:'na',   に:'ni',  ぬ:'nu',  ね:'ne',   の:'no',
  は:'ha',   ひ:'hi',  ふ:'fu',  へ:'he',   ほ:'ho',
  ま:'ma',   み:'mi',  む:'mu',  め:'me',   も:'mo',
  ら:'ra',   り:'ri',  る:'ru',  れ:'re',   ろ:'ro',
  や:'ya',   ゆ:'yu',  よ:'yo',
  わ:'wa',   ゐ:'wi',  ゑ:'we',  を:'wo',
  ん: 'n',
  が:'ga',   ぎ:'gi',  ぐ:'gu',  げ:'ge',   ご:'go',
  ざ:'za',   じ:'ji',  ず:'zu',  ぜ:'ze',   ぞ:'zo',
  だ:'da',   ぢ:'ji',  づ:'zu',  で:'de',   ど:'do',
  ば:'ba',   び:'bi',  ぶ:'bu',  べ:'be',   ぼ:'bo',
  ぱ:'pa',   ぴ:'pi',  ぷ:'pu',  ぺ:'pe',   ぽ:'po',
  ゔぁ:'va', ゔぃ:'vi', ゔ:'vu',  ゔぇ:'ve', ゔぉ:'vo',
};
/* eslint-enable  */

const SPECIAL_SYMBOLS = {
  '。': '.',
  '、': ',',
  '：': ':',
  '・': '/',
  '！': '!',
  '？': '?',
  '〜': '~',
  'ー': '-',
  '「': '‘',
  '」': '’',
  '『': '“',
  '』': '”',
  '［': '[',
  '］': ']',
  '（': '(',
  '）': ')',
  '｛': '{',
  '｝': '}',
  '　': ' ',
};

// んい -> n'i
const AMBIGUOUS_VOWELS = ['あ', 'い', 'う', 'え', 'お', 'や', 'ゆ', 'よ'];
const SMALL_Y = { ゃ: 'ya', ゅ: 'yu', ょ: 'yo' };
const SMALL_Y_EXTRA = { ぃ: 'yi', ぇ: 'ye' };
const SMALL_AIUEO = {
  ぁ: 'a',
  ぃ: 'i',
  ぅ: 'u',
  ぇ: 'e',
  ぉ: 'o',
};
const YOON_KANA = ['き', 'に', 'ひ', 'み', 'り', 'ぎ', 'び', 'ぴ', 'ゔ', 'く', 'ふ'];
const YOON_EXCEPTIONS = {
  し: 'sh',
  ち: 'ch',
  じ: 'j',
  ぢ: 'j',
};
const SMALL_KANA = {
  っ: '',
  ゃ: 'ya',
  ゅ: 'yu',
  ょ: 'yo',
  ぁ: 'a',
  ぃ: 'i',
  ぅ: 'u',
  ぇ: 'e',
  ぉ: 'o',
};

// going with the intuitive (yet incorrect) solution where っや -> yya and っぃ -> ii
// in other words, just assume the sokuon could have been applied to anything
const SOKUON_WHITELIST = {
  b: 'b',
  c: 't',
  d: 'd',
  f: 'f',
  g: 'g',
  h: 'h',
  j: 'j',
  k: 'k',
  m: 'm',
  p: 'p',
  q: 'q',
  r: 'r',
  s: 's',
  t: 't',
  v: 'v',
  w: 'w',
  x: 'x',
  z: 'z',
};

function getKanaToHepburnTree() {
  if (kanaToHepburnMap == null) {
    kanaToHepburnMap = createKanaToHepburnMap();
  }
  return kanaToHepburnMap;
}

function getKanaToRomajiTree(fullOptions) {
  switch (fullOptions.romanization) {
    case ROMANIZATIONS.HEPBURN:
      return getKanaToHepburnTree(fullOptions);
    default:
      return {};
  }
}

function createKanaToHepburnMap() {
  const romajiTree = transform(BASIC_ROMAJI);

  const subtreeOf = (string) => getSubTreeOf(romajiTree, string);
  const setTrans = (string, transliteration) => {
    subtreeOf(string)[''] = transliteration;
  };

  Object.entries(SPECIAL_SYMBOLS).forEach(([jsymbol, symbol]) => {
    subtreeOf(jsymbol)[''] = symbol;
  });

  [...Object.entries(SMALL_Y), ...Object.entries(SMALL_AIUEO)].forEach(([roma, kana]) => {
    setTrans(roma, kana);
  });

  // きゃ -> kya
  YOON_KANA.forEach((kana) => {
    const firstRomajiChar = subtreeOf(kana)[''][0];
    Object.entries(SMALL_Y).forEach(([yKana, yRoma]) => {
      setTrans(kana + yKana, firstRomajiChar + yRoma);
    });
    // きぃ -> kyi
    Object.entries(SMALL_Y_EXTRA).forEach(([yKana, yRoma]) => {
      setTrans(kana + yKana, firstRomajiChar + yRoma);
    });
  });

  Object.entries(YOON_EXCEPTIONS).forEach(([kana, roma]) => {
    // じゃ -> ja
    Object.entries(SMALL_Y).forEach(([yKana, yRoma]) => {
      setTrans(kana + yKana, roma + yRoma[1]);
    });
    // じぃ -> jyi, じぇ -> je
    setTrans(`${kana}ぃ`, `${roma}yi`);
    setTrans(`${kana}ぇ`, `${roma}e`);
  });

  romajiTree['っ'] = resolveTsu(romajiTree);

  Object.entries(SMALL_KANA).forEach(([kana, roma]) => {
    setTrans(kana, roma);
  });

  AMBIGUOUS_VOWELS.forEach((kana) => {
    setTrans(`ん${kana}`, `n'${subtreeOf(kana)['']}`);
  });

  // NOTE: could be re-enabled with an option?
  // // んば -> mbo
  // const LABIAL = [
  //   'ば', 'び', 'ぶ', 'べ', 'ぼ',
  //   'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ',
  //   'ま', 'み', 'む', 'め', 'も',
  // ];
  // LABIAL.forEach((kana) => {
  //   setTrans(`ん${kana}`, `m${subtreeOf(kana)['']}`);
  // });

  return Object.freeze(JSON.parse(JSON.stringify(romajiTree)));
}

function resolveTsu(tree) {
  return Object.entries(tree).reduce((tsuTree, [key, value]) => {
    if (!key) {
      // we have reached the bottom of this branch
      const consonant = value.charAt(0);
      tsuTree[key] = Object.keys(SOKUON_WHITELIST).includes(consonant)
        ? SOKUON_WHITELIST[consonant] + value
        : value;
    } else {
      // more subtrees
      tsuTree[key] = resolveTsu(value);
    }
    return tsuTree;
  }, {});
}


//--------

const isCharInitialLongDash = (char, index) => isCharLongDash(char) && index < 1;
const isCharInnerLongDash = (char, index) => isCharLongDash(char) && index > 0;
const isKanaAsSymbol = (char) => ['ヶ', 'ヵ'].includes(char);
const LONG_VOWELS = {
  a: 'あ',
  i: 'い',
  u: 'う',
  e: 'え',
  o: 'う',
};

// inject toRomaji to avoid circular dependency between toRomaji <-> katakanaToHiragana
function katakanaToHiragana(input = '', toRomaji, isDestinationRomaji) {
  let previousKana = '';

  return input
    .split('')
    .reduce((hira, char, index) => {
      // Short circuit to avoid incorrect codeshift for 'ー' and '・'
      if (isCharSlashDot(char) || isCharInitialLongDash(char, index) || isKanaAsSymbol(char)) {
        return hira.concat(char);
        // Transform long vowels: 'オー' to 'おう'
      } else if (previousKana && isCharInnerLongDash(char, index)) {
        // Transform previousKana back to romaji, and slice off the vowel
        const romaji = toRomaji(previousKana).slice(-1);
        // However, ensure 'オー' => 'おお' => 'oo' if this is a transform on the way to romaji
        if (isCharKatakana(input[index - 1]) && romaji === 'o' && isDestinationRomaji) {
          return hira.concat('お');
        }
        return hira.concat(LONG_VOWELS[romaji]);
      } else if (!isCharLongDash(char) && isCharKatakana(char)) {
        // Shift charcode.
        const code = char.charCodeAt(0) + (HIRAGANA_START - KATAKANA_START);
        const hiraChar = String.fromCharCode(code);
        previousKana = hiraChar;
        return hira.concat(hiraChar);
      }
      // Pass non katakana chars through
      previousKana = '';
      return hira.concat(char);
    }, [])
    .join('');
}

Object.assign(window, {
  katakanaToHiragana,
  isCharHiragana,
  isCharKanji,
  toRomaji,
});

})(window);