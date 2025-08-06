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
      style: layer.get('style'), // Set style to styleProperty, from layeradder.js
      title: layer.get('title'),
      // stylePicker, // Adds stylePicker to the shared layer
      type: layer.get('type'),
      infoFormat: layer.get('infoFormat'),
      group: layer.get('group'),
      theme: layer.get('hasThemeLegend'),
      opacity: layer.get('opacity'),
      searchable: layer.get('searchable')
    };
    if (stylePicker.length > 0) addedLayer.stylePicker = stylePicker;
    console.log('GetAddedLayers: addedLayer:', addedLayer);
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

    const style = [[
      {
        icon: { src: layer.style },
        extendedLegend: layer.theme
      }]];
      console.log('layer:', layer);
    viewer.addStyle(layer.style, style);

    viewer.addLayer(layer);
  });
};
