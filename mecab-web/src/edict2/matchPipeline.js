// export class MatchPipelineFactoryFactory {
//   constructor({
//     headwordReadingPipeline,
//   }) {
//     this._headwordReadingPipeline = headwordReadingPipeline;
//   }

//   construct({
//     parser,
//   }) {
//     return new MatchPipelineFactory({
//       parser,
//       headwordReadingPipeline: this._headwordReadingPipeline,
//     })
//   }
// }

export class MatchPipelineFactory {
  constructor({
    parser,
  }) {
    this._parser = parser;
  }

  construct({
    headwordReadingPipeline,
    relevancePipeline,
  }) {
    return new MatchPipeline({
      parser: this._parser,
      headwordReadingPipeline,
      relevancePipeline,
    })
  }
}

export class MatchPipeline {
  constructor({
    parser,
    headwordReadingPipeline,
    relevancePipeline,
  }) {
    this._parser = parser;
    this._headwordReadingPipeline = headwordReadingPipeline;
    this._relevancePipeline = relevancePipeline;
  }

  parse(line) {
    const parsedEntry = this._parser.parse(line);
    const withHeadwordReadings = this._headwordReadingPipeline.withHeadwordReadings(parsedEntry);
    const withRelevanceInfo = this._relevancePipeline.withRelevanceInfo(withHeadwordReadings);
    return withRelevanceInfo;
  }
}