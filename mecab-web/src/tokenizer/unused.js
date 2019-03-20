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