### Usage
```javascript
var XmlParse = require('...')
function fixture () {
    return '<service>test</service><item id="1">first</item><item id="2">second</item><user role="developer"><name>djf</name></user>'
}

var xml = XmlParse(fixture())
// by tag
console.log(xml.tagValue('service')) // test

// by tag and attribute
console.log(xml.tagValue('user', 'role')) // developer

// by nested tags
console.log(xml.tagValue('user').tagValue('name')) // djf

// by array of tags, matiching the first tag found
console.log(xml.tagValue(['not', 'service'])) // test

// group of tags
var itens = xml.tagGroup('item')
console.log(itens) // ["<item id=\"1\">first</item>", "<item id=\"2\">second</item>"]
console.log(xml.tagValue('item', 'id')) // 1
```

