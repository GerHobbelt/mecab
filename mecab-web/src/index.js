// import { tokenize } from '../web_modules/wanakana.js';
// import { kanjidic2Lookup } from './kanjidic2/index.js';
// import { edictLookup, getSearchTerm } from './edict2/index.js';
import { SearchTermRecommender } from './mecab/index.js';

import { createElement, render } from '../web_modules/preact.js';
import { useState, useEffect } from '../web_modules/preact/hooks.js';

import { Provider, connect, createStore } from '../web_modules/unistore/full/preact.es.js';

import htm from '../web_modules/htm.js';
const html = htm.bind(createElement);

function initStore() {
  const store = createStore({
    languageTools: undefined,
    dictionaryLoading: {
      edict2: false,
      enamdict: false,
      kanjidic2: false,
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
  addParse(state, parsedQuery) {
    return { ...state, parses: [...state.parses, parsedQuery], };
  },
  setLanguageTools(state, languageTools) {
    return { ...state, languageTools, };
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
  chooseTerm(state, mecabToken) {
    if (!state.languageTools) {
      return state;
    }
    const {
      dictionaries,
      mecabPipeline,
      furiganaFitter,
    } = state.languageTools;
    let subtokens = mecabToken.subtokens;
    if (!mecabToken.subtokens) {
      // if (mecabToken.readingHiragana) {
      //   subtokens = furiganaFitter.fitFurigana(
      //     mecabToken.token,
      //     mecabToken.readingHiragana);
      // } else {
      //   subtokens = tokenize(mecabToken.token, { detailed: true });
      // }
      subtokens = furiganaFitter.fitFurigana(
        mecabToken.token,
        mecabToken.readingHiragana || mecabToken.token);
    }
    const standardizedToken = {
      ...mecabToken,
      subtokens,
    }
    if (getTermKey(standardizedToken) === getTermKey(state.termResults.key || {})) {
      return state;
    }

    const results = dictionaries.lookupToken(standardizedToken);
    console.log(results);

    return {
      ...state,
      termResults: {
        key: standardizedToken,
        value: results,
      },
    };
  },
  // setTermResults(state, termResults) {
  //   return { ...state, termResults, };
  // }
});

/** Just a way to check whether we're looking up the same entry twice */
function getTermKey({ token, readingHiragana, dictionaryForm }) {
  return JSON.stringify({
    token,
    readingHiragana,
    dictionaryForm,
  });
}

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

const Word = ({ classList, mecabToken }) => {
  const {
    token,
    subtokens,
    readingHiragana,
    dictionaryForm
    } = mecabToken;
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

  // data-readingHiragana=${readingHiragana}
  // data-dictionaryForm=${dictionaryForm}

  return html`
  <span
  class=${classList || ''}
  data-token=${token}
  data-reading-hiragana=${readingHiragana}
  data-dictionary-form=${dictionaryForm}
  >${output}<//>
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

const Definition = connect('termResults,languageTools', actions)(
  ({ termResults,languageTools }) => {
    if (!languageTools) {
      return '';
    }
    const { furiganaFitter } = languageTools;

    const renderReadingTuple = (classList, headword, readingTuple) => {
      const mecabTokenLike = {
        token: headword,
        subtokens: readingTuple.subtokens,
      };
      return html`
      <${Word} classList=${classList} mecabToken=${mecabTokenLike} />
      `;
    };

    const renderHeadwordReading = (classList, headwordReading) => {
      return html`
      <div class="alt-headword-container">
        ${headwordReading.readingTuples.map(
          renderReadingTuple.bind(
            null,
            classList,
            headwordReading.headword))}
      <//>
      `;
    };

    // console.log('rendering results:');
    // console.log(results.value);
    const renderEdictResult = (result) => {
      let headwordReadings = result.result.headwordReadings;
      let bestHeadwordReading = result.result.bestHeadwordReading;
      if (!headwordReadings.length) {
        // probably we got an entry that's entirely phonetic
        // so our headword _is_ the reading (but EDICT avoids duplicating information).
        headwordReadings = result.result.headwords.map((headword) => ({
          headword: headword.form,
          readingTuples: [{
            reading: headword.form,
            subtokens: furiganaFitter.fitFurigana(
              headword.form,
              headword.form),
          }],
        }));
      }
      if (!headwordReadings.length) {
        // not supposed to be possible, but I suppose we have nothing to show.
        return '';
      }
      if (!bestHeadwordReading) {
        // might happen if we got an entry that's entirely phonetic (as above)
        const { headword, readingTuples } = headwordReadings[0];
        if (!readingTuples.length) {
          // we could check the other readingTuples, but this isn't supposed to be possible anyway.
          return '';
        }
        bestHeadwordReading = {
          headword,
          readingTuple: readingTuples[0],
        };
      }
      // console.log(bestHeadwordReading)
      // console.log(headwordReadings)
      const remainingTuples = headwordReadings.map((headwordReading) => ({
        ...headwordReading,
        readingTuples: headwordReading.readingTuples.filter(({ reading }) => 
          headwordReading.headword !== bestHeadwordReading.headword
          || reading !== bestHeadwordReading.readingTuple.reading),
      }))
      .filter(({ readingTuples }) => readingTuples.length);
      // console.log(remainingTuples)

      // const mecabTokenLike = {
      //   token: headword,
      //   subtokens: readingTuple.subtokens,
      // };

      return html`
      <div class="hero-container">
        ${renderReadingTuple('hero-definition', bestHeadwordReading.headword, bestHeadwordReading.readingTuple)}
        <div>${result.result.meaning}<//>
        <div>${result.result.line}<//>
      <//>
      <div class="alt-container">
        ${remainingTuples.map(renderHeadwordReading.bind(null, 'alt-definition'))}
      <//>
      `;
    };
    // { headwords, meaning, readings}
    // const renderEnamdictResult = (result) => {
    //   return html`
    //   <pre>${JSON.stringify(result.result, null, '  ')}</pre>
    //   `;
    // };
    const renderEnamdictResult = renderEdictResult;

    const term = new SearchTermRecommender()
    .getRecommendedSearchTerm(termResults.key);

    // <h3>EDICT2<//>

    return html`
    <div>
      <div class="results-header">
      Dictionary results for 
        '<${Word} classList="" mecabToken=${termResults.key} />'
        ${termResults.key.dictionaryForm
          && termResults.key.dictionaryForm !== termResults.key.token
          && ` (dictionary form: '${termResults.key.dictionaryForm}')`}
      <//>
      <div class="jisho-lookup">
      Look up <a href=${
      `https://jisho.org/search/${encodeURIComponent(term)}`
      } target="_blank">${term}<//> on Jisho.org
      <//>
      ${termResults.value.edict2.map(renderEdictResult)}
      <div class="names-section">Names<//>
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
      output: html`${acc.output}<${Word} classList="token4" mecabToken=${node} />`,
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

const App = connect('languageTools,parses,initialQuery,termResults', actions)(
  ({ languageTools, parses, initialQuery, termResults, addParse, chooseTerm, }) => {
    const keyedParses = parses.reduce((acc, parse) => ({
      parses: [...acc.parses, {
        key: acc.nextKey,
        parse,
      }],
      nextKey: acc.nextKey + 1,
    }), {
      parses: [],
      nextKey: 0,
    });

    const [query, setQuery] = useState(initialQuery);

    function onSubmit(event) {
      event.preventDefault();
      const nodes = mecabPipeline.tokenize(query);
      addParse(nodes);
    }

    function onClick(event) {
      if (!languageTools) {
        return;
      }
      const { mecabPipeline } = languageTools;
      // console.log(event);
      const tokenNode = event.target.className === 'token4'
      ? event.target
      : event.target.closest('.token4');
      // console.log(tokenNode);
      if (tokenNode) {
        const token = tokenNode.getAttribute('data-token');
        if (token) {
          event.stopPropagation();
          const mecabToken = {
            token,
            readingHiragana: tokenNode.getAttribute('data-reading-hiragana'),
            dictionaryForm: tokenNode.getAttribute('data-dictionary-form'),
          };
          chooseTerm(mecabToken);
        }
      }
    }

    const renderParsedQuery = (item) => html`
      <${Sentence} order=${item.key*2} key=${item.key} nodes=${item.parse} />
    `;

    // console.log('App render');

    return html`
      <form onSubmit=${onSubmit}>
        ${/* btw, we can't use React's onChange; Preact prefers browser-native onInput
        https://github.com/developit/preact/issues/1034 */''}
        <textarea class="input" value=${query} onInput=${event => setQuery(event.target.value)} />
        <button class="submitter" disabled=${!languageTools}>Analyse Japanese<//>
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

const Progress = connect('dictionaryLoading', actions)(
  ({ dictionaryLoading }) => {
    const { edict2, enamdict, kanjidic2 } = dictionaryLoading;
    return html`
    <div>
      ${edict2 && html`
        <div>Downloading embedded dictionary (EDICT2)...<//>
        `}
      ${enamdict && html`
        <div>Downloading embedded dictionary of names (ENAMDICT)...<//>
      `}
      ${kanjidic2 && html`
        <div>Downloading embedded dictionary of kanji (KANJIDIC2)...<//>
      `}
    <//>
    `;
    });

function renderProgress(store, element) {
  return render(html`
  <${Provider} store=${store}>
    <${Progress} />
  <//>
  `, element);
}

function initApplication({
  tokenizer,
  dictionaryLoadPromises,
  store,
  actions,
  element,
  progressElement,
}) {
  actions.setDictionaryLoading('edict2', true);
  actions.setDictionaryLoading('enamdict', true);
  actions.setDictionaryLoading('kanjidic2', true);
  dictionaryLoadPromises.edict2
  .then(() => actions.setDictionaryLoading('edict2', false));
  dictionaryLoadPromises.enamdict
  .then(() => actions.setDictionaryLoading('enamdict', false));
  dictionaryLoadPromises.kanjidic2
  .then(() => actions.setDictionaryLoading('kanjidic2', false));
  renderApplication(store, element);
  renderProgress(store, progressElement);
}

export {
  initStore,
  initApplication,
};