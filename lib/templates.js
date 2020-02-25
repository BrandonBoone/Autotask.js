module.exports = function(Handlebars) {

this["JST"] = this["JST"] || {};

this["JST"]["templates/query.hbr"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return "\n		<entity>"
    + container.escapeExpression(((helper = (helper = helpers.key || (data && data.key)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"key","hash":{},"data":data,"loc":{"start":{"line":3,"column":10},"end":{"line":3,"column":18}}}) : helper)))
    + "</entity><query>"
    + ((stack1 = helpers.each.call(alias1,depth0,{"name":"each","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":4,"column":2},"end":{"line":13,"column":14}}})) != null ? stack1 : "")
    + "</query>";
},"2":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "\n			<field>"
    + ((stack1 = helpers.each.call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"each","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":3},"end":{"line":11,"column":15}}})) != null ? stack1 : "")
    + "</field>";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {});

  return container.escapeExpression(((helper = (helper = helpers.key || (data && data.key)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"key","hash":{},"data":data,"loc":{"start":{"line":7,"column":3},"end":{"line":7,"column":13}}}) : helper)))
    + ((stack1 = helpers.each.call(alias1,depth0,{"name":"each","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":8,"column":4},"end":{"line":10,"column":16}}})) != null ? stack1 : "");
},"4":function(container,depth0,helpers,partials,data) {
    var helper, alias1=container.escapeExpression;

  return "\n				<expression op=\""
    + alias1(((helper = (helper = helpers.key || (data && data.key)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"key","hash":{},"data":data,"loc":{"start":{"line":9,"column":20},"end":{"line":9,"column":28}}}) : helper)))
    + "\">"
    + alias1(container.lambda(depth0, depth0))
    + "</expression>";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<queryxml>"
    + ((stack1 = helpers.each.call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":1},"end":{"line":15,"column":13}}})) != null ? stack1 : "")
    + "</queryxml> \n\n";
},"useData":true});

return this["JST"];

};