# layermanager-csw
Slightly altered https://github.com/origo-map/layermanager to fit a csw-backend
Works as a plugin in the same way. Instructions to follow.

#### Example usage of Layermanager as plugin

First you have to create a subfolder in the Origo-map directory named plugins/ where you can put the built version of layermanager-csv.
Then you configure the index.html like in the example.

## Options
### Layermanager settings (in html file)
Option | Type | Description
---|---|---
`types` | array | A list of themes to filter the results of the csw call.
`onlyAddableLayersBtn` | boolean | Adds a button that enables to show only addable layers in the layer list. False and excluding this option behaves the same way, the button is not visible and all layers are visible.
`layersDefaultProps` | object | Default properties of the added layers.
`group` | object | Properties of the layermanager group in mapmenu .
`noAbstractInfo` | string | Custom text if the result has no abstract information.
`noSearchResultText` | string | Custom text if there is no search result.
`url` | string | URL to CSW-service.
`addLayerErrorMsg` | string | A custom error message informing the client of an error occurring due to the added layer.

The plugin can be loaded like this in an html-file:
```
        <link href="plugins/layermanager.css" rel="stylesheet">
        ...
        <script src="js/origo.min.js"></script>
        <script src="plugins/lm.min.js"></script>
        <script type="text/javascript">
            var origo = Origo('config file.json');
            origo.on('load', function(viewer) {

                var layermanager = Layermanager({
                    types: [
                        "Addresses",
                        "Geology",
                        "Roads",
                        "Buildings",
                        "Oceans",
                    ],
                    onlyAddableLayersBtn: true,
                    layersDefaultProps: {
                        group: "mylayers",
                        queryable: true,
                        type: "WMS",
                        visible: true,
                        searchable:"always",
                        infoFormat: "text/html",
                        useLegendGraphics: true,
                        legendGraphicSettings: {
                            transparent: true,
                            service: "WMS"
                        }
                    },
                    group: {
                        name: "mylayers",
                        title: "My layers",
                        expanded: true,
                        position: "bottom"
                    },
                    noAbstractInfo: "Ingen information",
                    noSearchResultText: "No results found",
                    url: "URL to CSW-service",
                    sourceFields: {
                        description: {
                            "name": "description"
                        },
                        title: {
                            "name": "title"
                        },
                        layerId: {
                            "name": "layerId"
                        },
                        type: {
                            "name": "theme"
                        },
                        tags: {
                            "name": "tags"
                        },
                        src:{
                            "name": "src"
                        }
                    },
                    addLayerErrorMsg: "There was a problem trying to add a layer. You are welcome to report this to SUPPORT@SUPPORT.com"
                });
                viewer.addComponent(layermanager);
                
            });
        </script>
```

