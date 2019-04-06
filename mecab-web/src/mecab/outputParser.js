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