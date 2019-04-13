export class HiraganaReadingAdder {
  constructor({
    wanakana: { toHiragana },
  }) {
    this._wanakana = { toHiragana, };
  }

  _getHiraganaReading(mecabTokenLike) {
    return this._wanakana.toHiragana(mecabTokenLike.reading, { passRomaji: false });
  }

  _withHiraganaReading(mecabTokenLike) {
    const readingHiragana = this._getHiraganaReading(mecabTokenLike);
    return {
      ...mecabTokenLike,
      readingHiragana,
    };
  }

  withHiraganaReadings(mecabTokenLikes) {
    const withHiraganaReading = mecabTokenLikes.map(mecabTokenLike => this._withHiraganaReading(mecabTokenLike));
    return withHiraganaReading;
  }
}
