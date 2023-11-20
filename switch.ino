#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>

#include "secrets.h"

const int RELAY = 0;
const int TIMEOUT = 120 * 1000; // Milliseconds until the network connection is abandoned

// Create server object:
ESP8266WebServer server(80);

// Initialize in off state:
bool state = false;

// Relay State Management
// ======================================================

/**
 * Sets pin state to the current value of the `state` variable.
 */
void applyRelayState() {
  // The relay is "closed" when in LOW state, and "open" when in HIGH. Be mindful of where the load leads are attached—“on” describes the state of the NO contact!
  digitalWrite(RELAY, state ? LOW : HIGH);
}

// Network Configuration
// ======================================================

/**
 * Sets up a WLAN connection.
 */
bool connect() {
  const int interval = 500;
  int attempts = 0;

  Serial.print("Connecting to ");
  Serial.print(SSID);

  WiFi.begin(SSID, PASS);

  while (WiFi.status() != WL_CONNECTED) {
    delay(interval);
    Serial.print(".");

    // Keep track of the number of times we've tried to connect:
    attempts++;

    // Out of tries?
    if (attempts * interval > TIMEOUT) {
      Serial.println(" failed!");

      return false;
    }
  }

  Serial.println(" done!");

  return true;
}

// Response Helpers
// ======================================================

/**
 * Creates a crude JSON string
 * 
 * @param String message
 * @return String
 */
String renderJson(String message = "") {
  String json = "{\"on\":";

  if (state) {
    json += "true";
  } else {
    json += "false";
  }

  json += ",\"message\":\"" + message + "\"}";

  return json;
}

// HTTP Route Handlers
// ======================================================

void handleRequestState() {
  Serial.println("Sending current relay state...");

  server.send(200, "application/json", renderJson("Awaiting further instructions."));
}

void handleRequestOn() {
  Serial.println("Turning on...");

  state = true;
  applyRelayState();

  server.send(200, "application/json", renderJson("Turned on."));
}

void handleRequestOff() {
  Serial.println("Turning off...");

  state = false;
  applyRelayState();

  server.send(200, "application/json", renderJson("Turned off."));
}

void handleRequestToggle() {
  Serial.println("Toggling...");

  state = !state;
  applyRelayState();

  server.send(200, "application/json", renderJson("Toggled."));
}

// Arduino-specific functions
// ======================================================
 
/**
 * Program Setup
 */
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(RELAY, OUTPUT);

  // Establish serial stream:
  Serial.begin(9600);

  // Join WLAN:
  connect();

  // Register HTTP routes:
  server.on("/state/on", HTTP_POST, handleRequestOn);
  server.on("/state/off", HTTP_POST, handleRequestOff);
  server.on("/state/toggle", HTTP_POST, handleRequestToggle);
  server.on("/state", HTTP_GET, handleRequestState);

  // Boot HTTP server:
  server.begin();
  Serial.print("HTTP server running at: ");
  Serial.println(WiFi.localIP());
}

/**
 * Main Loop
 */
void loop() {
  server.handleClient();
}
