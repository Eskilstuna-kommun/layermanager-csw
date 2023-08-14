import 'Origo';

const LayerSearch = function LayerSearch(options = {}) {
  const {
    cls = '',
    onlyAddableLayersBtn,
    placeholder = 'Sök lager i katalogen',
    style: styleOptions = {
      height: '2.125rem',
      width: 'calc(100% - 2rem)'
    }
  } = options;

  const keyCodes = {
    9: 'tab',
    16: 'shift',
    17: 'ctrl',
    27: 'esc',
    37: 'left',
    39: 'right',
    13: 'enter',
    38: 'up',
    40: 'down'
  };

  const style = Origo.ui.dom.createStyle(styleOptions);
  let searchText = '';
  let searchEl;
  const searchId = Origo.ui.cuid();
  let clearButton;
  let searchButton;
  let typingTimer;
  let addLayerFilterButton;
  const getFilterBtn = () => addLayerFilterButton;
  const isItActive = onlyAddableLayersBtn ? 'active' : 'inactive';

  return Origo.ui.Component({
    getFilterBtn,
    onInit() {
      clearButton = Origo.ui.Button({
        cls: 'compact icon-smaller no-shrink hidden',
        icon: '#ic_close_24px',
        style: {
          'align-self': 'flex-end'
        },
        state: 'hidden',
        validStates: ['initial', 'hidden'],
        click: () => {
          searchEl.value = '';
          this.toggleSearchState('');
        }
      });
      searchButton = Origo.ui.Button({
        cls: 'compact icon-smaller no-shrink',
        icon: '#ic_search_24px'
      });
      this.addComponent(clearButton);

      addLayerFilterButton = Origo.ui.Button({
        cls: 'icon-small padding-left-large no-shrink',
        click() {
          if (this.getState() == 'inactive') {
            this.dispatch('change');
            this.setState('active');
          } else {
            this.setState('inactive');
            this.dispatch('change');
          }
          const searchText = document.getElementById(this.getId()).parentNode.getElementsByTagName('input')[0].value;
          this.dispatch('change:text', { searchText });
        },
        state: `${isItActive}`,
        tooltipText: 'Visar enbart tilläggbara lager',
        tooltipPlacement: 'west',
        icon: '#ic_add_notes_24px',
        data: { title: 'Tilläggbara lager' }
      });
      if (onlyAddableLayersBtn) {
        this.addComponent(addLayerFilterButton);
      }
    },

    onRender() {
      searchEl = document.getElementById(searchId);
      searchEl.addEventListener('keyup', this.onSearch.bind(this));
      searchEl.focus();
      this.dispatch('render');
    },
    render() {
      searchText = '';
      clearButton.setState('hidden');
      if (onlyAddableLayersBtn) {
        return `<div id="${this.getId()}" class="flex row align-center no-grow no-shrink bg-grey-lightest padding-small margin-bottom rounded ${cls}" style="${style}">
                ${searchButton.render()}
                <input id="${searchId}" class="flex grow padding-left-small search small grey" placeholder="${placeholder}">
                ${clearButton.render()}
                ${addLayerFilterButton.render()}
              </div>`;
      }
      return `<div id="${this.getId()}" class="flex row align-center no-grow no-shrink bg-grey-lightest padding-small margin-bottom rounded ${cls}" style="${style}">
                ${searchButton.render()}
                <input id="${searchId}" class="flex grow padding-left-small search small grey" placeholder="${placeholder}">
                ${clearButton.render()}
              </div>`;
    },
    onSearch(e) {
      const key = e.keyCode;
      if (key == 27) return; // allows layermanager.checkESC to execute when ESC is pressed.
      e.stopPropagation();
      if (!(key in keyCodes)) {
        const currentSearchValue = searchEl.value || '';
        const currentSearchText = currentSearchValue.toLowerCase();
        this.toggleSearchState(currentSearchText);
      }
    },
    toggleSearchState(newSearchText) {
      if (newSearchText !== searchText) {
        if (!(newSearchText.length)) {
          clearButton.setState('hidden');
        } else if (newSearchText.length && !(searchText.length)) {
          clearButton.setState('initial');
        }
        searchText = newSearchText;
        clearTimeout(typingTimer);
        setTimeout(() => {
          this.dispatch('change:text', { searchText });
        }, 200);
      }
    }
  });
};

export default LayerSearch;
