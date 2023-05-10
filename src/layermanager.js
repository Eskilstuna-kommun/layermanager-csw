import 'Origo';
import swal from 'sweetalert';
import FilterMenu from './layermanager/filtermenu';
import LayerListStore from './layermanager/layerliststore';
import Main from './layermanager/main';
import layerRequester from './layermanager/layerrequester';
import { onAddDraggable, onRemoveDraggable, InitDragAndDrop } from './layermanager/dragdrop';
import { GetAddedLayers, ReadAddedLayersFromMapState } from './layermanager/mapstatelayers';

const Layermanager = function Layermanager(options = {}) {
  const {
    target
  } = options;
  const {
    cls: clsSettings = 'control width-52',
    sourceFields,
    url,
    sourceUrl,
    group,
    layersDefaultProps,
    noSearchResultText,
    noAbstractInfo,
    noLegendIcon,
    types,
    addLayerErrorMsg
  } = options;

  const cls = `${clsSettings} flex fade-in box center-center padding-y-small padding-left layer-manager overflow-hidden`.trim();

  let filterMenu;
  let main;
  let viewer;
  let isActive = false;
  const backDropId = Origo.ui.cuid();
  let searchText = '';
  const name = 'layermanager';
  const clearCls = 'absolute round small icon-smaller grey-lightest';
  const icon = '#ic_clear_24px';
  const closeButton = Origo.ui.Button({
    cls: clearCls,
    icon,
    style: {
      right: '1rem',
      top: '1rem'
    }
  });

  const openBtn = Origo.ui.Button({
    cls: 'round compact primary icon-small margin-x-smaller',
    click() {
      viewer.dispatch('active:layermanager');
    },
    title: 'Lägg till lager',
    style: {
      'align-self': 'center'
    },
    icon: '#o_add_24px',
    iconStyle: {
      fill: '#fff'
    }
  });

  const setActive = function setActive(e) {
    if (!isActive) {
      // searchText might have value if it was given with dispatch
      searchText = e.searchText;
      isActive = true;
      this.render();
    }
  };

  const onClickClose = function onClickClose() {
    document.getElementById(this.getId()).remove();
    document.getElementById(backDropId).remove();
    isActive = false;
    searchText = '';
    this.dispatch('close');
  };

  function checkESC(e) {
    if (e.keyCode == 27) {
      closeButton.dispatch('click');
    }
  }

  function addAddedLayersToMapState(state) {
    state[name] = GetAddedLayers(viewer, group);
  }

  return Origo.ui.Component({
    name,
    getErrorMsg() {
      return addLayerErrorMsg;
    },
    onAdd(e) {
      viewer = e.target;
      viewer.on('active:layermanager', setActive.bind(this));
      viewer.addGroup(group);
      InitDragAndDrop(group);
      viewer.on('addlayer', (l) => {
        const addedLayer = viewer.getLayer(l.layerName);
        if (addedLayer.get('group') == group.name) onAddDraggable(addedLayer);
      });
      viewer.getMap().getLayers().on('remove', (e) => {
        const removedLayer = e.element;
        if (removedLayer.get('group') == group.name) onRemoveDraggable(removedLayer);
      });
      const legend = viewer.getControlByName('legend');
      legend.addButtonToTools(openBtn);
      main = Main({
        viewer,
        sourceFields,
        sourceUrl,
        url,
        layersDefaultProps,
        noSearchResultText,
        noAbstractInfo,
        noLegendIcon
      });
      filterMenu = FilterMenu({ types });
      this.addComponent(closeButton);
      this.addComponent(main);
      this.addComponent(filterMenu);
      filterMenu.on('filter:change', main.onUpdateLayerList);
      closeButton.on('click', onClickClose.bind(this));

      const sharemap = viewer.getControlByName('sharemap');
      sharemap.addParamsToGetMapState(name, addAddedLayersToMapState);
      const sharedLayers = viewer.getUrlParams()[name];
      if (sharedLayers) {
        ReadAddedLayersFromMapState(sharedLayers, viewer);
        if (viewer.getControlByName('legend').getState().visibleLayersViewActive) {
          viewer.getControlByName('legend').setVisibleLayersViewActive(true);
        }
      }
    },
    getActiveFilters() {
      return filterMenu.getActiveFilters();
    },
    onInit() {
      this.on('render', this.onRender);
    },
    onRender() {
      LayerListStore.clear();
      layerRequester({ url, searchText, noAbstractInfo });
      document.getElementById(backDropId).addEventListener('click', () => { closeButton.dispatch('click'); });
      window.addEventListener('keyup', checkESC, { once: true });
    },
    render() {
      const template = `
      <div id=${backDropId} style="width: 100%;height: 100%;background: #00000080;z-index: 51;">
      </div>
      <div id="${this.getId()}" class="${cls}" style="height: 700px; z-index: 52;" >      
          <div class="relative padding-y flex overflow-hidden width-100" ">
            <div class="flex row width-100 overflow-hidden filter-main-container">
              ${filterMenu.render()}
              ${main.render()}
            </div>
          </div>
          ${closeButton.render()}  
        </div>
      `;
      const elLayerManger = Origo.ui.dom.html(template);
      document.getElementById(viewer.getMain().getId()).appendChild(elLayerManger);
      this.dispatch('render');
    }
  });
};

// if (window.Origo) {
//  Origo.controls.Layermanager = Layermanager;
// }

export default Layermanager;
