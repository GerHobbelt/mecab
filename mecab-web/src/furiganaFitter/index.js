export class FuriganaFitter {
  constructor({
    kanjidic2,
    wanakana: { tokenize, toHiragana, },
    escapeRegExp,
  }) {
    this._kanjidic2 = kanjidic2;
    this._wanakana = { tokenize, toHiragana, };
    this._escapeRegExp = escapeRegExp;
  }

  _getCaptureGroup(
    kanji,
    isName,
    tokenIsEntirelyKanji,
    precedingSubtoken,
    followingSubtoken) {
    const parsed = this._kanjidic2.lookup(kanji);
    if (!parsed) {
      return '(.*)';
    }
    const onReadingsInHiragana = parsed.ons.map(this._wanakana.toHiragana);
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
        [...candidatesWithSameCodepoints, this._escapeRegExp(candidate)])
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
    surfaceLayerForm,
    readingHiragana,
    subtokens,
    regExStr,
    isName
    ) {
    const regEx = new RegExp(regExStr);

    const matches = regEx.exec(readingHiragana);
    if (!matches) {
      console.error(`We were unable to match the hiragana reading '${readingHiragana}' to surfaceLayerForm '${surfaceLayerForm}'. We used RegExp /${regExStr}/.`);
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

  fitFurigana(surfaceLayerForm, readingHiragana, isName) {
    const subtokens = this._wanakana.tokenize(surfaceLayerForm, { detailed: true });
    // if there's no kanji, then there's nothing to fit furigana to
    // and if there's anything other than kanji+hiragana, then our "strip okurigana" tactic won't work.
    if (!subtokens.some((subtoken) => ['kanji'].includes(subtoken.type))
      || subtokens.some((subtoken) => !['kanji', 'hiragana'].includes(subtoken.type))) {
      // console.error(`surfaceLayerForm ${surfaceLayerForm} has non-kanji or non-hiragana subtokens.`);
      // we're only interested in fitting a hiragana reading to kanji words that (may) have okurigana.
      // we're not interested in fitting our hiragana reading to a katakana or English word, for example.
      return subtokens;
    }
    if (surfaceLayerForm === readingHiragana) {
      return subtokens;
    }
    const regExStr = this._makeRegex(
      subtokens,
      isName);

    return this._fitReadingToRegex(
      surfaceLayerForm,
      readingHiragana,
      subtokens,
      regExStr,
      isName
      ).reduced;
  }
}