export class SearchTermRecommender {
  /** Decide our preference / fallback */
  getRecommendedSearchTerm(mecabToken) {
    const { surfaceLayerForm, readingHiragana, inflectionForm } = mecabToken;
    return inflectionForm || surfaceLayerForm;
  }
}

export class MecabOutputParser {
  constructor({
    config: {
      endOfSentence = 'EOS\n',
    },
    escapeRegExp,
  }) {
    this._endOfSentence = endOfSentence;
    this._escapeRegExp = escapeRegExp;
  }

  parse(mecabOutput) {
    const mecabTokens = this._toMecabTokens(mecabOutput);
    return mecabTokens;
  }

  _toMecabTokens(mecabOutput) {
    return mecabOutput.replace(
      new RegExp(`${
        this._escapeRegExp(
          this._endOfSentence)}$`),
      '')
    .split('\n')
    .filter(x => x)
    .map((line) => {
      const [
      surfaceLayerForm, // 表層形
      featureStr,
      ] = line.split('\t');
      const features = featureStr.split(',');
      // // MeCab seems to have a non-guaranteed schema
      // while (features.length <= 9) {
      //   features.push('');
      // }
      const [
      // surfaceLayerForm, // 表層形
      partOfSpeech, // 品詞
      partOfSpeechSubclass1, // 品詞細分類1
      partOfSpeechSubclass2, // 品詞細分類2
      partOfSpeechSubclass3, // 品詞細分類3
      inflectionType, // 活用型
      inflectionForm, // 活用形
      lemma, // 原形
      reading, // 読み
      pronunication, // 発音
      ] = features;
      return {
        surfaceLayerForm, // token
        partOfSpeech,
        partOfSpeechSubclass1,
        partOfSpeechSubclass2,
        partOfSpeechSubclass3,
        inflectionType,
        inflectionForm,
        lemma,
        reading,
        pronunication,
        isWhitespace: false,
      }
    });
  }
}