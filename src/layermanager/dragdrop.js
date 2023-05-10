import 'drag-drop-touch';

const addedLayers = [];
const zIndexStart = 0.1;
const dropZone = '<li title="drop" id="dropSlot" class="dropzone"></li>';
let draggedElement;
let zIndexCounter = zIndexStart;

const contentFromChildEl = function contentFromChildEl(element) {
  if (element.childElementCount < 1) return '';
  const childrenElements = Array.from(element.childNodes);
  return childrenElements.find(child => child.tagName === 'DIV').textContent;
};

const addDropSupport = function addDropSupport(el) {
  el.addEventListener('dragover', (event) => { event.preventDefault(); }, false);
  el.addEventListener('dragenter', (event) => { if (event.target.title === 'drop') { event.target.style.background = '#008FF5'; } }, false);
  el.addEventListener('dragleave', (event) => { if (event.target.title === 'drop') { event.target.style.background = ''; } }, false);
  el.addEventListener('drop', (event) => {
    event.preventDefault();
    // layer above dropzone
    let targetNeighbourTitle = '';
    event.target.style.background = '';

    if (event.target.title === 'drop') {
      const otherLayers = [];
      const parent = draggedElement.parentNode;
      let moveLayer = true;
      let dropIndex = Array.prototype.indexOf.call(parent.childNodes, event.target);
      let layerDragged;
      let layerTarget;
      let layerDraggedZIndex;
      let layerTargetZIndex;
      let dropBelow = false;
      const draggedElementTitle = contentFromChildEl(draggedElement);

      if (dropIndex === 0) {
        targetNeighbourTitle = contentFromChildEl(event.target.nextSibling);
        if (targetNeighbourTitle === draggedElementTitle) {
          moveLayer = false;
        } else {
          addedLayers.forEach((layer) => {
            if (layer.getProperties().title === draggedElementTitle) {
              layerDragged = layer;
            } else if (layer.getProperties().title === targetNeighbourTitle) {
              layerTarget = layer;
              dropBelow = false;
            } else {
              otherLayers.push(layer);
            }
          });
        }
      } else {
        // layer below dropzone
        let nextSiblingTitle = '';
        if (dropIndex !== -1) {
          targetNeighbourTitle = contentFromChildEl(event.target.previousSibling);
          // nextSiblingTitle = contentFromChildEl(event.target.nextSibling);
        } else {
          dropIndex = Array.prototype.indexOf.call(parent.childNodes, parent.lastElementChild) - 1;
          targetNeighbourTitle = contentFromChildEl(parent.childNodes[dropIndex].previousSibling);
          nextSiblingTitle = contentFromChildEl(parent.childNodes[dropIndex].nextSibling);
        }
        if (targetNeighbourTitle === draggedElementTitle || nextSiblingTitle === draggedElementTitle) {
          moveLayer = false;
        } else {
          addedLayers.forEach((layer) => {
            if (layer.getProperties().title === draggedElementTitle) layerDragged = layer;
            else if (layer.getProperties().title === targetNeighbourTitle) {
              layerTarget = layer;
              dropBelow = true;
            } else {
              otherLayers.push(layer);
            }
          });
        }
      }

      if (moveLayer) {
        const zIndexList = [];

        if (dropBelow) {
          layerDragged.setZIndex(layerTarget.getZIndex() - 0.01);
        } else {
          layerDragged.setZIndex(layerTarget.getZIndex() + 0.01);
        }

        zIndexList.push(layerDragged.getZIndex());
        zIndexList.push(layerTarget.getZIndex());
        layerTargetZIndex = layerTarget.getZIndex();
        layerDraggedZIndex = layerDragged.getZIndex();

        // sets the z indexes on all layers based on the drag and drop locations
        otherLayers.forEach((element) => {
          if (element.getZIndex() === layerTargetZIndex) {
            element.setZIndex(element.getZIndex() - 0.01);
            zIndexList.push(element.getZIndex());
          } else if (element.getZIndex() < layerTargetZIndex && !zIndexList.includes(element.getZIndex())) {
            element.setZIndex(element.getZIndex() - 0.01);
            zIndexList.push(element.getZIndex());
          } else if (element.getZIndex() < layerTargetZIndex && zIndexList.includes(element.getZIndex())) {
            let z = element.getZIndex() - 0.01;
            while (zIndexList.includes(z)) {
              z -= 0.01;
            }
            element.setZIndex(z);
            zIndexList.push(element.getZIndex());
          } else if (element.getZIndex() > layerDraggedZIndex && !zIndexList.includes(element.getZIndex())) {
            element.setZIndex(element.getZIndex() + 0.01);
            zIndexList.push(element.getZIndex());
          } else if (element.getZIndex() > layerDraggedZIndex && zIndexList.includes(element.getZIndex())) {
            let z = element.getZIndex() + 0.01;
            while (zIndexList.includes(z)) {
              z += 0.01;
            }
            element.setZIndex(z);
            zIndexList.push(element.getZIndex());
          } else {
            console.log(`Failed to sort z Index on layer: ${element.getProperties().title}`);
          }
        });

        // sort on zindex, highest zindex on index 0
        addedLayers.sort((a, b) => {
          if (a.getZIndex() < b.getZIndex()) return 1;
          else if (b.getZIndex() < a.getZIndex()) return -1;
          return 0;
        });

        // childnodes is a reference to parent.childNodes
        const childnodes = parent.childNodes;
        const dropSlot = parent.firstElementChild;

        const childSorted = [];
        zIndexCounter = zIndexStart + (addedLayers.length / 100);

        addedLayers.forEach((layer) => {
          layer.setZIndex(zIndexCounter);
          zIndexCounter -= 0.01;

          // for IE support
          if (window.NodeList && !NodeList.prototype.forEach) {
            NodeList.prototype.forEach = Array.prototype.forEach;
          }
          // removes dropslots and layers in legend, while saving the clones of the elements in childSorted
          // iterates unexpectedly since removing elements affects the iterations
          childnodes.forEach((child) => {
            // if the child is the element that corresponds to the layer
            if (contentFromChildEl(child) === layer.getProperties().title) {
              const dropSlotClone = dropSlot.cloneNode(true);
              addDropSupport(dropSlotClone);
              childSorted.push(dropSlotClone);
              childSorted.push(child);

              parent.removeChild(child);
            }
            if (child.getAttribute('id') === 'dropSlot') {
              parent.removeChild(child);
            }
          });
        });
        let dropSlotClone = dropSlot.cloneNode(true);
        addDropSupport(dropSlotClone);
        childSorted.push(dropSlotClone);
        // re-adds the layers in correct order
        childSorted.forEach((child) => {
          parent.appendChild(child);
        });
        dropSlotClone = dropSlot.cloneNode(true);
        addDropSupport(dropSlotClone);
        parent.insertBefore(dropSlotClone, parent.childNodes[0]);

        zIndexCounter = zIndexStart + (addedLayers.length / 100);
      }
    }
  }, false);
};

const addDragSupport = function addDragSupport(el) {
  el.addEventListener('drag', () => { }, false);
  el.addEventListener('dragstart', (event) => {
    draggedElement = event.target;
    event.target.style.opacity = 0.3;
  }, false);

  el.addEventListener('dragend', (event) => { event.target.style.opacity = ''; }, false);
};

export const InitDragAndDrop = function InitDragAndDrop(group) {
  const allSpanTagElements = document.getElementsByTagName('span');
  let overlayEl;
  for (let i = 0; i < allSpanTagElements.length; i += 1) {
    const item = allSpanTagElements[i];
    if (item.textContent === (`${group.title}`)) {
      // Some not-so-good traversal in dom to get to correct element to append
      overlayEl = item.parentElement.nextElementSibling.firstElementChild;
      break;
    }
  }
  let dropzoneEl = Origo.ui.dom.html(dropZone);
  dropzoneEl = dropzoneEl.childNodes[0];
  addDropSupport(dropzoneEl);
  overlayEl.appendChild(dropzoneEl);
};

export const onAddDraggable = function onAddDraggable(layer) {
  const allDivTagElements = document.getElementsByTagName('div');
  let overlayEl;
  for (let i = 0; i < allDivTagElements.length; i += 1) {
    const item = allDivTagElements[i];
    if (item.textContent === (`${layer.get('title')}`)) {
      overlayEl = item.parentElement;
      break;
    }
  }
  zIndexCounter += 0.01;
  layer.setZIndex(zIndexCounter);
  addedLayers.push(layer);
  overlayEl.setAttribute('draggable', 'true');
  overlayEl.setAttribute('ondragstart', "event.dataTransfer.setData('text/plain',null)");
  const overlayParentEl = overlayEl.parentElement;
  let dropzoneEl = Origo.ui.dom.html(dropZone);
  dropzoneEl = dropzoneEl.childNodes[0];
  addDropSupport(dropzoneEl);
  addDragSupport(overlayEl);
  overlayParentEl.insertBefore(dropzoneEl, overlayParentEl.firstChild);
};

export const onRemoveDraggable = function onRemoveDraggable(layer) {
  const RemovedLayerIndex = addedLayers.indexOf(layer);
  addedLayers.splice(RemovedLayerIndex, 1);
  // Removes dropslots where there are two of them in a row,
  // which will happen when removing a layer
  const overlayParentEl = document.getElementById('dropSlot').parentElement;
  for (let i = 0; i < overlayParentEl.childElementCount; i += 1) {
    const child = overlayParentEl.childNodes[i];
    if (child.id === 'dropSlot' && child.nextSibling.id === 'dropSlot') {
      child.remove();
      break;
    }
  }
};
