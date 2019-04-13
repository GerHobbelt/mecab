/**
 * This class expects to be run in a pipeline, after readingHiragana is added onto the word
 */
export class MecabTokenFuriganaFitter {
  constructor({
    furiganaFitter,
  }) {
    this._furiganaFitter = furiganaFitter;
  }

  _getSubtokens({ readingHiragana, surfaceLayerForm, partOfSpeech, partOfSpeechSubclass1 }) {
    return this._furiganaFitter.fitFurigana(
      surfaceLayerForm,
      readingHiragana,
      partOfSpeech === '名詞' // noun
      && partOfSpeechSubclass1 === '固有名詞' // if proper noun, treat as name
      );
  }

  _withFuriganaFitted(mecabToken) {
    const subtokens = this._getSubtokens(mecabToken);
    return {
      ...mecabToken,
      subtokens,
    };
  }

  getEnriched(mecabTokens) {
    const withFuriganaFitted = mecabTokens.map(mecabToken => this._withFuriganaFitted(mecabToken));
    return withFuriganaFitted;
  }
}
