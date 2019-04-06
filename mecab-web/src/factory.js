// import { Dictionaries, } from './edict2/index.js';
// import { Edict2LikeParser, Edict2LikeMatcher, } from './edict2/edict2Like.js';
// import { Edict2GlossParser, EnamdictGlossParser, } from './edict2/parsedEntryGlossParser.js';
// import { Edict2LikeMatchPipelineFactory, } from './edict2/matchPipeline.js';
// import { Edict2LikeMatchesPipelineFactory, } from './edict2/matchesPipeline.js';
// import {
//   Edict2LikeParsedEntryRelevancePipelineFactory,
//   Edict2LikeParsedEntryRelevanceClassifier,
//   Edict2LikeParsedEntrySorter,
// } from './edict2/parsedEntryRelevancePipeline.js';
// import {
//   Edict2LikeParsedEntryHeadwordReadingPipelineFactory,
//   Edict2LikeParsedEntryHeadwordReadingSorter,
//   Edict2LikeParsedEntryHeadwordReadingResolver,
// } from './edict2/parsedEntryHeadwordReadingPipeline.js';
// import { MecabOutputParser, } from './mecab/outputParser.js';
import {
  Dictionaries,

  Edict2LikeParser,
  Edict2LikeMatcher,

  Edict2GlossParser,
  EnamdictGlossParser,

  MatchPipelineFactory,

  MatchesPipelineFactory,

  ParsedEntryRelevancePipelineFactory,
  ParsedEntryRelevanceClassifier,
  ParsedEntrySorter,

  HeadwordReadingRankerFactory,
  HeadwordReadingPipelineFactory,
  HeadwordReadingSorter,
  HeadwordReadingResolver,

} from './edict2/index.js';

import {
  Mecab,
  MecabContext,
  MecabOutputParser,
  SearchTermRecommender,
  MecabTokenEnricher,
  MecabWhitespaceInterposer,
  MecabPipeline,
} from './mecab/index.js';

import { escapeRegExp, } from './util/index.js';
import { FuriganaFitter, } from './furiganaFitter/index.js';

import {
  Kanjidic2Matcher,
  Kanjidic2Parser,
  Kanjidic2,
} from './kanjidic2/index.js';

import { tokenize, toHiragana, } from './web_modules/wanakana.js';

export class Kanjidic2Factory {
  construct({
    kanjidic2Text,
  }) {
    return new Kanjidic2({
      kanjidic2Matcher: new Kanjidic2Matcher({
        kanjidic2Text,
        escapeRegExp,
      }),
      kanjidic2Parser: new Kanjidic2Parser(),
    })
  }
}

export class FuriganaFitterFactory {
  construct({
    kanjidic2,
    mecabConfig: {
      endOfSentence = 'EOS\n',
    },
  }) {
    const mecabOutputParser = new MecabOutputParser({
      escapeRegExp,
      config: mecabConfig,
    });
    const furiganaFitter = new FuriganaFitter({
      kanjidic2,
      wanakana: { tokenize },
      escapeRegExp,
    });
  }
}

export class MecabPipelineFactory {
  construct({
    mecab,
  }) {
    const mecabOutputParser = new MecabOutputParser({
      escapeRegExp,
      config: mecab.config,
    });
    return new MecabPipeline({
      mecab,
      mecabOutputParser,
      tokenEnricher: new MecabTokenEnricher({
        wanakana: { toHiragana, },
        furiganaFitter,
      }),
      whitespaceInterposer: new MecabWhitespaceInterposer(),
    })
  }
}

export class DictionariesFactory {
	construct({
		edict2Text,
		enamdictText,
    furiganaFitter,
	}) {
    const searchTermRecommender = new SearchTermRecommender();
    const headwordReadingPipelineFactory
    = new HeadwordReadingPipelineFactory({
      parsedEntrySorter: new HeadwordReadingSorter(),
      parsedEntryReadingsResolver: new HeadwordReadingResolver({
        furiganaFitter,
      }),
    });
    const parsedEntryRelevancePipelineFactory
    = new ParsedEntryRelevancePipelineFactory({
      relevanceClassifier: new ParsedEntryRelevanceClassifier({
        searchTermRecommender,
      }),
      relevanceSorter: new ParsedEntrySorter(),
    });
    return new Dictionaries({
      searchTermRecommender,
      edict2: {
        matchPipelineFactory: new MatchPipelineFactory(
          new Edict2LikeParser({
            glossParser: new Edict2GlossParser(),
          })),
        matchesPipelineFactory: new MatchesPipelineFactory({
          matcher: new Edict2LikeMatcher({
            text: edict2Text,
            escapeRegExp,
          }),
        }),
      },
      enamdict: {
        matchPipelineFactory: new MatchPipelineFactory(
          new Edict2LikeParser({
            glossParser: new EnamdictGlossParser(),
          })),
        matchesPipelineFactory: new MatchesPipelineFactory({
          matcher: new Edict2LikeMatcher({
            text: enamdictText,
            escapeRegExp,
          }),
        }),
      },
      headwordReadingPipelineFactory,
    });
	}
}