# Homebridge ESP-8266 Interface

A simple accessory for connecting to a custom ESP-8266 image. This is not intended or ready for distribution! Just a fun project for our house.

To create a switch, add this block to the `accessories` array of your Homebridge configuration:

```json
{
    "name": "ESP Switch",
    "host": "192.168.86.240",
    "updateInterval": 30000,
    "accessory": "ESPSwitch"
}
```

## Device Code

Of course, your device has to be programmed to expect "API" calls from the bridge. Use the included `switch.ino` file to flash your ESP8266 from an Arduino IDE. Make sure you create a `secrets.h` file next to your sketch with your network's SSID and password:

```cpp
// WiFi network name/SSID:
const char* SSID = "My Network Name";

// WiFi network password:
const char* PASS = "mypassword";
```

Once your Arduino-compatible device is flashed and joins your network, it's a good idea to give it a static IP address. This is usually possible from your router—the device’s MAC address will be stable, so it can reserve + issue the same IP to it whenever it re-joins the network.

## API

The HTTP server responds to four commands:

Path | Method | Function
--- | --- | ---
`/state/on` | `POST` | Turns the switch **on**, regardless of current state.
`/state/off` | `POST` | Turns the switch **off**, regardless of current state.
`/state/toggle` | `POST` | Inverts the switch’s state. The resulting switch state is returned.
`/state` | `GET` | Returns the current state, without mutating it.

Each endpoint returns an `application/json` response, with this schema:

```json
{
    "on": true,
    "message": "Human-readable log message."
}
```

You can test out your switch directly, via cURL:

```bash
curl -X POST http://192.168.86.240/state/toggle
```

The Homebridge accessory checks the switch state every minute to ensure it is in sync with the device. If you need more frequent updates, you can change the `QUERY_INTERVAL` variable at the top of `esp-switch.js`.

:deciduous_tree:
