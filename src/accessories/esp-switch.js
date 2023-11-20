const http = require('http');

const { HomebridgeAPI } = require('homebridge/lib/api');
const { AccessoryConfig } = require('homebridge/lib/bridgeService');
const { Logger } = require('homebridge/lib/logger');

const MIN_QUERY_INTERVAL = 5 * 1000; // Once every five seconds, maximum

/**
 * Simple Accessory for interfacing with a custom ESP-01S relay.
 */
class ESPSwitch {
    /**
     * @param {Logger} log
     * @param {AccessoryConfig} config
     * @param {HomebridgeAPI} api
     */
    constructor (log, config, api) {
        this.api = api;
        this.log = log;

        /** @property {Boolean} switchOn Current switch state, initialized to "off." */
        this.switchOn = false;

        /** @property {String} name Device name, as it will be exposed to HomeKit. */
        this.name = config.name;

        /** @property {String} host Device hostname or IP address. */
        this.host = config.host;

        /** @property {Number} updateInterval Frequency (in milliseconds) that the device’s state will be read + synchronized. */
        this.updateInterval = Math.max(MIN_QUERY_INTERVAL, config.updateInterval);

        // Switch Service + Characteristics:
        this.switchService = new this.api.hap.Service.Switch(this.name);
        this.switchService.getCharacteristic(this.api.hap.Characteristic.Name).setValue(this.name);

        this.switchService.getCharacteristic(this.api.hap.Characteristic.On)
            .on(this.api.hap.CharacteristicEventTypes.GET, (callback) => {
                this.log.info(`Current state of the switch was returned: ${this.switchOn ? 'ON' : 'OFF'}`);
                callback(undefined, this.switchOn);
            })
            .on(this.api.hap.CharacteristicEventTypes.SET, (value, callback) => {
                this.log.info(`Switch state being set to: ${value ? 'ON': 'OFF'}`);

                this.switchOn = value;
                this.setSwitchState(value);

                callback();
            });

        // Information Service + Make/Model Characteristics:
        this.informationService = new this.api.hap.Service.AccessoryInformation();

        this.informationService
            .setCharacteristic(this.api.hap.Characteristic.Manufacturer, 'Espressif')
            .setCharacteristic(this.api.hap.Characteristic.Model, 'ESP-01S')
            .setCharacteristic(this.api.hap.Characteristic.SerialNumber, 'CC-ESP-420-69')
            .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, '4.0')
            .setCharacteristic(this.api.hap.Characteristic.ConfiguredName, this.name);

        // Start the API request loop, asynchronously...
        setTimeout(() => {
            this.queueRefresh();
        }, this.updateInterval);
    }

    /*
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
    identify () {
        this.log('Identify!');
    }

    /*
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     */
    getServices () {
        return [
            this.switchService,
            this.informationService,
        ];
    }

    /**
     * Queues a query to refresh the switch state.
     */
    queueRefresh () {
        this.getSwitchState()
            .finally(() => {
                setTimeout(this.queueRefresh.bind(this), QUERY_INTERVAL);
            });
    }

    /**
     * Queries the device for its current state.
     */
    getSwitchState () {
        return this._makeRequest('state', 'GET')
            .then(this._handleResponse.bind(this))
            .catch((err) => this.log(`Failed to get state: ${err}`));
    }

    /**
     * Sends a request to turn the device on or off.
     * 
     * @param Boolean state
     */
    setSwitchState (state) {
        return this._makeRequest(`state/${state ? 'on' : 'off'}`, 'POST')
            .then(this._handleResponse.bind(this))
            .catch((err) => this.log(`Failed to set state: ${err}`));
    }

    /**
     * Abstract query method for getting or setting switch state.
     */
    _makeRequest (path, method) {
        return new Promise((resolve, reject) => {
            const req = http.request(`http://${this.host}/${path}`, {
                method,
            }, (res) => {
                let output = '';

                res.setEncoding('utf8');

                res.on('data', (chunk) => {
                    output += chunk;
                });

                res.on('end', () => {
                    this.log(`Received response from ESP: ${output}`);

                    resolve(JSON.parse(output));
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.end();
        });
    }

    /**
     * Handles a response by updating our internal state.
     * 
     * @param {Object} response Response data
     */
    _handleResponse (response) {
        this.switchService.updateCharacteristic(this.api.hap.Characteristic.On, response.on);
    }
}

module.exports = ESPSwitch;
