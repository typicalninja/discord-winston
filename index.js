const Transport = require('winston-transport');
const fetch = require('node-fetch');


const defaultColors = {
    // #db2828
    error: 14362664,
    // #fbbd08
    warn: 16497928,
    // #2185d0
    info: 2196944,
    // #6435c9
    verbose: 6559689,
    // #2185d0
    debug: 2196944,
     // #21ba45
    silly: 2210373,
};
/**
 * The main transport class
 */
module.exports = class DiscordWebhookTransport extends Transport {
    /**
     * @param {Object} opts
     * @param {String} opts.id
     * @param {String} opts.token
     * @param {object} opts.colors
     * @param {object} opts.postBody
     */
  constructor(opts) {
    super(opts);
    if(!opts.id || !opts.token) throw new Error('Token or id of the webhook not passed');
    /**
     * @property {Object} - The token and id used for constructing the webhookUrl
     */
    this.auth = {
       id: opts.id,
       token: opts.token,
   };
   this.url = this.getUrl();
   this.colors = typeof opts.colors == 'object' ? Object.assign({}, defaultColors, opts.colors) : defaultColors;
   this.postBody = opts.postBody || {};
   this.throwIfPostError = opts.throwErrorPost == true ? true : false;
  }
  getUrl() {
     return `https://discord.com/api/webhooks/${this.auth.id}/${this.auth.token}`;
  }

  log(info, callback) {
    console.log(info.message)
      if(info.postToDiscord == false) return callback();
        this.postToWebhook(info);
        return callback();
  }
  postToWebhook(info) {
      const bodyNonModified = {
        embeds: [{
            description: info.message,
            color: this.colors[info.level],
            fields: [],
            timestamp: new Date().toISOString(),
          }],
      };
      if(info.level === 'error' && info.error && info.error.stack) {
         bodyNonModified.embeds[0].fields = [{
                name: 'Error Stack',
                value: `\`\`\`${info.error.stack}\`\`\``,
         }];
      }
      const body = Object.assign({}, this.postBody, bodyNonModified);
      try {
        fetch(this.url, {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
      }
      catch(err) {
          if(this.throwIfPostError) {
            throw new Error(`Error occurred while posting to Discord webhook`)
          }
      }
  }
};