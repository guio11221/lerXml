/**
 * Escape user-provided tag names before including them in regular expressions.
 */
function escapeRegExp (value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Match an opening XML tag without treating '>' inside quoted attributes
 * as the end of the tag. Regexes here intentionally target the existing
 * lightweight parser API; this is not a full validating XML parser.
 */
function openingTagSource (tagName) {
  return '<' + escapeRegExp(tagName) + '(?=\\s|>)(?:\\s+(?:[^>"\\x27]|"[^"]*"|\\x27[^\\x27]*\\x27)*)?>'
}

/**
 *
 * @param      {<string>}  xml      The xml
 * @param      {<string>}  tagName  The tag name
 */
function extractGroup (xml, tagName) {
  var itens = []
  if (typeof tagName !== 'string' || tagName.length === 0) return itens
  var escapedTag = escapeRegExp(tagName)
  var regex = new RegExp(`${openingTagSource(tagName)}([\\s\\S]*?)</${escapedTag}>`, 'gi')
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

    if (typeof tagName[i] !== 'string' || tagName[i].length === 0) continue
    var escapedTag = escapeRegExp(tagName[i])

    found = new RegExp(`${openingTagSource(tagName[i])}([\\s\\S]*?)</${escapedTag}>`, 'i').exec(xml)
    if (found) {
      tagFound = tagName[i]
      break
    }
  }

  if (found && attributeName) {
    // Match a complete attribute name, allowing both XML quote styles.
    var attributePattern = new RegExp(`\\s${escapeRegExp(attributeName)}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i')
    var openingTag = new RegExp(`^${openingTagSource(tagFound)}`, 'i').exec(found[0])
    var attribute = openingTag && attributePattern.exec(openingTag[0])
    return attribute ? (attribute[1] === undefined ? attribute[2] : attribute[1]) : null
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
  var cache = Object.create(null)
  xml = xml && typeof xml === 'string' ? xml : ''

  return {
    tagValue: (tag, attribute) => {
      if (!Array.isArray(tag)) {
        tag = [tag]
      }

      path = JSON.stringify([tag, attribute || ''])

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
