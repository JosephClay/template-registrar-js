/**
 * Centralized template registration for
 * holding, compiling and rendering templates
 *
 * The template engine only has one requirement,
 * a `compile` function that returns a render function.
 * The render function will be called with the data
 * as the first parameter.
 *
 * Common libraries that use this paradigm are:
 * Mustache, Handlebars, Underscore, Lodash etc...
 */
var undefined, // safe undefined

	// Template strings registered by an id string
	templates = {},

	// Compiled templates registered by an id string
	compiledTemplates = {},

	// The current template engine being used.
	engine;

/**
 * Coerce a template to a string value. If a function is
 * passed, it's executed and coercion continues. If an array
 * is passed, it is joined. All strings are trimmed to prevent
 * any problems with the templating engine
 * @param  {String|Function|Array} tpl
 * @return {String}
 */
var coerceTemplateToString = function(tpl) {
	if (typeof tpl === 'function') { tpl = tpl(); }
	if (typeof tpl === 'string') { return tpl.trim(); }
	if (Array.isArray(tpl)) { return tpl.join(api.joint).trim(); }
	console.error('template (or the return value) was of unknown type', tpl);
	return '';
};

/**
 * Register a template
 * @param  {String} name id
 * @param  {String|Function|Array} tpl
 * @param  {Object} [opts]
 */
var register = function(name, tpl, opts) {
	opts = opts || {};

	// If an object, multiple items are being registered
	// and tpl is actually opts
	if (typeof name !== 'string') {
		var key, obj = name;
		for (key in obj) {
			register(key, obj[key], tpl);
		}
		return api;
	}

	// Not an object, must be a string. If it's a
	// css selector, go get the html for the template
	if (opts.query || name[0] === '#') {
		var element = document.querySelector(name);
		if (!element) { return console.error('cannot find reference to "'+ name +'" in DOM', name, tpl); }
		templates[name] = element.innerHTML;
		return api;
	}

	// If the tpl is a compiled template @type {Function},
	// then register it to compiledTemplates
	if (opts.isCompiled) {
		compiledTemplates[name] = tpl;
		return api;
	}

	templates[name] = coerceTemplateToString(tpl);
	return api;
};

/**
 * Get a template via a name
 * @param  {String} name id
 * @return {Function} compiled template
 */
var retrieve = function(name) {
	// If there's a compiled template, return that one
	var compTpl = compiledTemplates[name];
	if (compTpl) { return compTpl; }

	if (!engine) { console.error('no template engine is available', engine); }
	return (compiledTemplates[name] = engine.compile(templates[name]));
};

var api = module.exports = {
	$: function() { throw 'template-regisrar: $ NYI'; },

	joint:    '\n',

	add:      register,
	register: register,

	/**
	 * Remove a template from storm.template.
	 * Removes both the string and compiled versions
	 * @param  {String} name id
	 */
	remove: function(name) {
		templates[name] = compiledTemplates[name] = undefined;
		return api;
	},

	/**
	 * Render a registered template
	 * @param  {String} name id of the template
	 * @param  {Object} [data] passed to the template engine as a parameter
	 * @return {String} rendered template
	 */
	render: function(name, data) {
		return retrieve(name)(data || {});
	},

	/**
	 * Render a registered template with $
	 * @param  {String} name id of the template
	 * @param  {Object} [data] passed to the template engine as a parameter
	 * @return {String} rendered template
	 */
	render$: function(name, data) {
		var $     = api.$,
			parse = $.parseHTML,
			html  = api.render(name, data);

		return $((parse) ? parse(html) : html);
	},

	/**
	 * Sets the client-side templating engine
	 * for `storm.template` to use.
	 * @param {Object} engine
	 */
	engine: function(eng) {
		if (!eng) { return engine; }
		engine = eng;
		return api;
	},

	/**
	 * Return the registered template strings
	 * @param  {String} [key] a specific template
	 * @return {String|Object}
	 */
	toJSON: function(key) {
		return key ? templates[key] : templates;
	}
};