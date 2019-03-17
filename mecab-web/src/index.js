import { toMecabTokens, withWhitespacesSplicedBackIn, withInterWordWhitespaces } from './tokenizer/index.js';
import { edictLookup } from './edict2/index.js';
import { createElement, /*Component,*/ render } from '../web_modules/preact.js';
import { useState, useEffect } from '../web_modules/preact--hooks.js';
import { Provider, connect, createStore } from '../web_modules/unistore--full/preact.es.js';
import htm from '../web_modules/htm.js';
const html = htm.bind(createElement);
Provider.prototype.render = function(props) {
  return props.children;
};

// const td = new TextDecoder('utf-16le');
// .then((response)=>response.arrayBuffer())
const edict2 = fetch('edict2.utf8.txt')
.then((response)=> {
  document.getElementById('edict2-loading').classList.add('hidden');
  return response.text();
});
const enamdict = fetch('enamdict.utf8.txt')
.then((response)=> {
  document.getElementById('enamdict-loading').classList.add('hidden');
  return response.text();
});

const outputElement = document.getElementById('output');
const definitionElement = document.getElementById('definition');
const definitionTokenElement = document.getElementById('definition-token');
const queryContainerElement = document.getElementById('queryContainer');
const iframeContainerElement = document.getElementById('iframeContainer');
const currentQueryElement = document.getElementById('current-query');
const currentQueryTargetElement = document.getElementById('current-query-target');
let iframeElement;

function handleTokenClickEdict2(event) {
  const tokenNode = event.target.className === 'token3'
  ? event.target
  : event.target.closest('.token3');
  if (tokenNode
    && tokenNode._mecabToken) {
    console.log(tokenNode._mecabToken);
    const sentenceNode = tokenNode.closest('.parsed-sentence');
    if (!sentenceNode) {
      throw new Error('DOM not as expected');
    }
    +sentenceNode.style.order;
    Array.from(richOutputElement.children)
    .filter((element) => element.style.order > +sentenceNode.style.order)
    .sort((left, right) => right.style.order - left.style.order) // descending
    .forEach((child) => {
      child.style.order = +child.style.order+1;
    });
    definitionTokenElement.textContent = tokenNode._mecabToken;
    queryContainerElement.style.order = +sentenceNode.style.order+1;
    queryContainerElement.style.display = 'initial';
    definitionElement.classList.remove('hidden');
    Promise.all([
      edict2,
      enamdict]
      )
    .then((dictionaries) => {
      const results = edictLookup(dictionaries, tokenNode._mecabToken);
    });
  }
}

const store = createStore({
  ready: false,
  lols: 5,
//   query: `太郎はこの本を二郎を見た女性に渡した。
// すもももももももものうち。`,
  // parsedQueries: [],
});

const actions = (store) => ({
  increment(state) {
    return { ...state, lols: state.lols+1 }
  },
  setReady(state, ready) {
    return { ...state, ready, }
  },
  // setQuery(state, query) {
  //   return { ...state, query, }
  // },
  // addParsedQuery(state, parsedQuery) {
  //   return { ...state, parsedQueries: [parsedQuery, ...state.parsedQueries], }
  // },
});

function act(store, actionsObj, action, ...args) {
  return store.setState(
    actionsObj[action](
      store.getState(),
      ...args));
}
const actor = act.bind(null, store, actions(store));
const boundActions = Object.assign({}, 
  ...Object.keys(actions(store))
    .map(action => ({
      [action]: actor.bind(null, action),
    })),
);

boundActions.increment();
setInterval(boundActions.increment, 1000);

const monkeyPatchSetState = component => {
  if (!component) {
    return component;
  }
  // console.log(component);
  // component.setState = component.forceUpdate;
  const origSetState = component.setState;
  component.setState = function(state, props) {
    if (state == null) {
      state = {}
    };
    return origSetState.call(this, state, props);
  };
};

const Word = ({ theValue, reading }) => {
  return html`<ruby>
    <rb>${theValue}<//>
    <rt>${reading}<//>
  <//>`
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

// console.log(html`''`);

// if we want this connected to the store, we'll need a workaround
// otherwise the whole list will undergo re-render when any item is added
// https://stackoverflow.com/a/38726478/5257399
const Sentence = ({ nodes }) => {

  const renderNode = (acc, node) => {
    if (node.isWhitespace) {
      return {
        bufferedText: acc.bufferedText,
        output: boundHtmlConcat(acc.output, node.token),
      };
    }

    const reducedSubtokens = node.subtokens.reduce(({
      bufferedText,
      output,
    }, subtoken) => {
      if (subtoken.type === 'kanji') {
        if (bufferedText) {
          bufferedText = '';
          output = boundHtmlConcat(output, bufferedText);
        }
        output = html`${output}<${Word} theValue=${subtoken.value} reading=${subtoken.reading} />`;
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
      bufferedText: acc.bufferedText,
      output: '',
    });

    let { bufferedText, output } = reducedSubtokens;
    if (bufferedText) {
      output = boundHtmlConcat(output, reducedSubtokens.bufferedText),
      bufferedText = '';
    }

    return {
      bufferedText,
      output: html`${acc.output}<span class="token4">${output}<//>`,
    };
  };

  return html`
  <div class="parsed-sentence">
    ${nodes.reduce(renderNode, {
      bufferedText: '',
      output: '',
    }).output}
  <//>
  `
};

const App = connect('ready', actions)(
  ({ ready }) => {
    // const initialParses = [];
    // const [count, setCount] = useState(0);
    const [query, setQuery] = useState(`太郎はこの本を二郎を見た女性に渡した。
すもももももももものうち。`);
    const [nextParseId, setNextParseId] = useState(0);
    const [parses, setParses] = useState([]);
    console.log(parses);
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
      <${Sentence} key=${item.key} nodes=${item.parse} ref=${monkeyPatchSetState} />
    `;
    return html`
      <p>Preact stuff:</p>
      <form onSubmit=${onSubmit}>
        ${/* btw, we can't use React's onChange; Preact prefers browser-native onInput
        https://github.com/developit/preact/issues/1034 */''}
        <textarea class="input" value=${query} onInput=${event => setQuery(event.target.value)} />
        <button class="submitter" disabled=${!ready}>Analyse Japanese<//>
      <//>
      <div class="richOutput columnReverse">
        ${parses.map(renderParsedQuery)}
      <//>
    `;
  });
render(html`
  <${Provider} store=${store}>
    <${App} ref=${monkeyPatchSetState} />
  <//>
  `, document.getElementById('managed'));

function createAnalysisFragment(nodes) {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  div.className = 'parsed-sentence';
  div.style.order = 1;
  let isFirstNode = true;
  let bufferedText = '';
  for (const node of nodes) {
    if (node.isWhitespace) {
      div.insertAdjacentText('beforeend', node.token);
      continue;
    }
    let span;
    if (new URLSearchParams(window.location.search).get('jisho')) {
      span = document.createElement('span');
      span.className = 'token';
    } else if (new URLSearchParams(window.location.search).get('jisho_href')) {
      span = document.createElement('a');
      span.className = 'token2';
      span.href = `https://jisho.org/search/${encodeURIComponent(node.token)}`;
      span.target = '_blank';
    } else {
      span = document.createElement('span');
      span.className = 'token3';
    }
    span._mecabToken = node.token;
    let isFirstSubtoken = true;
    for (const subtoken of node.subtokens) {
      if (subtoken.type === 'kanji') {
        if (bufferedText) {
          span.insertAdjacentText('beforeend', bufferedText);
          bufferedText = '';
        }
        const ruby = document.createElement('ruby');
        const rb = document.createElement('rb');
        const rt = document.createElement('rt');

        rb.textContent = subtoken.value;
        rt.textContent = subtoken.reading;
        ruby.appendChild(rb);
        ruby.appendChild(rt);
        span.appendChild(ruby);
      } else {
        bufferedText += subtoken.value;
      }
      isFirstSubtoken = false;
    }
    if (bufferedText) {
      span.insertAdjacentText('beforeend', bufferedText);
      bufferedText = '';
    }
    div.appendChild(span);
    isFirstNode = false;
  }
  // if (bufferedText) {
  //   div.insertAdjacentText('beforeend', bufferedText);
  // }
  fragment.appendChild(div);
  return fragment;
}

function handleTokenClickJishoIframe(event) {
  const tokenNode = event.target.className === 'token'
  ? event.target
  : event.target.closest('.token');
  if (tokenNode
    && tokenNode._mecabToken) {
    console.log(tokenNode._mecabToken);
    const sentenceNode = tokenNode.closest('.parsed-sentence');
    if (!sentenceNode) {
      throw new Error('DOM not as expected');
    }
    +sentenceNode.style.order;
    Array.from(richOutputElement.children)
    .filter((element) => element.style.order > +sentenceNode.style.order)
    .sort((left, right) => right.style.order - left.style.order) // descending
    .forEach((child) => {
      child.style.order = +child.style.order+1;
    });
    if (!iframeElement) {
      iframeElement = document.createElement('iframe');
      iframeContainerElement.classList.remove('hidden');
      iframeContainerElement.appendChild(iframeElement);
    }
    currentQueryElement.classList.remove('hidden');
    currentQueryTargetElement.textContent = tokenNode._mecabToken;
    queryContainerElement.style.order = +sentenceNode.style.order+1;
    queryContainerElement.style.display = 'initial';
    iframeElement.src = `https://jisho.org/search/${encodeURIComponent(tokenNode._mecabToken)}`;
  }
}

const richOutputElement = document.getElementById('richOutput');

function handleFormSubmitted() {
	const input = document.getElementById('input').value;
  const nodes = parse(input);
  // const pretty = nodes.map((node) => node.token).join('\n');
  // outputElement.insertAdjacentText('beforeend', `${pretty}\n`);
  // outputElement.scrollTop = outputElement.scrollHeight;

  Array.from(richOutputElement.children)
  .sort((left, right) => right.style.order - left.style.order) // descending
  .forEach((child) => {
    child.style.order = +child.style.order+1;
  });

  const fragment = createAnalysisFragment(nodes);
  richOutputElement.prepend(fragment);
}

richOutputElement.addEventListener('click', function(event) {
  event.stopPropagation();
  if (new URLSearchParams(window.location.search).get('jisho')) {
    handleTokenClickJishoIframe(event);
  } else {
    handleTokenClickEdict2(event);
  }
});

function parse(sentence) {
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
  const mecabOutput = window.wrapped.mecab_sparse_tostr(window.currentPointers.tagger, sentence);
  console.log(mecabOutput);
  const mecabTokens = toMecabTokens(mecabOutput);
  const plusOriginalWhitespaces = withWhitespacesSplicedBackIn(mecabTokens, whitespaces);
  const plusInterWordWhitespaces = withInterWordWhitespaces(plusOriginalWhitespaces);
  return plusInterWordWhitespaces;
}

export {
	handleFormSubmitted,
	handleTokenClickEdict2,
  boundActions,
};