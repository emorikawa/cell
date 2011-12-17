# Using Cell
* Download the **coffescript** file here: [cell.0.1.0.coffee][]
* Download the compiled **javascript** file here: [cell.0.1.0.js][]
* See the **example app** here: [Cell example app][]
* Fork on **Github** here: [https://github.com/emorikawa/cell][Github]
* See the **annotated source** here: [][Annotated]
* **Clone the repo** from Github here: [git@github.com:emorikawa/cell.git][Clone]

The only dependency is [jQuery][http://jquery.com].

## Getting Started
1. Skim this whole page
2. Read [Building a Cell App Step 1]()
3. Read [Building a Cell App Step 2]()
4. Read [Building a Cell App Step Done]()

[cell.0.1.0.coffee]: /
[cell.0.1.0.js]: /
[Github]: https://github.com/emorikawa/cell
[Annotated]: /
[Clone]: git@github.com:emorikawa/cell.git
[Cell example app]: /

# What is Cell
**Cell is a Coffeescript mini framework for very dynamic, javascript-rendered web applications.**

That means we're a single \[coffee|java\]script include which helps you easily build extremely interactive web applications on the front-end, for the front-end.

First, divide up your web app into individual, compartmentalized modules & components - or *Cells* as we call them.

Each *Cell* has a *Model* which holds and manipulates data.

Each *Cell* has a *View* which controls how it should be displayed and interacted with.

The work that is traditionally taken up with a controller is instead divided between Views and Models. Any methods that deal with data are part of Models; any methods that deal with the display are part of Views.

**Almost everything on a page is rendered by Cell.**

To see what we mean by this, look at the [page source][] for our [example app][]. See how with only two lines of html in the body we can make a fairly fancy dyanmic application!

Now look at the single [coffeescript source file][] for the example app. That's it. ~200 lines, including comments, a couple of Cells, and a bit of parsing logic.

# Why Cell
First of all, I love frameworks like [backbone](http://documentcloud.github.com/backbone), and I think the work [Brunch](http://brunch.io) has done is cool too. However, when we were developing [Shadowbox](http://shadowbox.me) and started geting slogged in a myriad of rendering queues, and slow jQuery appends, & prepends, I began looking for a better solution.

**Fast, robuts, rendering:**
Instead of building a dynamic page from delta to delta, always have an absolute singular reprsentation of each Cell, that on each major change can be confidently and entirely replaced in one go. Since DOM replacement is about as close as you can get to browser's repainters, and you now don't need to worry about getting elements off sync anymore, Cell uses a render-replace method to display everything.

**Testing known outputs:**
Futhermore, when each Cell's view outputs a known single chunck of rendered HTML, we have a clear string that can be tested. This means the Views can be hooked up to test frameworks, fed test data, and automatically validated.

**Super lightweight**
Cell is quite small. It was deceptively hard to make this true. If something wasn't absolutely necessary, it didn't get included. It's likely the case that as a result, some things are still missing. That's why we need your help to improve it.

# Help Build Cell!
* Submit [issues on Github][]
* Fork the [code][]
* Complain to Evan Morikawa at: {First}@{FirstLast}.com
* Tweet to {a yet to be setup Twitter handle}

# The API
Each Cell has a `Model` and zero or more `View`s.

`Collection`s are `Model`s that can easily hold many other `Model`s.

A `PageManager` is used to setup and initialize the framework as well as manage things that happen outside of any single Cell.

All objects:
* inherit from `Cell.Object`
* have unique IDs stored in `@cell_id`
* have a string name stored in `@name`
* can `subscribe` to and `trigger` custom inter-Cell events

## Cell.Object
All objects inherit from `Cell.Object`

### subscribe: (event, callback)
Binds a `callback` function to an arbitrary string `event`. Events are always global and are the primary mechanism of inter-cell communication. Do not abuse.

    @subscribe "new_items", @handleNewItems

    handleNewItems = (args...) -> alert args.length

### unsubscribe: (event)
Unbinds `this` object from the `event`

### trigger: (event, args...)
Triggers the `event`. Any an all objects subscribed to the `event` get their bound callbacks called with `args...` passed in. Since Cells should be independent, if inter-cell communication is necessary, or events happen that multiple Cells would care about, the Dispatcher is available to facilitate this need.

    @trigger "new_items", item_arr, my_options

## Cell.Model
Each Cell must have a `Model`. The Model is responsible for storing and manipulating the data of a Cell.

Interact with data through the getter/setter method `D`.

Models also hold references to the view(s) of the Cell and are responsible for managing those references.

### constructor: (setup)
`Model`s can be constructed with a key-value hash of options. The following are valid keys and their corresponding expected values:

* `data` : A hash of key-value data records
* `name` : An optional custom string name for the Model. Defaults to class name
* `view` : A `View` constructor to be used as this Cell's singular view.
* `views` : An array of `View` constructors to allow the Cell to have multiple `view`s
* `initialize` : A custom method to be run at the end of object construction in scope of the object.

    class Eukaryote extends Cell.Model

    ...

    stem = new Eukaryote
      data:
        DNA: "ATCAGACTGGCATTACGCGATATG"
        protein: "RCANNFAPLDAA"
      name: "osmosis_jones"
      views: [EukaryoteView, EukaryoteAlternateView]

### D: ([data], [set\_value])
A multipurpose getter and setter for a `Model`s `D`ata. Since data access is so frequent and often times inline, the accessor method was intentionally shortened to one character.

    D() # Returns all of the data

    D "foo" # Returns the data stored at key "foo"

    D "foo", "bar" # Sets key "foo" to value "bar"

    D {foo:'bar', baz:'cell'} # Extends data store with object

### getView: (view\_name)
Returns the `View` object with the given `view_name` string. This is why all objects have names.

### addView: (view\_obj)
Add a `View` object. It is stored using the `View`s `name`.

### createView: (view\_constructor, setup)
Creates a new `View` using the given `view_constructor`, passes in the `setup` params to the `view_constructor`, then adds it to this `Model`.

### setPrimaryView: (view\_name)
Assigns the special Model field `view` to the View given by `view_name`. Since many Cells only have one view, this acts as a convenience to refrain from having to explicitly go through the `getView` method each time the single view needs to be accessed.

### renderViews: ([names...])
If `names...` is empty, calls `render` on all of this Model's views. Otherwise calls `render` on the views with names in the `names...` splat.

### getCollection: (collection\_name)
If this `Model` is part of a `Collection`, a named reference to that `Collection` will be stored. This returns a reference to that collection by its `collection_name`.

### addCollection: (collection\_obj)
Stores a reference to a collection that this `Model` is a part of.


## Cell.Collection
`Collection`s extend `Model` and are effectively a glorified ordered list of similar `Model` objects.

### constructor: (setup)
Calls `Cell.Model#constructor` and passes in same args.

    spleen = new Organ
      view: SpleenView

### length:

### add: (obj, [silent=false], [direction="push"])
Takes a single object, or list of objects, and adds them to the collection.

If `silent` is `false` or equal to `"silent"`, then this will not trigger a `render` on the Collection's views.

If `direction` can either be "push" or "unshift". This simply determines which side of the ordered list new elements are added to.

    @add cancer_cell
    @add stem_cell, "silent", "unshift"

### onAdd: (obj)
**OVERRIDE** `onAdd` to perform custom actions every time an object is added to the collection.

### hasDuplicate: (obj, [field], [collection])
Duplication is true if there is an object within the `collection` that has the same value for the given `field`. 

By defualt `field` is the `cell_id` field that all Objects have.

By default `collection` is this `Collection` object's collection.

    @hasDuplicate new_cell, "genome"

### del: (obj, [silent=false])
Removes object from the collection. Finds the object by its `cell_id`. Calls `render` on the `Collection`'s view(s) unless `silent` is set to false or "silent"

### removeAll: ([silent=false])
Clears the collection and calls `render` unless specified otherwise

### replace: (newObjs, [silent=false])
Completely replaces the collection with the list of `newObjs`. Does not merge.

### getAll:
Returns all objects in the collection. Can be overriden to add filters, etc.

### get: (key, value):
Returns all items in the collection that have a matching key and value pair.

    cell1 = @get "cell_id, "ab88001fcc920a3f880"
    cell2 = @get "type", "stem"

## Cell.View
Each Cell has zero or more `Views`. The `View` class is designed to describe both how the Cell should render and handle any events and changes to the views.

Please read the documentation on the `render` method to learn how Cell renders views.

The associated model is stored in the View's special `model` field.

The data of the associated model can be accessed through the `D` method.

The HTML output of the View is defined in the user-overriden `template` method

The HTML jQuery representation of the `template` is stored in the View's special `$` field.

All jQuery and Cell events are defined and handled in the user-overriden `events` method.

Other views of other Cells may be recursively included in `templates` via the `include` method.

Views **must** be associated with a single `Model`. This is why Views are usually created through a Model's constructor method or through a Model's `createView` method.

It is good practice to construct Views that can be arbitrarily included in multiple places and environments. Cells should be as independent as possible and Views should reflect that.

### constructor: (model, [setup])
`Views` are usually automatically constructed in the creation of their corresponding `Models`. If they are to be initialized separately, a `model` must be defined.

Views are powerful when extended. Multiple views may inherit from a common ancestor who provides basic templating and common methods.

`setup` is a hash of valid setup options. The options and their accepted values are:

* `name` : An optional custom string name for the Model. Defaults to class name
* `visible` : A boolean flag determining whether the view renders.
* `initialize` : A method to run once the view has been initialized

    class MyView extends Cell.View
    class MyOtherView extends Cell.View

    ...

    mod = new MyModel
      view: MyView

    ...

    mod.createView MyOtherView, setup_hash

    ...

    mod.addView new MyOtherView mod, setup_hash

### D: ([data], [set])
Shorthand alias that accesses the model's data. Does nothing more than: `@model.D(data, set)`

### events:
**OVERRIDE** `events` to setup this View's event bindings. This is where both jQuery and Cell events are defined.

Some jQuery examples:
    @$.bind "click", @onClick
    @$.find(".target").bind "hover", @onMouseEnter, @onMouseLeave

Some Cell event examples:
    @subscribe "socketUpdate", @onUpdate

Since every re-render creates a new @$ object, the `events` method is run after each and every render to refresh the bindings.

### template:
**OVERRIDE** `template` to define the HTML output of this View. Must return a valid HTML string.

Use coffeescript's string interpolation to make the view's dynamic.

Here is an example that uses the builtin @include method and other techniques:

    template: -> """
      <div class="eukaryotes">
        <h1>A nice cell</h1>
        #{@include @D('nucleus').view}
        <p>Some cool stuff<p>
      </div>
    """

### preRender:
**OVERRIDE** `preRender` to perform logic before a render happens. Since this is before a render, you should not assume that `$` template object has been inserted onto the DOM.

### render:
Performs the following 6 major steps:

1. Runs `preRender`
2. Builds the `template` string (and recursively all `included` views) and wraps it in a div with the given `cell_id`. The wrap enables step 4 to happen
3. Inserts the string into the DOM
4. Re-connects each Cell's `$` field with the appropriate DOM node
6. Re-binds all events
5. Runs `postRender`

When render is inserting the template into the DOM, it looks for one of three things:
1. A div with an id equal to the `cell_id`
2. A div with a `data-cell` attribute equal to the name of the cell's Model
3. If none of the above can be found, it appends the element to the DOM `body`

### postRender:
**OVERRIDE** `postRender` to perform logic after a render happens. This is the only place that one can guarantee the `$` template object exists on the DOM.

### setVisible: (status)
Sets boolean `status` flag. When set to `false`, prevents the View from rendering and tries to hide the DOM nodes.

### include: (view)
Returns the template string of the inculded `view` object. Also adds that sub-view in a list of views to recursively re-render. First runs the included `view`'s pre-render method before calling it's `template` method.

### buildCollection: (use\_view)
A convenience method that Views of Collections can use to automatically loop through and include views from all of the objects in its collection.

`use_view` is required to specify which view to include from each object in the collection.

    template: ->"""
      #{super()}
      <div class="listing">
        #{@buildCollection "TweetListingView"}
      </div>
    """

## Cell.PageManager
A class responsible for initializing the first views on a page and handling events that are not part of any Cell.

### init
**OVERRIDE** `init` to setup views. Automatically run when the PageManager gets constructed.

    init: ->
      stem = new Eukaryote
        view: EukaryoteView

      stem.view.render()
