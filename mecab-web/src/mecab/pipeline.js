export class MecabPipeline {
  constructor({
    mecab,
    mecabOutputParser,
    tokenEnricher,
    tokenAgglutinator,
    whitespaceInterposer,
  }) {
    this._mecab = mecab;
    this._tokenAgglutinator = tokenAgglutinator;
    this._mecabOutputParser = mecabOutputParser;
    this._tokenEnricher = tokenEnricher;
    this._whitespaceInterposer = whitespaceInterposer;
  }

  tokenize(sentence) {
    const mecabOutput = this._mecab.query(sentence)
    const nominalTokens = this._mecabOutputParser.parse(mecabOutput);
    const agglutinatedTokens = this._tokenAgglutinator.agglutinate(nominalTokens);
    const enrichedTokens = this._tokenEnricher.getEnriched(agglutinatedTokens);
    const withWhitespace = this._whitespaceInterposer.withWhitespacesSplicedBackIn(enrichedTokens, sentence);
    return withWhitespace;
  }
}