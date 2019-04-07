// export class MatchesPipelineFactoryFactory {
//   construct({
//     matcher,
//     matchPipeline,
//   }) {
//     return new MatchesPipelineFactory({
//       matcher: this._matcher,
//       matchPipeline: this._matchPipeline,
//     })
//   }
// }

export class MatchesPipelineFactory {
  constructor({
    matcher,
  }) {
    this._matcher = matcher;
  }

  construct({
    relevancePipeline,
    matchPipeline,
  }) {
    return new MatchesPipeline({
      matcher: this._matcher,
      matchPipeline,
      relevancePipeline,
    })
  }
}

export class MatchesPipeline {
  constructor({
    matcher,
    matchPipeline,
    relevancePipeline,
  }) {
    this._matcher = matcher;
    this._matchPipeline = matchPipeline;
    this._relevancePipeline = relevancePipeline;
  }

  lookup(term) {
    const matches = this._matcher.match(term);
    const parsedEntries = matches.map((match) => this._matchPipeline.parse(match))
    const withRelevanceInfo = this._relevancePipeline.withRelevanceInfo(parsedEntries);
    return parsedEntries;
  }
}