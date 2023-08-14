import jwt from 'jsonwebtoken'
import fetch from 'node-fetch'
import metrics from '../metrics.js'

export default class ZoomClient {

  /**
  * create a new zoom client
  * @constructor
  * @param {Object} props - an object containing the zoom api key and api secret:w
  * @param {string} props.zoomKey - The zoom api key
  * @param {string} props.zoomSecret- The zoom api secret
  * @returns {ZoomClient}
  */
  constructor(props) {
    this.zoomKey = props.zoomKey
    this.zoomSecret = props.zoomSecret
  }

  
  /**
  * Send a get request to zoom
  * @param {Object} opts - the parameter options
  * @param {string} opts.path - the endpoint e.g /metrics/<meeting-id>
  * @param {Object} opts.headers - the request headers
  * @returns {Object}
  */  
  async get(opts) {
    return this.request({...opts, method: 'get'})
  }


  /**
  * Send a post request to zoom
  * @param {Object} opts - the parameter options
  * @param {string} opts.path - the endpoint e.g /metrics/<meeting-id>
  * @param {Object} opts.headers - the request headers
  * @returns {Object}
  */  
  async post(opts) {
    return this.request({...opts,
      method: 'post',
      headers: {...opts.headers, 'content-type': 'application/json'},
    })
  }


  /**
  * Send a patch request to zoom
  * @param {Object} opts - the parameter options
  * @param {string} opts.path - the endpoint e.g /metrics/<meeting-id>
  * @param {Object} opts.headers - the request headers
  * @returns {Object}
  */  
  async patch(opts) {
    return this.request({
      ...opts,
      method: 'patch',
      headers: {...opts.headers, 'content-type': 'application/json'},
    })
  }


  /**
  * Send a get request to zoom
  * @param {Object} opts - the parameter options
  * @param {string} opts.path - the endpoint e.g /metrics/<meeting-id>
  * @param {Object} opts.headers - the request headers
  * @returns {Object}
  */  
  async put(opts) {
    return this.request({
      ...opts,
      method: 'put',
      headers: {...opts.headers, 'content-type': 'application/json'},
    })
  }


  /**
  * Send a get request to zoom
  * @param {Object} opts - the parameter options
  * @param {string} opts.path - the endpoint e.g /metrics/<meeting-id>
  * @param {Object} opts.headers - the request headers
  * @returns {Object}
  */  
  async delete(opts) {
    return this.request({
      ...opts,
      method: 'delete',
      headers: { ...opts.headers, 'content-type': 'application/json' }
    })
  }


/**
  * Make a get request to zoom
  * @param {Object} opts - the parameter options
  * @param {string} opts.path - the endpoint e.g /metrics/<meeting-id>
  * @param {Object} opts.headers - the request headers
  * @returns {Object}
  */  
  async request(opts) {
    const pathPrefix = opts.path.split("/")[0]
    console.log(opts)
    let startTimeMs = Date.now()
    return fetch(`https://api.zoom.us/v2/${opts.path}`, {
      method: opts.method,
      headers: {
        authorization: `Bearer ${this.token()}`,
        ...opts.headers
      },
      body: JSON.stringify(opts.body)
    }).then(async r => {
      const httpCodeMetricName = `zoom.http.code.${pathPrefix}.${r.status}`
      const httpLatencyMetricName = `zoom.http.latency.${pathPrefix}.${r.status}`
      let elapsedTimeMs = startTimeMs - Date.now();

      metrics.timing(httpLatencyMetricName, elapsedTimeMs)
      metrics.increment(httpCodeMetricName, 1)

      // Zoom sometimes responds with 204 for no content.
      // We don't want to try parsing JSON for this, because there is no JSON to parse
      console.log({response: r.ok})

      if (r.ok && r.status != 204) {
        let payload = r.json()
        payload.http_code = r.status
        return payload
      } else if (r.status == 204) {
        return {http_code:r.status}
      } else {
        return {http_code:r.status}
      }
    }).catch(err => {
      metrics.increment("error.zoom_request_exception", 1)
      console.error(err)
    })
  }

  /**
  * Generates a jwt for sending request
  * @method
  * @returns {string}
  */
  token() {
    const payload = {
      iss: this.zoomKey,
      exp: new Date().getTime() + 5000,
    }
    const token = jwt.sign(payload, this.zoomSecret)
    return token
  }
}