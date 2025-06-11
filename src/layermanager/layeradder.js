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
    statConf
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
  const defaultStyle = currentLayer.defaultStyle;
  const defaultTitle = currentLayer.defaultTitle;
  const altStyle = currentLayer.altStyle || [];
  const altTitle = currentLayer.altTitle || [];

  const stylesToCheck = [defaultStyle, altStyle]; // Combines defaultStyle and altStyle into an array.
  const legendResults = [];

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

        // For each style in stylesToCheck, constructs a URL to fetch the legend for that style. Uses fetch to make an HTTP request to the constructed URL.
        // Parses the response as JSON and returns an object containing the style and the parsed json.
        const legendFetches = stylesToCheck.map(style => {
          const legendUrl = `${src}service=WMS&version=1.1.0&request=GetLegendGraphic&layer=${layerId}&format=application/json&scale=401&style=${style}`;
          return fetch(legendUrl)
            .then(res => res.json())
            .then(json => ({ style, json }));
        });

        // Executes all the fetch requests in parallel using Promise.all. Waits for all the requests to complete.
        const results = (await Promise.all(legendFetches));
        // Adds all the results to the legendResults array.
        legendResults.push(...results);

        // Iterates over each result in results and checks for the conditions: Multiple Rules, Colormap, and Multiple Legends.
        results.forEach(({ json }) => {
          const value = json.Legend[0]?.rules[0]?.symbolizers[0]?.Raster?.colormap?.entries;
          if ((json.Legend[0].rules.length > 1) || (json.Legend.length > 1)) {
            theme = true;
          } else if (value) {
            theme = true;
          }
        });
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
        defaultStyle,
        defaultTitle,
        altStyle,
        altTitle,
        removable: true,
        source: srcUrl,
        abstract: abstractText,
        style: styleProperty,
        // style: defaultStyle,
        theme,
        stylePicker: [] // Initialize stylePicker
      };

      newLayer = Object.assign(newLayer, layersDefaultProps);
      // Create the stylePicker array dynamically based on altStyles and altTitles
      newLayer.stylePicker = [];

      if (theme) {
        // Add all alternative styles and titles to the stylePicker
        altStyle.forEach((style, index) => {
          const altTitleName = altTitle[index] || style; // Use the corresponding title or fallback to the style name
          newLayer.stylePicker.push({
            title: altTitleName,
            style,
            hasThemeLegend: true
          });
        });

        // Add the default style to the stylePicker
        newLayer.stylePicker.push({
          title: defaultTitle,
          style: defaultStyle,
          // defaultWMSServerStyle: true, // With this enabled it do not work to get the rigth name for the default styleName, it sets it to name + WMSServerDefault
          initialStyle: true,
          legendParams: {
            legend_options: 'dpi:300'
          }
        });
      }

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
