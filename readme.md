# Homebridge ESP-8266 Interface

A simple accessory for connecting to an custom ESP-8266 image. This is not intended or ready for distribution! Just a fun project for our house.

To create a switch, add this block to the `accessories` array of your Homebridge configuration:

```json
{
    "name": "ESP Switch",
    "host": "192.168.86.240",
    "accessory": "ESPSwitch"
}
```

:deciduous_tree:
