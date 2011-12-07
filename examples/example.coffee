#     Example application using Cell
#     (c) 2011 Evan Morikawa
#     Finds and displays all photos associated with a Twitter search.
#     Live updates the page when new photos come in.

# Page Manager
# ------------

# Creates top-level Cells, initializes rendering, and manages events outside
# of any individual Cell.
class ExamplePage extends Cell.PageManager
  init: ->
    # Create top-level Cells and define the views they can use
    fetcher = new Fetcher
      view: FetcherView
    tweets = new Tweets
      views: [Listing, Gallery]

    # Render the views onto the page. By default, Cell will try and find
    # divs with `data-cell` attributes equal to the Cell's Model name.
    # Otherwise, it will simply be appended onto the body.
    fetcher.view.render()
    tweets.getView('Listing').setVisible false
    tweets.getView('Gallery').render()

# Cell: Tweet Fetcher
# -------------------

# Given a twitter search, Fetcher polls Twitter, parses tweets, and
# dispatches events to update the page.
class Fetcher extends Cell.Model
  constructor: (options) ->
    super options
    @FETCH_INTERVAL_SEC = 5
    @fetch_interval = undefined

  fetch: (q) ->
    clearInterval @fetch_interval
    @_doFetch q, 10

    @fetch_interval = setInterval =>
      @_doFetch q, 1
    , @FETCH_INTERVAL_SEC * 1000

  _doFetch: (q,numpages=10) ->
    q += ""
    for i in [0..numpages]
      $.ajax
        url: "http://search.twitter.com/search.json",
        data: {q:q, page:i, rpp:100, include_entities:true},
        dataType: "jsonp",
        success: (r) => @trigger "new_tweets", r.results

class FetcherView extends Cell.View
  events: ->
    @$.find(".search").click => @model.fetch @$.find(".fetch_input").val()
    @$.find(".fetch_input").keypress (e) =>
      @model.fetch @$.find(".fetch_input").val() if e.keyCode is 13

  template:->"""
    <div class="fetcher">
      <input type="text" class="fetch_input" />
      <button class="search">Find Twitter photos for this search</button>
    </div>
  """


# Cell: Tweet Collection
# ----------------------

# Holds a collection of tweets.
class Tweets extends Cell.Collection
  constructor: (options) ->
    super options
    @subscribe "new_tweets", @_newTweets

  _newTweets: (results) ->
    if not results? then return
    tweets = []
    for tweet in results
      continue if @get('id',tweet.id)? or not tweet.id?
      t = new Tweet
        views : [TweetGalleryView, TweetListingView]
        data  : tweet
      if t.hasPic() then tweets.push t
    console.log tweets
    @add tweets

  switchView: (type) ->
    if type is "listing"
      @getView('Gallery').setVisible false
      @getView('Listing').setVisible true
    else if type is "gallery"
      @getView('Gallery').setVisible true
      @getView('Listing').setVisible false

# Abstract view of twitter tweets that can be inherited.
class TweetsView extends Cell.View
  events: ->
    @$.find(".do_gallery").click => @model.switchView "gallery"
    @$.find(".do_list").click => @model.switchView "listing"

  template: -> """
    <div class="view_type">
      <button class="do_gallery">Gallery View</button>
      <button class="do_list">List View</button>
    </div>
  """
# Displays tweets in a fixed-margin, fixed-height tiled gallery.
class Gallery extends TweetsView
  template: -> """
    #{super()}
    <div class="gallery">
      #{@buildCollection "TweetGalleryView"}
    </div>
  """

# Displays tweets in a list-like format.
class Listing extends TweetsView
  template: ->"""
    #{super()}
    <div class="listing">
      #{@buildCollection "TweetListingView"}
    </div>
  """


# Cell: Individual Tweet
# ----------------------

# Cell for a single tweet.
class Tweet extends Cell.Model
  constructor: (options) ->
    super options
    @D 'pics', []
    @_parsePicture()

  hasPic: -> @D('pics').length > 0

  _parsePicture: ->
    twitpic_regex = /http:\/\/(www.)?twitpic.com\/([a-zA-Z0-9]+)/
    yfrog_regex = /http:\/\/(www.)?yfrog.com\/([a-zA-Z0-9]+)/
    urls = @D('entities')?.urls
    media = @D('entities')?.media
    if urls?.length > 0
      for url in urls
        exp = url.expanded_url
        if not exp? then continue
        if exp.match twitpic_regex
          pic = exp.replace(twitpic_regex,"http://twitpic.com/show/large/$2")
        else if exp.match yfrog_regex
          pic = exp.replace(yfrog_regex,"http://yfrog.com/$2:medium")
        @D('pics').push pic if pic?
    if media?.length > 0
      for media_item in media
        pic = media_item.media_url
        @D('pics').push pic if pic?

# Abstract view of a single Twitter tweet.
class TweetView extends Cell.View
  template: ->
    local_time = new Date @D('created_at')
    local_time = local_time.toString()
    """
      <div class="tweet">
        <div class="tweet_text">#{@D "text"}</div>
        <div class="tweet_info">By <a href="http://twitter.com/#{@D "from_user"}">@#{@D 'from_user'}</a> on #{local_time}</div>
      </div>
    """

# The layout for a single tweet in Gallery mode
class TweetGalleryView extends TweetView
  events: ->
    @$.hover @onMouseEnter, @onMouseLeave

  onMouseEnter: (e) =>
    @$.find(".tweet_wrap").fadeIn 'fast'

  onMouseLeave: (e) =>
    @$.find(".tweet_wrap").fadeOut 'fast'

  template: ->
    pics = "<div class='pics'>"
    pics += "<img src='#{pic}'/>" for pic in @D('pics')
    pics += "</div>"
    """
    <div class="tweet_gallery"><div class="tweet_gallery_wrap">
      <div class="pic_wrap">#{pics}</div>
      <div class="tweet_wrap">#{super()}</div>
    </div></div>
    """
# The layout for a single tweet in List mode
class TweetListingView extends TweetView
  template: -> """
      <div class="tweet_listing">#{super()}</div>
    """

# Startup Cell. Automatically runs init which will render the to-level Cells.
jQuery -> new ExamplePage
