var assert = require('assert')
var XmlParse = require('../src')

function fixture () {
  return '<service>test</service><item id="1">first</item><item id="2">second</item><user role="developer"><name>djf</name></user><similar><pFCPSTRet>1.0001</pFCPSTRet><pFCPST>1.0000</pFCPST></similar>'
}

describe('Examples', function () {
  it('should test examples', function () {
    var xml = XmlParse(fixture())


    assert.strictEqual(xml.tagValue('service'), 'test')

    assert.strictEqual(xml.tagValue('user', 'role'), 'developer')

    assert.strictEqual(xml.tagValue('user').tagValue('name'), 'djf')


    assert.strictEqual(xml.tagValue(['not', 'service']), 'test')

    var itens = xml.tagGroup('item')

    assert.strictEqual(itens.length, 2)
    assert.strictEqual(xml.tagValue('item', 'id'), '1')
  })
})

describe('Tests', function () {
  describe('invalidXML', function () {
    it('should test for invalid XML input', function () {
      assert.strictEqual(typeof XmlParse({}), 'object')

      assert.strictEqual(typeof XmlParse([]), 'object')

      assert.strictEqual(typeof XmlParse(null), 'object')

      assert.strictEqual(typeof XmlParse(), 'object')

      assert.strictEqual(typeof XmlParse(''), 'object')

      assert.strictEqual(typeof XmlParse(5), 'object')
    })
  })

  describe('tagValue', function () {
    it('should test tagValue()', function () {
      var xml = XmlParse(fixture())

      assert.strictEqual(xml.tagValue('service'), 'test')

      assert.strictEqual(xml.tagValue(['service']), 'test')

      assert.strictEqual(xml.tagValue(['not', 'service']), 'test')

      assert.strictEqual(xml.tagValue('user', 'role'), 'developer')

      assert.strictEqual(typeof xml.tagValue('user'), 'object')
    })
  })

  describe('invalidTagValue', function () {
    it('should test for invalid tagValue() args', function () {
      var xml = XmlParse(fixture())

      assert.strictEqual(xml.tagValue(), null)

      assert.strictEqual(xml.tagValue(''), null)

      assert.strictEqual(xml.tagValue(null), null)
    })
  })

  describe('tagGroup', function () {
    it('should test for tagGroup()', function () {
      var xml = XmlParse(fixture())

      var itens = xml.tagGroup('item')

      assert.strictEqual(itens.length, 2)
    })
  })

  describe('tagGroup without attributes', function () {
    it('includes plain tags and tags with attributes', function () {
      var xml = XmlParse('<item>plain</item><item id="1">attributed</item>')
      assert.deepStrictEqual(xml.tagGroup('item'), [
        '<item>plain</item>',
        '<item id="1">attributed</item>'
      ])
    })
  })

  describe('invalidTagGroup', function () {
    it('should test for invalid tagGroup() args', function () {
      var xml = XmlParse(fixture())

      assert.strictEqual(xml.tagGroup('notfound').length, 0)

      assert.strictEqual(xml.tagGroup().length, 0)

      assert.strictEqual(xml.tagGroup('').length, 0)

      assert.strictEqual(xml.tagGroup(null).length, 0)
    })
  })

  describe('similarTagName', function () {
    it('should test for similar tag names', function () {
      var xml = XmlParse(fixture())
      var similar = xml.tagValue('similar')

      assert.strictEqual(typeof similar, 'object')

      assert.strictEqual(similar.tagValue('pFCPST'), '1.0000')

      assert.strictEqual(similar.tagValue('pFCPSTRet'), '1.0001')
    })
  })
})

describe('Literal tag matching', function () {
  it('matches tag names literally instead of treating them as regular expressions', function () {
    var xml = XmlParse('<aXb>wrong</aXb><a.b>correct</a.b>')
    assert.strictEqual(xml.tagValue('a.b'), 'correct')
    assert.deepStrictEqual(xml.tagGroup('a.b'), ['<a.b>correct</a.b>'])
  })

  it('does not throw on malformed regex characters supplied as tag names', function () {
    var xml = XmlParse('<service>ok</service>')
    assert.strictEqual(xml.tagValue('['), null)
    assert.deepStrictEqual(xml.tagGroup('['), [])
    assert.strictEqual(xml.tagValue('service', '['), null)
  })
})

describe('Cache isolation', function () {
  it('does not mix queries that used to share underscore-joined cache keys', function () {
    var xml = XmlParse('<a_b>one</a_b><a>two</a>')
    assert.strictEqual(xml.tagValue(['a_b', 'c']), 'one')
    assert.strictEqual(xml.tagValue(['a', 'b_c']), 'two')
  })

  it('does not return inherited Object prototype values', function () {
    var xml = XmlParse('<service>ok</service>')
    assert.strictEqual(xml.tagValue('__proto_'), null)
    assert.strictEqual(xml.tagValue('service'), 'ok')
  })
})

describe('XML text preservation', function () {
  it('returns an empty string for an empty tag', function () {
    assert.strictEqual(XmlParse('<empty></empty>').tagValue('empty'), '')
  })

  it('preserves newlines in element text', function () {
    assert.strictEqual(
      XmlParse('<message>first\nsecond\r\nthird</message>').tagValue('message'),
      'first\nsecond\r\nthird'
    )
  })

  it('matches an empty element with attributes', function () {
    assert.strictEqual(XmlParse('<empty id="3"></empty>').tagValue('empty'), '')
  })
})

describe('XML attribute lookups', function () {
  it('matches the exact name instead of a suffix of another attribute', function () {
    var xml = XmlParse('<item data-id="before" id="after">value</item>')
    assert.strictEqual(xml.tagValue('item', 'id'), 'after')
    assert.strictEqual(xml.tagValue('item', 'data-id'), 'before')
  })

  it('supports single quotes and empty attribute values', function () {
    var xml = XmlParse("<item id='42' empty=''>value</item>")
    assert.strictEqual(xml.tagValue('item', 'id'), '42')
    assert.strictEqual(xml.tagValue('item', 'empty'), '')
  })

  it('returns null when a requested attribute is missing', function () {
    var xml = XmlParse('<item id="3">value</item>')
    assert.strictEqual(xml.tagValue('item', 'missing'), null)
    assert.strictEqual(xml.tagValue('item'), 'value')
  })
})


describe('Quoted delimiters in XML opening tags', function () {
  it('reads content when a double-quoted attribute includes >', function () {
    var document = XmlParse('<item title="a > b">content</item>')
    assert.strictEqual(document.tagValue('item'), 'content')
    assert.strictEqual(document.tagValue('item', 'title'), 'a > b')
    assert.deepStrictEqual(document.tagGroup('item'), ['<item title="a > b">content</item>'])
  })

  it('reads content when a single-quoted attribute includes >', function () {
    var document = XmlParse("<item note='left > right'>text</item>")
    assert.strictEqual(document.tagValue('item'), 'text')
    assert.strictEqual(document.tagValue('item', 'note'), 'left > right')
    assert.deepStrictEqual(document.tagGroup('item'), ["<item note='left > right'>text</item>"])
  })

  it('does not mistake a prefixed tag name for the requested tag', function () {
    var document = XmlParse('<itemization>wrong</itemization><item id="1">correct</item>')
    assert.strictEqual(document.tagValue('item'), 'correct')
    assert.deepStrictEqual(document.tagGroup('item'), ['<item id="1">correct</item>'])
  })
})


describe('XML names are case sensitive', function () {
  it('distinguishes elements whose names differ only by case', function () {
    var xml = XmlParse('<Item>upper</Item><item>lower</item>')
    assert.strictEqual(xml.tagValue('Item'), 'upper')
    assert.strictEqual(xml.tagValue('item'), 'lower')
    assert.deepStrictEqual(xml.tagGroup('Item'), ['<Item>upper</Item>'])
    assert.deepStrictEqual(xml.tagGroup('item'), ['<item>lower</item>'])
  })

  it('does not accept a closing tag with mismatched case', function () {
    var xml = XmlParse('<item>invalid</ITEM>')
    assert.strictEqual(xml.tagValue('item'), null)
    assert.deepStrictEqual(xml.tagGroup('item'), [])
  })

  it('distinguishes case-sensitive attribute names', function () {
    var xml = XmlParse('<item Id="upper" id="lower">value</item>')
    assert.strictEqual(xml.tagValue('item', 'Id'), 'upper')
    assert.strictEqual(xml.tagValue('item', 'id'), 'lower')
    assert.strictEqual(xml.tagValue('item', 'ID'), null)
  })
})
