import { toMecabTokens, withWhitespacesSplicedBackIn, withInterWordWhitespaces } from './tokenizer/index.js';
import { edictLookup } from './edict2/index.js';
import { createElement, /*Component,*/ render } from '../web_modules/preact.js';
import { useState } from '../web_modules/preact--hooks.js';
import { Provider, connect, createStore } from '../web_modules/unistore--full/preact.es.js';
import htm from '../web_modules/htm.js';
const html = htm.bind(createElement);

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

const initialState = {
  lols: 5,
};

const store = createStore((state, action) => {
  return state;
},
initialState,
typeof devToolsExtension === 'function'
? devToolsExtension()
: undefined
);

const Child = connect(
  // mapStateToProps
  (state, ownProps) => state,
  // mapDispatchToProps
  (dispatch, ownProps) => ({}),
)( ({ dispatch }) => {
  return html`
  <div>Child
  </div>
  `
} );

const Lol = ({lol}) => {
  const [count, setCount] = useState(0);
  return html`
  <${Provider} store=${store}>
    <${Child} />
    <div>
      <div>Count:${count}</div>
      <div>Lol:${lol}</div>
      <button onClick=${() => setCount(count + 1)}>increment</button>
    </div>
  <//>
  `;
};
render(html`<${Lol} lol="hey" />`, document.getElementById('managed'));


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
};