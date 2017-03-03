# typed-schema

## Define a typed schema for any object, without extra dependencies

This module allows you to set a typed schema for an object that will be enforced constantly, not only on initialization. 

This is similar to Mongoose schemas.

## How to use

### ``var schema = require('typed-schema')``

### ``schema(obj, schema)``

Schemas are defined as an object of specs for each property. The spec can have properties:

* `type` - the type to be enforced, can be "string", "number", "date", "boolean". Can also be a RegExp instance in case you want to validate against that expression. It can be "object" or "array", but keep in mind then you need to also specify `schema` property
* `default` - the default value; must comply to the type
* `get` - getter, cannot be used with type/default
* `set` - setter, cannot be used with type/default
* `enumerable` - whether this property will be enumerable - the default is true
* `schema` - applicable if you set the type to "object" or "array"; the value follows the same spec

Validating arrays is supported by setting the `type` to `"array"` and providing the `schema` property.
Nested objects are supported by setting the `type` to `"object"` and providing the `schema` property.

### Example

```javascript
var schema = require('typed-schema')

function Person() {
	schema(this, {
		name: { type: 'string', default: 'nameless' },
		age: { type: 'number' },
		created: 'date',
		address: {
			line1: 'string',
			line2: 'string'
		},
		favNumbers: { type: 'array', schema: { type: 'number' } }, // array of numbers
		firstName: { get: function() { return this.name.split(" ")[0] } } // getter
	})

	return this
}

var p = new Person()
// p is { name: 'nameless', age: 0, created: /* date when created */, address: { line1: "", line2: "" }, favNumbers: [] }

p.name = 23
// p.name becomes "23", it's cast to string

p.created = "10/23/2004"
// p is 23 October 2004, date object

p.favNumbers.push(22)
p.favNumbers.push("42") // favNumbers will be [22, 42] ; the string will be cast to a number
p.favNumbers.push("forty five") // nothing happens, can't cast "forty five" to number
// p.favNumbers is [22, 42]

p.name = "John Smith"
// p.firstName is "John", thanks to the getter
```


