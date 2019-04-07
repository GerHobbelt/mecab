export class MecabPipeline {
  constructor({
    mecab,
    mecabOutputParser,
    tokenEnricher,
    whitespaceInterposer,
  }) {
    this._mecab = mecab;
    this._mecabOutputParser = mecabOutputParser;
    this._tokenEnricher = tokenEnricher;
    this._whitespaceInterposer = whitespaceInterposer;
  }

  tokenize(sentence) {
    const mecabOutput = this._mecab.query(sentence)
    const nominalTokens = this._mecabOutputParser.parse(mecabOutput);
    const enrichedTokens = this._tokenEnricher.getEnriched(nominalTokens);
    const withWhitespace = this._whitespaceInterposer.withWhitespacesSplicedBackIn(enrichedTokens, sentence);
    return withWhitespace;
  }
}