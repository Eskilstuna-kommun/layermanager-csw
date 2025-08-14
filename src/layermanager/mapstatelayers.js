export const GetAddedLayers = function GetAddedLayers(viewer, group) {
  const layers = viewer.getLayersByProperty('group', group.name);
  const addedLayers = [];

  layers.forEach((layer) => {
    const stylePicker = layer.get('stylePicker') || []; // Get stylePicker from layer in layeradder.js
    // Update the stylePicker to set initialStyle based on styleName (the name of the style

    const addedLayer = {
      name: layer.get('name'),
      abstract: layer.get('abstract'),
      visible: layer.getVisible(),
      removable: layer.get('removable'),
      zIndex: layer.getProperties().zIndex,
      source: layer.get('sourceName'),
      style: layer.get('styleName'),
      styleName: layer.get('styleName'),
      title: layer.get('title'),
      type: layer.get('type'),
      infoFormat: layer.get('infoFormat'),
      group: layer.get('group'),
      hasThemeLegend: layer.get('hasThemeLegend') || layer.get('theme'),
      opacity: layer.get('opacity'),
      searchable: layer.get('searchable')
    };
    if (stylePicker.length > 0) {
      addedLayer.stylePicker = stylePicker;
      addedLayer.altStyleIndex = stylePicker.map((s) => s.style).indexOf(layer.get('styleName'));
    } else addedLayer.styleName = 'default';
    addedLayers.push(addedLayer);
  });
  return addedLayers;
};

export const ReadAddedLayersFromMapState = function ReadAddedLayersFromMapState(sharedLayers, viewer) {
  // Sort layers on z-index before adding them to map to keep order
  sharedLayers.sort((a, b) => {
    if (a.zIndex < b.zIndex) return -1;
    else if (b.zIndex < a.zIndex) return 1;
    return 0;
  });
  sharedLayers.forEach((layer) => {
    viewer.addSource(layer.source, { url: layer.source });

    if (!(layer?.stylePicker?.length > 0)) {
      const style = [[
        {
          icon: { src: layer.style },
          extendedLegend: layer.theme || layer.hasThemeLegend
        }]];

      viewer.addStyle(layer.style, style);
    }
    viewer.addLayer(layer);
  });
};
