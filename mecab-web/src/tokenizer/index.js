import { tokenize, toHiragana } from '../../web_modules/wanakana.js';
import { parseKanjidic2Entry } from '../kanjidic2/index.js';

function getCaptureGroup(
  kanjidic2Lookup,
  kanji,
  isName,
  tokenIsEntirelyKanji,
  precedingSubtoken,
  followingSubtoken) {
  const entry = kanjidic2Lookup(kanji);
  if (!entry) {
    return '(.*)';
  }
  const parsed = parseKanjidic2Entry(entry);
  const onReadingsInHiragana = parsed.ons.map(toHiragana);
  const kunsWithCompatibleOkurigana = parsed.kuns.filter(kun =>
    !kun.okurigana
    || (followingSubtoken && followingSubtoken.type === 'hiragana' && followingSubtoken.value === kun.okurigana))
  const prefixKunReadings = kunsWithCompatibleOkurigana.filter(kun => kun.isPrefix);
  const suffixKunReadings = kunsWithCompatibleOkurigana.filter(kun => kun.isSuffix);
  const infixKunReadings = kunsWithCompatibleOkurigana.filter(kun => !kun.isPrefix && !kun.isSuffix);
  const getKunReading = (kun) => kun.reading;
  const candidates = new Set([]);
  const candidatesByLength = new Map([]);

  if (isName) {
    parsed.nanoris.forEach(candidate => candidatesByLength.set(candidate.split('').length, [...(candidatesByLength.get(candidate.split('').length)||[]), candidate]));
  } else {
    if (tokenIsEntirelyKanji) {
      onReadingsInHiragana.forEach(candidate => candidatesByLength.set(candidate.split('').length, [...(candidatesByLength.get(candidate.split('').length)||[]), candidate]));
    }

    if (['kanji', 'hiragana', 'katakana'].includes(followingSubtoken && followingSubtoken.type)) {
      prefixKunReadings.map(getKunReading).forEach(candidate => candidatesByLength.set(candidate.split('').length, [...(candidatesByLength.get(candidate.split('').length)||[]), candidate]));
    }
    if (['kanji', 'hiragana', 'katakana'].includes(precedingSubtoken && precedingSubtoken.type)) {
      suffixKunReadings.map(getKunReading).forEach(candidate => candidatesByLength.set(candidate.split('').length, [...(candidatesByLength.get(candidate.split('').length)||[]), candidate]));
    }

    infixKunReadings.map(getKunReading).forEach(candidate => candidatesByLength.set(candidate.split('').length, [...(candidatesByLength.get(candidate.split('').length)||[]), candidate]));

    if (!tokenIsEntirelyKanji) {
      onReadingsInHiragana.forEach(candidate => candidatesByLength.set(candidate.split('').length, [...(candidatesByLength.get(candidate.split('').length)||[]), candidate]));
    }
    // last-resort, happens to be a way to get the いっ reading for 一
    parsed.nanoris.forEach(candidate => candidatesByLength.set(candidate.split('').length, [...(candidatesByLength.get(candidate.split('').length)||[]), candidate]));
  }

  [...candidatesByLength.keys()]
  .sort((a, b) => b-a)
  .forEach(key => [...candidatesByLength.get(key)]
    .forEach(candidates.add, candidates));
  // even last-er resort
  candidates.add('.*');
  
  return `(${[...candidates].join('|')})`;
}
function makeRegex(kanjidic2Lookup, subtokens, isName) {
  const tokenIsEntirelyKanji = subtokens.reduce((accumulator, currentSubtoken) => 
    accumulator && currentSubtoken.type === 'kanji',
    true /* vacuous truth */);
  return subtokens.reduce((accumulator, currentSubtoken, subtokenIx, subtokenArr) => {
    const prevSubtoken = subtokenIx-1 >= 0
    ? subtokenArr[subtokenIx-1]
    : undefined;
    const nextSubtoken = subtokenIx+1 < subtokenArr.length
    ? subtokenArr[subtokenIx+1]
    : undefined;
    if (currentSubtoken.type === 'kanji') {
      return accumulator + currentSubtoken.value.split('')
      .reduce((patternAcc, currentKanji, kanjiIx, kanjiArr) => {
        const [kanjiBehind, kanjiAhead] = [
        kanjiArr.slice(0, kanjiIx).join(),
        kanjiArr.slice(kanjiIx+1).join(),
        ];

        let precedingSubtoken;
        if (kanjiBehind) {
          precedingSubtoken = {
            type: 'kanji',
            value: kanjiBehind,
          };
        } else {
          precedingSubtoken = prevSubtoken;
        }

        let followingSubtoken;
        if (kanjiAhead) {
          followingSubtoken = {
            type: 'kanji',
            value: kanjiBehind,
          };
        } else {
          followingSubtoken = nextSubtoken;
        }
        return patternAcc + getCaptureGroup(
          kanjidic2Lookup,
          currentKanji,
          isName,
          tokenIsEntirelyKanji,
          precedingSubtoken,
          followingSubtoken);
      }, '');
    }
    return accumulator + currentSubtoken.value;
  }, '^') + '$';
}
function toSubtokensWithKanjiReadings(kanjidic2Lookup, token, readingHiragana, isName) {
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
  const regExStr = makeRegex(kanjidic2Lookup, subtokens, isName);

  const regEx = new RegExp(regExStr);
  const matches = regEx.exec(readingHiragana);
  if (!matches) {
    console.error(`We were unable to match the hiragana reading '${readingHiragana}' to token '${token}'. We used RegExp /${regExStr}/.`);
    return subtokens;
  }

  return {
    regex: regExStr,
    reduced: subtokens.reduce((accumulator, currentSubtoken) => {
      const { chunks, kanjiReadings } = accumulator;
      if (currentSubtoken.type === 'kanji') {
        const kanjiReduced = currentSubtoken.value.split('')
        .reduce((kanjiAcc, currentKanji) => {
          const { chunks, kanjiReadings } = kanjiAcc;
          if (!kanjiReadings.length
            || (!kanjiReadings[0] && chunks.length)) {
            return {
              chunks: [
              ...chunks.slice(0, chunks.length-1),
              {
                ...chunks[chunks.length-1],
                value: chunks[chunks.length-1].value + currentKanji,
              },
              ],
              kanjiReadings: kanjiReadings.slice(1),
            }
          }
          return {
            chunks: [
              ...chunks,
              {
                type: 'kanji',
                value: currentKanji,
                reading: kanjiReadings[0],
              },
            ],
            kanjiReadings: kanjiReadings.slice(1),
          };
        }, {
          chunks: [],
          kanjiReadings,
        });

        return {
          chunks: [
            ...chunks,
            ...kanjiReduced.chunks,
          ],
          kanjiReadings: kanjiReduced.kanjiReadings,
        };
      }
      return {
        chunks: [
          ...chunks,
          currentSubtoken,
        ],
        kanjiReadings,
      };
    }, {
      chunks: [],
      kanjiReadings: matches.slice(1),
    }).chunks,
  }.reduced;
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

function toMecabTokens(kanjidic2Lookup, mecabOutput) {
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
    const subtokens = toSubtokensWithKanjiReadings(
      kanjidic2Lookup,
      token,
      readingHiragana
      );
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