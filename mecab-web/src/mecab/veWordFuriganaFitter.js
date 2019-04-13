import { Pos } from './veConst.js';

/**
 * This class expects to be run in a pipeline, after readingHiragana is added onto the word
 */
export class VeWordFuriganaFitter {
  constructor({
    furiganaFitter,
  }) {
    this._furiganaFitter = furiganaFitter;
  }

  _getSubtokens({ readingHiragana, surfaceLayerForm, partOfSpeechVe }) {
    return this._furiganaFitter.fitFurigana(
      surfaceLayerForm,
      readingHiragana,
      partOfSpeechVe === Pos.ProperNoun,
      );
  }

  _withFuriganaFitted(veWord) {
    const subtokens = this._getSubtokens(veWord);
    return {
      ...veWord,
      subtokens,
    };
  }

  withFuriganaFitted(veWords) {
    const withFuriganaFitted = veWords.map(veWord => this._withFuriganaFitted(veWord));
    return withFuriganaFitted;
  }
}
