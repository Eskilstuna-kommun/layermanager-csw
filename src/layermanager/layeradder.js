import Origo from 'Origo';
import LayerListStore from './layerliststore';

const LayerAdder = function LayerAdder(options = {}) {
  const {
    layerId,
    cls: clsSettings = 'round compact boxshadow-subtle text-inverse icon-small',
    addIcon = '#ic_add_24px',
    mapIcon = '#ic_map_24px',
    // sourceUrl,
    // type = 'layer',
    title = 'Lägg till lager',
    src,
    viewer,
    abstract = '',
    layersDefaultProps,
    noLegendIcon,
    statConf,
    preDefinedThemePropStyles
  } = options;

  const layer = viewer.getLayer(layerId);
  const group = viewer.getGroup(layerId);
  const initialState = layer || group ? 'inactive' : 'initial';
  const initialIcon = initialState === 'initial' ? addIcon : mapIcon;
  const initialBgCls = initialState === 'initial' ? 'primary' : 'grey';
  const initialToolTip = initialState === 'initial' ? 'Lägg till lager' : 'Finns i kartan';
  const cls = `${clsSettings} layeradder ${initialBgCls}`.trim();
  const isValid = src === 'no src' ? 'hidden' : 'visible'; // decides hide or show button, depends if src exist for layer

  // Use LayerListStore to get all the added layers
  const allLayers = LayerListStore.getList();
  // Get the layerID for the current layer
  const currentLayer = allLayers.find(l => l.layerId === layerId);
  // Get defaultStyle, defaultTitle, altStyle, altTitle for the current layer
  const defaultStyleName = currentLayer.defaultStyleName;
  const defaultStyleTitle = currentLayer.defaultStyleTitle;
  const layerStyles = currentLayer.stylePicker || [{ styleName: defaultStyleName, styleTitle: defaultStyleTitle }];

  const addSources = function addSources(sources) {
    Object.keys(sources).forEach((sourceName) => {
      viewer.addSource(sourceName, sources[sourceName]);
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
    el.querySelector('svg title').innerHTML = 'Finns i kartan';
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

        // check if there are predefinedThemePropStyles and if so try to edit the given layerStyles accordingly
        const applyPredefinedThemePropStyles = () => {
          if (!Array.isArray(preDefinedThemePropStyles) || preDefinedThemePropStyles.length === 0) return;
          if (!Array.isArray(layerStyles) || layerStyles.length === 0) return;

          const predefined = preDefinedThemePropStyles.find(({ layerName }) => layerName === layerId);
          if (!predefined?.styles?.length) return;

          const layerStyleByName = new Map(layerStyles.map(ls => [ls.styleName, ls]));

          for (let i = 0; i < predefined.styles.length; i += 1) { // style of predefined.styles) {
            const target = layerStyleByName.get(predefined.styles[i].name);
            if (target) target.isThemeStyle = predefined.styles[i].isThemeStyle;
          }
        };

        applyPredefinedThemePropStyles();

        // Only fetch legends for styles that don't already have isThemeStyle
        // save index to match layerStyles with fetchPromises
        // can handle that only some styles of a layer have predefined isThemeStyle prop
        const fetchPromises = [];
        const geoserverErrorXmls = [];
        for (let i = 0; i < layerStyles.length; i += 1) {
          const style = layerStyles[i];
          if (!('isThemeStyle' in style)) { // kan bara ha om fördefinierade
            let legendUrl = `${src}service=WMS&version=1.1.0&request=GetLegendGraphic&layer=${layerId}&format=application/json&scale=401`;
            if (layerStyles.length > 1) legendUrl += `&style=${style.styleName}`;

            const p = fetch(legendUrl).then(response => {
              if (response.ok) {
                if (response.headers.get('Content-Type').includes('application/json')) {
                  return response.json();
                }
                return response.text();
              }
              return Promise.reject(new Error(`Error fetching legend for layer ${layerId}, style ${style.styleName}`));
            });
            fetchPromises.push({
              index: i,
              legendPromise: p
            });
          }
        }

        const settledPromises = await Promise.allSettled(fetchPromises.map(p => p.legendPromise));

        settledPromises.forEach((res, index) => {
          const fetchPromise = fetchPromises[index];
          const layerStyleIndex = fetchPromise.index;

          if (res.status === 'fulfilled') {
            if (typeof res.value === 'object' && 'Legend' in res.value) {
              const firstLegend = res.value.Legend?.[0];
              const rules = firstLegend?.rules;
              const rasterEntries = rules[0]?.symbolizers?.[0]?.Raster?.colormap?.entries;

              const multipleRules = Array.isArray(rules) && rules.length > 1;
              const multipleLegends = Array.isArray(res.value.Legend) && res.value.Legend.length > 1;

              layerStyles[layerStyleIndex].isThemeStyle = multipleRules || multipleLegends || Boolean(rasterEntries);
            } else { // expected Geoserver http 200 xml error report
              const parser = new DOMParser();
              const parsedXml = parser.parseFromString(res.value, 'text/xml');
              geoserverErrorXmls.push(parsedXml);
            }
          } else { // the fetch response was not ok so the allSettled individual promise rejected and here is the error reason
            console.warn(res.reason.message);
          }
        });
      }

      let legendUrls;

      if (layerStyles.length > 0) {
        legendUrls = layerStyles.map((style) => {
          const vendorParam = !style.isThemeStyle ? '&legend_options=dpi:300' : '';
          let legendUrl = `${srcUrl}?service=WMS&version=1.1.0&request=GetLegendGraphic&layer=${layerId}&FORMAT=image/png&scale=401${vendorParam}`;
          if (layerStyles.length > 1) {
            legendUrl += `&style=${style.styleName}`;
          }
          return legendUrl;
        });
      }

      let newLayer = {
        name: layerId,
        title,
        style: legendUrls[0],
        removable: true,
        source: srcUrl,
        abstract: abstractText
      };

      newLayer = Object.assign(newLayer, layersDefaultProps);

      if (currentLayer.stylePicker) {
        newLayer.stylePicker = [];
        layerStyles.forEach((style, index) => {
          // const altTitleName = altTitle[index] || style; // Use the corresponding title or fallback to the style name
          const styleObject = {
            title: style.styleTitle,
            style: style.styleName,
            hasThemeLegend: style.isThemeStyle
          };
          if (index === 0) {
            styleObject.initialStyle = true;
          }
          if (style.isThemeStyle === false) {
            styleObject.legendParams = {
              legend_options: 'dpi:300'
            };
          }
          newLayer.stylePicker.push(styleObject);
        });
      } else {
        newLayer.hasThemeLegend = layerStyles[0].isThemeStyle;
      }

      const srcObject = {};
      srcObject[`${srcUrl}`] = { url: srcUrl };
      addSources(srcObject);

      if (legendUrls && !currentLayer.stylePicker) {
        legendUrls.forEach((legendUrl, index) => {
          const style = [[
            {
              icon: { src: legendUrl },
              extendedLegend: layerStyles[index].isThemeStyle
            }]];
          viewer.addStyle(legendUrl, style);
        });
      }

      // newLayer.styleName = legendUrls[0];
      // newLayer.style = legendUrls[0];
      viewer.addLayer(newLayer);
      if (statConf) {
        const postOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            layers: [newLayer.name],
            ext: statConf.ext
          })
        };
        fetch(statConf.url, postOptions);
      }
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
