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