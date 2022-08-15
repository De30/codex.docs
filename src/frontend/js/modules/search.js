import { debounce } from '../utils/decorators';
import Shortcut from '@codexteam/shortcuts';
import axios from 'axios';

export default class Search {
  constructor() {
    this.nodes = {
      overlay: null,
      searchWrapper: null,
      searchInput: null,
      searchResultWrapper: null
    };

    this.isVisible = false;

    this.PLACEHOLDER = 'Find in documents...';

    this.TOGGLER_SHORTCUT = 'CMD+SHIFT+F';
    this.shortcut = null;

    this.DEBOUNCE_TIME = 300;
    this.debouncedSearch = null;

    this.MIN_SEARCH_LENGTH = 1;

    this.CSS = {
      overlay: 'search-overlay',
      overlayVisible: 'search-overlay--visible',
      searchWrapper: 'search-wrapper',
      searchInput: 'search-input',
      searchResultWrapper: 'search-result-wrapper',

      searchResultSuggestions: 'search-result-suggestions',
      searchResultSuggestionItem: 'search-result-suggestions-item',

      searchResultItem: 'search-result-item',
      searchResultItemTitle: 'search-result-item__title',
      searchResultItemDescription: 'search-result-item__description',

      blur: 'blurred',
      noscroll: 'noscroll'
    };
  }

  init(settings = {}, moduleEl) {
    console.log('search init');

    this.createSearchOverlay();
    this.createDebouncedSearch();
    this.enableShortcutListening();

    // ! force open search overlay
    // this.toggleSearchOverlay(true);
    // const testString = 'api';
    // this.nodes.searchInput.value = testString;
    // this.debouncedSearch(testString);
  }

  createSearchOverlay() {
    this.nodes.overlay = document.createElement('div');
    this.nodes.overlay.classList.add(this.CSS.overlay);
    this.nodes.overlay.addEventListener('click', this.searchOverlayClickProcessor.bind(this));

    this.nodes.searchWrapper = document.createElement('div');
    this.nodes.searchWrapper.classList.add(this.CSS.searchWrapper);

    this.nodes.searchInput = document.createElement('input');
    this.nodes.searchInput.classList.add(this.CSS.searchInput);
    this.nodes.searchInput.setAttribute('type', 'search');
    this.nodes.searchInput.setAttribute('placeholder', this.PLACEHOLDER);
    this.nodes.searchInput.setAttribute('autocomplete', 'off');
    this.nodes.searchInput.addEventListener('input', this.searchInputOnchangeProcessor.bind(this));
    this.nodes.searchWrapper.appendChild(this.nodes.searchInput);

    this.nodes.searchResultWrapper = document.createElement('div');
    this.nodes.searchResultWrapper.classList.add(this.CSS.searchResultWrapper);
    this.nodes.searchWrapper.appendChild(this.nodes.searchResultWrapper);

    this.nodes.overlay.appendChild(this.nodes.searchWrapper);
    document.body.appendChild(this.nodes.overlay);
  }

  searchOverlayClickProcessor(event) {
    if (event.target !== this.nodes.overlay) {
      return;
    }

    this.toggleSearchOverlay(false);
  }

  searchInputOnchangeProcessor(event) {
    const text = event.target.value;

    if (text.length < this.MIN_SEARCH_LENGTH) {
      this.clearSearchResults();
      return;
    }

    this.debouncedSearch(text);
  }

  enableShortcutListening() {
    this.shortcut = new Shortcut({
      name : this.TOGGLER_SHORTCUT,
      on : document.body,
      callback: (event) => {
        this.toggleSearchOverlay();
      }
    });
  }

  toggleSearchOverlay(force) {
    this.isVisible = force || !this.isVisible;

    this.nodes.overlay.classList.toggle(this.CSS.overlayVisible, this.isVisible);
    document.body.classList.toggle(this.CSS.noscroll, this.isVisible);

    // blur everything except search overlay
    try {
      document.getElementsByClassName('docs-header')[0].classList.toggle(this.CSS.blurred, this.isVisible);
      document.getElementsByClassName('docs')[0].classList.toggle(this.CSS.blurred, this.isVisible);
    } catch (e) {}

    this.nodes.searchInput.focus();
  }

  createDebouncedSearch() {
    this.debouncedSearch = debounce(this.getSearchResults, this.DEBOUNCE_TIME);
  }

  getSearchResults(text) {

    axios.get('/api/search', {
      params: {
        text
      }
    })
      .then(this.showSearchResult.bind(this));
  }

  clearSearchResults() {
    this.nodes.searchResultWrapper.innerHTML = '';
  }

  showSearchResult({ data }) {
    this.clearSearchResults();

    // const suggestionsWrapper = this.generateSearchSuggestions(data.result.suggestions);
    //
    // this.nodes.searchResultWrapper.appendChild(suggestionsWrapper);

    data.result.pages.forEach(page => {
      const result = document.createElement('a');
      result.classList.add(this.CSS.searchResultItem);
      result.setAttribute('href', `/${page.uri}`);

      const title = document.createElement('div');
      title.classList.add(this.CSS.searchResultItemTitle);
      title.innerHTML = page.title;
      result.appendChild(title);

      const description = document.createElement('div');
      description.classList.add(this.CSS.searchResultItemDescription);
      description.innerHTML = `${page.shortBody}`;
      // result.appendChild(description);

      this.nodes.searchResultWrapper.appendChild(result);
    });
  }

  // generateSearchSuggestions(suggestions = []) {
  //   const suggestionsWrapper = document.createElement('div');
  //
  //   suggestionsWrapper.classList.add(this.CSS.searchResultSuggestions);
  //
  //   suggestions.forEach(suggestion => {
  //     const suggestionItem = document.createElement('span');
  //
  //     suggestionItem.classList.add(this.CSS.searchResultSuggestionItem);
  //     suggestionItem.innerHTML = suggestion;
  //     suggestionItem.addEventListener('click', this.searchSuggestionClickProcessor.bind(this));
  //
  //     suggestionsWrapper.appendChild(suggestionItem);
  //   });
  //
  //   return suggestionsWrapper;
  // }
  //
  // searchSuggestionClickProcessor(event) {
  //   const word = event.target.innerHTML;
  //
  //   const searchString = this.nodes.searchInput.value;
  //   const searchStringWords = searchString.split(' ');
  //
  //   searchStringWords.pop();
  //   searchStringWords.push(word);
  //
  //   this.nodes.searchInput.value = searchStringWords.join(' ');
  //
  //   this.debouncedSearch(this.nodes.searchInput.value);
  // }
}
