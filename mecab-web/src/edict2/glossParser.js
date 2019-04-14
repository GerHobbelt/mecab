import edict2Abbrev from './abbrev.js';

const getInitialTags = () => ({
	// kanji: [],
	// reading: [],
	sense: [], // (uk)
	partOfSpeech: [], // (adj-no) (pref) (suf,ctr) (prt)
	usageDomain: undefined, // {ling}
	dialect: undefined,
	language: undefined,
	glossaryInfo: [],

	as: [], // (as ＡもＢも)
	oftenAs: [], // (often as 〜ても, 〜でも, 〜とも, etc.)
	see: [], // (See ご本・ごほん) (See が・1) (See 何の・どの,此れ・1,其の・1,彼の) (See が・1)
	usually: [],
	misc: [],
	sometimesPronounced: [], // (sometimes pronounced ぼん or ぽん)
	only: [], // (じょせい only) (おもて, もて only)
});

export class Edict2GlossParser {
  parse(meaningsSectionAndTail) {
  	// tailMatch was formerly:
  	// /\/[^ ]*$/
  	console.log(meaningsSectionAndTail)
  	const tailMatch = meaningsSectionAndTail.match(/\/(\(P\)\/)?Ent[\dA-Z]+\/$/);
  	const tail = tailMatch[0];
  	const tailData = tail.split('/')
  	.reduce((acc, current) => {
  		if (!current) {
  			return acc;
  		}
  		if (current === '(P)') {
  			return {
  				...acc,
  				isPriority: true,
  			};
  		}
  		if (current.match(/^Ent[\dA-Z]+$/)) {
  			return {
  				...acc,
  				entryId: current,
  			};
  		}
  		return acc;
  	}, {
		isPriority: false,
		entryId: undefined
  	});

  	const meaningsSection = meaningsSectionAndTail.slice(0, tailMatch.index)
  	const meanings = meaningsSection.split(/\/\(/)
  	.map((meaningSection, ix) => {
  		const replaceDelimiter = ix
  		? '('
  		: '';
  		const repaired = `${replaceDelimiter}${meaningSection}`;
  		const tagsSection = repaired.match(/^(\([^()]*\) |\{[^{}]*\} )+/g);

  		let meaningIx = 1;

  		const tags = getInitialTags();
  		const tagMatcher = /(^| )(\(([^()]*)\))/g;
  		const curlyTagMatcher = /(^| )(\{([^{}]*)\})/g;

  		let tagMatch;
  		while (tagMatch = tagMatcher.exec(tagsSection[0])) {
  			const [,,,tagContent] = tagMatch;
  			tagContent.split(',').forEach(tag => {
  				if (!isNaN(tag)) {
	  				meaningIx = +tag;
	  				return;
	  			}
	  			const dialectMatch = /^([^:]*):$/.exec(tag);
	  			if (dialectMatch) {
	  				const [,dialect] = dialectMatch;
	  				if (dialect in edict2Abbrev.dialect) {
	  					tags.dialect = tag;
	  					return;
	  				}
	  			}
	  			if (tag in edict2Abbrev.sense) {
	  				tags.sense.push(tag);
	  			} else if (tag in edict2Abbrev.partOfSpeech) {
	  				tags.partOfSpeech.push(tag);
	  			} else {
	  				tags.misc.push(tag);
	  			}
  			});
  		}

  		let curlyTagMatch;
  		while (curlyTagMatch = curlyTagMatcher.exec(tagsSection[0])) {
  			const [,,,tag] = curlyTagMatch;
			if (!isNaN(tag)) {
  				// numeric tag is just the index of the meaning.
  				// our meanings aready have an array index.
  				return;
  			}
  			if (tag in edict2Abbrev.usageDomain) {
  				tags.usageDomain = tag;
  			} else {
  				tags.misc.push(tag);
  			}
  		}
  		const prose = repaired.slice(tagsSection[0].length);
  		return {
  			meaningIx,
			prose,
			tags,
  		};
  	});

    return {
    	meanings,
    	...tailData,
    };
  }
}

export class EnamdictGlossParser {
  parse(meaningSection) {
    return {
    	meanings: [{
    		prose: meaningSection.split('/', 1)[0],
    		meaningIx: 1,
    		tags: getInitialTags(),
    	}]
    };
  }
}

