#     Cell 0.1.0
#     (c) 2011 Evan Morikawa
#     Cell may be freely distributed under the MIT license.
#     Full documentation at http://emorikawa.github.com/cell

# Reference to the global object
root = @

# Namespace for Cell. Exported for CommonJS and the browser
Cell = exports ? root.Cell = {}

# Common Ancestor Object
# ----------------------
class Cell.Object
  constructor: ->
    # Make private methods (leading _ really private)
    methods = {}

    for methodName, func of @
      unless methodName.charAt(0) is '_'
        methods[methodName] = @[methodName]
      else
        methods[methodName] = undefined

    # All objects have a unique ID.
    @cell_id = @_UUID()

    # All objects have a name. Since a cell's model may have multiple views,
    # a name is required to directly address the appropriate object.
    @name = @getClassName()

    return methods

  # All objects may subscribe to custom global events and bind a callback
  # handler to that event. This method of inter-cell communication helps
  # keep cells independent and decoupled from other cells.
  subscribe: (event, callback) ->
    Cell.Dispatch.get().subscribe @, event, callback

  unsubscribe: (event) ->
    Cell.Dispatch.get().unsubscribe @, event

  # Triggers custom global events through the Cell Dispatcher
  trigger: (event, args...) ->
    Cell.Dispatch.get().trigger event, args...

  # Returns the class name of the argument or undefined if it's not a
  # valid JavaScript object.
  getClassName: ->
    if @ and @.constructor and @.constructor.toString
      arr = @.constructor.toString().match /function\s*(\w+)/
      if arr and arr.length is 2 then return arr[1]
    return undefined

  # Returns an RFC4122 v4 compliant UUID
  _UUID: ->
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace /[xy]/g,
    (c) ->
      r = Math.random()*16|0
      v = if c is 'x' then r else (r&0x3|0x8)
      return v.toString(17)

# Model
# -----
class Cell.Model extends Cell.Object
  constructor: (options) ->
    super()

    # Internal key:value data store. This should never be accessed directly
    # from any user code.
    @_data = {}

    # Internal store of linked `Cell.View`s. Indexed by the View's `name`
    @_views = {}

    # Internal back references to other `Cell.Model`s that have this object
    # referenced as part of their collections. Keyed by the `name` of
    # the objects.
    @_collections = {}

    # A shorthand to a single view defined by setPrimaryView. Many times, a
    # cell's `Model` will only have one `View`. To prevent always having to
    # call the `View` by `name` through the `getView` accessor function, this
    # read-only field provides faster access.
    @view = undefined

    for key, value of options
      switch key
        # Add the initial set of data into the model.
        when 'data' then @D value
        when 'name' then @name = value
        when 'view' then @createView value
        when 'views' then @createViews value
        when 'initialize' then initialize = value

    initialize.call @ if initialize? # Run init function if exists

    # If we haven't been passed in a view, try create a view with
    # the view naming convention
    if not @view? then @createView(@getClassName() + "View")

    # Return the constructed model
    @

  # A multipurpose getter and setter for this `Cell.Model`'s `D`ata.
  #
  #     D() # Returns all of the data
  #
  #     D "foo" # Returns the data stored at key "foo"
  #
  #     D "foo", "bar" # Sets key "foo" to value "bar"
  #
  #     D {foo:'bar', baz:'cell'} # Extends data store with object
  #
  # We test for the correct number of arguments instead of test for
  # undefined arguments because it is many times desireble to set a
  # field to the value of `undefined`.
  D: (data, set_value) ->
    if arguments.length > 0
      if typeof data is 'string'
        if arguments.length is 1 then @_data[data]
        else if arguments.length is 2 then @_data[data] = set_value
      else if typeof data is 'object'
        $.extend @_data, data
    else @_data

  # Retrieves a view by it's string `view_name`. All `Cell.View`s are required
  # to have names.
  getView: (view_name) -> @_views[view_name]
  # `view_obj` must be an instance of `Cell.View`. It is automatically stored
  # internally and keyed by the `view_obj`'s `name` field.
  addView: (view_obj) ->
    if view_obj instanceof Cell.View then @_views[view_obj.name] = view_obj

  # Creates multiple `Cell.View`s
  createViews: (view_list) -> @createView(view) for view in view_list

  # Creates and assigns a `Cell.View` object to this `Cell.Model`. The
  # `view` parameter can be either a string or the class function itself.
  createView: (view_constructor, options) ->
    if view_constructor instanceof Cell.View then @addView view_constructor
    else if typeof view_constructor is "function"
      # Create the new view using the constructor. Pass through options
      v = new view_constructor @, options

      # Add the new model to this class
      @addView v

      if not @view? then @setPrimaryView v.name

      return v

  # You may opt to, as a convenience, set the cannonical view of this
  # model. This allows for faster and easier accessing only
  setPrimaryView: (view_name) -> @view = @getView view_name

  # Calls `render` on given view names. If no parameters are passed in,
  # `render` is called on all views.
  renderViews: (names...) ->
    if names.length is 0 then view.render() for name, view of @_views
    else @_views[name]?.render() for name in names

  getCollection: (collection_name) -> @_collections[collection_name]
  # `collection_obj` must be an instance of `Cell.Collection`
  # It is keyed the the collection's name
  addCollection: (collection_obj) ->
    if collection_obj instanceof Cell.Collection
      @_collections[collection_obj.name] = collection_obj

# Collection
# ----------
class Cell.Collection extends Cell.Model

  constructor: (options) ->
    super options

    # Stores a list of objects of this collection's corresponding type
    @_collections = []

    @

  length: -> @_collections.length

  # Adds an object or list of objects to this `Cell.Collection`.
  # By default, each time an object is added, the collection's views render.
  # If objects are added in a list, rendering is by default called only once.
  # By default, items are unshifted onto the internal list.
  add: (obj, silent=false, direction="push") ->
    if obj instanceof Array
      @add indv_obj, "silent", direction for indv_obj in obj
    else
      if direction is "push" then @_collections.push obj
      else if direction is "unshift" then @_collections.unshift obj
      obj.addCollection @

    if silent is "silent" or silent is true then null
    else @renderViews()

    @onAdd obj
    return obj

  # OVERRIDE `onAdd` to perform custom actions every time an object is added
  # to the collection
  onAdd: (obj) ->

  # Checks the collection for a duplicate of an object on a given field in
  # a collection. Returns true if duplicate exists, false otherwise
  hasDuplicate: (obj, field, collection) ->
    if not collection? then collection = @getAll()
    if not field? then field = "cell_id"
    for item in collection
      if obj.D(field) is item.D(field) then return true else continue
    return false

  # Removes the given object id (or object itself) from the collection.
  # Re-renders the template unless the silent flag is passed
  del: (obj, silent=false) ->
    if obj instanceof Model
      del_id = obj.cell_id
    else if obj is 'string' then del_id = obj
    else return false

    i = 0
    while i < @_collections.length
      if del_id is @_collections[i].cell_id
        @_collections.splice(i,1)
      i++

    if silent is "silent" or silent is true then null
    else @renderViews()

  removeAll: (silent=false) ->
    @_collections = []

    if silent is "silent" or silent is true then null
    else @renderViews()

  # Replaces the @_collections object and then calls render on all subscribed
  # views. Make sure objects have a reference to this collection
  replace: (newObjs, silent=false) ->
    @_collections = newObjs
    for obj in newObjs
      obj.collection @

    if silent is "silent" or silent is true then null
    else @renderViews()

  getAll: -> @_collections

  # Get an item in the collection whose key value pair matches
  get: (key, value) ->
    ret = []
    for a in @getAll()
      ret.push a if a.D(key)? and a.D(key) is value

    if ret.length is 0
      return undefined
    else if ret.length is 1
      return ret[0]
    else return ret

# View
# ----
class Cell.View extends Cell.Object
  constructor: (@model, options) ->
    super()

    if not @model?
      throw new Error "Reference to this view's model is required"

    # The jQuery reference to the template
    @$ = undefined

    # A list to keep track of sub components to recursively render
    @renderList = []

    # Flag to detect if we've been rendered at least once.
    @rendered = false

    # Flag to determine whether or not the view should be rendered
    @visible = true

    for key, value of options
      switch key
        # Add the initial set of data into the model.
        when 'name' then @name = value
        when 'initialize' then initialize = value
        when 'visible' then @setVisible value

    initialize.call @ if initialize? # Run init function if exists

  # Shorthand alias to access data fieds of the linked model
  D: (data, set) ->
    if arguments.length is 0 then @model.D()
    else if arguments.length is 1 then @model.D data
    else if arguments.length >= 2 then @model.D data, set

  # OVERRIDE to bind both Cell and jQuery events to desired methods
  #
  # Some jQuery examples:
  #     @$.bind "click", @onClick
  #     @$.find(".target").bind "hover", @onMouseEnter, @onMouseLeave
  #
  # Some Cell event examples:
  #     @subscribe "socketUpdate", @onUpdate
  #
  # Since every re-render creates a new @$ object, the `events` method is
  # run after each and every render to refresh the bindings.
  events: ->

  # OVERRIDE to describe the HTML for this Cell.
  #
  # Whatever string `template` returns is built into a jQuery object,
  # assigned to the instance variable `@$`, and then inserted onto
  # the appropriate part of the page.
  template: ->

  # OVERRIDE to perform tasks on each render before the render takes place
  preRender: ->
    null

  # Builds the template and all sub-templates into a jQuery object and inserts
  # into the DOM
  #
  # On each and every render, `Cell` constructs a single string and replaces
  # the entire html object onto the page. This method is most effective and
  # useful when the delta between renders would require a large number of
  # expensive DOM manipulation operations, and when one wishes to validate
  # the static output given a known input state. The replacement methods are
  # extremely fast on browsers and provide a very good alternative to
  # applications that require fast and frequent updating.
  #
  # The DOM's `replaceChild` method is used instead of `innerHTML` due to
  # optimization research done by Steven Levithan:
  # http://blog.stevenlevithan.com/archives/faster-than-innerhtml
  #
  # All sub-cells are also constructed into a single string and rendered
  # onto the page at the same time. However, each sub-cell needs to have
  # a jQuery reference to its DOM nodes through the `@$` construct.
  # After the html text has been rendered onto the page, the
  # `bindSubTemplates` method finds appropriate submodules and assigns the
  # `@$` references.
  render: ->
    if not @visible then return
    @preRender()

    @renderList = []

    # Always make sure we wrap templates in divs with the appropriate ID.
    # This guarantees we can successfully access it later
    template$ = $("<div class='cell' id='#{@cell_id}'>#{@template()}</div>")
    oldEl = $("##{@cell_id}")[0]

    if not oldEl?
      # Try and look for a div with the data-cell attribute set to the
      # associated Model's name
      oldEl = $("div[data-cell='#{@model.name}']")[0]

    # If we still can't find a place to put it, just append to the body
    if not oldEl?
      $("body").append(template$)
    else
      # We use the raw DOM methods instead of jQuery for performance
      templateEl = template$[0]
      oldEl.parentNode.replaceChild templateEl, oldEl

    # Assign the @$ object to the contents of our template$. We don't include
    # the cell wrapper div.
    @$ = template$.children()

    @bindSubTemplates()

    @events()

    @postRender()

    @rendered = true

  # After the template has been inserted onto the page, each sub-template
  # recursively gets bound to its appropriate DOM node.
  bindSubTemplates: ->
    for view in @renderList
      view.bindSubTemplates()
      # Remember that we wrapped the element in an extra div. We grab the
      # children to make this wrapping transparent
      view.$ = $("##{view.cell_id}").children()
      view.events() if view.events?
      view.postRender()
      view.rendered = true

  # OVERRIDE to perform tasks after a render has taken place.
  postRender: ->

  # If true, attempts to display template (if constructed) and enables
  # rendering. If false, attempts to hide template (if constructed) and
  # disables future rendering.
  setVisible: (status) ->
    if status is true
      @visible = true
      @render()
      @$?.show()
    if status is false
      @visible = false
      @$?.hide()

  # Used to include sub-templates for other Cells. Returns the template
  # string of the subtemplate and adds the view into the list of subtemplates
  # to be binded later.
  include: (view) ->
    if not view? then return ""

    @renderList.push view if view not in @renderList

    view.preRender()
    view.renderList = []
    return "<div class='cell' id='#{view.cell_id}'>#{view.template()}</div>"

  # Loops through all items in the collection, calls `include` on each, and
  # returns the completed string.
  buildCollection: (view_name)->
    out = ""
    for obj in @model.getAll()
      if view_name? or not obj.view?
        out += @include obj.getView view_name
      else
        out += @include obj.view
    return out

# Page Manager
# ------------
class Cell.PageManager extends Cell.Object
  constructor: ->
    super()
    @init()

  # OVERRIDE to run code on page startup
  init: ->

# Dispatch
# -------
class Cell.Dispatch
  # Singleton instance. Declared here to force closure
  _instance = undefined

  # The static get method
  @get: -> _instance ?= new _Dispatch

class _Dispatch

  constructor: ->
    # A mapping between events and lists of objects to be tiggered
    @dispatchList = {}

  subscribe: (context, event, callback) ->
    @dispatchList[event] ?= {}
    @dispatchList[event][context.cell_id] = [callback, context]

  unsubscribe: (obj, event) ->
    if @dispatchList[event]?
      delete @dispatchList[event][obj.cell_id]

  trigger: (event, args...) ->
    if @dispatchList[event]?
      for cell_id, trigger_data of @dispatchList[event]
        callback = trigger_data[0]
        context = trigger_data[1]
        callback.apply context, args
