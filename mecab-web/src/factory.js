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
  MecabOutputParser,
} from './mecab/index.js';

import { escapeRegExp, } from './util/index.js';
import { FuriganaFitter, } from './furiganaFitter/index.js';

import {
  Kanjidic2Matcher,
  Kanjidic2Parser,
  Kanjidic2,
} from './kanjidic2/index.js';

import { tokenize } from './web_modules/wanakana.js';

export class DictionariesFactory {
	constructor({

	}) {
	}

	construct({
		edict2Text,
		enamdictText,
		kanjidic2Text,
    mecabConfig = {
      endOfSentence = 'EOS\n',
    },
	}) {
    const kanjidic2 = new Kanjidic2({
      kanjidic2Matcher: new Kanjidic2Matcher({
        kanjidic2Text,
        escapeRegExp,
      }),
      kanjidic2Parser: new Kanjidic2Parser(),
    });
    const furiganaFitter = new FuriganaFitter({
      kanjidic2,
      wanakana: { tokenize },
      escapeRegExp,
    });
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
        mecabOutputParser: new MecabOutputParser({
          escapeRegExp,
        }),
      }),
      relevanceSorter: new ParsedEntrySorter(),
    });
		return new Dictionaries({
      mecabOutputParser,
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