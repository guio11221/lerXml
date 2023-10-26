/**
 *
 * @param      {<string>}  xml      The xml
 * @param      {<string>}  tagName  The tag name
 */
function extractGroup (xml, tagName) {
  var itens = []
  var regex = new RegExp(`<${tagName}.+?>(.+?)</${tagName}>`, 'gi')
  var result = ''
  for (result = regex.exec(xml); regex.lastIndex !== 0; result = regex.exec(xml)) {
    itens.push(result[0])
  }

  return itens
}

/**
 *
 * @param      {<string>}  xml   
 * @param      {<string|array>}  tagName       
 * @param      {<string>}  attributeName 
 * @return     {string | null}
 */
function extract (xml, tagName, attributeName) {
  if (!Array.isArray(tagName)) {
    tagName = [tagName]
  }

  var found = null
  var tagFound = null
  for (var i = 0; i < tagName.length; i++) {

    found = new RegExp(`<${tagName[i]}\\s*>(.+?)</${tagName[i]}>`, 'i').exec(xml)
    if (found) {
      tagFound = tagName[i]
      break
    }

 
    found = new RegExp(`<${tagName[i]} .*?>(.+?)</${tagName[i]}>`, 'i').exec(xml)
    if (found) {
      tagFound = tagName[i]
      break
    }
  }

  if (found && attributeName) {
    var attribute = new RegExp(`<${tagFound} .*?${attributeName}=\"(.+?)\".*?>`, 'i').exec(found[0])
    if (attribute) {
      return attribute[1]
    }
  }

  return found ? found[1] : null
}

/**
 *
 * @param      {<string>}   content 
 * @return     {boolean} 
 */
function hasTags (content) {
  return (content.split('</', 2)[0] !== content)
}

/**
 *
 * @param      {string}  xml     The xml
 * @return     {Object}  {tagValue(), tagGroup()}
 */
function model (xml) {
  var path = ''
  var cache = {}
  xml = xml && typeof xml === 'string' ? xml.replace(/[\n\r]/gi, '') : ''

  return {
    tagValue: (tag, attribute) => {
      if (!Array.isArray(tag)) {
        tag = [tag]
      }

      path = tag.join('_') + '_' + (attribute || '')

      if (typeof cache[path] === 'undefined') {
        cache[path] = extract(xml, tag, attribute)
        if (typeof cache[path] === 'string' && hasTags(cache[path])) {
          cache[path] = model(cache[path])
        }
      }

      return cache[path]
    },
    tagGroup: (tag) => {
      return extractGroup(xml, tag)
    }
  }
}

module.exports = model
