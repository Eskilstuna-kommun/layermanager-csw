export const GetAddedLayers = function GetAddedLayers(viewer, group) {
  const layers = viewer.getLayersByProperty('group', group.name);
  const addedLayers = [];

  layers.forEach((layer) => {
    let stylePicker = layer.get('stylePicker') || []; // Get stylePicker from layer in layeradder.js
    // Update the stylePicker to set initialStyle based on styleName (the name of the style)
    stylePicker = stylePicker.map((entry) => ({
      ...entry, // Spread the existing properties
      initialStyle: entry.style === layer.styleName // Update initialStyle based on styleName
    }));

    const addedLayer = {
      name: layer.get('name'),
      abstract: layer.get('abstract'),
      visible: layer.getVisible(),
      removable: layer.get('removable'),
      useLegendGraphics: layer.get('useLegendGraphics'),
      zIndex: layer.getProperties().zIndex,
      source: layer.get('sourceName'),
      style: layer.get('styleProperty'), // Set style to styleProperty, from layeradder.js
      styleName: layer.get('styleName'), // Set styleName to the current styleName, from layeradder.js
      title: layer.get('title'),
      stylePicker, // Adds stylePicker to the shared layer
      type: layer.get('type'),
      infoFormat: layer.get('infoFormat'),
      group: layer.get('group'),
      theme: layer.get('theme'),
      opacity: layer.get('opacity'),
      searchable: layer.get('searchable')
    };
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
    viewer.addStyle(layer.style, style);

    // Use the stylePicker directly from the shared layer
    const stylePicker = (layer.stylePicker || []).map((entry) => ({
      ...entry, // Spread the existing properties
      initialStyle: entry.style === layer.styleName // Update initialStyle based on layer.styleName
    }));

    // Add the layer to the viewer with the stylePicker
    const layerWithStylePicker = {
      ...layer,
      stylePicker // Add the stylePicker property
    };
    viewer.addLayer(layerWithStylePicker);
  });
};
