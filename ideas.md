Centralise storage keys

Setup for Geo and Device Orientation

Geo and Device orientation should both have their own context and hooks.
When user first enters app, nothing should be subscribed to any of these API's, however each hook has:

- permission status (unknown, granted, denied) (Device orientation must be reset for every session)
-

Settings

- Check useEffects
- getTitle, getSubtitle????
