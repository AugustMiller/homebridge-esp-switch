# Homebridge ESP-8266 Interface

A simple accessory for connecting to a custom ESP-8266 image. This is not intended or ready for distribution! Just a fun project for our house.

To create a switch, add this block to the `accessories` array of your Homebridge configuration:

```json
{
    "name": "ESP Switch",
    "host": "192.168.86.240",
    "accessory": "ESPSwitch"
}
```

## Device Code

Of course, your device has to be programmed to expect "API" calls from the bridge. Use the included `switch.ino` file to flash your ESP8266 from an Arduino IDE. Make sure you create a `secrets.h` file next to your sketch with your network's SSID and password:

```cpp
const char* SSID = "My Network Name";    // WiFi network name/SSID
const char* PASS = "mypassword";         // WiFi network password
```

:deciduous_tree:
