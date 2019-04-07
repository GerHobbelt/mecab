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
    parsedEntriesSorter,
  }) {
    this._matcher = matcher;
    this._parsedEntriesSorter = parsedEntriesSorter;
  }

  construct({
    matchPipeline,
  }) {
    return new MatchesPipeline({
      matcher: this._matcher,
      parsedEntriesSorter: this._parsedEntriesSorter,
      matchPipeline,
    })
  }
}

export class MatchesPipeline {
  constructor({
    matcher,
    matchPipeline,
    parsedEntriesSorter,
  }) {
    this._matcher = matcher;
    this._matchPipeline = matchPipeline;
    this._parsedEntriesSorter = parsedEntriesSorter;
  }

  lookup(term) {
    const matches = this._matcher.match(term);
    const parsedEntries = matches.map((match) => this._matchPipeline.parse(match))
    const sorted = this._parsedEntriesSorter.sortByRelevance(parsedEntries);
    return parsedEntries;
  }
}