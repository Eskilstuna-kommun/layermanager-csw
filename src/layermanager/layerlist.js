import 'Origo';
import LayerItem from './layeritem';
import layerRequester from './layerrequester';

const LayerList = function LayerList(options = {}) {
  const {
    cls: clsSettings = '',
    sourceFields,
    sourceUrl,
    url,
    viewer,
    noSearchResultText = 'No results..',
    noLegendIcon = 'img/png/raster.png',
    noAbstractInfo,
    layersDefaultProps,
    layerSearch
  } = options;

  let layerItems;
  let scrollPos; // control scroll position when loading in more
  const searchFields = Object.keys(sourceFields).reduce((prev, curr) => {
    if (sourceFields[curr].searchable) {
      return prev.concat(curr);
    }
    return prev;
  }, []);

  const renderListItems = components => components.reduce((acc, comp) => acc + comp.render(), '');

  const sortAscending = (list, key) => {
    if (key) {
      return list.sort((a, b) => ((a[key] > b[key]) ? 1 : ((b[key] > a[key]) ? -1 : 0)));
    }
    return list;
  };

  const createLayerItems = (list) =>
    // const sorted = sortAscending(list, sourceFields.title.name);
    // let CSW-call do the sorting
    list.map((layer) => LayerItem({
      data: layer,
      sourceFields,
      sourceUrl,
      url,
      viewer,
      layersDefaultProps,
      noLegendIcon
    }));
  const findMatch = (searchString, data) => {
    const isMatch = searchFields.reduce((result, field) => {
      const searchField = sourceFields[field].name;
      if (searchField) {
        let searchData = data[searchField];
        if (searchData) {
          searchData = searchData.toLowerCase();
          if (searchData.search(searchString) > -1) return true;
        }
      }
      return result;
    }, false);
    return isMatch;
  };

  const searchByText = function searchByText(searchString) {
    const matches = layerItems.filter((layerItem) => {
      const data = layerItem.getData();
      const isMatch = findMatch(searchString, data);
      return isMatch;
    });
    return matches;
  };

  const noItemsMessage = Origo.ui.Component({
    render() {
      return `<li id="${this.getId()}">
              ${noSearchResultText}
         </li>`;
    }
  });

  return Origo.ui.Component({
    addLayers(list) {
      layerItems = createLayerItems(list);
      this.addComponents(layerItems);
      this.update();
    },
    onRender() {
      scrollPos = 0;
    },
    render(cmps) {
      const components = cmps || this.getComponents();

      // Empty array means no items to show, add a message as visual feedback
      if (components.length == 0) {
        components.push(noItemsMessage);
        this.addComponent(noItemsMessage);
      }
      return `<div id="${this.getId()}" class="o-list-container flex column overflow-auto-y padding-right-large">
                <ul class="divided list">${renderListItems(components)}</ul>
              </div>`;
    },
    search(searchText) {
      const filters = viewer.getControlByName('layermanager').getActiveFilters();
      layerRequester({ // new request with searchstring
        searchText,
        themes: filters,
        noAbstractInfo,
        url,
        layerSearch
      });
      scrollPos = document.getElementById(this.getId()).scrollTop;
    },
    update(cmps) {
      const el = document.getElementById(this.getId());
      const htmlString = cmps ? this.render(cmps) : this.render();
      const newEl = Origo.ui.dom.html(htmlString);
      el.parentNode.replaceChild(newEl, el);
      this.dispatch('render');
      // After rendering and updating is done, set the scroll event
      const currentEl = document.getElementById(this.getId());
      let ready = true;
      currentEl.addEventListener('scroll', async () => {
        if ((currentEl.scrollTop > 0) && (Math.ceil(currentEl.scrollTop + currentEl.clientHeight) >= currentEl.scrollHeight) && ready) {
          ready = false;
          scrollPos = currentEl.scrollHeight - currentEl.offsetHeight;
          const searchText = currentEl.parentNode.getElementsByTagName('input')[0].value;
          const filters = viewer.getControlByName('layermanager').getActiveFilters();
          await layerRequester({
            searchText,
            noAbstractInfo,
            themes: filters,
            startRecord: this.getComponents().length + 1,
            extend: true,
            url,
            layerSearch
          });
          ready = true;
        }
      });
      currentEl.scrollTop = scrollPos;
    }
  });
};

export default LayerList;
