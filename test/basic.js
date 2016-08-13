var tape = require("tape");
var schema = require("../index");

function Obj(extra) {
  schema(this, {
    id: "string",
    count: "number"
  });
  if (extra) for (k in extra) this[k] = extra[k];
}

tape("schema - initialize - enforcing number", function(t) {
  var o = new Obj({ id: "test", count: 5 });

  t.ok(o, "we have object");

  o.count = "shit";
  t.equal(o.count, 5, "assigning wrong type should fail");

  o.count = "7"
  t.equal(o.count, 7, "assigning castable value should work");

  t.end();
})

// TODO
// TODO
// MANY OTHER TESTS :) see https://github.com/Ivshti/linvodb3/blob/master/test/schema.test.js