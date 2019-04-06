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
