(function() {
  var ExamplePage, Fetcher, FetcherView, Gallery, Listing, Tweet, TweetGalleryView, TweetListingView, TweetView, Tweets, TweetsView;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  ExamplePage = (function() {
    __extends(ExamplePage, Cell.PageManager);
    function ExamplePage() {
      ExamplePage.__super__.constructor.apply(this, arguments);
    }
    ExamplePage.prototype.init = function() {
      var fetcher, tweets;
      fetcher = new Fetcher({
        view: FetcherView
      });
      tweets = new Tweets({
        views: [Listing, Gallery]
      });
      fetcher.view.render();
      tweets.getView('Listing').setVisible(false);
      return tweets.getView('Gallery').render();
    };
    return ExamplePage;
  })();
  Fetcher = (function() {
    __extends(Fetcher, Cell.Model);
    function Fetcher(options) {
      Fetcher.__super__.constructor.call(this, options);
      this.FETCH_INTERVAL_SEC = 5;
      this.fetch_interval = void 0;
    }
    Fetcher.prototype.fetch = function(q) {
      clearInterval(this.fetch_interval);
      this._doFetch(q, 10);
      return this.fetch_interval = setInterval(__bind(function() {
        return this._doFetch(q, 1);
      }, this), this.FETCH_INTERVAL_SEC * 1000);
    };
    Fetcher.prototype._doFetch = function(q, numpages) {
      var i, _results;
      if (numpages == null) {
        numpages = 10;
      }
      q += "";
      _results = [];
      for (i = 0; 0 <= numpages ? i <= numpages : i >= numpages; 0 <= numpages ? i++ : i--) {
        _results.push($.ajax({
          url: "http://search.twitter.com/search.json",
          data: {
            q: q,
            page: i,
            rpp: 100,
            include_entities: true
          },
          dataType: "jsonp",
          success: __bind(function(r) {
            return this.trigger("new_tweets", r.results);
          }, this)
        }));
      }
      return _results;
    };
    return Fetcher;
  })();
  FetcherView = (function() {
    __extends(FetcherView, Cell.View);
    function FetcherView() {
      FetcherView.__super__.constructor.apply(this, arguments);
    }
    FetcherView.prototype.events = function() {
      this.$.find(".search").click(__bind(function() {
        return this.model.fetch(this.$.find(".fetch_input").val());
      }, this));
      return this.$.find(".fetch_input").keypress(__bind(function(e) {
        if (e.keyCode === 13) {
          return this.model.fetch(this.$.find(".fetch_input").val());
        }
      }, this));
    };
    FetcherView.prototype.template = function() {
      return "<div class=\"fetcher\">\n  <input type=\"text\" class=\"fetch_input\" />\n  <button class=\"search\">Find Twitter photos for this search</button>\n</div>";
    };
    return FetcherView;
  })();
  Tweets = (function() {
    __extends(Tweets, Cell.Collection);
    function Tweets(options) {
      Tweets.__super__.constructor.call(this, options);
      this.subscribe("new_tweets", this._newTweets);
    }
    Tweets.prototype._newTweets = function(results) {
      var t, tweet, tweets, _i, _len;
      if (!(results != null)) {
        return;
      }
      tweets = [];
      for (_i = 0, _len = results.length; _i < _len; _i++) {
        tweet = results[_i];
        if ((this.get('id', tweet.id) != null) || !(tweet.id != null)) {
          continue;
        }
        t = new Tweet({
          views: [TweetGalleryView, TweetListingView],
          data: tweet
        });
        if (t.hasPic()) {
          tweets.push(t);
        }
      }
      console.log(tweets);
      return this.add(tweets);
    };
    Tweets.prototype.switchView = function(type) {
      if (type === "listing") {
        this.getView('Gallery').setVisible(false);
        return this.getView('Listing').setVisible(true);
      } else if (type === "gallery") {
        this.getView('Gallery').setVisible(true);
        return this.getView('Listing').setVisible(false);
      }
    };
    return Tweets;
  })();
  TweetsView = (function() {
    __extends(TweetsView, Cell.View);
    function TweetsView() {
      TweetsView.__super__.constructor.apply(this, arguments);
    }
    TweetsView.prototype.events = function() {
      this.$.find(".do_gallery").click(__bind(function() {
        return this.model.switchView("gallery");
      }, this));
      return this.$.find(".do_list").click(__bind(function() {
        return this.model.switchView("listing");
      }, this));
    };
    TweetsView.prototype.template = function() {
      return "<div class=\"view_type\">\n  <button class=\"do_gallery\">Gallery View</button>\n  <button class=\"do_list\">List View</button>\n</div>";
    };
    return TweetsView;
  })();
  Gallery = (function() {
    __extends(Gallery, TweetsView);
    function Gallery() {
      Gallery.__super__.constructor.apply(this, arguments);
    }
    Gallery.prototype.template = function() {
      return "" + (Gallery.__super__.template.call(this)) + "\n<div class=\"gallery\">\n  " + (this.buildCollection("TweetGalleryView")) + "\n</div>";
    };
    return Gallery;
  })();
  Listing = (function() {
    __extends(Listing, TweetsView);
    function Listing() {
      Listing.__super__.constructor.apply(this, arguments);
    }
    Listing.prototype.template = function() {
      return "" + (Listing.__super__.template.call(this)) + "\n<div class=\"listing\">\n  " + (this.buildCollection("TweetListingView")) + "\n</div>";
    };
    return Listing;
  })();
  Tweet = (function() {
    __extends(Tweet, Cell.Model);
    function Tweet(options) {
      Tweet.__super__.constructor.call(this, options);
      this.D('pics', []);
      this._parsePicture();
    }
    Tweet.prototype.hasPic = function() {
      return this.D('pics').length > 0;
    };
    Tweet.prototype._parsePicture = function() {
      var exp, media, media_item, pic, twitpic_regex, url, urls, yfrog_regex, _i, _j, _len, _len2, _ref, _ref2, _results;
      twitpic_regex = /http:\/\/(www.)?twitpic.com\/([a-zA-Z0-9]+)/;
      yfrog_regex = /http:\/\/(www.)?yfrog.com\/([a-zA-Z0-9]+)/;
      urls = (_ref = this.D('entities')) != null ? _ref.urls : void 0;
      media = (_ref2 = this.D('entities')) != null ? _ref2.media : void 0;
      if ((urls != null ? urls.length : void 0) > 0) {
        for (_i = 0, _len = urls.length; _i < _len; _i++) {
          url = urls[_i];
          exp = url.expanded_url;
          if (!(exp != null)) {
            continue;
          }
          if (exp.match(twitpic_regex)) {
            pic = exp.replace(twitpic_regex, "http://twitpic.com/show/large/$2");
          } else if (exp.match(yfrog_regex)) {
            pic = exp.replace(yfrog_regex, "http://yfrog.com/$2:medium");
          }
          if (pic != null) {
            this.D('pics').push(pic);
          }
        }
      }
      if ((media != null ? media.length : void 0) > 0) {
        _results = [];
        for (_j = 0, _len2 = media.length; _j < _len2; _j++) {
          media_item = media[_j];
          pic = media_item.media_url;
          _results.push(pic != null ? this.D('pics').push(pic) : void 0);
        }
        return _results;
      }
    };
    return Tweet;
  })();
  TweetView = (function() {
    __extends(TweetView, Cell.View);
    function TweetView() {
      TweetView.__super__.constructor.apply(this, arguments);
    }
    TweetView.prototype.template = function() {
      var local_time;
      local_time = new Date(this.D('created_at'));
      local_time = local_time.toString();
      return "<div class=\"tweet\">\n  <div class=\"tweet_text\">" + (this.D("text")) + "</div>\n  <div class=\"tweet_info\">By <a href=\"http://twitter.com/" + (this.D("from_user")) + "\">@" + (this.D('from_user')) + "</a> on " + local_time + "</div>\n</div>";
    };
    return TweetView;
  })();
  TweetGalleryView = (function() {
    __extends(TweetGalleryView, TweetView);
    function TweetGalleryView() {
      this.onMouseLeave = __bind(this.onMouseLeave, this);
      this.onMouseEnter = __bind(this.onMouseEnter, this);
      TweetGalleryView.__super__.constructor.apply(this, arguments);
    }
    TweetGalleryView.prototype.events = function() {
      return this.$.hover(this.onMouseEnter, this.onMouseLeave);
    };
    TweetGalleryView.prototype.onMouseEnter = function(e) {
      return this.$.find(".tweet_wrap").fadeIn('fast');
    };
    TweetGalleryView.prototype.onMouseLeave = function(e) {
      return this.$.find(".tweet_wrap").fadeOut('fast');
    };
    TweetGalleryView.prototype.template = function() {
      var pic, pics, _i, _len, _ref;
      pics = "<div class='pics'>";
      _ref = this.D('pics');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pic = _ref[_i];
        pics += "<img src='" + pic + "'/>";
      }
      pics += "</div>";
      return "<div class=\"tweet_gallery\"><div class=\"tweet_gallery_wrap\">\n  <div class=\"pic_wrap\">" + pics + "</div>\n  <div class=\"tweet_wrap\">" + (TweetGalleryView.__super__.template.call(this)) + "</div>\n</div></div>";
    };
    return TweetGalleryView;
  })();
  TweetListingView = (function() {
    __extends(TweetListingView, TweetView);
    function TweetListingView() {
      TweetListingView.__super__.constructor.apply(this, arguments);
    }
    TweetListingView.prototype.template = function() {
      return "<div class=\"tweet_listing\">" + (TweetListingView.__super__.template.call(this)) + "</div>";
    };
    return TweetListingView;
  })();
  jQuery(function() {
    return new ExamplePage;
  });
}).call(this);
