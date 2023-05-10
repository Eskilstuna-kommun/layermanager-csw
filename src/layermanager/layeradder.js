import 'Origo';
import readAsync from './readasync';

const LayerAdder = function LayerAdder(options = {}) {
  const {
    layerId,
    cls: clsSettings = 'round compact boxshadow-subtle text-inverse icon-small',
    addIcon = '#ic_add_24px',
    mapIcon = '#ic_map_24px',
    sourceUrl,
    type = 'layer',
    title = 'Lägg till lager',
    src,
    viewer,
    abstract = '',
    layersDefaultProps,
    noLegendIcon
  } = options;

  const layer = viewer.getLayer(layerId);
  const group = viewer.getGroup(layerId);
  const initialState = layer || group ? 'inactive' : 'initial';
  const initialIcon = initialState === 'initial' ? addIcon : mapIcon;
  const initialBgCls = initialState === 'initial' ? 'primary' : 'grey';
  const initialToolTip = initialState === 'initial' ? 'Lägg till lager' : 'Finns i kartan';
  const cls = `${clsSettings} layeradder ${initialBgCls}`.trim();
  const isValid = src == 'no src' ? 'hidden' : 'visible'; // decides hide or show button, depends if src exist for layer

  const fetchLayer = async function fetchLayer() {
    const body = JSON.stringify([{
      id: layerId,
      type
    }]);
    try {
      const result = await fetch(sourceUrl, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        method: 'POST',
        mode: 'cors',
        body
      }).then(response => response.json());
      return result;
    } catch (err) {
      console.log(err);
    }
  };

  const addSources = function addSources(sources) {
    Object.keys(sources).forEach((sourceName) => {
      viewer.addSource(sourceName, sources[sourceName]);
    });
  };

  const addStyles = function addStyles(styles) {
    Object.keys(styles).forEach((styleName) => {
      viewer.addStyle(styleName, styles[styleName]);
    });
  };

  const initial = function initial() {
    this.setIcon(addIcon);
    this.title = 'Lägg till lager';
    const el = document.getElementById(this.getId());
    el.classList.remove('grey');
    el.classList.add('primary');
  };

  const inactive = function inactive() {
    this.setIcon(mapIcon);
    const el = document.getElementById(this.getId());
    el.children[0].children[0].children[0].innerHTML = 'Finns i kartan';
    el.classList.remove('primary');
    el.classList.add('grey');
  };

  const click = async function click() {
    if (this.getState() === 'initial') {
      this.setState('loading');
      // add layers with same format as in config-json
      // currently WMS layers from a Geoserver and ArcGIS Server are supported
      const abstractText = (abstract === 'no description') ? '' : abstract;
      let srcUrl = src;
      let legendJson = false;
      let styleProperty;
      let theme = false;
      // assume ArcGIS WMS based on URL. 'OR' as webadaptors need not be called 'arcgis'
      if (srcUrl.includes('arcgis') || srcUrl.includes('WMSServer')) {
        let jsonUrl = srcUrl.replace(/\/arcgis(\/rest)?\/services\/([^/]+\/[^/]+)\/MapServer\/WMSServer/, '/arcgis/rest/services/$2/MapServer');
        jsonUrl = `${jsonUrl}/legend?f=json`;

        try {
          const response = await fetch(jsonUrl);
          legendJson = await response.json();
          const filteredLayersArray = legendJson.layers.filter(l => l.layerName === layerId);
          if (filteredLayersArray[0].legend.length > 1) {
            theme = true;
          }
        } catch (error) {
          console.warn(error);
        }
        layersDefaultProps.infoFormat = 'application/geo+json';
      } else {
      // not an ArcGIS Server WMS layer, assume Geoserver
        if (src[src.length - 1] === '?') srcUrl = src.substring(0, src.length - 1); // some extra '?' from request breaks the url
        const legendUrl = `${src}service=WMS&version=1.1.0&request=GetLegendGraphic&layer=${layerId}&format=application/json&scale=401`;
        const legendResult = await fetch(legendUrl);

        try {
          legendJson = await legendResult.json();
        } catch (error) {
          console.warn(error);
        }

        if (legendJson) {
          const value = legendJson.Legend[0]?.rules[0]?.symbolizers[0]?.Raster?.colormap?.entries;
          if ((legendJson.Legend[0].rules.length > 1) || (legendJson.Legend.length > 1)) {
            theme = true;
          } else if (value) {
            theme = true;
          }
        }
      }

      if (legendJson) {
        let vendorParam = '';
        if (!theme) vendorParam = '&legend_options=dpi:300';
        styleProperty = `${srcUrl}?service=WMS&version=1.1.0&request=GetLegendGraphic&layer=${layerId}&FORMAT=image/png&scale=401${vendorParam}`;
      } else {
        styleProperty = noLegendIcon;
      }

      let newLayer = {
        name: layerId,
        title,
        removable: true,
        source: srcUrl,
        abstract: abstractText,
        style: styleProperty,
        theme
      };

      newLayer = Object.assign(newLayer, layersDefaultProps);
      const srcObject = {};
      srcObject[`${srcUrl}`] = { url: srcUrl };
      addSources(srcObject);

      if (styleProperty) {
        const style = [[
          {
            icon: { src: styleProperty },
            extendedLegend: theme
          }]];
        viewer.addStyle(styleProperty, style);
      }
      viewer.addLayer(newLayer);
      this.setState('inactive');
    }
  };

  return Origo.ui.Button({
    style: `visibility: ${isValid}`, // hide button if you cant add it
    click,
    title: initialToolTip,
    cls,
    icon: initialIcon,
    iconStyle: {
      fill: '#fff'
    },
    validStates: ['initial', 'inactive'],
    methods: {
      initial,
      inactive
    },
    state: initialState
  });
};

export default LayerAdder;
