export class MecabPipeline {
  constructor({
    mecab,
    mecabOutputParser,
    tokenEnricher,
    whitespaceInterposer,
  }) {
    this.mecabOutputParser = mecabOutputParser;
    this.tokenEnricher = tokenEnricher;
    this.whitespaceInterposer = whitespaceInterposer;
  }

  tokenize(sentence) {
    const mecabOutput = this.mecab.query(sentence)
    const nominalTokens = this.mecabOutputParser.parse(mecabOutput);
    const enrichedTokens = this.tokenEnricher.getEnriched(nominalTokens);
    const withWhitespace = this.whitespaceInterposer.withWhitespacesSplicedBackIn(enrichedTokens, sentence);
    return withWhitespace;
  }
}