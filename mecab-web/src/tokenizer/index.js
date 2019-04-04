import { tokenize, toHiragana } from '../../web_modules/wanakana.js';
import { parseKanjidic2Entry } from '../kanjidic2/index.js';

export class FuriganaFitter {
  constructor({
    kanjidic2,
    wanakana: { tokenize },
  }) {
    this.kanjidic2 = kanjidic2;
    this.tokenize = tokenize;
  }

  _getCaptureGroup(
    kanji,
    isName,
    tokenIsEntirelyKanji,
    precedingSubtoken,
    followingSubtoken) {
    const entry = this.kanjidic2.lookup(kanji);
    if (!entry) {
      return '(.*)';
    }
    const parsed = this.kanjidic2.parse(entry);
    const onReadingsInHiragana = parsed.ons.map(toHiragana);
    const kunsWithCompatibleOkurigana = parsed.kuns.filter(kun =>
      !kun.okurigana
      || (followingSubtoken && followingSubtoken.type === 'hiragana' && followingSubtoken.value === kun.okurigana))
    const prefixKunReadings = kunsWithCompatibleOkurigana.filter(kun => kun.isPrefix);
    const suffixKunReadings = kunsWithCompatibleOkurigana.filter(kun => kun.isSuffix);
    const infixKunReadings = kunsWithCompatibleOkurigana.filter(kun => !kun.isPrefix && !kun.isSuffix);
    const getKunReading = kun => kun.reading;
    const candidates = new Set([]);
    const candidatesByLength = new Map([]);

    const addToMultimap = candidate => {
      const numberOfCodepoints = candidate.split('').length;
      const candidatesWithSameCodepoints = candidatesByLength.get(numberOfCodepoints) || [];
      return candidatesByLength.set(
        numberOfCodepoints,
        [...candidatesWithSameCodepoints, this.escapeRegExp(candidate)])
    };

    if (isName) {
      parsed.nanoris.forEach(addToMultimap);
    }
    if (!isName && tokenIsEntirelyKanji) {
      onReadingsInHiragana.forEach(addToMultimap);
    }

    if (['kanji', 'hiragana', 'katakana'].includes(followingSubtoken && followingSubtoken.type)) {
      prefixKunReadings.map(getKunReading).forEach(addToMultimap);
    }
    if (['kanji', 'hiragana', 'katakana'].includes(precedingSubtoken && precedingSubtoken.type)) {
      suffixKunReadings.map(getKunReading).forEach(addToMultimap);
    }

    infixKunReadings.map(getKunReading).forEach(addToMultimap);

    if (isName || !tokenIsEntirelyKanji) {
      onReadingsInHiragana.forEach(addToMultimap);
    }
    if (!isName) {
      // last-resort, happens to be a way to get the いっ reading for 一
      parsed.nanoris.forEach(addToMultimap);
    }

    [...candidatesByLength.keys()]
    .sort((a, b) => b-a)
    .forEach(key =>
      [...candidatesByLength.get(key)]
      .forEach(candidates.add, candidates));

    // even last-er resort
    candidates.add('.*');

    const pipeDelimited = [...candidates].join('|');
    
    return `(${pipeDelimited})`;
  }

  _makeRegex(subtokens, isName) {
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
          return patternAcc + this._getCaptureGroup(
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

  _fitReadingToRegex(
    token,
    readingHiragana,
    subtokens,
    regExStr,
    isName
    ) {
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
    };
  }

  fitFurigana(token, readingHiragana, isName) {
    const subtokens = this.tokenize(token, { detailed: true });
    // if there's no kanji, then there's nothing to fit furigana to
    // and if there's anything other than kanji+hiragana, then our "strip okurigana" tactic won't work.
    if (!subtokens.some((subtoken) => ['kanji'].includes(subtoken.type))
      || subtokens.some((subtoken) => !['kanji', 'hiragana'].includes(subtoken.type))) {
      // console.error(`token ${token} has non-kanji or non-hiragana subtokens.`);
      // we're only interested in fitting a hiragana reading to kanji words that (may) have okurigana.
      // we're not interested in fitting our hiragana reading to a katakana or English word, for example.
      return subtokens;
    }
    const regExStr = this._makeRegex(
      subtokens,
      isName);

    return this._fitReadingToRegex(
      token,
      readingHiragana,
      subtokens,
      regExStr,
      isName
      ).reduced;
  }
}

export class Mecab {
  constructor({
    callbacks: {
      mecab_sparse_tostr
    },
    structures: {
      tagger,
    },
  }) {
    this.mecab_sparse_tostr = mecab_sparse_tostr;
    this.tagger = tagger;
  }

  query(sentence) {
    return this.mecab_sparse_tostr(this.tagger, sentence);
  }
}

export class MecabOutputParser {
  constructor({
    config = {
      endOfSentence = 'EOS\n',
    },
    escapeRegExp,
  }) {
    this.endOfSentence = endOfSentence;
    this.escapeRegExp = escapeRegExp;
  }

  parse(mecabOutput) {
    const mecabTokens = this._toMecabTokens(mecabOutput);
    return mecabTokens;
  }

  /** Decide our preference / fallback */
  getRecommendedSearchTerm(mecabToken) {
    const { token, readingHiragana, dictionaryForm } = mecabToken;
    return dictionaryForm || token;
  }

  _toMecabTokens(mecabOutput) {
    return mecabOutput.replace(
      new RegExp(`${
        this.escapeRegExp(
          this.endOfSentence)}$`),
      '')
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
        pronunication,
        isWhitespace: false,
      }
    });
  }
}

export class MecabWhitespaceInterposer {
  withWhitespacesSplicedBackIn(mecabTokens, sentence) {
    const whitespaces = this._locateWhitespaces(sentence)
    const plusOriginalWhitespaces = this._withWhitespacesSplicedBackIn(mecabTokens, whitespaces);
    const plusInterWordWhitespaces = this._withInterWordWhitespaces(plusOriginalWhitespaces);
    return plusInterWordWhitespaces;
  }

  _locateWhitespaces(sentence) {
    const whitespaces = [];
    const r = new RegExp('[\\s　]+', 'g');
    let match;
    while(match = r.exec(sentence)) {
      /*
      0: ' ',
      index: 27,
      */
      whitespaces.push(match);
    }
    return whitespaces;
  }

  _withWhitespacesSplicedBackIn(mecabTokens, whitespaces) {
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

  _withInterWordWhitespaces(mecabTokens) {
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
}

export class MecabTokenEnricher {
  constructor({
    wanakana: { toHiragana },
    furiganaFitter,
  }) {
    this.toHiragana = toHiragana;
    this.furiganaFitter = furiganaFitter;
  }

  _getHiraganaReading(mecabToken) {
    return this.toHiragana(mecabToken.reading, { passRomaji: false });
  }

  _getSubtokens(readingHiragana, { token, partOfSpeech }) {
    return this.furiganaFitter.fitFurigana(
      token,
      readingHiragana,
      partOfSpeech === '固有名詞' // if proper noun, treat as name
      );
  }

  _getImprovedToken(mecabToken) {
    const readingHiragana = this.toHiragana(mecabToken.reading, { passRomaji: false });
    return {
      ...mecabToken,
      readingHiragana,
      subtokens: this._getSubtokens(readingHiragana, mecabToken),
    };
  }

  getEnriched(mecabTokens) {
    const improvedTokens = mecabTokens.map(mecabToken => this._addHiraganaReading(mecabToken));
    return improvedTokens;
  }
}

export class MecabPipeline {
  constructor({
    mecab,
    mecabOutputParser,
    tokenEnricher,
    whitespaceInterposer,
  }) {
    this.mecabOutputParser = mecabOutputParser;
    this.tokenEnricher = tokenEnricher;
    this.whitespaceInterposer = whitespaceInterposer;
  }

  tokenize(sentence) {
    const mecabOutput = this.mecab.query(sentence)
    const nominalTokens = this.mecabOutputParser.parse(mecabOutput);
    const enrichedTokens = this.tokenEnricher.getEnriched(nominalTokens);
    const withWhitespace = this.whitespaceInterposer.withWhitespacesSplicedBackIn(enrichedTokens, sentence);
    return withWhitespace;
  }
}

// export class Tokenizer {
//   constructor({
//     dictionaries,
//     mecab,
//   }) {
//     this.dictionaries = dictionaries;
//     this.mecab = mecab;
//   }

//   tokenize(sentence) {

//   }
// }

// export {
//   toSubtokensWithKanjiReadings,
//   withWhitespacesSplicedBackIn,
//   withInterWordWhitespaces,
//   toMecabTokens,
// }