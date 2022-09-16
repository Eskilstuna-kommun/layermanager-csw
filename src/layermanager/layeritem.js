import 'Origo'
import LayerAdder from './layeradder';

const layerItem = function layerItem(options = {}) {
  const {
    style: styleOptions = {},
    data = {},
    cls: clsOptions = '',
    sourceUrl,
    viewer,
    sourceFields,
    layersDefaultProps,
    noLegendIcon
  } = options;

  const {
    title,
    layerId,
    description,
    type,
    src
  } = sourceFields;
  const cls = `${clsOptions} item`.trim();
  const style = Origo.ui.dom.createStyle(styleOptions);
  let layerAdder;
  
  const headerComponent = Origo.ui.CollapseHeader({
    title: `${data[title.name]}`,
    cls: "text-black text-grey-dark text-normal text-weight-bold"
  });
  const contentComponent = Origo.ui.Element({
    tagName: 'p',
    innerHTML: `${data[description.name]}`,
    cls: "text-grey text-smaller text-height-smaller text-fade",
    style: {"word-break":"break-word"}
  })
  const collapse = Origo.ui.Collapse({
    cls: '',
    headerComponent,
    contentComponent,
    collapseX: false,
    contentStyle: { "min-height": "35px" }
  });

  return Origo.ui.Component({
    getData: () => data,
    onInit() {
      layerAdder = LayerAdder({ 
        viewer,
        layerId: data[layerId.name],
        title: data[title.name],
        type: data[type.name],
        src: data[src.name],
        sourceUrl,
        abstract: data[description.name],
        layersDefaultProps,
        noLegendIcon
      });
      this.addComponent(layerAdder);
    },
    onRender() {
      this.dispatch('render');
    },
    render() {
      let textElements = `<div class="text-black text-grey-dark text-normal text-weight-bold">${data[title.name]}</div>
                          <p class="relative text-grey text-smaller text-height-smaller overflow-hidden">${data[description.name]}</p>`
      if (data[description.name].length > 166){
        this.addComponent(collapse);
        textElements = `${collapse.render()}`;
      }
      return `<li id="${this.getId()}" class="${cls}" style="${style}">
              <div class="flex row">
                  <div class="grow">
                    ${textElements}
                    </div>
                  <div class="flex no-grow no-shrink align-center padding-x-small">
                    ${layerAdder.render()}
                  </div>
                </div>
             </li>`
    }
  });
}

export default layerItem;