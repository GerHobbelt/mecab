/**
I ended up not needing this in the end, but it does a cool thing:
input:
'取り引き'
output:
[
  [
    {type: 'kanji', value: '取'},
    {type: 'hiragana', value: 'り'},
  ],
  [
    {type: 'kanji', value: '引'},
    {type: 'hiragana', value: 'き'},
  ],
]
*/
function chunkByKanji(token) {
  return wanakana.tokenize(token, { detailed: true })
  .reduce((accumulator, currentValue)=> {
    if (!accumulator.length) {
      return [[currentValue]];
    }
    if (currentValue.type === 'kanji') {
      // start a new segment
      return [...accumulator, [currentValue]];
    }
    // insert our token into latest segment
    return [
    ...accumulator.slice(0, accumulator.length-1),
    [...accumulator[accumulator.length-1], currentValue],
    ];
  },[]);
}

/**
I ended up not needing this in the end, but it does a cool thing:
input:
('取り引き', 'とりひき')
output:
[
  [
    {type: 'kanji', value: '取', reading: 'と''},
    {type: 'hiragana', value: 'り'},
  ],
  [
    {type: 'kanji', value: '引', reading: 'ひ'},
    {type: 'hiragana', value: 'き'},
  ],
]
*/
function withReadingsByKanjiChunk(token, readingHiragana) {
  const subtokens = wanakana.tokenize(token, { detailed: true });
  const regExStr = subtokens.reduce((accumulator, currentSubtoken) => {
    if (currentSubtoken.type === 'kanji') {
      return accumulator + '(.+)';
    }
    return accumulator + currentSubtoken.value;
  }, '^') + '$';

  const regEx = new RegExp(regExStr);
  const matches = regEx.exec(readingHiragana);

  return subtokens.reduce((accumulator, currentSubtoken) => {
    const [chunks, kanjiReadings] = accumulator;
    if (currentSubtoken.type === 'kanji') {
      // start a new chunk
      return [
        [
          ...chunks,
          [{
            ...currentSubtoken,
            reading: kanjiReadings[0],
          }]
        ],
        kanjiReadings.slice(1)
      ];
    }
    // insert our subtoken into latest chunk
    return [
      [
        ...chunks.slice(0, chunks.length-1),
        [
        ...chunks[chunks.length-1],
        currentSubtoken,
        ],
      ],
      kanjiReadings,
    ];
  }, [[], matches.slice(1)])[0];
}

/**
This is a pretty good approach to fitting kana
without a dictionary. but we can do better with KANJIDIC.

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

/** This looks pretty cool. I don't remember when I stopped using it, 
but seems to be related to whitespace splicing. */
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