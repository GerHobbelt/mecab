import { edictLookup } from './edict2/index.js';

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
      console.log(edictLookup(dictionaries, tokenNode._mecabToken));
    });
  }
}

export {
	handleTokenClickEdict2,
};