import { tokenize, toHiragana } from '../../web_modules/wanakana.js';

/**
input:
('取り引き', 'とりひき')
output:
[
  {type: 'kanji', value: '取', reading: 'と''},
  {type: 'hiragana', value: 'り'},
  {type: 'kanji', value: '引', reading: 'ひ'},
  {type: 'hiragana', value: 'き'},
]
*/
function toSubtokensWithKanjiReadings(token, readingHiragana) {
  const subtokens = tokenize(token, { detailed: true });
  // if there's no kanji, then there's nothing to fit furigana to
  // and if there's anything other than kanji+hiragana, then our "strip okurigana" tactic won't work.
  if (!subtokens.some((subtoken) => ['kanji'].includes(subtoken.type))
    || subtokens.some((subtoken) => !['kanji', 'hiragana'].includes(subtoken.type))) {
    // console.error(`token ${token} has non-kanji or non-hiragana subtokens.`);
    // we're only interested in fitting a hiragana reading to kanji words that (may) have okurigana.
    // we're not interested in fitting our hiragana reading to a katakana or English word, for example.
    return subtokens;
  }
  const regExStr = subtokens.reduce((accumulator, currentSubtoken) => {
    if (currentSubtoken.type === 'kanji') {
      return accumulator + '(.+)';
    }
    return accumulator + currentSubtoken.value;
  }, '^') + '$';

  const regEx = new RegExp(regExStr);
  const matches = regEx.exec(readingHiragana);
  if (!matches) {
    console.error(`We were unable to match the hiragana reading '${readingHiragana}' to token '${token}'. We used RegExp /${regExStr}/.`);
    return subtokens;
  }

  return subtokens.reduce((accumulator, currentSubtoken) => {
    const [chunks, kanjiReadings] = accumulator;
    if (currentSubtoken.type === 'kanji') {
      return [
        [
          ...chunks,
          {
            ...currentSubtoken,
            reading: kanjiReadings[0],
          },
        ],
        kanjiReadings.slice(1)
      ];
    }
    return [
      [
        ...chunks,
        currentSubtoken,
      ],
      kanjiReadings,
    ];
  }, [[], matches.slice(1)])[0];
}

function splitAtIndices(str, indices) {
  return [...indices, str.length].reduce((accumulator, splitIx) => {
    const [remainingStr, startIx, splits] = accumulator;
    return [
      remainingStr.substring(splitIx-startIx),
      splitIx,
      [...splits, remainingStr.substring(0, splitIx-startIx)],
    ]
  }, [str, 0, []])[2];
}

function withWhitespacesSplicedBackIn(mecabTokens, whitespaces) {
  return mecabTokens.reduce((accumulator, currentToken) => {
    const [tokens, remainingWhitespaces, sentenceIx] = accumulator;
    const currentSentenceIx = sentenceIx + currentToken.token.length;
    if (remainingWhitespaces.length
      && remainingWhitespaces[0].index === currentSentenceIx) {
      const whitespaceObj = remainingWhitespaces[0];
      const whitespaceToken = whitespaceObj[0];
      return [
        [
          ...tokens,
          currentToken,
          {
            token: whitespaceToken,
            isWhitespace: true,
            subtokens: [
              {
                type: 'whitespace',
                value: whitespaceToken,
              },
            ],
          },
        ],
        remainingWhitespaces.slice(1),
        currentSentenceIx
        + whitespaceToken.length,
      ];
    }
    return [
      [
        ...tokens,
        currentToken,
      ],
      remainingWhitespaces,
      currentSentenceIx,
    ];
  }, [[], whitespaces, 0])[0];
}

function withInterWordWhitespaces(mecabTokens) {
  return mecabTokens.reduce((accumulator, currentToken) => {
    const [tokens, prevToken] = accumulator;
    if (!prevToken
      || !prevToken.subtokens.length
      || !currentToken.subtokens.length) {
      return [[...tokens, currentToken], currentToken];
    }
    const [leftOfBoundary, rightOfBoundary] = [
      prevToken.subtokens[prevToken.subtokens.length-1],
      currentToken.subtokens[0],
    ];
    if (!(['englishPunctuation', 'japanesePunctuation', 'whitespace']
        .includes(leftOfBoundary.type))
      && !(['englishPunctuation', 'japanesePunctuation', 'whitespace']
        .includes(rightOfBoundary.type))) {
      return [
        [
          ...tokens,
          {
            isWhitespace: true,
            token: ' ',
            subtokens: [
              {
                type: 'whitespace',
                value: ' ',
              },
            ],
          },
          currentToken,
        ],
        currentToken,
      ];
    }
    return [[...tokens, currentToken], currentToken];
  }, [[], undefined])[0];
}

function toMecabTokens(mecabOutput) {
  return mecabOutput.replace(/EOS\n$/, '')
  .split('\n')
  .filter(x => x)
  .map((line) => {
    const [token, featureStr] = line.split('\t');
    const features = featureStr.split(',');
    // MeCab seems to have a non-guaranteed schema
    while (features.length <= 9) {
      features.push('');
    }
    const [
    surfaceLayerForm, // 表層形
    partOfSpeech, // 品詞
    partOfSpeechSubcategory1, // 品詞細分類1
    partOfSpeechSubcategory2, // 品詞細分類2
    partOfSpeechSubcategory3, // 品詞細分類3
    utilizationType, // 活用型
    dictionaryForm, // 活用形
    originalForm, // 原形
    reading, // 読み
    pronunication, // 発音
    ] = features;
    const readingHiragana = toHiragana(reading, { passRomaji: false });
    const subtokens = toSubtokensWithKanjiReadings(token, readingHiragana);
    // console.warn(subtokens);
    return {
      token,
      surfaceLayerForm,
      partOfSpeech,
      partOfSpeechSubcategory1,
      partOfSpeechSubcategory2,
      partOfSpeechSubcategory3,
      utilizationType,
      dictionaryForm,
      originalForm,
      reading,
      readingHiragana,
      subtokens,
      pronunication,
      isWhitespace: false,
    }
  });
}

export {
  toSubtokensWithKanjiReadings,
  splitAtIndices,
  withWhitespacesSplicedBackIn,
  withInterWordWhitespaces,
  toMecabTokens,
}