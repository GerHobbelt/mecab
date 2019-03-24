import { toSubtokensWithKanjiReadings, toMecabTokens, withWhitespacesSplicedBackIn, withInterWordWhitespaces } from './tokenizer/index.js';
import { edictLookup } from './edict2/index.js';

import { createElement, render } from '../web_modules/preact.js';
import { useState, useEffect } from '../web_modules/preact/hooks.js';

import { Provider, connect, createStore } from '../web_modules/unistore/full/preact.es.js';

import htm from '../web_modules/htm.js';
const html = htm.bind(createElement);

function initStore() {
  const store = createStore({
    ready: false,
    mecabCallbacks: {},
    mecabStructures: {},
    parse: undefined,
    dictionaryLoading: {
      edict2: false,
      enamdict: false,
    },
    dictionaryText: {
      edict2: '',
      enamdict: '',
    },
    initialQuery: `太郎はこの本を二郎を見た女性に渡した。
すもももももももものうち。`,
    parses: [],
    // chosenTerm: undefined,
    termResults: {
      key: undefined,
      value: undefined,
    },
  });
  const boundActions = getBoundActions(store);
  return [store, boundActions];
}

const actions = (store) => ({
  setReady(state, ready) {
    return { ...state, ready, };
  },
  addParse(state, parsedQuery) {
    return { ...state, parses: [...state.parses, parsedQuery], };
  },
  setupMecab(state, mecabCallbacks, mecabStructures) {
    return {
      ...state,
      mecabCallbacks,
      mecabStructures,
      parse: bindParser(
        mecabCallbacks,
        mecabStructures),
      ready: true,
    }
  },
  setDictionaryLoading(state, dict, bool) {
    return {
      ...state,
      dictionaryLoading: {
        ...state.dictionaryLoading,
        [dict]: bool,
      }
    };
  },
  dictionaryLoaded(state, dict, text) {
    return {
      ...state,
      dictionaryLoading: {
        ...state.dictionaryLoading,
        [dict]: false,
      },
      dictionaryText: {
        ...state.dictionaryText,
        [dict]: text,
      },
    };
  },
  // setChosenTerm(state, chosenTerm) {
  //   return { ...state, chosenTerm, };
  // },
  setTermResults(state, termResults) {
    return { ...state, termResults, };
  }
});

function act(store, actionsObj, action, ...args) {
  return store.setState(
    actionsObj[action](
      store.getState(),
      ...args));
}

function getBoundActions(store) {
  const actor = act.bind(null, store, actions(store));
  return Object.assign({}, 
    ...Object.keys(actions(store))
      .map(action => ({
        [action]: actor.bind(null, action),
      })),
  )
}

const Rubied = ({ theValue, reading }) => {
  return html`
  <ruby>
    <rb>${theValue}<//>
    <rt>${reading}<//>
  <//>
  `
  };

const Word = ({ classList, token, subtokens }) => {
  const reducedSubtokens = subtokens.reduce(({
    bufferedText,
    output,
  }, subtoken) => {
    if (subtoken.type === 'kanji') {
      // we've hit an alphabet boundary, so flush buffer
      if (bufferedText) {
        output = boundHtmlConcat(output, bufferedText);
        bufferedText = '';
      }
      output = html`
      ${output}<${Rubied} theValue=${subtoken.value} reading=${subtoken.reading} />
      `;
      return {
        bufferedText,
        output,
      }
    }
    return {
      bufferedText: bufferedText + subtoken.value,
      output,
    }
  }, {
    bufferedText: '',
    output: '',
  });

  // flush buffer at word end, because it's a "word boundary"
  let { bufferedText, output } = reducedSubtokens;
  if (bufferedText) {
    output = boundHtmlConcat(output, reducedSubtokens.bufferedText);
  }

  return html`
  <span class=${classList || ''} data-token=${token}>${output}<//>
  `
  };

/**
 * Returns simpler output for special cases
 * html`${'lol'}${'what'}` = ['lol','what']
 * htmlConcat(html, html`${'lol'}`, html`${'what'}`) = 'lolwhat'
 */
function htmlConcat(html, left, right) {
  if (!left) {
    return right;
  }
  if (!right) {
    return left;
  }
  if (typeof left === 'string' && typeof right === 'string') {
    return left + right;
  }
  return html`${left}${right}`;
}
const boundHtmlConcat = htmlConcat.bind(null, html);

const Definition = connect('termResults', actions)(
  ({ termResults }) => {
    // const {edict2, enamdict} = dictionaryText;
    // const [results, setResults] = useState({
    //   key: chosenTerm,
    //   value: undefined,
    // });
    // console.log(`chosenTerm: ${chosenTerm}`)
    // console.log(`results.value: ${!!results.value}`)
    // console.log(`results.key: ${results.key}`)

    // if (!edict2 || !enamdict) {
    //   return '';
    // }
    // if (!termResults.value || termResults.key !== chosenTerm) {
    //   useEffect(() => {
    //     const results = edictLookup([edict2, enamdict], chosenTerm);
    //     setResults({
    //       key: chosenTerm,
    //       value: results,
    //     });
    //   });
    // }
    // const renderProgress = (chosenTerm) => {
    //   if (!chosenTerm) {
    //     return '';
    //   }
    //   return html`
    //   <div>Looking up '${chosenTerm}'...<//>
    //   `
    // };
    // if (!results.value && results.key === chosenTerm) {
    //   return renderProgress(chosenTerm);
    // }
    // const renderHeadWordMiscTag = (headwordMiscTag) => {
    //   return html`
    //   <div>${headwordMiscTag}<//>
    //   `;
    // };
    // const renderHeadWord = (headword) => {
    //   return html`
    //   <div>${headword.form}${
    //     headword.tags.misc.length
    //     ? html`(${headword.tags.misc.map(renderHeadWordMiscTag)}`
    //     : ''}<//>
    //   `;
    // };

    // const renderHeadword = (headword) => {
    //   return '';
    // };
    const renderHeadwordReadingTuple = (classList, headwordReadingTuple) => {
      // console.log(headwordReadingTuple);
      return html`
      <${Word} classList=${classList} token=${headwordReadingTuple.headword} subtokens=${headwordReadingTuple.subtokens} />
      `;
    };

    // console.log('rendering results:');
    // console.log(results.value);
    const renderEdictResult = (result) => {
      let headwordReadingTuples = result.result.headwordReadingCombinations;
      if (!headwordReadingTuples.length) {
        // probably we got an entry that's entirely phonetic
        // so our headword _is_ the reading (but EDICT avoids duplicating information).
        headwordReadingTuples = result.result.headwords.map((headword) => ({
          headword: headword.form,
          reading: headword.form,
          subtokens: toSubtokensWithKanjiReadings(headword.form, headword.form),
        }));
      }
      if (!headwordReadingTuples.length) {
        // not supposed to be possible, but I suppose we have nothing to show.
        return '';
      }
      // <pre>${JSON.stringify(result.result, null, '  ')}</pre>
      const firstTuple = headwordReadingTuples[0];
      const restTuples = headwordReadingTuples.slice(1);
      return html`
      <div class="hero-container">
        ${renderHeadwordReadingTuple('hero-definition', firstTuple)}
        <div>${result.result.meaning}<//>
        <div>${result.result.line}<//>
      <//>
      ${restTuples.map(renderHeadwordReadingTuple.bind(null, 'alt-definition'))}
      `;
    };
    // { headwords, meaning, readings}
    // const renderEnamdictResult = (result) => {
    //   return html`
    //   <pre>${JSON.stringify(result.result, null, '  ')}</pre>
    //   `;
    // };
    const renderEnamdictResult = renderEdictResult;

    return html`
    <div>
      <h3>EDICT2<//>
      ${termResults.value.edict2.map(renderEdictResult)}
      <h3>ENAMDICT<//>
      ${termResults.value.enamdict.map(renderEnamdictResult)}
    <//>
    `;
  });

// if we want this connected to the store, we'll need a workaround
// otherwise the whole list will undergo re-render when any item is added
// https://stackoverflow.com/a/38726478/5257399
const Sentence = ({ nodes, order }) => {
  // console.log('sentence render:');
  // console.log(nodes);
  // const [chosenTerm, setChosenTerm] = useState(undefined);

  const renderNode = (acc, node) => {
    if (node.isWhitespace) {
      return {
        output: boundHtmlConcat(acc.output, node.token),
      };
    }

    return {
      output: html`${acc.output}<${Word} classList="token4" token=${node.token} subtokens=${node.subtokens} />`,
    };
  };

  return html`
  <div class="output-row" style="${{ order }}">
    <div class="parsed-sentence">
      ${nodes.reduce(renderNode, {
        output: '',
      }).output}
    <//>
  <//>
  `
};

const App = connect('ready,parses,initialQuery,parse,termResults,dictionaryText', actions)(
  ({ ready, parses, initialQuery, parse, termResults, dictionaryText, setChosenTerm, addParse, setTermResults }) => {
    const keyedParses = parses.reduce((acc, parse) => ({
      parses: [...acc.parses, {
        // key: `from store: ${acc.nextKey}`,
        key: acc.nextKey,
        parse,
      }],
      nextKey: acc.nextKey + 1,
    }), {
      parses: [],
      nextKey: 0,
    });

    const [query, setQuery] = useState(initialQuery);
    // const [parses, setParses] = useState([]);
    // const [nextParseId, setNextParseId] = useState(0);

    function onSubmit(event) {
      event.preventDefault();
      const nodes = parse(query);
      // useEffect(() => {
        // setParses(parses.concat({
        //   key: nextParseId,
        //   parse: nodes,
        // }));
        // setNextParseId(nextParseId+2);
        addParse(nodes);
      // });
    }

    function onClick(event) {
      const {edict2, enamdict} = dictionaryText;
      if (!edict2 || !enamdict) {
        return;
      }
      // console.log(event);
      const tokenNode = event.target.className === 'token4'
      ? event.target
      : event.target.closest('.token4');
      // console.log(tokenNode);
      if (tokenNode) {
        const token = tokenNode.getAttribute('data-token');
        if (token) {
          event.stopPropagation();
          // console.log(token);
          // useEffect(() => {
          const results = edictLookup([edict2, enamdict], token);
          // setTermResults(token);
          // termResults
          setTermResults({
            key: token,
            value: results,
          });
          // });
        }
      }
    }

    // const unionParses = keyedInitialParses.parses.concat(parses);
    // const parsesBeforeDefinition = unionParses.slice(0, 1);
    // const parsesAfterDefinition = unionParses.slice(1);
    // const definitionIndex = unionParses.length
    // ? unionParses[unionParses.length-1].key-1
    // : 0; 
    // const parsesBeforeDefinition = parses.slice(0, 1);
    // const parsesAfterDefinition = parses.slice(1);
    // const definitionIndex = parses.length
    // ? parses[parses.length-1].key-1
    // : 0; 

    const renderParsedQuery = (item) => html`
      <${Sentence} order=${item.key*2} key=${item.key} nodes=${item.parse} />
    `;

    // console.log('App render');
    // ${parsesBeforeDefinition.map(renderParsedQuery)}

    return html`
      <form onSubmit=${onSubmit}>
        ${/* btw, we can't use React's onChange; Preact prefers browser-native onInput
        https://github.com/developit/preact/issues/1034 */''}
        <textarea class="input" value=${query} onInput=${event => setQuery(event.target.value)} />
        <button class="submitter" disabled=${!ready}>Analyse Japanese<//>
      <//>
      <div class="paper-tape columnReverse" onClick=${onClick}>
        ${keyedParses.parses.map(renderParsedQuery)}
        ${termResults.key && html`
          <div class="output-row" style="${{ order: keyedParses.parses.length*2-3 }}">
            <${Definition} key=${`Definition ${termResults.key}`} />
          <//>
          `}
      <//>
    `;
  });

function renderApplication(store, element) {
  return render(html`
  <${Provider} store=${store}>
    <${App} />
  <//>
  `, element);
}

function parse({ mecab_sparse_tostr }, { tagger }, sentence) {
  const whitespaces = [];
  const r = new RegExp('[\\s　]+', 'g');
  let match;
  while(match = r.exec(sentence)) {
    /*
    0: ' ',
    index: 27,
    */
    whitespaces.push(match);
  }
  const mecabOutput = mecab_sparse_tostr(tagger, sentence);
  console.log(mecabOutput);
  const mecabTokens = toMecabTokens(mecabOutput);
  const plusOriginalWhitespaces = withWhitespacesSplicedBackIn(mecabTokens, whitespaces);
  const plusInterWordWhitespaces = withInterWordWhitespaces(plusOriginalWhitespaces);
  return plusInterWordWhitespaces;
}

function bindParser(mecabCallbacks, mecabStructures) {
  return parse.bind(null, mecabCallbacks, mecabStructures);
}

function initApplication({
  dictionaryTextPromises,
  store,
  actions,
  element,
}) {
  actions.setDictionaryLoading('edict2', true);
  actions.setDictionaryLoading('enamdict', true);
  dictionaryTextPromises.edict2.then((text) => {
    actions.dictionaryLoaded('edict2', text);
  });
  dictionaryTextPromises.enamdict.then((text) => {
    actions.dictionaryLoaded('enamdict', text);
  });
  renderApplication(store, element);
}

export {
  initStore,
  initApplication,
};