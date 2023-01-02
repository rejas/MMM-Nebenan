/* global performWebRequest */

/* MagicMirror²
 * Module: MMM-Nebenan
 *
 * MIT Licensed.
 */
Module.register("MMM-Nebenan", {
  // Default module config.
  defaults: {
    apiUrl: "https://api.nebenan.de/api/v2",
    hoodName: "alt-friedrichsfelde",
    maxFeedItems: -1,
    initialLoadDelay: 0,
    updateInterval: 100 * 1000,
    animationInterval: 5 * 1000,
    animationSpeed: 2.5 * 1000,
    type: "hoods",
    showAsList: false
  },

  // Module properties.
  templateData: [],
  activeItem: 0,

  // Define required styles.
  getStyles: function () {
    return ["nebenan.css"];
  },

  // Return the scripts that are necessary for the module.
  getScripts: function () {
    return [this.file("../default/utils.js"), "moment.js"];
  },

  // Start the module.
  start: function () {
    // Set locale.
    moment.locale(config.language);

    // Schedule the first update.
    this.scheduleUpdate(this.config.initialLoadDelay);
  },

  // Select the template depending on the display type.
  getTemplate: function () {
    switch (this.config.type.toLowerCase()) {
      case "hoods":
      default:
        return "hoods.njk";
    }
  },

  // Add all the data to the template.
  getTemplateData: function () {
    if (this.error) {
      return {
        error: this.error
      };
    }
    if (this.templateData.length === 0) {
      return {
        empty: true
      };
    }
    if (this.activeItem >= this.templateData.length) {
      this.activeItem = 0;
    }
    console.log(this.activeItem);
    console.log({
      loaded: true,
      config: this.config,
      items: this.templateData,
      activeItem: this.templateData[this.activeItem]
    });
    return {
      loaded: true,
      config: this.config,
      items: this.templateData,
      activeItem: this.templateData[this.activeItem]
    };
  },

  scheduleUpdate: function (delay = null) {
    let nextLoad = this.config.updateInterval;
    if (delay !== null && delay >= 0) {
      nextLoad = delay;
    }

    setTimeout(() => {
      switch (this.config.type.toLowerCase()) {
        case "hoods":
        default:
          this.fetchHoods();
      }
    }, nextLoad);

    setInterval(() => {
      this.activeItem++;
      if (!this.config.showAsList)
		  this.updateDom(this.config.animationSpeed);
    }, this.config.animationInterval);
  },

  // Create a URL from the config and base URL.
  getUrl() {
    let url = "";
    switch (this.config.type.toLowerCase()) {
      case "hoods":
      default:
        // TODO url doesnt respect perPage?
        url =
          this.config.apiUrl +
          `/hoods/${this.config.hoodName}/public_feed.json?per_page=${this.config.maxFeedItems}`;
    }
    return url;
  },

  // What to do when the weather provider has new information available?
  updateAvailable: function () {
    Log.log("New nebenan info available.");
    this.updateDom(0);
  },

  fetchHoods() {
    this.fetchData(this.getUrl())
      .then((data) => {
        const items = data.hood_messages
          .slice(0, this.config.maxFeedItems)
          .map(function (item) {
            item.publishDate = moment(new Date(item.created_at)).format(
              "MMMM Do YYYY, h:mm"
            );
            return item;
          });
        console.log(items);
        this.templateData = items;
      })
      .catch(function (request) {
        Log.error("Could not load data ... ", request);
      })
      .finally(() => this.updateAvailable());
  },

  /**
   * A convenience function to make requests.
   *
   * @param {string} url the url to fetch from
   * @param {string} type what contenttype to expect in the response, can be "json" or "xml"
   * @param {Array.<{name: string, value:string}>} requestHeaders the HTTP headers to send
   * @param {Array.<string>} expectedResponseHeaders the expected HTTP headers to recieve
   * @returns {Promise} resolved when the fetch is done
   */
  fetchData: async function (
    url,
    type = "json",
    requestHeaders = undefined,
    expectedResponseHeaders = undefined
  ) {
    const mockData = this.config.mockData;
    if (mockData) {
      const data = mockData.substring(1, mockData.length - 1);
      return JSON.parse(data);
    }
    const useCorsProxy =
      typeof this.config.useCorsProxy !== "undefined" &&
      this.config.useCorsProxy;
    return performWebRequest(
      url,
      type,
      useCorsProxy,
      requestHeaders,
      expectedResponseHeaders
    );
  }
});
