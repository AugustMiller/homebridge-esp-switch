const ESPSwitch = require('./src/accessories/esp-switch');

module.exports = function (api) {
    api.registerAccessory('homebridge-esp-plugin', 'ESPSwitch', ESPSwitch);
};
