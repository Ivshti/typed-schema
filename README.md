# typed-schema

## Define a typed schema for any object, without extra dependencies


## How to use

### ``var schema = require('typed-schema')``

### ``schema(obj, schema)``

Schemas are defined as an object of specs for each property. The spec can have properties:

* `type` - the type to be enforced, can be "string", "number", "date" (alternatively use String, Number, Date). Can also be a RegExp instance in case you want to validate against that expression.
* `default` - the default value; must comply to the type
* `get` - getter, cannot be used with type/default
* `set` - setter, cannot be used with type/default
* `enumerable` - whether this property will be enumerable - the default is true

If type is all you need, you can shorthand the property to the type only, e.g. `{ name: String }`.
You can also define a property as an "array of" by setting it to `[spec]`, for example `[String]` for an array of strings.
Nested objects are supported.

### Example

```javascript
var schema = require('typed-schema')

function Person() {
	schema(this, {
		name: { type: 'string', default: 'nameless' },
		age: 'number', // shorthand to { type: ... },
		created: Date, // you can also use String, Number, Date instead of 'string', 'number', 'date'
		address: {
			line1: 'string',
			line2: 'string'
		},
		favNumbers: ['number'], // array of numbers
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


