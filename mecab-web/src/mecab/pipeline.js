export class MecabPipeline {
  constructor({
    mecab,
    mecabOutputParser,
    hiraganaReadingAdder,
    veWordFuriganaFitter,
    tokenAgglutinator,
    whitespaceInterposer,
  }) {
    this._mecab = mecab;
    this._tokenAgglutinator = tokenAgglutinator;
    this._mecabOutputParser = mecabOutputParser;
    this._hiraganaReadingAdder = hiraganaReadingAdder;
    this._veWordFuriganaFitter = veWordFuriganaFitter;
    this._whitespaceInterposer = whitespaceInterposer;
  }

  tokenize(sentence) {
    const mecabOutput = this._mecab.query(sentence)
    const nominalTokens = this._mecabOutputParser.parse(mecabOutput);
    const veWords = this._tokenAgglutinator.agglutinate(nominalTokens);
    const withHiraganaReadings = this._hiraganaReadingAdder.withHiraganaReadings(veWords);
    const withFuriganaFitted = this._veWordFuriganaFitter.withFuriganaFitted(withHiraganaReadings);
    const withWhitespace = this._whitespaceInterposer.withWhitespacesSplicedBackIn(withFuriganaFitted, sentence);
    return withWhitespace;
  }
}