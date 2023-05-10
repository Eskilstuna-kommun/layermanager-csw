export const GetAddedLayers = function GetAddedLayers(viewer, group) {
  const layers = viewer.getLayersByProperty('group', group.name);
  const addedLayers = [];
  layers.forEach((layer) => {
    const addedLayer = {
      name: layer.get('name'),
      abstract: layer.get('abstract'),
      visible: layer.getVisible(),
      removable: layer.get('removable'),
      useLegendGraphics: layer.get('useLegendGraphics'),
      zIndex: layer.getProperties().zIndex,
      source: layer.get('sourceName'),
      style: layer.get('style'),
      title: layer.get('title'),
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
    viewer.addLayer(layer);
  });
};
