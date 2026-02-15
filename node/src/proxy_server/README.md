# `proxy_server`

## Purpose
The purpose of `proxy_server` is to convert regular (non-clandestine) requests into CORES packages for the PulseCloak Network,
and convert CORES packages from the PulseCloak Network back into regular (non-clandestine) responses.

When you use the PulseCloak Network, the ProxyServer on your local PulseCloak Node is the first stop.
ProxyServer acts as a front end for the PulseCloak Network, appearing to your browser to be the server
to which it's trying to connect. It converts your regular TCP request into a PulseCloak CORES package and sends it out 
onto the PulseCloak Network. When the response comes back, ProxyServer unwraps it and gives it back to the requesting entity 
on your host machine.

It probably isn't the most interesting place to begin digging into our code;
[node](https://github.com/PulseCloak-Project/Node/tree/master/node)
is a better place to start.

Copyright (c) 2022, PulseCloak (https://pulsechaincloak.io) and/or its affiliates. All rights reserved.
