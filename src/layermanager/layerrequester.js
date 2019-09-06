//import data from './data';
import LayerListStore from './layerliststore';
import readAsync from './readasync';

 const requestAll = () => {
   return data;
 };


const layerRequester = async function layerRequester({
  type = 'all',
  url = '',
  searchText = '',
  startRecord = 1,
  extend = false,
  themes = []
}  = {}) {

  function parseThemes(){
    let activeThemes = ''
    themes.forEach(theme => {
      activeThemes += `<ogc:PropertyIsLike matchCase="false" wildCard="%" singleChar="_" escapeChar="\">
          <ogc:PropertyName>subject</ogc:PropertyName>
          <ogc:Literal>%${theme}%</ogc:Literal>
        </ogc:PropertyIsLike>`
    })
    return activeThemes;
  }

  function buildFilter(){
    let filter = '<ogc:Filter>';
    let themesActive = false;
    if (themes.length != 0){
       filter += '<ogc:And>';
       themesActive = true;
    }
    filter += `<ogc:PropertyIsLike matchCase="false" wildCard="%" singleChar="_" escapeChar="\">
                <ogc:PropertyName>title</ogc:PropertyName>
                <ogc:Literal>%${searchText}%</ogc:Literal>
              </ogc:PropertyIsLike>`
    if(themesActive){
      filter += (themes.length == 1) ? `${parseThemes()}</ogc:And>` : `<ogc:Or>${parseThemes()}</ogc:Or></ogc:And>`
    }
    filter += '</ogc:Filter>'
    return filter
  }

    let body = `
    <csw:GetRecords 
      xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" 
      xmlns:ogc="http://www.opengis.net/ogc" 
      service="CSW" 
      version="2.0.2" 
      resultType="results" 
      startPosition="${startRecord}" 
      maxRecords="15" 
      outputFormat="application/xml" 
      outputSchema="http://www.opengis.net/cat/csw/2.0.2" 
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
      xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd" 
      xmlns:gmd="http://www.isotc211.org/2005/gmd" 
      xmlns:apiso="http://www.opengis.net/cat/csw/apiso/1.0">
      <csw:Query typeNames="csw:Record">
        <csw:ElementSetName>full</csw:ElementSetName>
        <csw:Constraint version="1.1.0">
          ${buildFilter()}
        </csw:Constraint>
        <ogc:SortBy xmlns:ogc="http://www.opengis.net/ogc">
                <ogc:SortProperty>
                    <ogc:PropertyName>title</ogc:PropertyName>
                    <ogc:SortOrder>ASCE</ogc:SortOrder>
                </ogc:SortProperty>
            </ogc:SortBy>
      </csw:Query>
    </csw:GetRecords> 
    `
    const { error, data } = await readAsync(fetch(url, {
    method: "POST", 
    headers: { "Content-Type" : "application/xml"}, 
    body: body}).then((rsp) => rsp.text()));
    //const { error, data } = await readAsync(fetch(url).then(response => response.json()));
    if (error) {
      console.log(error);
    } else {
      //Parse the csw fetch to XML and get specific properties for layers
      let xml = new DOMParser().parseFromString(data,"text/xml")
      console.log(xml)
      let records = xml.getElementsByTagName("csw:Record");
      //Dont do anything if empty
      if (records.length == 0 && extend){
        return
      }
      if (records.length == 0){
        LayerListStore.clear()
        return
      }
      let layers = []
      for (var i = 0; i < records.length; i++) {
        let correctUri =  records[i].querySelector(`[protocol='OGC:WMS-1.1.1-http-get-map']`)
        let layerId = correctUri ? correctUri.getAttribute('name') : "No id"
        let title = records[i].getElementsByTagName("dc:title")[0].childNodes[0]
        let description = records[i].getElementsByTagName("dc:description")[0].childNodes[0]
        let theme = "no theme"
        let src = "no src"
        if(correctUri){
          if(correctUri.childNodes[0]){
            if(correctUri.childNodes[0].nodeValue){
              src = correctUri.childNodes[0].nodeValue
            }
          }
        }
        
        title = title ? title.nodeValue : "no title"
        description = description ? description.nodeValue : "no description"
        layers.push({
          layerId,
          title,
          description,
          theme,
          src
        })
      }

      //if to extend current list, used for "load more on scroll"-effect
      if (extend)
        layers = LayerListStore.getList().concat(layers)
      LayerListStore.updateList(layers);
    }
  
  return [];
};

export default layerRequester;