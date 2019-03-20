import { toMecabTokens, withWhitespacesSplicedBackIn, withInterWordWhitespaces } from './tokenizer/index.js';
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
    initialParses: [],
  });
  const boundActions = getBoundActions(store);
  return [store, boundActions];
}

const actions = (store) => ({
  setReady(state, ready) {
    return { ...state, ready, };
  },
  addInitialParse(state, parsedQuery) {
    return { ...state, initialParses: [...state.initialParses, parsedQuery], };
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

const Word = ({ token, subtokens }) => {
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
  <span class="token4" data-token=${token}>${output}<//>
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

const Definition = connect('dictionaryText', actions)(
  ({ chosenTerm, dictionaryText }) => {
    const {edict2, enamdict} = dictionaryText;
    const [results, setResults] = useState({
      key: chosenTerm,
      value: undefined,
    });

    if (!edict2 || !enamdict) {
      return '';
    }
    if (!results.value || results.key !== chosenTerm) {
      useEffect(() => {
        const results = edictLookup([edict2, enamdict], chosenTerm);
        // console.log('setting results:');
        // console.log(results);
        setResults({
          key: chosenTerm,
          value: results,
        });
      });
      return '';
    }
    // console.log('rendering results:');
    // console.log(results.value);
    const renderEdictResult = (result) => {
      return html`
      <pre>${JSON.stringify(result)}</pre>
      `;
    };
    // { headwords, meaning, readings}
    const renderEnamdictResult = (result) => {
      return html`
      <pre>${JSON.stringify(result)}</pre>
      `;
    };

    return html`
    <div>
      <h3>EDICT2<//>
      ${results.value.edict2.map(renderEdictResult)}
      <h3>ENAMDICT<//>
      ${results.value.enamdict.map(renderEnamdictResult)}
    </div>
    `;
  });

// if we want this connected to the store, we'll need a workaround
// otherwise the whole list will undergo re-render when any item is added
// https://stackoverflow.com/a/38726478/5257399
const Sentence = ({ nodes }) => {
  // console.log('sentence render:');
  // console.log(nodes);
  const [chosenTerm, setChosenTerm] = useState(undefined);

  const renderNode = (acc, node) => {
    if (node.isWhitespace) {
      return {
        output: boundHtmlConcat(acc.output, node.token),
      };
    }

    return {
      output: html`${acc.output}<${Word} token=${node.token} subtokens=${node.subtokens} />`,
    };
  };

  function onClick(event) {
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
        useEffect(() => {
          setChosenTerm(token);
        });
      }
    }
  }

  return html`
  <div class="output-row">
    <div class="parsed-sentence" onClick=${onClick}>
      ${nodes.reduce(renderNode, {
        output: '',
      }).output}
    <//>
    ${chosenTerm
      ? html`
      <${Definition} chosenTerm=${chosenTerm} />
      `
      : ''}
  <//>
  `
};

const App = connect('ready,initialParses,initialQuery,parse', actions)(
  ({ ready, initialParses, initialQuery, parse, }) => {
    const keyedInitialParses = initialParses.reduce((acc, parse) => ({
      parses: [...acc.parses, {
        key: `from store: ${acc.nextKey}`,
        // key: acc.nextKey,
        parse,
      }],
      nextKey: acc.nextKey + 1,
    }), {
      parses: [],
      nextKey: 0,
    });

    const [query, setQuery] = useState(initialQuery);
    const [parses, setParses] = useState([]);
    const [nextParseId, setNextParseId] = useState(0);

    function onSubmit(event) {
      event.preventDefault();
      const nodes = parse(query);
      useEffect(() => {
        setParses(parses.concat({
          key: nextParseId,
          parse: nodes,
        }));
        setNextParseId(nextParseId+1);
      });
    }

    const renderParsedQuery = (item) => html`
      <${Sentence} key=${item.key} nodes=${item.parse} />
    `;
    return html`
      <form onSubmit=${onSubmit}>
        ${/* btw, we can't use React's onChange; Preact prefers browser-native onInput
        https://github.com/developit/preact/issues/1034 */''}
        <textarea class="input" value=${query} onInput=${event => setQuery(event.target.value)} />
        <button class="submitter" disabled=${!ready}>Analyse Japanese<//>
      <//>
      <div class="richOutput columnReverse">
        ${keyedInitialParses.parses.concat(parses).map(renderParsedQuery)}
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