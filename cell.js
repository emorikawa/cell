(function() {
  var Cell, root, _Dispatch;
  var __slice = Array.prototype.slice, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  root = this;
  Cell = typeof exports !== "undefined" && exports !== null ? exports : root.Cell = {};
  Cell.Object = (function() {
    function Object() {
      var func, methodName, methods;
      methods = {};
      for (methodName in this) {
        func = this[methodName];
        if (methodName.charAt(0) !== '_') {
          methods[methodName] = this[methodName];
        } else {
          methods[methodName] = void 0;
        }
      }
      this.cell_id = this._UUID();
      this.name = this.getClassName();
      return methods;
    }
    Object.prototype.subscribe = function(event, callback) {
      return Cell.Dispatch.get().subscribe(this, event, callback);
    };
    Object.prototype.unsubscribe = function(event) {
      return Cell.Dispatch.get().unsubscribe(this, event);
    };
    Object.prototype.trigger = function() {
      var args, event, _ref;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return (_ref = Cell.Dispatch.get()).trigger.apply(_ref, [event].concat(__slice.call(args)));
    };
    Object.prototype.getClassName = function() {
      var arr;
      if (this && this.constructor && this.constructor.toString) {
        arr = this.constructor.toString().match(/function\s*(\w+)/);
        if (arr && arr.length === 2) {
          return arr[1];
        }
      }
    };
    Object.prototype._UUID = function() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r, v;
        r = Math.random() * 16 | 0;
        v = c === 'x' ? r : r & 0x3 | 0x8;
        return v.toString(17);
      });
    };
    return Object;
  })();
  Cell.Model = (function() {
    __extends(Model, Cell.Object);
    function Model(options) {
      var initialize, key, value;
      Model.__super__.constructor.call(this);
      this._data = {};
      this._views = {};
      this._collection = {};
      this.view = void 0;
      for (key in options) {
        value = options[key];
        switch (key) {
          case 'data':
            this.D(value);
            break;
          case 'name':
            this.name = value;
            break;
          case 'view':
            this.createView(value);
            break;
          case 'views':
            this.createViews(value);
            break;
          case 'initialize':
            initialize = value;
        }
      }
      if (initialize != null) {
        initialize.call(this);
      }
      if (!(this.view != null)) {
        this.createView(this.getClassName() + "View");
      }
      this;
    }
    Model.prototype.D = function(data, set_value) {
      if (arguments.length > 0) {
        if (typeof data === 'string') {
          if (arguments.length === 1) {
            return this._data[data];
          } else if (arguments.length === 2) {
            return this._data[data] = set_value;
          }
        } else if (typeof data === 'object') {
          return $.extend(this._data, data);
        }
      } else {
        return this._data;
      }
    };
    Model.prototype.getView = function(view_name) {
      return this._views[view_name];
    };
    Model.prototype.addView = function(view_obj) {
      if (view_obj instanceof Cell.View) {
        return this._views[view_obj.name] = view_obj;
      }
    };
    Model.prototype.createViews = function(view_list) {
      var view, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = view_list.length; _i < _len; _i++) {
        view = view_list[_i];
        _results.push(this.createView(view));
      }
      return _results;
    };
    Model.prototype.createView = function(view_constructor, options) {
      var v;
      if (view_constructor instanceof Cell.View) {
        return this.addView(view_constructor);
      } else if (typeof view_constructor === "function") {
        v = new view_constructor(this, options);
        this.addView(v);
        if (!(this.view != null)) {
          this.setPrimaryView(v.name);
        }
        return v;
      }
    };
    Model.prototype.setPrimaryView = function(view_name) {
      return this.view = this.getView(view_name);
    };
    Model.prototype.renderViews = function() {
      var name, names, view, _i, _len, _ref, _ref2, _results, _results2;
      names = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (names.length === 0) {
        _ref = this._views;
        _results = [];
        for (name in _ref) {
          view = _ref[name];
          _results.push(view.render());
        }
        return _results;
      } else {
        _results2 = [];
        for (_i = 0, _len = names.length; _i < _len; _i++) {
          name = names[_i];
          _results2.push((_ref2 = this._views[name]) != null ? _ref2.render() : void 0);
        }
        return _results2;
      }
    };
    Model.prototype.getCollection = function(collection_name) {
      return this._collection[collection_name];
    };
    Model.prototype.addCollection = function(collection_obj) {
      if (collection_obj instanceof Cell.Collection) {
        return this._collection[collection_obj.name] = collection_obj;
      }
    };
    return Model;
  })();
  Cell.Collection = (function() {
    __extends(Collection, Cell.Model);
    function Collection(options) {
      Collection.__super__.constructor.call(this, options);
      this._collection = [];
      this;
    }
    Collection.prototype.length = function() {
      return this._collection.length;
    };
    Collection.prototype.add = function(obj, silent, push) {
      var indv_obj, _i, _len;
      if (silent == null) {
        silent = false;
      }
      if (push == null) {
        push = false;
      }
      if (obj instanceof Array) {
        for (_i = 0, _len = obj.length; _i < _len; _i++) {
          indv_obj = obj[_i];
          this.add(indv_obj, "silent", push);
        }
      } else {
        if (push === "push" || push === true) {
          this._collection.push(obj);
        } else if (push === "unshift" || push === false) {
          this._collection.unshift(obj);
        }
        obj.addCollection(this);
      }
      if (silent === "silent" || silent === true) {
        null;
      } else {
        this.renderViews();
      }
      this.onAdd(obj);
      return obj;
    };
    Collection.prototype.onAdd = function(obj) {};
    Collection.prototype.hasDuplicate = function(obj, field, collection) {
      var item, _i, _len;
      for (_i = 0, _len = collection.length; _i < _len; _i++) {
        item = collection[_i];
        if (obj.D(field) === item.D(field)) {
          return true;
        } else {
          continue;
        }
      }
      return false;
    };
    Collection.prototype.del = function(obj, silent) {
      var del_id, i;
      if (silent == null) {
        silent = false;
      }
      if (obj instanceof Model) {
        del_id = obj.cell_id;
      } else if (obj === 'string') {
        del_id = obj;
      } else {
        return false;
      }
      i = 0;
      while (i < this._collection.length) {
        if (del_id === this._collection[i].cell_id) {
          this._collection.splice(i, 1);
        }
        i++;
      }
      if (silent === "silent" || silent === true) {
        return null;
      } else {
        return this.renderViews();
      }
    };
    Collection.prototype.removeAll = function(silent) {
      if (silent == null) {
        silent = false;
      }
      this._collection = [];
      if (silent === "silent" || silent === true) {
        return null;
      } else {
        return this.renderViews();
      }
    };
    Collection.prototype.replace = function(newObjs, silent) {
      var obj, _i, _len;
      if (silent == null) {
        silent = false;
      }
      this._collection = newObjs;
      for (_i = 0, _len = newObjs.length; _i < _len; _i++) {
        obj = newObjs[_i];
        obj.collection(this);
      }
      if (silent === "silent" || silent === true) {
        return null;
      } else {
        return this.renderViews();
      }
    };
    Collection.prototype.getAll = function() {
      return this._collection;
    };
    Collection.prototype.get = function(key, value) {
      var a, _i, _len, _ref;
      _ref = this.getAll();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        a = _ref[_i];
        if ((a.D(key) != null) && a.D(key) === value) {
          return a;
        }
      }
    };
    return Collection;
  })();
  Cell.View = (function() {
    __extends(View, Cell.Object);
    function View(model, options) {
      var initialize, key, value;
      this.model = model;
      View.__super__.constructor.call(this);
      if (!(this.model != null)) {
        throw new Error("Reference to this view's model is required");
      }
      this.$ = void 0;
      this.renderList = [];
      this.rendered = false;
      this.visible = true;
      for (key in options) {
        value = options[key];
        switch (key) {
          case 'name':
            this.name = value;
            break;
          case 'initialize':
            initialize = value;
            break;
          case 'visible':
            this.setVisible(value);
        }
      }
      if (initialize != null) {
        initialize.call(this);
      }
    }
    View.prototype.D = function(data, set) {
      if (arguments.length === 0) {
        return this.model.D();
      } else if (arguments.length === 1) {
        return this.model.D(data);
      } else if (arguments.length >= 2) {
        return this.model.D(data, set);
      }
    };
    View.prototype.events = function() {};
    View.prototype.template = function() {};
    View.prototype.preRender = function() {};
    View.prototype.render = function() {
      var oldEl, template$, templateEl;
      if (!this.visible) {
        return;
      }
      this.preRender();
      this.renderList = [];
      template$ = $("<div class='cell' id='" + this.cell_id + "'>" + (this.template()) + "</div>");
      oldEl = $("#" + this.cell_id)[0];
      if (!(oldEl != null)) {
        oldEl = $("div[data-cell='" + this.model.name + "']")[0];
      }
      if (!(oldEl != null)) {
        $("body").append(template$);
      } else {
        templateEl = template$[0];
        oldEl.parentNode.replaceChild(templateEl, oldEl);
      }
      this.$ = template$.children();
      this.bindSubTemplates();
      this.events();
      this.postRender();
      return this.rendered = true;
    };
    View.prototype.bindSubTemplates = function() {
      var view, _i, _len, _ref, _results;
      _ref = this.renderList;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        view.bindSubTemplates();
        view.$ = $("#" + view.cell_id).children();
        if (view.events != null) {
          view.events();
        }
        view.postRender();
        _results.push(view.rendered = true);
      }
      return _results;
    };
    View.prototype.postRender = function() {};
    View.prototype.setVisible = function(status) {
      var _ref, _ref2;
      if (status === true) {
        this.visible = true;
        this.render();
        if ((_ref = this.$) != null) {
          _ref.show();
        }
      }
      if (status === false) {
        this.visible = false;
        return (_ref2 = this.$) != null ? _ref2.hide() : void 0;
      }
    };
    View.prototype.include = function(view) {
      if (!(view != null)) {
        return "";
      }
      if (__indexOf.call(this.renderList, view) < 0) {
        this.renderList.push(view);
      }
      view.preRender();
      view.renderList = [];
      return "<div class='cell' id='" + view.cell_id + "'>" + (view.template()) + "</div>";
    };
    View.prototype.buildCollection = function(view_name) {
      var obj, out, _i, _len, _ref;
      out = "";
      _ref = this.model.getAll();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        obj = _ref[_i];
        if ((view_name != null) || !(obj.view != null)) {
          out += this.include(obj.getView(view_name));
        } else {
          out += this.include(obj.view);
        }
      }
      return out;
    };
    return View;
  })();
  Cell.PageManager = (function() {
    __extends(PageManager, Cell.Object);
    function PageManager() {
      PageManager.__super__.constructor.call(this);
      this.init();
    }
    PageManager.prototype.init = function() {};
    return PageManager;
  })();
  Cell.Dispatch = (function() {
    var _instance;
    function Dispatch() {}
    _instance = void 0;
    Dispatch.get = function() {
      return _instance != null ? _instance : _instance = new _Dispatch;
    };
    return Dispatch;
  })();
  _Dispatch = (function() {
    function _Dispatch() {
      this.dispatchList = {};
    }
    _Dispatch.prototype.subscribe = function(context, event, callback) {
      var _base, _ref;
            if ((_ref = (_base = this.dispatchList)[event]) != null) {
        _ref;
      } else {
        _base[event] = {};
      };
      return this.dispatchList[event][context.cell_id] = [callback, context];
    };
    _Dispatch.prototype.unsubscribe = function(obj, event) {
      if (this.dispatchList[event] != null) {
        return delete this.dispatchList[event][obj.cell_id];
      }
    };
    _Dispatch.prototype.trigger = function() {
      var args, callback, cell_id, context, event, trigger_data, _ref, _results;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (this.dispatchList[event] != null) {
        _ref = this.dispatchList[event];
        _results = [];
        for (cell_id in _ref) {
          trigger_data = _ref[cell_id];
          callback = trigger_data[0];
          context = trigger_data[1];
          _results.push(callback.apply(context, args));
        }
        return _results;
      }
    };
    return _Dispatch;
  })();
}).call(this);
