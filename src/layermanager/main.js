import 'Origo';
import LayerListStore from './layerliststore';
import LayerList from './layerlist';
import LayerSearch from './layersearch';

const Main = function Main(options = {}) {
  const {
    onlyAddableLayersBtn,
    cls: clsSettings = ''
  } = options;

  const cls = `${clsSettings} layer-list flex column overflow-hidden`.trim();
  let layerList;
  let layerSearch;
  const getLayerSearch = () => layerSearch;

  return Origo.ui.Component({
    getLayerSearch,
    onInit() {
      layerSearch = LayerSearch({ onlyAddableLayersBtn });
      options.layerSearch = layerSearch;
      layerList = LayerList(options);
      this.addComponent(layerList);
      this.addComponent(layerSearch);
      LayerListStore.on('change', this.onUpdateListStore.bind(this));
      layerSearch.on('change:text', this.onUpdateLayerList);
      layerSearch.getFilterBtn().on('change:text', this.onUpdateLayerList);
    },
    onRender() {
      this.dispatch('render');
    },
    render() {
      return `<div id="${this.getId()}" class="flex column grow relative ${cls}" style="width: 100%;">
                <div class=""><h6 class="text-weight-bold text-grey-dark">Katalog</h6></div>
                ${layerSearch.render()}
                ${layerList.render()}
             </div>`;
    },
    onUpdateLayerList(e) {
      layerList.search(e.searchText);
    },
    onUpdateListStore() {
      const list = LayerListStore.getList();
      layerList.clearComponents();
      layerList.addLayers(list);
    }
  });
};

export default Main;
